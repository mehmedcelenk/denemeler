import { choices, type Choice } from '../../data/question.ts';
import { isSavedChoicesContainer, parseSavedChoicesValue } from '../../shared/saved-choices.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';
import { state, store } from '../../app/state.ts';
import { readJson, writeJson } from '../../app/storage.ts';

function isChoice(value: unknown): value is Choice {
  return choices.some(choice => choice === value);
}

function isEliminatedChoices(value: unknown): value is Record<number, Choice[]> {
  return isSavedChoicesContainer(value) && Object.entries(value).every(([id, list]) =>
    /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Array.isArray(list) && list.every(isChoice)
  );
}

function isEliminatedWrongChoices(value: unknown): value is Record<number, Choice> {
  return isSavedChoicesContainer(value) && Object.entries(value).every(([id, choice]) =>
    /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && isChoice(choice)
  );
}

export function saveChoicesToStorage(): void {
  writeJson(StorageKeys.USER_CHOICES, state.userMarkedChoices);
}

export function loadSavedChoices(): void {
  const savedChoices = readJson(StorageKeys.USER_CHOICES, isSavedChoicesContainer, {});
  store.setUserMarkedChoices(parseSavedChoicesValue(savedChoices), false);
  store.setEliminatedChoices(
    readJson(StorageKeys.ELIMINATED_CHOICES, isEliminatedChoices, {}),
    false
  );
  store.setEliminatedWrongChoices(
    readJson(StorageKeys.ELIMINATED_WRONG_CHOICES, isEliminatedWrongChoices, {}),
    false
  );
}

