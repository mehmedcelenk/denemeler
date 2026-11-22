import { state, onStateChange } from '../../app/state.ts';
import { openProfileScreen } from './profile-screen.ts';
import { canStudyLocally, isGuest, isStudyGeneration } from './study-session.ts';
import { writeString } from '../../app/storage.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';
import {
  signInWithEmail,
  signUpWithEmail,
  checkUsernameAvailable,
} from '../../data/supabase-auth.ts';
import {
  getActiveSession,
  saveActiveSession,
  isAuthenticated,
  syncCloudProgress,
  handleSignOut as baseHandleSignOut,
} from './cloud-sync.ts';

export * from './cloud-sync.ts';

export async function handleSignOut(): Promise<void> {
  await baseHandleSignOut();
  updateAuthUiState();
}

export function requireAuth(onAuthenticated: () => void, promptMessage?: string): void {
  if (isAuthenticated()) {
    onAuthenticated();
    return;
  }
  showAuthModal('signin', promptMessage || 'Bu özelliği kullanmak için lütfen oturum açın.');
}

let authMode: 'signin' | 'signup' = 'signin';

export function setAuthMode(mode: 'signin' | 'signup'): void {
  authMode = mode;
  if (typeof document === 'undefined') return;

  const isSign = mode === 'signin';
  const setTab = (id: string, active: boolean) => {
    const el = document.getElementById(id);
    el?.classList.toggle('is-active', active);
    el?.setAttribute('aria-selected', String(active));
  };
  setTab('btnTabSignin', isSign);
  setTab('btnTabSignup', !isSign);

  const userInput = document.getElementById('authUsernameInput') as HTMLInputElement | null;
  const emailInput = document.getElementById('authEmailInput') as HTMLInputElement | null;
  const passInput = document.getElementById('authPasswordInput') as HTMLInputElement | null;
  const passConfirmInput = document.getElementById('authPasswordConfirmInput') as HTMLInputElement | null;
  const submitBtn = document.getElementById('btnAuthSubmit');
  const noticeEl = document.getElementById('authNoticeText');
  const errorEl = document.getElementById('authDialogError');

  if (errorEl) errorEl.textContent = '';
  if (userInput) userInput.hidden = isSign;
  if (passConfirmInput) passConfirmInput.hidden = isSign;
  if (emailInput) emailInput.placeholder = isSign ? 'Kullanıcı adı veya E-posta' : 'E-posta adresiniz (örn: emin@mail.com)';
  if (passInput) passInput.placeholder = isSign ? 'Şifreniz' : 'Şifreniz (en az 6 karakter)';
  if (submitBtn) submitBtn.textContent = isSign ? 'Giriş Yap →' : 'Kayıt Ol →';
  if (noticeEl) noticeEl.textContent = isSign ? 'Hesabınla giriş yap veya misafir olarak çalış.' : 'Yeni bir hesap oluşturup hemen başlayın.';
  (isSign ? emailInput : userInput)?.focus();
}

export function showAuthModal(mode: 'signin' | 'signup' = 'signin', notice = ''): void {
  setAuthMode(mode);
  if (typeof document === 'undefined') return;
  if (notice) {
    const noticeEl = document.getElementById('authNoticeText');
    if (noticeEl) noticeEl.textContent = notice;
  }
  const authSection = document.getElementById('welcomeAuthSection');
  const mainSection = document.getElementById('welcomeMainSection');
  if (authSection) authSection.hidden = false;
  if (mainSection) mainSection.hidden = true;
  const portal = document.getElementById('welcomePortal');
  if (portal) {
    portal.hidden = false;
    portal.setAttribute('aria-hidden', 'false');
  }
  document.body.classList.add('welcome-active');
  document.getElementById(mode === 'signin' ? 'authEmailInput' : 'authUsernameInput')?.focus();
}

export function hideAuthModal(): void {
  if (!canStudyLocally()) return;
  updateAuthUiState();
}

export function toggleAuthMode(): void {
  setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
}

let isSubmitting = false;

