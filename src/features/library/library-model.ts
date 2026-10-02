import { state } from '../../app/state.ts';

const STARRED_KEY = 'aol_starred_questions';
const REMATCH_KEY = 'aol_rematch_queue';

export function loadLibraryData(): void {
  try {
    const rawStarred = localStorage.getItem(STARRED_KEY);
    if (rawStarred) {
      const arr = JSON.parse(rawStarred);
      if (Array.isArray(arr)) {
        state.starredQuestionIds = new Set(arr.filter(Number.isSafeInteger));
      }
    }
  } catch {
    state.starredQuestionIds = new Set();
  }

  try {
    const rawRematch = localStorage.getItem(REMATCH_KEY);
    if (rawRematch) {
      const arr = JSON.parse(rawRematch);
      if (Array.isArray(arr)) {
        state.rematchQuestionIds = new Set(arr.filter(Number.isSafeInteger));
      }
    }
  } catch {
    state.rematchQuestionIds = new Set();
  }

  updateLibraryBadgeUI();
}

export function saveStarred(): void {
  try {
    localStorage.setItem(STARRED_KEY, JSON.stringify(Array.from(state.starredQuestionIds)));
  } catch {}
  updateLibraryBadgeUI();
}

export function saveRematch(): void {
  try {
    localStorage.setItem(REMATCH_KEY, JSON.stringify(Array.from(state.rematchQuestionIds)));
  } catch {}
  updateLibraryBadgeUI();
}

export function saveLibraryToStorage(): void {
  saveStarred();
  saveRematch();
}

export function toggleStarQuestion(id: number): boolean {
  let isStarred = false;
  if (state.starredQuestionIds.has(id)) {
    state.starredQuestionIds.delete(id);
    isStarred = false;
  } else {
    state.starredQuestionIds.add(id);
    isStarred = true;
  }
  saveStarred();
  return isStarred;
}

export function addToRematch(id: number): void {
  state.rematchQuestionIds.add(id);
  saveRematch();
}

export function removeFromRematch(id: number): void {
  state.rematchQuestionIds.delete(id);
  saveRematch();
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

