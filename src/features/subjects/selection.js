import { state, store, onStateChange, notifyStateChange } from '../../app/state.ts';
import { loadSubjectData } from '../../data/questions.js';
import { matchesSubject } from '../../data/subjects.js';
import { updateCourseModeToggleVisibility, setCourseFilterMode } from './filters.ts';
import { saveSessionSnapshot } from '../booklet/resume.ts';
import { renderDrawerTopics } from './topics.js';
import { renderSubjectRowsHtml } from './subject-rows.ts';
import { getProgramSubjectList, getActiveSubjects, getSubjectCourses } from './selection-model.ts';
import { closeAllSubjectDropdowns } from './dropdown.ts';

export { getActiveSubjects } from './selection-model.ts';
export { toggleSubjectDropdown } from './dropdown.ts';

let selectionVersion = 0;

export async function setProgramMode(mode) {
  store.setProgramMode(mode);
  const currentList = getProgramSubjectList(mode);
  const isCurrentInList = currentList.some(s => s.id === state.currentSubject);
  const targetSubj = isCurrentInList ? state.currentSubject : currentList[0].id;
  await setSubject(targetSubj);
}

export async function setSubject(subj) {
  const version = ++selectionVersion;
  try {
    const questions = await loadSubjectData(subj);
    store.appendQuestions(questions);
  } catch (error) {
    if (version !== selectionVersion) return false;
    const container = document.getElementById('drawerTopicList');
    if (container) container.innerHTML = '<div style="padding:14px; text-align:center; color:var(--paper-text-muted); font-size:12px;">Ders yüklenemedi. Bağlantıyı kontrol edip tekrar deneyin.</div>';
    return false;
  }
  if (version !== selectionVersion) return false;

  store.setCurrentSubject(subj);
  saveSessionSnapshot(subj);
  store.clearSelectedTopicKeys();
  store.setSelectedExamPeriod(null);
  store.setActiveSearchFilter('');
  store.setBookletFilterMode('all');
  notifyStateChange('filter:updated');

  const normalContainer = document.getElementById('drawerNormalSelectorContainer');
  if (normalContainer) normalContainer.style.display = 'block';

  const isYks = state.programMode === 'TYT' || state.programMode === 'AYT' || state.programMode === 'YDT';
  const courses = getSubjectCourses(subj);

  if (courses.length > 0) {
    store.setSelectedCourses(isYks ? courses : [courses[0]]);
  } else {
    store.clearSelectedCourses();
  }

  updateCourseModeToggleVisibility();
  renderDrawerSelectorBar();
  renderDrawerTopics();
  notifyStateChange('booklet:refresh');
  return true;
}

export async function addSubjectRow(subjId) {
  const currentList = getProgramSubjectList();
  const activeSubjs = getActiveSubjects();

  let targetId = subjId;
  if (!targetId) {
    const nextSubj = currentList.find(s => !activeSubjs.some(act => act.id === s.id));
    if (!nextSubj) return false;
    targetId = nextSubj.id;
  }

  const version = ++selectionVersion;
  try {
    const questions = await loadSubjectData(targetId);
    store.appendQuestions(questions);
  } catch (error) {
    if (version !== selectionVersion) return false;
    return false;
  }
  if (version !== selectionVersion) return false;

  const courses = getSubjectCourses(targetId);

  if (courses.length > 0) {
    store.addSelectedCourse(courses[0]);
  }

  updateCourseModeToggleVisibility();
  renderDrawerSelectorBar();
  renderDrawerTopics();
  notifyStateChange('booklet:refresh');
  return true;
}

export function removeSubjectRow(subjId) {
  const activeSubjs = getActiveSubjects();
  if (activeSubjs.length <= 1) return;

  const coursesToRemove = Array.from(state.selectedCourses).filter(c => matchesSubject({ ders: c }, subjId));
  coursesToRemove.forEach(c => store.removeSelectedCourse(c));

  const remaining = getActiveSubjects();
  if (state.currentSubject === subjId && remaining.length > 0) {
    store.setCurrentSubject(remaining[0].id);
  }

  updateCourseModeToggleVisibility();
  renderDrawerSelectorBar();
  renderDrawerTopics();
  notifyStateChange('booklet:refresh');
}

export async function switchRowSubject(oldSubjId, newSubjId) {
  if (oldSubjId === newSubjId) return;
  const version = ++selectionVersion;
  try {
    const questions = await loadSubjectData(newSubjId);
    store.appendQuestions(questions);
  } catch (error) {
    if (version !== selectionVersion) return;
  }
  if (version !== selectionVersion) return;

  const coursesToRemove = Array.from(state.selectedCourses).filter(c => matchesSubject({ ders: c }, oldSubjId));
  coursesToRemove.forEach(c => store.removeSelectedCourse(c));

  const isYks = state.programMode === 'TYT' || state.programMode === 'AYT' || state.programMode === 'YDT';
  const courses = getSubjectCourses(newSubjId);

  if (courses.length > 0) {
    if (isYks) {
      courses.forEach(c => store.addSelectedCourse(c));
    } else {
      store.addSelectedCourse(courses[0]);
    }
  }
  store.setCurrentSubject(newSubjId);

  updateCourseModeToggleVisibility();
  renderDrawerSelectorBar();
  renderDrawerTopics();
  notifyStateChange('booklet:refresh');
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

  const currentList = getProgramSubjectList();
  const activeSubjs = getActiveSubjects();
  const rowsContainer = document.getElementById('drawerSubjectRowsContainer');
  const addBtn = document.getElementById('btnAddSubjectRow');
  const addBtnWrap = document.getElementById('addSubjectRowWrapper');
  const btnIntersect = document.getElementById('btnIntersectionToggle');
  const chk = document.getElementById('chkIntersectionSwitch');

  if (rowsContainer) {
    rowsContainer.innerHTML = renderSubjectRowsHtml(activeSubjs);
  }

  const hasMore = currentList.length > activeSubjs.length;
  if (addBtn) {
    addBtn.style.display = hasMore ? 'inline-flex' : 'none';
  }
  if (addBtnWrap) {
    addBtnWrap.style.display = hasMore ? 'block' : 'none';
  }

  const isAnd = (state.courseFilterMode === 'AND');
  if (btnIntersect) {
    btnIntersect.classList.toggle('active', isAnd);
  }
  if (chk) {
    chk.checked = isAnd;
  }

  updateCourseModeToggleVisibility();
}

export async function handleDropdownItemSelect(newSubjId, oldSubjId) {
  closeAllSubjectDropdowns();

  if (!oldSubjId || oldSubjId === state.currentSubject) {
    await setSubject(newSubjId);
  } else {
    await switchRowSubject(oldSubjId, newSubjId);
  }
}

export async function selectSubjectFromDropdown(subjId) {
  await handleDropdownItemSelect(subjId, '');
}

export function toggleCourseLevel(courseName) {
  if (state.selectedCourses.has(courseName)) {
    if (state.selectedCourses.size > 1) {
      store.removeSelectedCourse(courseName);
    }
  } else {
    store.addSelectedCourse(courseName);
  }

  renderDrawerSelectorBar();
  renderDrawerTopics();
  notifyStateChange('booklet:refresh');
}

export function handleIntersectionToggle(isChecked) {
  setCourseFilterMode(isChecked ? 'AND' : 'OR');
}

onStateChange('drawer:topics-refresh', () => {
  renderDrawerSelectorBar();
});

onStateChange('subject:select', async (payload) => {
  if (payload && typeof payload === 'object' && 'subject' in payload && typeof payload.subject === 'string') {
    await setSubject(payload.subject);
  }
});
