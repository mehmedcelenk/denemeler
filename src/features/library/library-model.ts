import { state, store } from '../../app/state.ts';

const STARRED_KEY = 'aol_starred_questions';
const REMATCH_KEY = 'aol_rematch_queue';

export function loadLibraryData(): void {
  try {
    const rawStarred = localStorage.getItem(STARRED_KEY);
    if (rawStarred) {
      const arr = JSON.parse(rawStarred);
      if (Array.isArray(arr)) {
        store.setStarredQuestionIds(arr.filter(Number.isSafeInteger), false);
      }
    }
  } catch {
    store.setStarredQuestionIds([], false);
  }

  try {
    const rawRematch = localStorage.getItem(REMATCH_KEY);
    if (rawRematch) {
      const arr = JSON.parse(rawRematch);
      if (Array.isArray(arr)) {
        store.setRematchQuestionIds(arr.filter(Number.isSafeInteger), false);
      }
    }
  } catch {
    store.setRematchQuestionIds([], false);
  }

  updateLibraryBadgeUI();
}

export function saveStarred(): void {
  store.setStarredQuestionIds(state.starredQuestionIds, true);
  updateLibraryBadgeUI();
}

export function saveRematch(): void {
  store.setRematchQuestionIds(state.rematchQuestionIds, true);
  updateLibraryBadgeUI();
}

export function saveLibraryToStorage(): void {
  saveStarred();
  saveRematch();
}

export function toggleStarQuestion(id: number): boolean {
  const isStarred = store.toggleStarredQuestion(id, true);
  updateLibraryBadgeUI();
  return isStarred;
}

export function addToRematch(id: number): void {
  store.addRematchQuestion(id, true);
  updateLibraryBadgeUI();
}

export function removeFromRematch(id: number): void {
  store.removeRematchQuestion(id, true);
  updateLibraryBadgeUI();
}

export function updateLibraryBadgeUI(): void {
  if (typeof document === 'undefined') return;
  const badge = document.getElementById('lblRematchBadge');
  if (badge) {
    const count = state.rematchQuestionIds.size;
    badge.textContent = String(count);
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
  }
}
