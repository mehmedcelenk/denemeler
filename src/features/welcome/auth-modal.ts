import { readJson, writeJson, writeString } from '../../app/storage.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';
import type { AuthSession, UserProgressData } from '../../data/supabase-auth.ts';
import {
  signInWithEmail,
  signUpWithEmail,
  signOutFromSupabase,
  fetchUserProgressFromSupabase,
  saveUserProgressToSupabase,
  checkUsernameAvailable,
} from '../../data/supabase-auth.ts';
import { store, state } from '../../app/state.ts';

function isAuthSession(value: unknown): value is AuthSession {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  return typeof s.accessToken === 'string' && typeof s.user === 'object' && s.user !== null;
}

export function getActiveSession(): AuthSession | null {
  return readJson<AuthSession | null>(StorageKeys.AUTH_SESSION, isAuthSession, null);
}

export function saveActiveSession(session: AuthSession | null): void {
  if (session) {
    writeJson(StorageKeys.AUTH_SESSION, session);
  } else {
    writeString(StorageKeys.AUTH_SESSION, '');
  }
}

export function isAuthenticated(): boolean {
  return getActiveSession() !== null;
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

  const btnSignin = document.getElementById('btnTabSignin');
  const btnSignup = document.getElementById('btnTabSignup');
  const userInput = document.getElementById('authUsernameInput') as HTMLInputElement | null;
  const emailInput = document.getElementById('authEmailInput') as HTMLInputElement | null;
  const passInput = document.getElementById('authPasswordInput') as HTMLInputElement | null;
  const passConfirmInput = document.getElementById('authPasswordConfirmInput') as HTMLInputElement | null;
  const submitBtn = document.getElementById('btnAuthSubmit');
  const noticeEl = document.getElementById('authNoticeText');
  const errorEl = document.getElementById('authDialogError');

  if (errorEl) errorEl.textContent = '';

  if (mode === 'signin') {
    btnSignin?.classList.add('is-active');
    btnSignin?.setAttribute('aria-selected', 'true');
    btnSignup?.classList.remove('is-active');
    btnSignup?.setAttribute('aria-selected', 'false');

    if (userInput) userInput.hidden = true;
    if (passConfirmInput) passConfirmInput.hidden = true;
    if (emailInput) emailInput.placeholder = 'Kullanıcı adı veya E-posta';
    if (passInput) passInput.placeholder = 'Şifreniz';
    if (submitBtn) submitBtn.textContent = 'Giriş Yap →';
    if (noticeEl) noticeEl.textContent = 'Derslere ve sorulara erişmek için giriş yapın.';
    requestAnimationFrame(() => emailInput?.focus());
  } else {
    btnSignup?.classList.add('is-active');
    btnSignup?.setAttribute('aria-selected', 'true');
    btnSignin?.classList.remove('is-active');
    btnSignin?.setAttribute('aria-selected', 'false');

    if (userInput) userInput.hidden = false;
    if (passConfirmInput) passConfirmInput.hidden = false;
    if (emailInput) emailInput.placeholder = 'E-posta adresiniz (örn: emin@mail.com)';
    if (passInput) passInput.placeholder = 'Şifreniz (en az 6 karakter)';
    if (submitBtn) submitBtn.textContent = 'Kayıt Ol →';
    if (noticeEl) noticeEl.textContent = 'Yeni bir hesap oluşturup hemen başlayın.';
    requestAnimationFrame(() => userInput?.focus());
  }
}

export function showAuthModal(mode: 'signin' | 'signup' = 'signin', notice = ''): void {
  setAuthMode(mode);
  if (typeof document === 'undefined') return;
  if (notice) {
    const noticeEl = document.getElementById('authNoticeText');
    if (noticeEl) noticeEl.textContent = notice;
  }
  const portal = document.getElementById('welcomePortal');
  if (portal) {
    portal.hidden = false;
    portal.setAttribute('aria-hidden', 'false');
  }
  document.body.classList.add('welcome-active');
}

export function hideAuthModal(): void {
  if (!isAuthenticated()) return;
}

export function toggleAuthMode(): void {
  setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
}

