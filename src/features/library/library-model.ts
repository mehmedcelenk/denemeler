import {
  state,
  store,
  onStateChange,
  type AnswerMarkedPayload,
} from '../../app/state.ts';
import { readJson } from '../../app/storage.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

let initialized = false;

function isAnswerMarkedPayload(value: unknown): value is AnswerMarkedPayload {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AnswerMarkedPayload>;
  return Number.isSafeInteger(candidate.qid)
    && typeof candidate.isCorrect === 'boolean';
}

export function initLibrary(): void {
  if (initialized) return;
  initialized = true;

  onStateChange('answer:marked', (payload) => {
    if (!isAnswerMarkedPayload(payload)) return;
    if (payload.isCorrect) {
      if (state.rematchQuestionIds.has(payload.qid)) {
        removeFromRematch(payload.qid);
      }
    } else {
      addToRematch(payload.qid);
    }
  }, 40);
}

export function loadLibraryData(): void {
  const starred = readJson(StorageKeys.STARRED_QUESTIONS, isArray, []).filter(isSafeInteger);
  store.setStarredQuestionIds(starred, false);
  const rematch = readJson(StorageKeys.REMATCH_QUESTIONS, isArray, []).filter(isSafeInteger);
  store.setRematchQuestionIds(rematch, false);

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