export async function submitAuth(): Promise<void> {
  if (isSubmitting) return;
  getActiveSession();
  const generation = state.studyGeneration;
  const emailInput = document.getElementById('authEmailInput') as HTMLInputElement | null;
  const passInput = document.getElementById('authPasswordInput') as HTMLInputElement | null;
  const userInput = document.getElementById('authUsernameInput') as HTMLInputElement | null;
  const passConfirmInput = document.getElementById('authPasswordConfirmInput') as HTMLInputElement | null;
  const errorEl = document.getElementById('authDialogError');
  const noticeEl = document.getElementById('authNoticeText');
  const submitBtn = document.getElementById('btnAuthSubmit') as HTMLButtonElement | null;

  const identifier = emailInput?.value.trim() || '';
  const password = passInput?.value || '';
  const username = userInput?.value.trim() || '';
  const passwordConfirm = passConfirmInput?.value || '';

  const showError = (msg: string, el?: HTMLElement | null): void => {
    if (errorEl) errorEl.textContent = msg;
    el?.focus();
  };

  if (authMode === 'signup') {
    if (!username) return showError('Lütfen bir kullanıcı adı belirleyin.', userInput);
    const cleanUser = username.toLowerCase();
    if (cleanUser.length < 3 || cleanUser.length > 30) return showError('Kullanıcı adı 3 ile 30 karakter arasında olmalıdır.', userInput);
    if (!/^[a-zA-Z0-9_\u00C0-\u017F-]+$/.test(username)) {
      return showError('Kullanıcı adı boşluk içeremez; harf, rakam, alt çizgi ve tire kullanılabilir.', userInput);
    }
    if (!identifier) return showError('Lütfen e-posta adresinizi girin.', emailInput);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) return showError('Lütfen geçerli bir e-posta adresi girin (örn: adiniz@mail.com).', emailInput);
    if (!password || password.length < 6) return showError('Şifreniz en az 6 karakter olmalıdır.', passInput);
    if (password !== passwordConfirm) return showError('Girdiğiniz şifreler eşleşmiyor. Lütfen tekrar kontrol edin.', passConfirmInput);

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Kontrol ediliyor...';
    }
    const isAvail = await checkUsernameAvailable(cleanUser);
    if (!isStudyGeneration(generation)) {
      if (submitBtn) submitBtn.disabled = false;
      return;
    }
    if (!isAvail) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kayıt Ol →';
      }
      return showError('Bu kullanıcı adı zaten alınmış. Lütfen başka bir kullanıcı adı seçin.', userInput);
    }
  } else if (!identifier || !password) {
    return showError('Lütfen kullanıcı adı/e-posta ve şifrenizi girin.');
  }

  isSubmitting = true;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'İşleniyor...';
  }
  if (errorEl) errorEl.textContent = '';

  try {
    const isSignupFlow = authMode === 'signup';
    const res = authMode === 'signin'
      ? await signInWithEmail(identifier, password)
      : await signUpWithEmail(identifier, password, username.toLowerCase(), username);

    if (!isStudyGeneration(generation)) return;
    if (res.error) {
      if (errorEl) errorEl.textContent = res.error;
      return;
    }

    if (!res.data) {
      if (isSignupFlow) {
        setAuthMode('signin');
        if (noticeEl) noticeEl.textContent = 'Kaydınız oluşturuldu! Lütfen e-postanızı onaylayıp giriş yapın.';
      } else if (errorEl) {
        errorEl.textContent = 'Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.';
      }
      return;
    }

    saveActiveSession(res.data);
    const chosenName = res.data.user.username || res.data.user.displayName || (!identifier.includes('@') ? identifier : '');
    if (chosenName) {
      writeString(StorageKeys.USER_NAME, chosenName);
    }
    if (passInput) passInput.value = '';
    if (passConfirmInput) passConfirmInput.value = '';
    hideAuthModal();
    updateAuthUiState();
    await syncCloudProgress();
    if (isSignupFlow && typeof document !== 'undefined') {
      const hasAnyResponsible = Object.values(state.responsibleCourses).some(list => list.length > 0);
      if (!hasAnyResponsible) openProfileScreen(true);
    }
  } finally {
    isSubmitting = false;
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = authMode === 'signin' ? 'Giriş Yap →' : 'Kayıt Ol →';
    }
  }
}

export function updateAuthUiState(): void {
  if (typeof document === 'undefined') return;
  const session = getActiveSession();
  const authSection = document.getElementById('welcomeAuthSection');
  const mainSection = document.getElementById('welcomeMainSection');
  const userDisplay = document.getElementById('authUserNameDisplay');

  const guest = isGuest();
  const trigger = document.getElementById('welcomeAuthTrigger');
  trigger?.classList.toggle('is-authenticated', Boolean(session));
  document.querySelectorAll('.auth-status-dot').forEach(el => el.classList.toggle('is-online', Boolean(session)));
  if (authSection) authSection.hidden = Boolean(session) || guest;
  if (mainSection) mainSection.hidden = !session && !guest;
  if (!session && !guest) document.body?.classList?.add('auth-gate-active');
  else document.body?.classList?.remove('auth-gate-active');
  if (userDisplay && guest) userDisplay.textContent = 'Misafir';
  document.querySelectorAll<HTMLElement>('[data-guest-notice]').forEach(el => { el.hidden = !guest; });
  document.querySelectorAll<HTMLElement>('[data-account-only]').forEach(el => { el.hidden = guest; });
  document.querySelectorAll<HTMLElement>('[data-guest-only]').forEach(el => { el.hidden = !guest; });
  if (userDisplay && session) {
    userDisplay.textContent = session.user.displayName || session.user.username || session.user.email || 'Kullanıcı';
  }
  if (!session) setAuthMode('signin');
}

onStateChange('auth:expired', () => {
  updateAuthUiState();
});

onStateChange('study:changed', () => {
  updateAuthUiState();
  if (typeof document === 'undefined') return;
  const portal = document.getElementById('welcomePortal');
  if (portal) {
    portal.hidden = false;
    portal.setAttribute('aria-hidden', 'false');
  }
  document.body.classList.add('welcome-active');
});
