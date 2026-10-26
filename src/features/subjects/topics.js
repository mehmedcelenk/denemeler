import { getAggregatedTopics } from './topic-model.js';
import { state, store, onStateChange, notifyStateChange } from '../../app/state.ts';
import { getCondensedCourseCode, matchesSubject, AOIHL_SUBJECTS, AOF_SUBJECTS } from '../../data/subjects.js';
import { updateFilterButtonsUI } from '../booklet/filter.ts';
import { getExamPeriodsForSelection, renderExamPeriodsHtml, selectExamPeriodFromDrawer } from './exam-periods.ts';
import { renderTopicsTreeHtml } from './topics-tree.ts';

let currentDrawerTab = 'periods';

export function setDrawerTab(tab) {
  currentDrawerTab = (tab === 'topics') ? 'topics' : 'periods';
  renderDrawerTopics();
}

export function getCurrentDrawerTab() {
  return currentDrawerTab;
}

export function renderDrawerTopics() {
  const container = document.getElementById('drawerTopicList');
  const headerLbl = document.getElementById('lblDrawerTopicHeader');
  const allBtn = document.getElementById('btnLoadAllTopics');

  if (state.isLibraryMode) {
    if (container) container.innerHTML = '';
    return;
  }

  const isTde = state.currentSubject === 'TDE' || Array.from(state.selectedCourses).some(c => c.includes('EDEBİYAT') || c.includes('TÜRK DİLİ'));

  const tabsContainer = document.getElementById('drawerViewModeTabs');
  if (tabsContainer) {
    tabsContainer.style.display = isTde ? 'inline-flex' : 'none';
    const btnPeriods = tabsContainer.querySelector('[data-tab="periods"]');
    const btnTopics = tabsContainer.querySelector('[data-tab="topics"]');
    if (btnPeriods) btnPeriods.classList.toggle('active', currentDrawerTab === 'periods');
    if (btnTopics) btnTopics.classList.toggle('active', currentDrawerTab === 'topics');
  }

  if (!isTde) {
    currentDrawerTab = 'periods';
  }

  if (!state.currentSubject && state.selectedCourses.size === 0) {
    if (headerLbl) headerLbl.textContent = (currentDrawerTab === 'topics') ? 'Konular:' : 'Sınav Dönemleri:';
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

  if (currentDrawerTab === 'periods') {
    const examPeriods = getExamPeriodsForSelection();
    if (headerLbl) {
      headerLbl.textContent = state.selectedExamPeriod
        ? `Seçili Sınav: ${state.selectedExamPeriod}`
        : `Çıkmış Sınav Dönemleri (${examPeriods.length}):`;
    }
    if (allBtn) {
      allBtn.textContent = state.selectedExamPeriod ? 'Tüm Dönemleri Aç' : 'Tümünü Aç';
      allBtn.onclick = function() {
        selectExamPeriodFromDrawer(null);
      };
    }
    if (container) {
      if (examPeriods.length === 0) {
        container.innerHTML = '<div style="padding:14px; text-align:center; color:var(--paper-text-muted); font-size:12px;">Bu ders için sınav dönemi bulunamadı.</div>';
      } else {
        container.innerHTML = renderExamPeriodsHtml(examPeriods);
        container.querySelectorAll('[data-select-exam-period]').forEach(el => {
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            const periodKey = el.getAttribute('data-select-exam-period');
            selectExamPeriodFromDrawer(periodKey || null);
          });
        });
      }
    }
    return;
  }

  // Konular Sekmesi
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

  const currentList = state.programMode === 'AOF' ? AOF_SUBJECTS : AOIHL_SUBJECTS;
  const activeSubjectList = currentList.filter(s => {
    for (const c of state.selectedCourses) {
      if (matchesSubject({ ders: c }, s.id)) return true;
    }
    return state.selectedCourses.size === 0 && state.currentSubject === s.id;
  });

  if (container) {
    container.innerHTML = renderTopicsTreeHtml(topics, activeSubjectList, state.selectedTopicKeys);

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
        const nextKeys = new Set(state.selectedTopicKeys);
        gKeys.forEach(k => {
          if (allSel) nextKeys.delete(k);
          else nextKeys.add(k);
        });
        store.setSelectedExamPeriod(null);
        store.setSelectedTopicKeys(nextKeys);
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
        const nextKeys = new Set(state.selectedTopicKeys);
        sKeys.forEach(k => {
          if (allSel) nextKeys.delete(k);
          else nextKeys.add(k);
        });
        store.setSelectedExamPeriod(null);
        store.setSelectedTopicKeys(nextKeys);
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
  store.setSelectedExamPeriod(null);
  store.toggleTopicKey(topicKey);
  renderDrawerTopics();
}

export function clearTopicSelection() {
  store.clearSelectedTopicKeys();
  renderDrawerTopics();
}

export function selectTopicFromDrawer(topicKey) {
  store.setSelectedExamPeriod(null);
  store.setSelectedTopicKeys([topicKey]);
  store.setActiveSearchFilter('');
  store.setBookletFilterMode('all');
  updateFilterButtonsUI();
  notifyStateChange('drawer:close');
  notifyStateChange('filter:updated');
  notifyStateChange('booklet:refresh');
}

export function loadAllTopicsToBooklet() {
  store.setActiveSearchFilter('');
  store.setBookletFilterMode('all');
  updateFilterButtonsUI();
  notifyStateChange('drawer:close');
  notifyStateChange('filter:updated');
  notifyStateChange('booklet:refresh');
}

onStateChange('drawer:topics-refresh', () => {
  renderDrawerTopics();
});
