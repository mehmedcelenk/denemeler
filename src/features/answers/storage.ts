import { parseSavedChoices } from '../../shared/saved-choices.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';
import { state } from '../../app/state.ts';

export function saveChoicesToStorage(): void {
  try {
    localStorage.setItem(StorageKeys.USER_CHOICES, JSON.stringify(state.userMarkedChoices));
  } catch {}
}

export function loadSavedChoices(): void {
  try {
    state.userMarkedChoices = parseSavedChoices(localStorage.getItem(StorageKeys.USER_CHOICES));
  } catch {}
}
