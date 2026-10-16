import { parseSavedChoices } from '../../shared/saved-choices.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';
import { state, store } from '../../app/state.ts';

export function saveChoicesToStorage(): void {
  try {
    localStorage.setItem(StorageKeys.USER_CHOICES, JSON.stringify(state.userMarkedChoices));
  } catch {}
}

export function loadSavedChoices(): void {
  try {
    const parsed = parseSavedChoices(localStorage.getItem(StorageKeys.USER_CHOICES));
    store.setUserMarkedChoices(parsed, false);
  } catch {}
  try {
    const rawEliminated = localStorage.getItem(StorageKeys.ELIMINATED_CHOICES);
    if (rawEliminated) {
      const parsed = JSON.parse(rawEliminated);
      if (parsed && typeof parsed === 'object') {
        store.setEliminatedChoices(parsed, false);
      }
    }
  } catch {}
}

