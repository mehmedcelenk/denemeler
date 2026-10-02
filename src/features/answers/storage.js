import { parseSavedChoices } from '../../shared/saved-choices.ts';
import { state } from '../../app/state.ts';

export function saveChoicesToStorage() {
  try {
    localStorage.setItem('aol_user_choices', JSON.stringify(state.userMarkedChoices));
  } catch (e) {}
}

export function loadSavedChoices() {
  try {
    state.userMarkedChoices = parseSavedChoices(localStorage.getItem('aol_user_choices'));
  } catch (e) {}
}
