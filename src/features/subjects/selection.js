import { state, onStateChange, notifyStateChange } from '../../app/state.ts';
import { loadSubjectData } from '../../data/questions.js';
import { SUBJECTS, getShortCourseName, matchesSubject } from '../../data/subjects.js';
import { updateCourseModeToggleVisibility, setCourseFilterMode } from './filters.js';
import { renderDrawerTopics } from './topics.js';
import { escapeHtml, escapeJs } from '../../shared/escape.ts';

let selectionVersion = 0;

export async function setSubject(subj) {
  const version = ++selectionVersion;
  try {
    await loadSubjectData(subj);
  } catch (error) {
    if (version !== selectionVersion) return false;
    throw error;
  }
  if (version !== selectionVersion) return false;

  state.currentSubject = subj;
  state.selectedTopicKey = null;
  state.activeSearchFilter = '';
  state.drawerSearchTerm = '';
  state.bookletFilterMode = 'all';
  notifyStateChange('filter:updated');
  const input = document.getElementById('drawerSearchInput');
  if (input) input.value = '';
  const clearBtn = document.getElementById('drawerSearchClearBtn');
  if (clearBtn) clearBtn.style.display = 'none';

  const resultsContainer = document.getElementById('drawerSearchResultsContainer');
  const normalContainer = document.getElementById('drawerNormalSelectorContainer');
  if (resultsContainer) resultsContainer.style.display = 'none';
  if (normalContainer) normalContainer.style.display = 'block';

  state.selectedCourses.clear();

  const courses = Array.from(new Set(state.allData.filter(q => matchesSubject(q, subj)).map(q => q.ders)));
  courses.sort((a, b) => {
    const numA = parseInt((a.match(/\d+$/) || [0])[0], 10);
    const numB = parseInt((b.match(/\d+$/) || [0])[0], 10);
    return numA - numB;
  });

  // Varsayılan olarak 1. kademeyi seç (ör: MAT-1, TDE-1)
  if (courses.length > 0) {
    state.selectedCourses.add(courses[0]);
  }

  updateCourseModeToggleVisibility();
  renderDrawerSelectorBar();
  renderDrawerTopics();
  notifyStateChange('booklet:refresh');
  return true;
}

export function renderDrawerSubjects() {
  renderDrawerSelectorBar();
}

export function renderDrawerCourses() {
  renderDrawerSelectorBar();
}

export function renderDrawerSelectorBar() {
  if (typeof document === 'undefined') return;

  const normalContainer = document.getElementById('drawerNormalSelectorContainer');
  const bannerContainer = document.getElementById('drawerLibraryActiveBanner');

  if (state.isLibraryMode) {
    if (normalContainer) normalContainer.style.display = 'none';
    if (bannerContainer) bannerContainer.style.display = 'block';
    return;
  }

  if (normalContainer) normalContainer.style.display = 'block';
  if (bannerContainer) bannerContainer.style.display = 'none';

  const subjDef = SUBJECTS.find(s => s.id === state.currentSubject) || SUBJECTS[0];
  const iconEl = document.getElementById('selectedSubjIcon');
  const nameEl = document.getElementById('selectedSubjShortName');
  const chipsContainer = document.getElementById('levelChipsContainer');
  const chk = document.getElementById('chkIntersectionSwitch');

  if (iconEl) iconEl.textContent = subjDef.icon;
  if (nameEl) nameEl.textContent = subjDef.name.toUpperCase();

  if (chipsContainer && state.currentSubject) {
    const courses = Array.from(new Set(state.allData.filter(q => matchesSubject(q, state.currentSubject)).map(q => q.ders)));
    courses.sort((a, b) => {
      const numA = parseInt((a.match(/\d+$/) || [0])[0], 10);
      const numB = parseInt((b.match(/\d+$/) || [0])[0], 10);
      return numA - numB;
    });

    let chipsHtml = '';
    courses.forEach(c => {
      const isSel = state.selectedCourses.has(c);
      const m = c.match(/\d+$/);
      const num = m ? m[0] : c;
      const short = getShortCourseName(c);
      chipsHtml += `
        <button type="button" class="btn-level-chip ${isSel ? 'active' : ''}" 
                onclick="toggleCourseLevel('${escapeJs(c)}')" 
                title="${escapeHtml(short)}">
          ${escapeHtml(num)}
        </button>
      `;
    });
    chipsContainer.innerHTML = chipsHtml;
  }

  if (chk) {
    chk.checked = (state.courseFilterMode === 'AND');
  }

  updateCourseModeToggleVisibility();
}

export function toggleSubjectDropdown() {
  const menu = document.getElementById('subjectDropdownMenu');
  if (!menu) return;

  if (menu.style.display === 'block') {
    menu.style.display = 'none';
    return;
  }

  let html = '';
  SUBJECTS.forEach(s => {
    const isAct = (s.id === state.currentSubject);
    html += `
      <div class="dropdown-menu-item ${isAct ? 'active' : ''}" onclick="selectSubjectFromDropdown('${s.id}')">
        <span>${s.icon} ${escapeHtml(s.name)}</span>
        ${isAct ? '<span>✓</span>' : ''}
      </div>
    `;
  });
  menu.innerHTML = html;
  menu.style.display = 'block';
}

export async function selectSubjectFromDropdown(subjId) {
  const menu = document.getElementById('subjectDropdownMenu');
  if (menu) menu.style.display = 'none';
  await setSubject(subjId);
}

export function toggleCourseLevel(courseName) {
  if (state.selectedCourses.has(courseName)) {
    if (state.selectedCourses.size > 1) {
      state.selectedCourses.delete(courseName);
    }
  } else {
    state.selectedCourses.add(courseName);
  }

  state.selectedTopicKey = null;
  renderDrawerSelectorBar();
  renderDrawerTopics();
  notifyStateChange('booklet:refresh');
}

export function handleIntersectionToggle(isChecked) {
  setCourseFilterMode(isChecked ? 'AND' : 'OR');
}

export const switchSubjectFromDrawer = selectSubjectFromDropdown;
export const toggleCourseInDrawer = toggleCourseLevel;
export const toggleLevelDropdown = () => {};
export const selectLevelFromDropdown = toggleCourseLevel;

// Dışarı tıklayınca ders dropdownını kapat
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const target = e.target;
    const subjWrap = document.getElementById('subjectDropdownWrapper');
    const subjMenu = document.getElementById('subjectDropdownMenu');

    if (subjWrap && !subjWrap.contains(target) && subjMenu) {
      subjMenu.style.display = 'none';
    }
  });
}

onStateChange('drawer:topics-refresh', () => {
  renderDrawerSelectorBar();
});

onStateChange('subject:select', async (payload) => {
  if (payload && typeof payload === 'object' && 'subject' in payload && typeof payload.subject === 'string') {
    await setSubject(payload.subject);
  }
});