export async function submitAuth(): Promise<void> {
  const emailInput = document.getElementById('authEmailInput') as HTMLInputElement | null;
  const passInput = document.getElementById('authPasswordInput') as HTMLInputElement | null;
  const userInput = document.getElementById('authUsernameInput') as HTMLInputElement | null;
  const passConfirmInput = document.getElementById('authPasswordConfirmInput') as HTMLInputElement | null;
  const errorEl = document.getElementById('authDialogError');
  const submitBtn = document.getElementById('btnAuthSubmit') as HTMLButtonElement | null;

  const identifier = emailInput?.value.trim() || '';
  const password = passInput?.value || '';
  const username = userInput?.value.trim() || '';
  const passwordConfirm = passConfirmInput?.value || '';

  if (authMode === 'signup') {
    if (!username) {
      if (errorEl) errorEl.textContent = 'Lütfen bir kullanıcı adı belirleyin.';
      userInput?.focus();
      return;
    }
    const cleanUser = username.toLowerCase();
    if (cleanUser.length < 3 || cleanUser.length > 30) {
      if (errorEl) errorEl.textContent = 'Kullanıcı adı 3 ile 30 karakter arasında olmalıdır.';
      userInput?.focus();
      return;
    }
    if (!/^[a-zA-Z0-9_\u00C0-\u017F-]+$/.test(username)) {
      if (errorEl) errorEl.textContent = 'Kullanıcı adı boşluk içeremez; harf, rakam, alt çizgi ve tire kullanılabilir.';
      userInput?.focus();
      return;
    }
    if (!identifier) {
      if (errorEl) errorEl.textContent = 'Lütfen e-posta adresinizi girin.';
      emailInput?.focus();
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
      if (errorEl) errorEl.textContent = 'Lütfen geçerli bir e-posta adresi girin (örn: adiniz@mail.com).';
      emailInput?.focus();
      return;
    }
    if (!password || password.length < 6) {
      if (errorEl) errorEl.textContent = 'Şifreniz en az 6 karakter olmalıdır.';
      passInput?.focus();
      return;
    }
    if (password !== passwordConfirm) {
      if (errorEl) errorEl.textContent = 'Girdiğiniz şifreler eşleşmiyor. Lütfen tekrar kontrol edin.';
      passConfirmInput?.focus();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Kontrol ediliyor...';
    }
    const isAvail = await checkUsernameAvailable(cleanUser);
    if (!isAvail) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Kayıt Ol →';
      }
      if (errorEl) errorEl.textContent = 'Bu kullanıcı adı zaten alınmış. Lütfen başka bir kullanıcı adı seçin.';
      userInput?.focus();
      return;
    }
  } else if (!identifier || !password) {
    if (errorEl) errorEl.textContent = 'Lütfen kullanıcı adı/e-posta ve şifrenizi girin.';
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'İşleniyor...';
  }
  if (errorEl) errorEl.textContent = '';

  try {
    const res = authMode === 'signin'
      ? await signInWithEmail(identifier, password)
      : await signUpWithEmail(identifier, password, username.toLowerCase(), username);

    if (res.error || !res.data) {
      if (errorEl) errorEl.textContent = res.error || 'İşlem başarısız.';
      return;
    }

    saveActiveSession(res.data);
    hideAuthModal();
    updateAuthUiState();

    // Oturum açılınca buluttaki ilerlemeyi çek ve senkronize et
    await syncCloudProgress();
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = authMode === 'signin' ? 'Giriş Yap →' : 'Kayıt Ol →';
    }
  }
}

export async function handleSignOut(): Promise<void> {
  const session = getActiveSession();
  if (session?.accessToken) {
    await signOutFromSupabase(session.accessToken);
  }
  saveActiveSession(null);
  updateAuthUiState();
  const portal = document.getElementById('welcomePortal');
  if (portal) {
    portal.hidden = false;
    portal.setAttribute('aria-hidden', 'false');
  }
  document.body.classList.add('welcome-active');
}

export async function syncCloudProgress(): Promise<void> {
  const session = getActiveSession();
  if (!session) return;

  const cloud = await fetchUserProgressFromSupabase(session);
  if (cloud) {
    if (cloud.starred && cloud.starred.length > 0) {
      store.setStarredQuestionIds(new Set([...state.starredQuestionIds, ...cloud.starred]));
    }
    if (cloud.rematch && cloud.rematch.length > 0) {
      store.setRematchQuestionIds(new Set([...state.rematchQuestionIds, ...cloud.rematch]));
    }
  }

  // Yerel ilerlemeyi de buluta yedekle
  const localData: UserProgressData = {
    choices: state.userMarkedChoices,
    starred: Array.from(state.starredQuestionIds),
    rematch: Array.from(state.rematchQuestionIds),
  };
  await saveUserProgressToSupabase(session, localData);
}

export function updateAuthUiState(): void {
  if (typeof document === 'undefined') return;
  const session = getActiveSession();
  const authSection = document.getElementById('welcomeAuthSection');
  const mainSection = document.getElementById('welcomeMainSection');
  const userDisplay = document.getElementById('authUserNameDisplay');

  if (session) {
    if (authSection) authSection.hidden = true;
    if (mainSection) mainSection.hidden = false;
    if (userDisplay) {
      userDisplay.textContent = session.user.username || session.user.displayName || session.user.email || 'Kullanıcı';
    }
  } else {
    if (authSection) authSection.hidden = false;
    if (mainSection) mainSection.hidden = true;
    setAuthMode('signin');
  }
}
