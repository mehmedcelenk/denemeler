import { state, store, notifyStateChange, onStateChange } from '../../app/state.ts';
import { readJson, readString, writeJson, writeString, readSessionJson, writeSessionJson,
  migrateLegacyProgress } from '../../app/storage.ts';
import { StorageKeys, type ProgressOwner } from '../../shared/storage-keys.ts';
import { normalizeMascotId } from '../../shared/mascot-types.ts';
import type { AuthSession } from '../../data/supabase-auth.ts';
import { isResponsibleCoursesMap } from '../../data/progress-validation.ts';
import { loadSavedChoices } from '../answers/storage.ts';
import { loadSessionSnapshot } from '../booklet/resume.ts';

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<AuthSession>;
  return typeof s.accessToken === 'string' && s.accessToken.length > 0
    && typeof s.refreshToken === 'string' && !!s.user
    && typeof s.user.id === 'string' && s.user.id.length > 0;
}

function storedSession(): AuthSession | null {
  return readJson<AuthSession | null>(StorageKeys.AUTH_SESSION, isAuthSession, null);
}

function hydrateProgress(): void {
  loadSavedChoices();
  const ids = (value: unknown): value is number[] => Array.isArray(value) && value.every(Number.isSafeInteger);
  store.setStarredQuestionIds(readJson(StorageKeys.STARRED_QUESTIONS, ids, []), false);
  store.setRematchQuestionIds(readJson(StorageKeys.REMATCH_QUESTIONS, ids, []), false);
  store.setWaterStreak(Number(readString(StorageKeys.WATER_STREAK)) || 0, false);
  store.setResponsibleCourses(readJson(StorageKeys.RESPONSIBLE_COURSES, isResponsibleCoursesMap, {}), false);
  store.setMascotId(normalizeMascotId(readString(StorageKeys.MASCOT_ID)), false);
  store.setProgramMode(loadSessionSnapshot()?.programMode ?? 'AOIHL');
}

function activate(owner: ProgressOwner, force = false, ready = true): void {
  if (!force && state.progressOwner === owner && state.progressReady === ready) return;
  // Startup must preserve the saved room tab until its normal restore step.
  if (state.progressOwner !== 'legacy') notifyStateChange('auth:signout');
  store.setProgressOwner(owner, ready);
  hydrateProgress();
  notifyStateChange('study:changed');
  notifyStateChange('booklet:refresh');
}

function saveMode(mode: 'guest' | 'account' | 'locked'): void {
  writeString(StorageKeys.STUDY_MODE, mode);
  writeSessionJson(StorageKeys.STUDY_MODE, mode);
}

export function initializeStudySession(): void {
  const isMode = (v: unknown): v is string => typeof v === 'string';
  const mode = readSessionJson(StorageKeys.STUDY_MODE, isMode) ?? readString(StorageKeys.STUDY_MODE);
  const session = storedSession();
  if (mode === 'guest') {
    // Pin this tab, including after reload, when another tab signs in.
    writeSessionJson(StorageKeys.STUDY_MODE, 'guest');
    activate('guest');
  } else if (session) {
    activate(`account:${session.user.id}`, false, migrateLegacyProgress(session.user.id));
  } else activate('locked');
}

export function getActiveSession(): AuthSession | null {
  if (state.progressOwner === 'guest' || state.progressOwner === 'locked') return null;
  const session = storedSession();
  if (state.progressOwner !== 'legacy') {
    const owner = session ? `account:${session.user.id}` as const : 'locked';
    if (owner !== state.progressOwner) {
      activate(owner, false, session ? migrateLegacyProgress(session.user.id) : true);
    } else if (session && !state.progressReady && migrateLegacyProgress(session.user.id)) {
      activate(owner, true);
    }
  }
  return session;
}

onStateChange('study:reconcile', () => { getActiveSession(); });

export function saveActiveSession(session: AuthSession | null): void {
  if (session && !isAuthSession(session)) return;
  if (session) {
    writeJson(StorageKeys.AUTH_SESSION, session);
    const ready = migrateLegacyProgress(session.user.id);
    saveMode('account');
    activate(`account:${session.user.id}`, false, ready);
  } else {
    writeString(StorageKeys.AUTH_SESSION, '');
    saveMode('locked');
    activate('locked');
  }
}

export function enterGuestMode(): void {
  saveMode('guest');
  activate('guest', true);
}

export function isAuthenticated(): boolean { return getActiveSession() !== null; }
export function isGuest(): boolean { return state.progressOwner === 'guest'; }
export function canStudyLocally(): boolean {
  const hasAccess = isGuest() || isAuthenticated();
  return state.progressReady && hasAccess;
}

/** Reconcile shared account changes before comparing async operation ownership. */
export function isStudyGeneration(generation: number): boolean {
  getActiveSession();
  return generation === state.studyGeneration && state.progressReady;
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key !== StorageKeys.AUTH_SESSION || isGuest()) return;
    // Account tabs follow the shared session. Guest tabs keep their local workspace.
    const session = storedSession();
    activate(session ? `account:${session.user.id}` : 'locked', false,
      session ? migrateLegacyProgress(session.user.id) : true);
  });
}
