import { state, store, notifyStateChange, onStateChange, BookletFilterMode } from '../../app/state.ts';
import { matchesSubject } from '../../data/subjects.js';
import { Question } from '../../data/question.ts';
import { updateBookletQuestions } from './selection.js';
import { renderBookletPages } from './render.js';

export type UnifiedMode = 'all' | 'rematch' | 'starred' | 'notes';

const MODE_META: Record<UnifiedMode, { label: string; icon: string; title: string }> = {
  all: {
    label: 'Sorular',
    title: 'Tüm Sorular (Test Modu)',
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`
  },
  rematch: {
    label: 'Rövanş',
    title: 'Rövanşlar (Yanlışlar & Şüpheliler)',
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="m16 16 4 4"/><path d="m19 21 2-2"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5"/><path d="m5 14 4 4"/><path d="m7 17-3 3"/><path d="m3 19 2 2"/></svg>`
  },
  starred: {
    label: 'Kayıtlı',
    title: 'Kaydedilen Sorular',
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`
  },
  notes: {
    label: 'Notlar',
    title: 'Ders Notları',
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`
  }
};

let isDropdownOpen = false;

export function toggleUnifiedDropdown(force?: boolean): void {
  isDropdownOpen = typeof force === 'boolean' ? force : !isDropdownOpen;
  const menu = document.getElementById('unifiedDropdownMenu');
  const trigger = document.getElementById('btnUnifiedTrigger');
  if (menu) menu.classList.toggle('is-open', isDropdownOpen);
  if (trigger) trigger.classList.toggle('is-expanded', isDropdownOpen);
}

export function closeUnifiedDropdown(): void {
  if (!isDropdownOpen) return;
  toggleUnifiedDropdown(false);
}

// Menü dışına tıklanınca kapat
if (typeof document !== 'undefined') {
  document.addEventListener('click', (event) => {
    if (!isDropdownOpen) return;
    const target = event.target as HTMLElement | null;
    if (!target?.closest('#topUnifiedPill')) {
      closeUnifiedDropdown();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isDropdownOpen) {
      closeUnifiedDropdown();
    }
  });
}

export function setUnifiedMode(mode: UnifiedMode): void {
  closeUnifiedDropdown();
  if (mode === 'notes') {
    store.setContentViewMode('notes');
    updateUnifiedToggleUI();
    notifyStateChange('view-mode:updated', 'notes');
    renderBookletPages();
  } else {
    store.setBookletFilterMode(mode);
    store.setLibraryMode(false);
    const viewChanged = state.contentViewMode !== 'questions';
    store.setContentViewMode('questions');
    updateUnifiedToggleUI();
    if (viewChanged) {
      notifyStateChange('view-mode:updated', 'questions');
      renderBookletPages();
    } else {
      updateBookletQuestions();
    }
  }
}

export function setBookletFilter(mode: BookletFilterMode): void {
  store.setBookletFilterMode(mode);
  store.setLibraryMode(false);
  if (state.contentViewMode === 'notes') {
    store.setContentViewMode('questions');
    notifyStateChange('view-mode:updated', 'questions');
  }
  updateUnifiedToggleUI();
  updateBookletQuestions();
}

export function getFilterCounts(): { rematch: number; starred: number } {
  let rematch = 0;
  let starred = 0;

  const dataset = state.allData;
  dataset.forEach((q: Question) => {
    if (state.currentSubject && !matchesSubject(q, state.currentSubject)) return;
    if (state.currentSubject && state.selectedCourses.size > 0 && !state.selectedCourses.has(q.ders)) return;

    const userMark = state.userMarkedChoices[q.id];
    const isWrong = Boolean(userMark && userMark !== q.dogru_cevap);
    const inQueue = state.rematchQuestionIds.has(q.id);
    if (isWrong || inQueue) rematch++;
    if (state.starredQuestionIds.has(q.id)) starred++;
  });

  return { rematch, starred };
}

export function updateUnifiedToggleUI(): void {
  if (typeof document === 'undefined') return;
  const pill = document.getElementById('topUnifiedPill');
  const counts = getFilterCounts();

  const currentView = state.contentViewMode || 'questions';
  const currentFilter = state.bookletFilterMode || 'all';

  const activeMode: UnifiedMode = (currentView === 'notes')
    ? 'notes'
    : (currentFilter === 'rematch' ? 'rematch' : (currentFilter === 'starred' ? 'starred' : 'all'));

  const rematchBadge = counts.rematch > 0
    ? `<span class="filter-count-badge">${counts.rematch}</span>`
    : '';

  const starredBadge = counts.starred > 0
    ? `<span class="filter-count-badge">${counts.starred}</span>`
    : '';

  const activeMeta = MODE_META[activeMode];
  const activeBadge = activeMode === 'rematch' ? rematchBadge : (activeMode === 'starred' ? starredBadge : '');

  if (pill) {
    pill.innerHTML = `
      <button class="btn-top-unified btn-top-unified-trigger active ${isDropdownOpen ? 'is-expanded' : ''}" id="btnUnifiedTrigger" data-action="toggle-unified-dropdown" data-mode="${activeMode}" title="${activeMeta.title} (Görünüm Değiştir)" aria-expanded="${isDropdownOpen}">
        ${activeMeta.icon}
        <span class="top-unified-label">${activeMeta.label}</span>
        ${activeBadge}
        <span class="unified-trigger-caret">▾</span>
      </button>
      <div class="unified-dropdown-menu ${isDropdownOpen ? 'is-open' : ''}" id="unifiedDropdownMenu" role="menu">
        <button class="unified-dropdown-item ${activeMode === 'all' ? 'is-selected' : ''}" id="btnUnifiedAll" data-action="set-unified-mode" data-mode="all" role="menuitem">
          ${MODE_META.all.icon}
          <span class="top-unified-label">Sorular</span>
        </button>
        <button class="unified-dropdown-item ${activeMode === 'rematch' ? 'is-selected' : ''}" id="btnUnifiedRematch" data-action="set-unified-mode" data-mode="rematch" role="menuitem">
          ${MODE_META.rematch.icon}
          <span class="top-unified-label">Rövanş</span>
          ${rematchBadge}
        </button>
        <button class="unified-dropdown-item ${activeMode === 'starred' ? 'is-selected' : ''}" id="btnUnifiedStarred" data-action="set-unified-mode" data-mode="starred" role="menuitem">
          ${MODE_META.starred.icon}
          <span class="top-unified-label">Kayıtlı</span>
          ${starredBadge}
        </button>
        <button class="unified-dropdown-item ${activeMode === 'notes' ? 'is-selected' : ''}" id="btnUnifiedNotes" data-action="set-unified-mode" data-mode="notes" role="menuitem">
          ${MODE_META.notes.icon}
          <span class="top-unified-label">Notlar</span>
        </button>
      </div>
    `;
  }
}

export function updateFilterButtonsUI(): void {
  updateUnifiedToggleUI();
}

onStateChange('filter:updated', () => {
  updateUnifiedToggleUI();
});



