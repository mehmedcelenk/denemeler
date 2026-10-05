import { getAggregatedTopics } from './topic-model.js';
import { state, onStateChange, notifyStateChange } from '../../app/state.ts';
import { getCondensedCourseCode, getShortCourseName } from '../../data/subjects.js';
import { updateBookletQuestions } from '../booklet/selection.js';
import { updateFilterButtonsUI } from '../booklet/filter.ts';
import { closeSubjectDrawer } from './drawer-visibility.js';
import { escapeHtml, escapeJs } from '../../shared/escape.ts';

export function renderDrawerTopics() {
  const container = document.getElementById('drawerTopicList');
  const headerLbl = document.getElementById('lblDrawerTopicHeader');
  const allBtn = document.getElementById('btnLoadAllTopics');

  if (state.isLibraryMode) {
    if (container) container.innerHTML = '';
    return;
  }

  if (!state.currentSubject) {
    if (headerLbl) headerLbl.textContent = 'Konular:';
    if (allBtn) {
      allBtn.textContent = 'Bir Branş Seçin →';
      allBtn.onclick = null;
      allBtn.style.opacity = '0.5';
    }
    container.innerHTML = '<div style="padding:14px; text-align:center; color:var(--paper-text-muted); font-size:12px;">Ders seçilmedi. Tüm branşlarda arama yapabilir veya yukarıdaki branş kartlarından birini seçebilirsiniz.</div>';
    return;
  }
  if (allBtn) allBtn.style.opacity = '1';

  const topics = getAggregatedTopics();
  const totalCount = topics.reduce((acc, t) => acc + t.count, 0);

  const isSingleCourse = (state.selectedCourses.size === 1);
  const courseCode = getCondensedCourseCode(state.selectedCourses, state.currentSubject);
  const modeStr = (state.courseFilterMode === 'AND' && !isSingleCourse) ? ' (Ortak ∩)' : '';

  if (headerLbl) {
    headerLbl.textContent = isSingleCourse 
      ? `${courseCode} Konu Başlıkları:` 
      : `Konular (${courseCode}${modeStr}):`;
  }

  if (allBtn) {
    allBtn.textContent = isSingleCourse 
      ? `Tüm ${courseCode} Soruları (${totalCount}s) →` 
      : `Tüm ${courseCode} Sorularını Yükle (${totalCount}s) →`;
    allBtn.onclick = function() { loadAllTopicsToBooklet(); };
  }

  if (topics.length === 0) {
    container.innerHTML = '<div style="padding:14px; text-align:center; color:var(--paper-text-muted); font-size:12px;">Seçili kriterde konu bulunamadı.</div>';
    return;
  }

  const groupedTopics = new Map();
  topics.forEach((t) => {
    const parentKey = (t.ana_konu && t.alt_konu && t.ana_konu !== t.alt_konu) ? t.ana_konu : (t.ana_konu || t.alt_konu || 'Genel');
    const group = groupedTopics.get(parentKey) || [];
    group.push(t);
    groupedTopics.set(parentKey, group);
  });

  let html = '';
  groupedTopics.forEach((group, parentKey) => {
    if (group.length > 1) {
      const expanded = group.some(t => state.selectedTopicKey === t.key);
      const parentLabel = parentKey || 'Genel';
      const nestedHtml = group.map((t) => {
        const isFull = (state.selectedCourses.size > 1 && Object.keys(t.courses).length === state.selectedCourses.size);
        const intersectionMark = (isFull && !isSingleCourse) ? '∩ ' : '';
        const isSelected = (state.selectedTopicKey === t.key);
        let courseBreakdown = '';
        if (state.selectedCourses.size > 1 && Object.keys(t.courses).length > 0) {
          const bParts = Object.entries(t.courses).map(([c, cnt]) => `${getShortCourseName(c)}: ${cnt}`);
          courseBreakdown = ` <span class="drawer-topic-course-breakdown">(${bParts.join(', ')})</span>`;
        }
        const freqBadgeHtml = t.avg_per_exam ? `
          <span class="drawer-topic-freq-badge" title="Son ${t.period_count} sınavda ortalama ${t.avg_per_exam} soru gelmiştir.">
            ~${t.avg_per_exam} soru/sınav
          </span>
        ` : '';
        return `
          <div class="drawer-topic-item child-item ${isSelected ? 'selected' : ''}" data-select-topic="${escapeJs(t.key)}">
            <span class="drawer-topic-name">${intersectionMark}${escapeHtml(t.alt_konu || t.ana_konu || 'Genel')}${courseBreakdown}</span>
            <div class="drawer-topic-badges-group">
              ${freqBadgeHtml}
              <span class="drawer-topic-badge">${t.count} Soru</span>
            </div>
          </div>
        `;
      }).join('');

      html += `
        <div class="drawer-topic-group ${expanded ? 'open' : ''}" data-topic-group="${escapeJs(parentKey)}">
          <button type="button" class="drawer-topic-group-header" data-topic-toggle-group="${escapeJs(parentKey)}">
            <span class="drawer-topic-group-title">
              <span>${escapeHtml(parentLabel)}</span>
              <span class="drawer-topic-group-count">(${group.reduce((sum, item) => sum + item.count, 0)} soru)</span>
            </span>
            <span class="drawer-topic-dropdown-caret">${expanded ? '▾' : '▸'}</span>
          </button>
          <div class="drawer-topic-group-body">
            ${nestedHtml}
          </div>
        </div>
      `;
      return;
    }

    const t = group[0];
    const isFull = (state.selectedCourses.size > 1 && Object.keys(t.courses).length === state.selectedCourses.size);
    const intersectionMark = (isFull && !isSingleCourse) ? '∩ ' : '';
    const isSelected = (state.selectedTopicKey === t.key);
    let courseBreakdown = '';
    if (state.selectedCourses.size > 1 && Object.keys(t.courses).length > 0) {
      const bParts = Object.entries(t.courses).map(([c, cnt]) => `${getShortCourseName(c)}: ${cnt}`);
      courseBreakdown = ` <span class="drawer-topic-course-breakdown">(${bParts.join(', ')})</span>`;
    }
    let topicLabelHtml = '';
    if (t.ana_konu && t.alt_konu && t.ana_konu !== t.alt_konu) {
      topicLabelHtml = `<span class="topic-ak">${escapeHtml(t.ana_konu)}</span> <span class="topic-slash">/</span> <span class="topic-sub">${escapeHtml(t.alt_konu)}</span>`;
    } else {
      topicLabelHtml = `<span class="topic-sub">${escapeHtml(t.alt_konu || t.ana_konu)}</span>`;
    }
    const freqBadgeHtml = t.avg_per_exam ? `
      <span class="drawer-topic-freq-badge" title="Son ${t.period_count} sınavda ortalama ${t.avg_per_exam} soru gelmiştir.">
        ~${t.avg_per_exam} soru/sınav
      </span>
    ` : '';

    html += `
      <div class="drawer-topic-item ${isSelected ? 'selected' : ''}" data-select-topic="${escapeJs(t.key)}">
        <span class="drawer-topic-name">${intersectionMark}${topicLabelHtml}${courseBreakdown}</span>
        <div class="drawer-topic-badges-group">
          ${freqBadgeHtml}
          <span class="drawer-topic-badge">${t.count} Soru</span>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  container.querySelectorAll('[data-select-topic]').forEach((el) => {
    el.addEventListener('click', (event) => {
      event.stopPropagation();
      const key = el.getAttribute('data-select-topic');
      if (key) selectTopicFromDrawer(key);
    });
  });

  container.querySelectorAll('[data-topic-toggle-group]').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const group = btn.closest('.drawer-topic-group');
      if (!group) return;
      const caret = group.querySelector('.drawer-topic-dropdown-caret');
      if (!caret) return;
      group.classList.toggle('open');
      caret.textContent = group.classList.contains('open') ? '▾' : '▸';
    });
  });
}

export function selectTopicFromDrawer(topicKey) {
  state.selectedTopicKey = topicKey;
  state.activeSearchFilter = '';
  state.bookletFilterMode = 'all';
  updateFilterButtonsUI();
  closeSubjectDrawer();
  updateBookletQuestions();
  notifyStateChange('filter:updated');
  notifyStateChange('booklet:refresh');
}

export function loadAllTopicsToBooklet() {
  state.selectedTopicKey = null;
  state.activeSearchFilter = '';
  state.drawerSearchTerm = '';
  state.bookletFilterMode = 'all';
  updateFilterButtonsUI();
  const input = document.getElementById('drawerSearchInput');
  if (input) input.value = '';
  const clearBtn = document.getElementById('drawerSearchClearBtn');
  if (clearBtn) clearBtn.style.display = 'none';

  const resultsContainer = document.getElementById('drawerSearchResultsContainer');
  const normalContainer = document.getElementById('drawerNormalSelectorContainer');
  if (resultsContainer) resultsContainer.style.display = 'none';
  if (normalContainer) normalContainer.style.display = 'block';

  closeSubjectDrawer();
  updateBookletQuestions();
  notifyStateChange('filter:updated');
  notifyStateChange('booklet:refresh');
}

onStateChange('drawer:topics-refresh', () => {
  renderDrawerTopics();
});
