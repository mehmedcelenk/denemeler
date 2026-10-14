import { getAggregatedTopics } from './topic-model.js';
import { state, onStateChange, notifyStateChange } from '../../app/state.ts';
import { getCondensedCourseCode, matchesSubject, AOIHL_SUBJECTS, AOF_SUBJECTS } from '../../data/subjects.js';
import { updateFilterButtonsUI } from '../booklet/filter.ts';
import { escapeHtml, escapeJs } from '../../shared/escape.ts';

export function renderDrawerTopics() {
  const container = document.getElementById('drawerTopicList');
  const headerLbl = document.getElementById('lblDrawerTopicHeader');
  const allBtn = document.getElementById('btnLoadAllTopics');

  if (state.isLibraryMode) {
    if (container) container.innerHTML = '';
    return;
  }

  if (!state.currentSubject && state.selectedCourses.size === 0) {
    if (headerLbl) headerLbl.textContent = 'Konular:';
    if (allBtn) {
      allBtn.textContent = 'Bir Branş Seçin →';
      allBtn.onclick = null;
      allBtn.style.opacity = '0.5';
    }
    if (container) {
      container.innerHTML = '<div style="padding:14px; text-align:center; color:var(--paper-text-muted); font-size:12px;">Ders seçilmedi. Branş kartlarından birini seçebilirsiniz.</div>';
    }
    return;
  }
  if (allBtn) allBtn.style.opacity = '1';

  const topics = getAggregatedTopics();
  const isSingleCourse = (state.selectedCourses.size === 1);
  const courseCode = state.currentSubject ? getCondensedCourseCode(state.selectedCourses, state.currentSubject) : 'Dersler';
  const modeStr = (state.courseFilterMode === 'AND' && !isSingleCourse) ? ' (Ortak ∩)' : '';

  if (headerLbl) {
    if (state.selectedTopicKeys.size > 0) {
      headerLbl.innerHTML = `
        <span style="display:flex; justify-content:space-between; align-items:center; width:100%;">
          <span>Seçilen Konular (${state.selectedTopicKeys.size} / ${topics.length}):</span>
          <button type="button" class="btn-clear-topics" id="btnClearTopicSelection" style="background:none; border:none; color:var(--brand-accent); font-size:11px; font-weight:700; cursor:pointer; padding:2px 6px;">✕ Sıfırla</button>
        </span>
      `;
      const btnClear = document.getElementById('btnClearTopicSelection');
      if (btnClear) {
        btnClear.onclick = (e) => {
          e.stopPropagation();
          clearTopicSelection();
        };
      }
    } else {
      headerLbl.textContent = isSingleCourse 
        ? `${courseCode} Konu Başlıkları (${topics.length}):` 
        : `Konular (${courseCode}${modeStr} · ${topics.length}):`;
    }
  }

  if (allBtn) {
    if (state.selectedTopicKeys.size > 0) {
      allBtn.textContent = `Tümünü Aç (${state.selectedTopicKeys.size} Konu)`;
    } else {
      allBtn.textContent = 'Tümünü Aç';
    }
    allBtn.onclick = function() { loadAllTopicsToBooklet(); };
  }

  if (topics.length === 0) {
    if (container) {
      container.innerHTML = '<div style="padding:14px; text-align:center; color:var(--paper-text-muted); font-size:12px;">Seçili kriterde konu bulunamadı.</div>';
    }
    return;
  }

  const groupedBySubject = new Map();
  const currentList = state.programMode === 'AOF' ? AOF_SUBJECTS : AOIHL_SUBJECTS;
  const activeSubjectList = currentList.filter(s => {
    for (const c of state.selectedCourses) {
      if (matchesSubject({ ders: c }, s.id)) return true;
    }
    return state.selectedCourses.size === 0 && state.currentSubject === s.id;
  });

  activeSubjectList.forEach(s => {
    const subjTopics = topics.filter(t => Object.keys(t.courses).some(c => matchesSubject({ ders: c }, s.id)));
    if (subjTopics.length > 0) {
      groupedBySubject.set(s, subjTopics);
    }
  });

  let html = '';
  groupedBySubject.forEach((subjTopics, s) => {
    const subjTotal = subjTopics.reduce((sum, t) => sum + t.count, 0);

    const groupedTopics = new Map();
    subjTopics.forEach((t) => {
      const parentKey = (t.ana_konu && t.alt_konu && t.ana_konu !== t.alt_konu) ? t.ana_konu : (t.ana_konu || t.alt_konu || 'Genel');
      const group = groupedTopics.get(parentKey) || [];
      group.push(t);
      groupedTopics.set(parentKey, group);
    });

    let innerHtml = '';
    groupedTopics.forEach((group, parentKey) => {
      const allGroupKeys = group.map(t => t.key);
      const isAllGroupSelected = allGroupKeys.length > 0 && allGroupKeys.every(k => state.selectedTopicKeys.has(k));
      const isPartialGroupSelected = !isAllGroupSelected && allGroupKeys.some(k => state.selectedTopicKeys.has(k));

      if (group.length > 1) {
        const hasSelectedChild = isAllGroupSelected || isPartialGroupSelected;
        const expanded = hasSelectedChild;
        const parentLabel = parentKey || 'Genel';
        const totalGroupQuestions = group.reduce((sum, item) => sum + item.count, 0);

        const nestedHtml = group.map((t) => {
          const isSelected = state.selectedTopicKeys.has(t.key);
          return `
            <div class="drawer-topic-item child-item ${isSelected ? 'selected' : ''}" data-select-topic="${escapeJs(t.key)}">
              <span class="tree-checkbox ${isSelected ? 'checked' : ''}" aria-hidden="true">${isSelected ? '✓' : ''}</span>
              <span class="drawer-topic-name">${escapeHtml(t.alt_konu || t.ana_konu || 'Genel')}</span>
              <span class="drawer-topic-count-num">${t.count} soru</span>
            </div>
          `;
        }).join('');

        innerHtml += `
          <div class="drawer-topic-group ${expanded ? 'open' : ''}" data-topic-group="${escapeJs(parentKey)}">
            <button type="button" class="drawer-topic-group-header" data-topic-toggle-group="${escapeJs(parentKey)}" aria-expanded="${expanded ? 'true' : 'false'}">
              <span class="drawer-topic-group-title">
                <span class="tree-checkbox ${isAllGroupSelected ? 'checked' : (isPartialGroupSelected ? 'partial' : '')}" 
                      data-group-checkbox="${escapeJs(parentKey)}" aria-hidden="true">
                  ${isAllGroupSelected ? '✓' : (isPartialGroupSelected ? '–' : '')}
                </span>
                <span class="drawer-topic-group-name">${escapeHtml(parentLabel)}</span>
              </span>
              <div class="drawer-topic-group-meta">
                <span class="drawer-topic-count-num group-count">${totalGroupQuestions} soru</span>
                <span class="drawer-topic-dropdown-caret" aria-hidden="true">${expanded ? '⌄' : '›'}</span>
              </div>
            </button>
            <div class="drawer-topic-group-body">
              ${nestedHtml}
            </div>
          </div>
        `;
        return;
      }

      const t = group[0];
      const isSelected = state.selectedTopicKeys.has(t.key);
      let topicLabelHtml = '';
      if (t.ana_konu && t.alt_konu && t.ana_konu !== t.alt_konu) {
        topicLabelHtml = `<span class="topic-ak">${escapeHtml(t.ana_konu)}</span><span class="topic-slash">/</span><span class="topic-sub">${escapeHtml(t.alt_konu)}</span>`;
      } else {
        topicLabelHtml = `<span class="topic-sub">${escapeHtml(t.alt_konu || t.ana_konu)}</span>`;
      }

      innerHtml += `
        <div class="drawer-topic-item ${isSelected ? 'selected' : ''}" data-select-topic="${escapeJs(t.key)}">
          <span class="tree-checkbox ${isSelected ? 'checked' : ''}" aria-hidden="true">${isSelected ? '✓' : ''}</span>
          <span class="drawer-topic-name">${topicLabelHtml}</span>
          <span class="drawer-topic-count-num">${t.count} soru</span>
        </div>
      `;
    });

    const allSubjKeys = subjTopics.map(t => t.key);
    const isAllSubjSelected = allSubjKeys.length > 0 && allSubjKeys.every(k => state.selectedTopicKeys.has(k));
    const isPartialSubjSelected = !isAllSubjSelected && allSubjKeys.some(k => state.selectedTopicKeys.has(k));

    html += `
      <div class="drawer-subject-folder open" data-subject-folder="${s.id}">
        <button type="button" class="drawer-subject-folder-header" data-toggle-subject-folder="${s.id}">
          <div class="folder-header-left">
            <span class="tree-checkbox ${isAllSubjSelected ? 'checked' : (isPartialSubjSelected ? 'partial' : '')}"
                  data-folder-checkbox="${s.id}" aria-hidden="true">
              ${isAllSubjSelected ? '✓' : (isPartialSubjSelected ? '–' : '')}
            </span>
            <span>${s.icon}</span>
            <span>${escapeHtml(s.name)}</span>
          </div>
          <div class="folder-header-right">
            <span class="folder-count">${subjTotal} soru</span>
            <span class="folder-caret">⌄</span>
          </div>
        </button>
        <div class="drawer-subject-folder-body">
          ${innerHtml}
        </div>
      </div>
    `;
  });

  if (container) {
    container.innerHTML = html;

    container.querySelectorAll('[data-select-topic]').forEach((el) => {
      el.addEventListener('click', (event) => {
        event.stopPropagation();
        const key = el.getAttribute('data-select-topic');
        if (key) toggleTopicFromDrawer(key);
      });
    });

    container.querySelectorAll('[data-group-checkbox]').forEach((cb) => {
      cb.addEventListener('click', (event) => {
        event.stopPropagation();
        const gKey = cb.getAttribute('data-group-checkbox');
        const gTopics = topics.filter(t => {
          const pk = (t.ana_konu && t.alt_konu && t.ana_konu !== t.alt_konu) ? t.ana_konu : (t.ana_konu || t.alt_konu || 'Genel');
          return pk === gKey;
        });
        const gKeys = gTopics.map(t => t.key);
        const allSel = gKeys.every(k => state.selectedTopicKeys.has(k));
        gKeys.forEach(k => {
          if (allSel) state.selectedTopicKeys.delete(k);
          else state.selectedTopicKeys.add(k);
        });
        renderDrawerTopics();
      });
    });

    container.querySelectorAll('[data-folder-checkbox]').forEach((cb) => {
      cb.addEventListener('click', (event) => {
        event.stopPropagation();
        const sId = cb.getAttribute('data-folder-checkbox');
        const sTopics = topics.filter(t => Object.keys(t.courses).some(c => matchesSubject({ ders: c }, sId)));
        const sKeys = sTopics.map(t => t.key);
        const allSel = sKeys.every(k => state.selectedTopicKeys.has(k));
        sKeys.forEach(k => {
          if (allSel) state.selectedTopicKeys.delete(k);
          else state.selectedTopicKeys.add(k);
        });
        renderDrawerTopics();
      });
    });

    container.querySelectorAll('[data-topic-toggle-group]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        const group = btn.closest('.drawer-topic-group');
        if (!group) return;
        const caret = group.querySelector('.drawer-topic-dropdown-caret');
        group.classList.toggle('open');
        if (caret) caret.textContent = group.classList.contains('open') ? '⌄' : '›';
      });
    });

    container.querySelectorAll('[data-toggle-subject-folder]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        const folder = btn.closest('.drawer-subject-folder');
        if (!folder) return;
        const caret = folder.querySelector('.folder-caret');
        folder.classList.toggle('open');
        if (caret) caret.textContent = folder.classList.contains('open') ? '⌄' : '›';
      });
    });
  }
}

export function toggleTopicFromDrawer(topicKey) {
  if (state.selectedTopicKeys.has(topicKey)) {
    state.selectedTopicKeys.delete(topicKey);
  } else {
    state.selectedTopicKeys.add(topicKey);
  }
  renderDrawerTopics();
}

export function clearTopicSelection() {
  state.selectedTopicKeys.clear();
  renderDrawerTopics();
}

export function selectTopicFromDrawer(topicKey) {
  state.selectedTopicKeys.clear();
  state.selectedTopicKeys.add(topicKey);
  state.activeSearchFilter = '';
  state.bookletFilterMode = 'all';
  updateFilterButtonsUI();
  notifyStateChange('drawer:close');
  notifyStateChange('filter:updated');
  notifyStateChange('booklet:refresh');
}

export function loadAllTopicsToBooklet() {
  state.activeSearchFilter = '';
  state.bookletFilterMode = 'all';
  updateFilterButtonsUI();
  notifyStateChange('drawer:close');
  notifyStateChange('filter:updated');
  notifyStateChange('booklet:refresh');
}

onStateChange('drawer:topics-refresh', () => {
  renderDrawerTopics();
});
