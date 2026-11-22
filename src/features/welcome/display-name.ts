import { onStateChange, state } from '../../app/state.ts';
import { writeString } from '../../app/storage.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';
import { updateDisplayName } from '../../data/display-name.ts';
import { ensureFreshSession } from './cloud-sync.ts';
import { getActiveSession, isStudyGeneration, saveActiveSession } from './study-session.ts';

function bindDisplayNameInput(input: HTMLInputElement): void {
  if (input.dataset.bound === '1') return;
  input.dataset.bound = '1';
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void saveDisplayName();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeDisplayNameEditor();
    }
  });
}

export function openDisplayNameEditor(): void {
  const session = getActiveSession();
  const editor = document.getElementById('displayNameEditor');
  const input = document.getElementById('displayNameInput') as HTMLInputElement | null;
  const profileDisplay = document.getElementById('profileUserNameDisplay');
  const error = document.getElementById('displayNameError');
  if (!session || !editor || !input) return;
  bindDisplayNameInput(input);
  if (error) error.textContent = '';
  input.value = session.user.displayName || session.user.username || '';
  if (profileDisplay) profileDisplay.hidden = true;
  editor.hidden = false;
  input.focus();
  input.select();
}

export function closeDisplayNameEditor(): void {
  const editor = document.getElementById('displayNameEditor');
  const profileDisplay = document.getElementById('profileUserNameDisplay');
  const error = document.getElementById('displayNameError');
  if (error) error.textContent = '';
  if (profileDisplay) profileDisplay.hidden = false;
  if (editor) editor.hidden = true;
}

onStateChange('study:changed', closeDisplayNameEditor);

export async function saveDisplayName(): Promise<void> {
  const input = document.getElementById('displayNameInput') as HTMLInputElement | null;
  const error = document.getElementById('displayNameError');
  const button = document.getElementById('displayNameSave') as HTMLButtonElement | null;
  const name = input?.value.trim() || '';
  if (!name || name.length > 80) {
    if (error) error.textContent = 'Adınız 1 ile 80 karakter arasında olmalı.';
    return;
  }
  const generation = state.studyGeneration;
  if (button) button.disabled = true;
  if (error) error.textContent = '';
  try {
    const session = await ensureFreshSession();
    if (!session || !isStudyGeneration(generation)) return;
    const ok = await updateDisplayName(session, name);
    const current = getActiveSession();
    if (!isStudyGeneration(generation) || current?.user.id !== session.user.id) return;
    if (!ok) {
      if (error) error.textContent = 'Adınız kaydedilemedi. Bağlantınızı kontrol edip tekrar deneyin.';
      return;
    }
    saveActiveSession({ ...current, user: { ...current.user, displayName: name } });
    writeString(StorageKeys.USER_NAME, name);
    const display = document.getElementById('authUserNameDisplay');
    if (display) display.textContent = name;
    const profileDisplay = document.getElementById('profileUserNameDisplay');
    if (profileDisplay) profileDisplay.textContent = name;
    closeDisplayNameEditor();
  } finally { if (button) button.disabled = false; }
}
