import { state, notifyStateChange, onStateChange, BookletFilterMode } from '../../app/state.ts';
import { matchesSubject } from '../../data/subjects.js';
import { Question } from '../../data/question.ts';
import { updateBookletQuestions } from './selection.js';
import { renderBookletPages } from './render.js';

export type UnifiedMode = 'all' | 'rematch' | 'starred' | 'notes';

export function setUnifiedMode(mode: UnifiedMode): void {
  if (mode === 'notes') {
    state.contentViewMode = 'notes';
    updateUnifiedToggleUI();
    notifyStateChange('view-mode:updated', 'notes');
    renderBookletPages();
  } else {
    state.bookletFilterMode = mode;
    state.isLibraryMode = false;
    const viewChanged = state.contentViewMode !== 'questions';
    state.contentViewMode = 'questions';
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
  state.bookletFilterMode = mode;
  state.isLibraryMode = false;
  if (state.contentViewMode === 'notes') {
    state.contentViewMode = 'questions';
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
    if (state.currentSubject && !state.selectedCourses.has(q.ders)) return;

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

  if (pill) {
    pill.innerHTML = `
      <button class="btn-top-unified ${activeMode === 'all' ? 'active' : ''}" id="btnUnifiedAll" data-action="set-unified-mode" data-mode="all" title="Tüm Sorular (Test Modu)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        <span class="top-unified-label">Sorular</span>
      </button>
      <button class="btn-top-unified ${activeMode === 'rematch' ? 'active' : ''}" id="btnUnifiedRematch" data-action="set-unified-mode" data-mode="rematch" title="Rövanşlar (Yanlışlar & Şüpheliler)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="m16 16 4 4"/><path d="m19 21 2-2"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5"/><path d="m5 14 4 4"/><path d="m7 17-3 3"/><path d="m3 19 2 2"/></svg>
        <span class="top-unified-label">Rövanş</span>
        ${rematchBadge}
      </button>
      <button class="btn-top-unified ${activeMode === 'starred' ? 'active' : ''}" id="btnUnifiedStarred" data-action="set-unified-mode" data-mode="starred" title="Yıldızlılar (Favoriler)">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        <span class="top-unified-label">Yıldızlı</span>
        ${starredBadge}
      </button>
      <button class="btn-top-unified ${activeMode === 'notes' ? 'active' : ''}" id="btnUnifiedNotes" data-action="set-unified-mode" data-mode="notes" title="Ders Notları">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        <span class="top-unified-label">Notlar</span>
      </button>
    `;
  }
}

export function updateFilterButtonsUI(): void {
  updateUnifiedToggleUI();
}

onStateChange('filter:updated', () => {
  updateUnifiedToggleUI();
});



