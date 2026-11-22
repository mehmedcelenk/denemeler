import { readJson, writeJson, writeString } from '../../app/storage.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';
import { choices, type Choice } from '../../data/question.ts';
import { parseSavedChoicesValue } from '../../shared/saved-choices.ts';
import type { AuthSession, UserProgressData } from '../../data/supabase-auth.ts';
import { fetchInstitutionQuestionStats } from '../../data/institution-stats.ts';
import { signOutFromSupabase, fetchUserProgressFromSupabase,
  saveUserProgressToSupabase, refreshTokenUsingSupabase } from '../../data/supabase-auth.ts';
import { store, state, notifyStateChange, onStateChange } from '../../app/state.ts';
import { getActiveSession, saveActiveSession, isAuthenticated, isStudyGeneration } from './study-session.ts';
import { isSessionSnapshot } from '../booklet/resume.ts';
export { getActiveSession, saveActiveSession, isAuthenticated } from './study-session.ts';

let refreshFlight: { generation: number; promise: Promise<AuthSession | null> } | null = null;

export async function ensureFreshSession(): Promise<AuthSession | null> {
  const session = getActiveSession();
  if (!session) return null;
  const generation = state.studyGeneration;
  if (refreshFlight?.generation === generation) return refreshFlight.promise;
  const promise = (async () => {
    const now = Math.floor(Date.now() / 1000);
    if (session.expiresAt && session.expiresAt - now < 60 && session.refreshToken) {
      const refreshed = await refreshTokenUsingSupabase(session.refreshToken);
      if (!isStudyGeneration(generation) || getActiveSession()?.refreshToken !== session.refreshToken) return null;
      if (refreshed.data && refreshed.data.user.id === session.user.id) {
        saveActiveSession(refreshed.data);
        return refreshed.data;
      }
      if (refreshed.invalidRefreshToken) {
        saveActiveSession(null);
        notifyStateChange('auth:expired');
        return null;
      }
      if (session.expiresAt <= now) return null;
    }
    if (session.expiresAt && session.expiresAt <= now) return null;
    return session;
  })().finally(() => {
    if (refreshFlight?.promise === promise) refreshFlight = null;
  });
  refreshFlight = { generation, promise };
  return promise;
}

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let saveFlight: { generation: number; pending: boolean; controller: AbortController } | null = null;

export function cancelCloudSync(): void {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = null;
}

onStateChange('study:changed', () => {
  cancelCloudSync();
  saveFlight?.controller.abort();
  saveFlight = null;
});

export async function refreshInstitutionStats(): Promise<void> {
  try {
    const stats = await fetchInstitutionQuestionStats();
    if (stats) {
      store.setInstitutionStats(stats);
      notifyStateChange('filter:updated');
      notifyStateChange('drawer:topics-refresh');
    }
  } catch {}
}

export async function saveCloudProgress(): Promise<boolean> {
  if (!getActiveSession() || !state.progressReady) return false;
  const generation = state.studyGeneration;
  if (saveFlight?.generation === generation) {
    saveFlight.pending = true;
    return false;
  }
  const flight = { generation, pending: false, controller: new AbortController() };
  saveFlight = flight;
  try {
    const session = await ensureFreshSession();
    if (!session || !isStudyGeneration(generation)) return false;
    const localData: UserProgressData = {
      choices: { ...state.userMarkedChoices },
      starred: Array.from(state.starredQuestionIds),
      rematch: Array.from(state.rematchQuestionIds),
      eliminatedChoices: Object.fromEntries(Object.entries(state.eliminatedChoices).map(([id, list]) => [id, [...list]])),
      responsibleCourses: Object.fromEntries(Object.entries(state.responsibleCourses).map(([prog, list]) => [prog, [...list]])),
      stars: state.waterStreak,
      lastSession: readJson<Record<string, unknown> | null>(StorageKeys.RESUME_STATE,
        (v): v is Record<string, unknown> => typeof v === 'object' && v !== null, null) ?? undefined,
    };
    const ok = await saveUserProgressToSupabase(session, localData, 5000, flight.controller.signal);
    if (!isStudyGeneration(generation)) return false;
    if (ok) void refreshInstitutionStats();
    return ok;
  } finally {
    if (saveFlight === flight) {
      saveFlight = null;
      if (flight.pending && isStudyGeneration(generation)) void saveCloudProgress();
    }
  }
}

export function scheduleCloudSync(delayMs = 1200): void {
  if (!isAuthenticated() || !state.progressReady) return;
  const generation = state.studyGeneration;
  cancelCloudSync();
  syncTimer = setTimeout(() => {
    syncTimer = null;
    if (isStudyGeneration(generation)) void saveCloudProgress();
  }, delayMs);
}

onStateChange('progress:changed', payload => {
  const delay = payload && typeof payload === 'object' && 'delayMs' in payload ? payload.delayMs : undefined;
  scheduleCloudSync(typeof delay === 'number' ? delay : undefined);
});

if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && syncTimer) {
      cancelCloudSync();
      void saveCloudProgress();
    }
  });
}

export async function handleSignOut(): Promise<void> {
  const session = getActiveSession();
  const generation = state.studyGeneration;
  if (syncTimer) {
    cancelCloudSync();
    await saveCloudProgress();
  }
  if (!isStudyGeneration(generation)) return;
  cancelCloudSync();
  saveActiveSession(null);
  writeString(StorageKeys.USER_NAME, '');
  if (session) await signOutFromSupabase(session.accessToken);
}

export async function syncCloudProgress(): Promise<void> {
  const generation = state.studyGeneration;
  const session = await ensureFreshSession();
  if (!session || !isStudyGeneration(generation)) return;

  if (syncTimer) {
    cancelCloudSync();
    await saveCloudProgress();
    if (!isStudyGeneration(generation)) return;
  }

  const controller = new AbortController();
  const unsubscribe = onStateChange('study:changed', () => controller.abort());
  const cloud = await fetchUserProgressFromSupabase(session, 5000, controller.signal).finally(unsubscribe);
  if (!cloud || !isStudyGeneration(generation)) return;
  if (cloud.lastSession && !isSessionSnapshot(cloud.lastSession)) return;

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
  if (cloud.responsibleCourses && typeof cloud.responsibleCourses === 'object') {
    const merged: Record<string, string[]> = {};
    for (const [prog, list] of Object.entries(state.responsibleCourses)) {
      if (list.length > 0) merged[prog] = [...list];
    }
    for (const [prog, list] of Object.entries(cloud.responsibleCourses)) {
      if ((!merged[prog] || merged[prog].length === 0) && Array.isArray(list) && list.length > 0) {
        merged[prog] = [...list];
      }
    }
    store.setResponsibleCourses(merged);
  }
  if (typeof cloud.stars === 'number' && cloud.stars > state.waterStreak) {
    store.setWaterStreak(cloud.stars);
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
  void refreshInstitutionStats();
  await saveCloudProgress();
}
