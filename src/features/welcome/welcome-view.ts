import { canStudyLocally } from './study-session.ts';
import type { AppState } from '../../app/state-types.ts';
import type { SubjectId } from '../../data/question.ts';
import { updateAuthUiState } from './auth-modal.ts';
import { renderArenaReport } from './arena-report.ts';

export type ProgramMode = AppState['programMode'];

export const DEFAULT_SUBJECTS: Readonly<Record<ProgramMode, SubjectId>> = {
  AOIHL: 'TDE',
  AOO: 'AOO_TURKCE',
  AOF: 'AOF_HADIS',
  ILMIHAL: 'ILM_TEMIZLIK',
  GIRISIMCILIK: 'GIR_TEMEL',
  TYT: 'TYT_TURKCE',
  AYT: 'AYT_MAT',
  YDT: 'YDT_ING',
};

interface WelcomeViewOptions {
  readonly programMode: ProgramMode;
  readonly canResume: boolean;
}

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
        <h1>anlatansorular.com</h1>
      </header>

      <!-- GİRİŞ / KAYIT BÖLÜMÜ (Giriş yapılmamışken direkt ekranda görünür) -->
      <section class="welcome-auth-section" id="welcomeAuthSection" aria-label="Kullanıcı Girişi">
        <p class="welcome-auth-lead" id="authNoticeText">Hesabınla giriş yap veya misafir olarak çalış.</p>
        <div class="welcome-auth-tabs" role="tablist">
          <button type="button" class="welcome-auth-tab is-active" id="btnTabSignin" data-action="welcome-set-auth-signin" role="tab" aria-selected="true">Giriş Yap</button>
          <button type="button" class="welcome-auth-tab" id="btnTabSignup" data-action="welcome-set-auth-signup" role="tab" aria-selected="false">Kayıt Ol</button>
        </div>
        <div class="welcome-auth-fields">
          <input id="authUsernameInput" type="text" maxlength="30" autocomplete="username" placeholder="Kullanıcı Adınız (örn: emin)" aria-label="Kullanıcı Adı" hidden>
          <input id="authEmailInput" type="text" autocomplete="username email" placeholder="Kullanıcı adı veya E-posta" aria-label="Kullanıcı adı veya E-posta">
          <input id="authPasswordInput" type="password" autocomplete="current-password" placeholder="Şifreniz" aria-label="Şifre">
          <input id="authPasswordConfirmInput" type="password" autocomplete="new-password" placeholder="Şifrenizi Tekrar Girin" aria-label="Şifre Tekrarı" hidden>
          <p class="welcome-name-error" id="authDialogError" role="alert" aria-live="polite"></p>
          <button type="button" class="welcome-name-confirm" id="btnAuthSubmit" data-action="welcome-submit-auth">Giriş Yap →</button>
        </div>
        <button type="button" class="welcome-action-row" data-action="welcome-enter-guest">Misafir Olarak Devam Et</button>
      </section>

      <!-- Bireysel erişim: gerçek hesap veya yerel misafir -->
      <section class="welcome-main-section" id="welcomeMainSection" aria-label="Hızlı Başlat" hidden>
        <div class="welcome-arena-report" id="welcomeArenaReport"></div>
        <div class="welcome-arena-subjects" id="welcomeArenaSubjects"></div>
      </section>

      <p class="welcome-form-error" id="welcomeFormError" role="alert" aria-live="polite"></p>
    </div>

  `;

  setWelcomeProgram(options.programMode);
  updateResumeAction(options.canResume);
  updateAuthUiState();
  renderArenaReport();
}

export function closeProfileMenu(): void {
  document.getElementById('consoleMenuPopup')?.classList.remove('open');
  document.getElementById('btnMasterConsole')?.setAttribute('aria-expanded', 'false');
}

export function openTeamInput(): void {
  closeProfileMenu();
  const modal = document.getElementById('teamQuickModal');
  if (modal) modal.hidden = false;
  showWelcomeError();
  focusRoomInput();
}

export function resetTeamInput(force = false): void {
  const modal = document.getElementById('teamQuickModal');
  if (modal && (force || !modal.hidden)) {
    modal.hidden = true;
  }
  const err = document.getElementById('teamQuickError');
  if (err) err.textContent = '';
}

export function updateWelcomeActiveRoom(roomId: string | null, _roomName: string, _participantCount: number): void {
  if (roomId) resetTeamInput(true);
}

export function showWelcomePortal(): void {
  const portal = getPortal();
  if (!portal) return;
  portal.hidden = false;
  portal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('welcome-active');
  document.getElementById('consoleMenuPopup')?.classList.remove('open');
  document.getElementById('btnMasterConsole')?.setAttribute('aria-expanded', 'false');
  closeProfileMenu();
  resetTeamInput();
  renderArenaReport();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

export function hideWelcomePortal(): void {
  if (!canStudyLocally()) {
    showWelcomePortal();
    return;
  }
  const portal = getPortal();
  if (!portal) return;
  portal.hidden = true;
  portal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('welcome-active');
  document.getElementById('consoleMenuPopup')?.classList.remove('open');
  document.getElementById('btnMasterConsole')?.setAttribute('aria-expanded', 'false');
  closeProfileMenu();
}

export function setWelcomeProgram(mode: ProgramMode): void {
  document.querySelectorAll<HTMLButtonElement>('[data-program]').forEach(button => {
    const isActive = button.dataset.program === mode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

export function getWelcomeRoomId(): string {
  const input = document.getElementById('welcomeRoomId') as HTMLInputElement | null;
  return input && typeof input.value === 'string' ? input.value.trim() : '';
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
  const teamError = document.getElementById('teamQuickError');
  if (teamError) teamError.textContent = message;
}

export function updateResumeAction(canResume: boolean): void {
  const consoleBtn = document.getElementById('btnResumeLastSession') as HTMLButtonElement | null;
  if (consoleBtn) {
    consoleBtn.hidden = !canResume;
    consoleBtn.title = canResume ? 'Son çalıştığın soruya dön' : 'Yeni derse başla';
  }
}

export function focusRoomInput(): void {
  document.getElementById('welcomeRoomId')?.focus();
}
