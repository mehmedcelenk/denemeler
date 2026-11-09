import { readJson, writeJson, writeString } from '../../app/storage.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';
import { choices, type Choice } from '../../data/question.ts';
import { parseSavedChoicesValue } from '../../shared/saved-choices.ts';
import type { AuthSession, UserProgressData } from '../../data/supabase-auth.ts';
import {
  signOutFromSupabase,
  fetchUserProgressFromSupabase,
  saveUserProgressToSupabase,
  refreshTokenUsingSupabase,
} from '../../data/supabase-auth.ts';
import { store, state, notifyStateChange } from '../../app/state.ts';

function isAuthSession(value: unknown): value is AuthSession {
  if (typeof value !== 'object' || value === null) return false;
  const s = value as Record<string, unknown>;
  return typeof s.accessToken === 'string' && s.accessToken.length > 0 && typeof s.user === 'object' && s.user !== null;
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

export async function ensureFreshSession(): Promise<AuthSession | null> {
  const session = getActiveSession();
  if (!session) return null;
  const now = Math.floor(Date.now() / 1000);
  if (session.expiresAt && session.expiresAt - now < 60 && session.refreshToken) {
    const refreshed = await refreshTokenUsingSupabase(session.refreshToken);
    if (refreshed.data) {
      saveActiveSession(refreshed.data);
      return refreshed.data;
    }
    if (session.expiresAt <= now) return null;
  }
  return session;
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function cancelCloudSync(): void {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
}

export async function saveCloudProgress(): Promise<boolean> {
  const session = await ensureFreshSession();
  if (!session) return false;
  const localData: UserProgressData = {
    choices: state.userMarkedChoices,
    starred: Array.from(state.starredQuestionIds),
    rematch: Array.from(state.rematchQuestionIds),
    eliminatedChoices: state.eliminatedChoices as unknown as Record<string, string[]>,
    lastSession: readJson<Record<string, unknown> | null>(
      StorageKeys.RESUME_STATE,
      (v): v is Record<string, unknown> => typeof v === 'object' && v !== null,
      null
    ) ?? undefined,
  };
  return saveUserProgressToSupabase(session, localData);
}

export function scheduleCloudSync(delayMs = 1200): void {
  if (!isAuthenticated()) return;
  cancelCloudSync();
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void saveCloudProgress();
  }, delayMs);
}

if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && syncTimer) {
      cancelCloudSync();
      void saveCloudProgress();
    }
  });
}

export async function handleSignOut(): Promise<void> {
  if (syncTimer) {
    cancelCloudSync();
    await saveCloudProgress();
  } else {
    cancelCloudSync();
  }
  const session = getActiveSession();
  if (session?.accessToken) {
    await signOutFromSupabase(session.accessToken);
  }
  saveActiveSession(null);
  writeString(StorageKeys.USER_NAME, '');
  writeString(StorageKeys.RESUME_STATE, '');
  writeString(StorageKeys.CLASSROOM_SESSION, '');
  writeString(StorageKeys.ANSWER_LOCK_UNTIL, '');

  store.setUserMarkedChoices({});
  store.clearAllPendingChoices();
  store.clearAllEliminatedChoices();
  store.clearAllEliminatedWrongChoices();
  store.setStarredQuestionIds(new Set());
  store.setRematchQuestionIds(new Set());
  store.setAiExplanations({});
  store.setWaterStreak(0);

  if (typeof document !== 'undefined') {
    document.querySelectorAll<HTMLElement>('.booklet-question').forEach(card => {
      card.dataset.userMark = '';
      delete card.dataset.userStatus;
    });
    document.querySelectorAll('.optical-choice-row').forEach(el => {
      el.classList.remove('marked', 'marked-correct', 'marked-incorrect', 'revealed-correct');
    });
    const portal = document.getElementById('welcomePortal');
    if (portal) {
      portal.hidden = false;
      portal.setAttribute('aria-hidden', 'false');
    }
    document.body.classList.add('welcome-active');
  }

  notifyStateChange('booklet:refresh');
}

export async function syncCloudProgress(): Promise<void> {
  const session = await ensureFreshSession();
  if (!session) return;

  if (syncTimer) {
    cancelCloudSync();
    await saveCloudProgress();
  }

  const cloud = await fetchUserProgressFromSupabase(session);
  if (!cloud) return;

  if (cloud.choices) {
    const parsedCloud = parseSavedChoicesValue(cloud.choices);
    store.setUserMarkedChoices({ ...parsedCloud, ...state.userMarkedChoices });
  }
  if (cloud.starred && cloud.starred.length > 0) {
    const valid = cloud.starred.filter(Number.isSafeInteger);
    if (state.starredQuestionIds.size === 0) {
      store.setStarredQuestionIds(new Set(valid));
    }
  }
  if (cloud.rematch && cloud.rematch.length > 0) {
    const valid = cloud.rematch.filter(Number.isSafeInteger);
    if (state.rematchQuestionIds.size === 0) {
      store.setRematchQuestionIds(new Set(valid));
    }
  }
  if (cloud.eliminatedChoices && typeof cloud.eliminatedChoices === 'object') {
    const finalElim: Record<number, Choice[]> = {};
    for (const [k, v] of Object.entries(cloud.eliminatedChoices)) {
      const qid = Number(k);
      if (Number.isSafeInteger(qid) && Array.isArray(v)) {
        finalElim[qid] = v.filter((c): c is Choice => choices.includes(c as Choice));
      }
    }
    for (const [k, v] of Object.entries(state.eliminatedChoices)) {
      finalElim[Number(k)] = [...v];
    }
    store.setEliminatedChoices(finalElim);
  }
  if (cloud.lastSession && typeof cloud.lastSession === 'object' && !readJson(StorageKeys.RESUME_STATE, (v): v is Record<string, unknown> => typeof v === 'object' && v !== null, null)) {
    writeJson(StorageKeys.RESUME_STATE, cloud.lastSession);
  }

  if (typeof document !== 'undefined') {
    const hasResume = Boolean(readJson(
      StorageKeys.RESUME_STATE,
      (v): v is Record<string, unknown> => typeof v === 'object' && v !== null,
      null
    ));
    if (hasResume) {
      const welcomeBtn = document.getElementById('btnWelcomeResume');
      if (welcomeBtn) welcomeBtn.style.display = 'flex';
      const consoleBtn = document.getElementById('btnResumeLastSession');
      if (consoleBtn) consoleBtn.title = 'Son çalıştığın soruya dön';
    }
  }

  notifyStateChange('booklet:refresh');
  await saveCloudProgress();
}
