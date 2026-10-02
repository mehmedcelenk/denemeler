import { getAggregatedTopics } from './topic-model.js';
import { state } from '../../app/state.ts';
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

  let html = '';
  topics.forEach((t) => {
    const isFull = (state.selectedCourses.size > 1 && Object.keys(t.courses).length === state.selectedCourses.size);
    const star = (isFull && !isSingleCourse) ? '⭐ ' : '';
    const isSelected = (state.selectedTopicKey === t.key);
    
    let courseBreakdown = '';
    if (state.selectedCourses.size > 1 && Object.keys(t.courses).length > 0) {
      const bParts = Object.entries(t.courses).map(([c, cnt]) => `${getShortCourseName(c)}: ${cnt}`);
      courseBreakdown = ` <span style="font-size:10px; opacity:0.75; font-weight:normal;">(${bParts.join(', ')})</span>`;
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
      <div class="drawer-topic-item ${isSelected ? 'selected' : ''}" onclick="selectTopicFromDrawer('${escapeJs(t.key)}')">
        <span class="drawer-topic-name">${star}${topicLabelHtml}${courseBreakdown}</span>
        <div class="drawer-topic-badges-group">
          ${freqBadgeHtml}
          <span class="drawer-topic-badge">${t.count} Soru</span>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

export function selectTopicFromDrawer(topicKey) {
  state.selectedTopicKey = topicKey;
  state.activeSearchFilter = '';
  state.bookletFilterMode = 'all';
  updateFilterButtonsUI();
  closeSubjectDrawer();
  updateBookletQuestions();
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
}
