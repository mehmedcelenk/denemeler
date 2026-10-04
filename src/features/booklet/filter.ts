import { state, onStateChange } from '../../app/state.ts';
import type { BookletFilterMode } from '../../shared/question-filter.ts';
import { updateBookletQuestions } from './selection.js';
import { matchesSubject } from '../../data/subjects.js';

export function setBookletFilter(mode: BookletFilterMode): void {
  state.bookletFilterMode = mode;
  state.isLibraryMode = false;
  updateFilterButtonsUI();
  updateBookletQuestions();
}

export function getFilterCounts(): { rematch: number; starred: number } {
  let rematch = 0;
  let starred = 0;

  const dataset = state.allData;
  dataset.forEach(q => {
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

export function updateFilterButtonsUI(): void {
  if (typeof document === 'undefined') return;
  const pill = document.getElementById('topFilterPill');
  if (!pill) return;

  const counts = getFilterCounts();
  const currentMode = state.bookletFilterMode;

  const rematchBadge = counts.rematch > 0
    ? `<span class="filter-count-badge">${counts.rematch}</span>`
    : '';

  const starredBadge = counts.starred > 0
    ? `<span class="filter-count-badge">${counts.starred}</span>`
    : '';

  pill.innerHTML = `
    <button class="btn-top-filter ${currentMode === 'all' ? 'active' : ''}" id="btnFilterAll" onclick="setBookletFilter('all')" title="Tüm Sorular (Klasik Mod)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
      <span class="top-filter-label">Tümü</span>
    </button>
    <button class="btn-top-filter ${currentMode === 'rematch' ? 'active' : ''}" id="btnFilterRematch" onclick="setBookletFilter('rematch')" title="Rövanşlar (Yanlışlar & Şüpheliler)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6"/><path d="m16 16 4 4"/><path d="m19 21 2-2"/><path d="M14.5 6.5 18 3h3v3l-3.5 3.5"/><path d="m5 14 4 4"/><path d="m7 17-3 3"/><path d="m3 19 2 2"/></svg>
      <span class="top-filter-label">Rövanş</span>
      ${rematchBadge}
    </button>
    <button class="btn-top-filter ${currentMode === 'starred' ? 'active' : ''}" id="btnFilterStarred" onclick="setBookletFilter('starred')" title="Yıldızlılar (Favoriler)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      <span class="top-filter-label">Yıldızlı</span>
      ${starredBadge}
    </button>
  `;
}

onStateChange('filter:updated', () => {
  updateFilterButtonsUI();
});



