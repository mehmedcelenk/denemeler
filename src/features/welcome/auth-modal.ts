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

export function showAuthModal(mode: 'signin' | 'signup' = 'signin', notice = ''): void {
  authMode = mode;
  if (typeof document === 'undefined') return;
  const dialog = document.getElementById('welcomeAuthDialog');
  if (!dialog) return;
  dialog.hidden = false;

  const emailInput = document.getElementById('authEmailInput') as HTMLInputElement | null;
  const passInput = document.getElementById('authPasswordInput') as HTMLInputElement | null;
  const title = document.getElementById('authDialogTitle');
  const submitBtn = document.getElementById('btnAuthSubmit');
  const toggleBtn = document.getElementById('btnAuthToggleMode');
  const noticeEl = document.getElementById('authDialogNotice');
  const errorEl = document.getElementById('authDialogError');
  const nameRow = document.getElementById('authNameRow');
  const passConfirmRow = document.getElementById('authPasswordConfirmRow');

  if (noticeEl) noticeEl.textContent = notice;
  if (errorEl) errorEl.textContent = '';

  if (mode === 'signin') {
    if (title) title.textContent = 'Hesabına Giriş Yap';
    if (submitBtn) submitBtn.textContent = 'Giriş Yap →';
    if (toggleBtn) toggleBtn.textContent = 'Hesabın yok mu? Kayıt Ol';
    if (nameRow) nameRow.hidden = true;
    if (passConfirmRow) passConfirmRow.hidden = true;
    if (emailInput) emailInput.placeholder = 'Kullanıcı adı veya E-posta';
    if (passInput) passInput.placeholder = 'Şifreniz';
    requestAnimationFrame(() => emailInput?.focus());
  } else {
    if (title) title.textContent = 'Yeni Hesap Oluştur';
    if (submitBtn) submitBtn.textContent = 'Kayıt Ol →';
    if (toggleBtn) toggleBtn.textContent = 'Zaten hesabın var mı? Giriş Yap';
    if (nameRow) nameRow.hidden = false;
    if (passConfirmRow) passConfirmRow.hidden = false;
    if (emailInput) emailInput.placeholder = 'E-posta adresiniz (örn: ali@mail.com)';
    if (passInput) passInput.placeholder = 'Şifreniz (en az 6 karakter)';
    requestAnimationFrame(() => document.getElementById('authUsernameInput')?.focus());
  }
}

export function hideAuthModal(): void {
  if (typeof document === 'undefined') return;
  const dialog = document.getElementById('welcomeAuthDialog');
  if (dialog) dialog.hidden = true;
}

export function toggleAuthMode(): void {
  showAuthModal(authMode === 'signin' ? 'signup' : 'signin');
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
  const authBtn = document.getElementById('welcomeAuthTrigger');
  if (!authBtn) return;

  if (session) {
    const name = session.user.displayName || session.user.email || 'Kullanıcı';
    authBtn.innerHTML = `
      <span class="auth-status-dot is-online" aria-hidden="true"></span>
      <span class="auth-status-name">${name}</span>
      <span class="auth-status-action" data-action="welcome-signout" title="Çıkış Yap">Çıkış</span>
    `;
    authBtn.classList.add('is-authenticated');
  } else {
    authBtn.innerHTML = `
      <span class="auth-status-dot" aria-hidden="true"></span>
      <span class="auth-status-label">Giriş Yap & Eşitle</span>
    `;
    authBtn.classList.remove('is-authenticated');
  }
}
