import type { AppState } from '../../app/state-types.ts';

export type ProgramMode = AppState['programMode'];

interface WelcomeViewOptions {
  readonly programMode: ProgramMode;
  readonly canResume: boolean;
}

const studyIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10"/></svg>
`;
const usersIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
`;

function getPortal(): HTMLElement | null {
  return document.getElementById('welcomePortal');
}

export function renderWelcomePortal(options: WelcomeViewOptions): void {
  const portal = getPortal();
  if (!portal) return;

  portal.innerHTML = `
    <div class="welcome-card">
      <header class="welcome-header">
        <p class="welcome-bismillah" lang="ar" dir="rtl">بسم الله</p>
        <h1>CENK</h1>
        <div class="welcome-program-toggle" role="group" aria-label="Program seçimi">
          <button type="button" data-action="welcome-set-program" data-program="AOIHL" aria-pressed="false">AOİHL</button>
          <button type="button" data-action="welcome-set-program" data-program="AOF" aria-pressed="false">AÖF</button>
          <button type="button" data-action="welcome-set-program" data-program="TYT" aria-pressed="false">TYT</button>
          <button type="button" data-action="welcome-set-program" data-program="AYT" aria-pressed="false">AYT</button>
          <button type="button" data-action="welcome-set-program" data-program="YDT" aria-pressed="false">YDT</button>
        </div>
      </header>

      <div class="welcome-actions">
        <button type="button" class="welcome-action-row" data-action="welcome-start-single">
          <span class="welcome-action-icon">${studyIcon}</span>
          <span class="welcome-action-label">Soru Çöz</span>
          <span class="welcome-action-arrow" aria-hidden="true">→</span>
        </button>
        <div class="welcome-action-row welcome-multiplayer-row">
          <span class="welcome-action-icon">${usersIcon}</span>
          <label class="welcome-multiplayer-label" for="welcomeRoomId">Çevrim İçi:</label>
          <input id="welcomeRoomId" type="text" maxlength="24" autocomplete="off" autocapitalize="characters" placeholder="Oda adı" aria-label="Oda adı">
          <button type="button" class="welcome-room-submit" data-action="welcome-join-room" aria-label="Odaya katıl">→</button>
        </div>
      </div>
      <p class="welcome-form-error" id="welcomeFormError" role="alert" aria-live="polite"></p>
    </div>

    <div class="welcome-dialog-backdrop" id="welcomeNameDialog" hidden>
      <section class="welcome-name-dialog" role="dialog" aria-modal="true" aria-labelledby="welcomeNameTitle">
        <button type="button" class="welcome-dialog-close" data-action="welcome-cancel-name" aria-label="Kapat">×</button>
        <h2 id="welcomeNameTitle">Oyundaki adınız nedir?</h2>
        <p>Bu adı sonraki odalarda otomatik kullanacağız.</p>
        <input id="welcomeNameInput" type="text" maxlength="40" autocomplete="name" placeholder="Adınız" aria-label="Oyundaki adınız">
        <p class="welcome-name-error" id="welcomeNameError" role="alert" aria-live="polite"></p>
        <button type="button" class="welcome-name-confirm" data-action="welcome-confirm-name">Devam Et →</button>
      </section>
    </div>
  `;

  setWelcomeProgram(options.programMode);
  updateResumeAction(options.canResume);
}

export function showWelcomePortal(): void {
  const portal = getPortal();
  if (!portal) return;
  portal.hidden = false;
  portal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('welcome-active');
  document.getElementById('consoleMenuPopup')?.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'auto' });
}

export function hideWelcomePortal(): void {
  const portal = getPortal();
  if (!portal) return;
  hideNameDialog();
  portal.hidden = true;
  portal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('welcome-active');
  document.getElementById('consoleMenuPopup')?.classList.remove('open');
}

export function setWelcomeProgram(mode: ProgramMode): void {
  document.querySelectorAll<HTMLButtonElement>('#welcomePortal [data-program]').forEach(button => {
    const isActive = button.dataset.program === mode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

export function getWelcomeRoomId(): string {
  const input = document.getElementById('welcomeRoomId');
  return input instanceof HTMLInputElement ? input.value.trim().toLocaleUpperCase('tr-TR') : '';
}

export function getDialogUserName(): string {
  const input = document.getElementById('welcomeNameInput');
  return input instanceof HTMLInputElement ? input.value.trim() : '';
}

export function showNameDialog(): void {
  const dialog = document.getElementById('welcomeNameDialog');
  if (!dialog) return;
  dialog.hidden = false;
  showNameError();
  requestAnimationFrame(() => document.getElementById('welcomeNameInput')?.focus());
}

export function hideNameDialog(): void {
  const dialog = document.getElementById('welcomeNameDialog');
  if (dialog) dialog.hidden = true;
}

export function setWelcomeBusy(isBusy: boolean): void {
  const portal = getPortal();
  if (!portal) return;
  portal.classList.toggle('is-busy', isBusy);
  portal.setAttribute('aria-busy', String(isBusy));
  portal.querySelectorAll<HTMLButtonElement>('button').forEach(button => {
    button.disabled = isBusy;
  });
}

export function showWelcomeError(message = ''): void {
  const error = document.getElementById('welcomeFormError');
  if (error) error.textContent = message;
}

export function showNameError(message = ''): void {
  const error = document.getElementById('welcomeNameError');
  if (error) error.textContent = message;
}

export function updateResumeAction(canResume: boolean): void {
  const button = document.getElementById('btnResumeLastSession');
  if (!(button instanceof HTMLButtonElement)) return;
  button.title = canResume ? 'Son çalıştığın soruya dön' : 'Yeni derse başla';
}

export function focusRoomInput(): void {
  document.getElementById('welcomeRoomId')?.focus();
}
