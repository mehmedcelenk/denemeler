import { registerActions } from '../../app/actions.ts';
import { notifyStateChange, onStateChange, state, store, type AnswerMarkedPayload } from '../../app/state.ts';
import { fetchUserMascotFromSupabase, saveUserMascotToSupabase } from '../../data/mascot-profile.ts';
import { isMascotId, type MascotId } from '../../shared/mascot-types.ts';
import { getActiveSession, isAuthenticated, isStudyGeneration } from '../welcome/study-session.ts';
import { setMascotPrintHidden, syncMascotCompanion, triggerMascotMood } from './mascot-companion.ts';

let initialized = false;
let syncedUserId: string | null = null;
let inFlightUserId: string | null = null;
let selectionVersion = 0;

function isAnswerMarkedPayload(value: unknown): value is AnswerMarkedPayload {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AnswerMarkedPayload>;
  return Number.isSafeInteger(candidate.qid) && typeof candidate.isCorrect === 'boolean';
}

function refreshCompanion(greet = false): void {
  const signedIn = isAuthenticated();
  syncMascotCompanion(signedIn, state.mascotId, greet && signedIn);
}

async function hydrateRemoteMascotIfNeeded(): Promise<void> {
  const session = getActiveSession();
  if (!session) {
    syncedUserId = null;
    inFlightUserId = null;
    return;
  }
  const targetUserId = session.user.id;
  if (syncedUserId === targetUserId || inFlightUserId === targetUserId) return;
  const generation = state.studyGeneration;
  const version = selectionVersion;
  inFlightUserId = targetUserId;

  try {
    const remoteId = await fetchUserMascotFromSupabase(session);
    if (!remoteId || !isStudyGeneration(generation) || version !== selectionVersion) return;
    const currentSession = getActiveSession();
    if (!currentSession || currentSession.user.id !== targetUserId) return;

    syncedUserId = targetUserId;
    if (remoteId !== state.mascotId) {
      store.setMascotId(remoteId, true);
      refreshCompanion(false);
      notifyStateChange('mascot:changed');
    }
  } finally {
    if (inFlightUserId === targetUserId) inFlightUserId = null;
  }
}

export function selectUserMascot(nextId: MascotId): void {
  if (!isAuthenticated() || !isMascotId(nextId)) return;
  selectionVersion++;
  const changed = state.mascotId !== nextId;
  store.setMascotId(nextId, true);
  refreshCompanion(nextId !== 'none');
  notifyStateChange('mascot:changed');

  const session = getActiveSession();
  if (session) {
    syncedUserId = session.user.id;
    if (changed) void saveUserMascotToSupabase(session, nextId);
  }
}

export function initMascot(): void {
  if (initialized) return;
  initialized = true;

  registerActions({
    'select-mascot': (el) => {
      const id = el?.dataset.mascot;
      if (isMascotId(id)) selectUserMascot(id);
    },
  });

  onStateChange('study:changed', () => {
    const signedIn = isAuthenticated();
    if (!signedIn) syncedUserId = null;
    refreshCompanion(signedIn);
    if (signedIn) void hydrateRemoteMascotIfNeeded();
  });

  onStateChange('auth:signout', () => {
    syncedUserId = null;
    inFlightUserId = null;
    selectionVersion++;
    syncMascotCompanion(false, 'none', false);
  });

  onStateChange('welcome:home', () => {
    if (isAuthenticated()) triggerMascotMood('welcome');
  });

  onStateChange('answer:marked', (payload) => {
    if (!isAuthenticated() || !isAnswerMarkedPayload(payload)) return;
    triggerMascotMood(payload.isCorrect ? 'correct' : 'wrong');
  }, 20);

  onStateChange('print:before', () => setMascotPrintHidden(true));
  onStateChange('print:after', () => setMascotPrintHidden(false));

  const signedIn = isAuthenticated();
  refreshCompanion(signedIn);
  if (signedIn) void hydrateRemoteMascotIfNeeded();
}

export function resetMascotInitForTest(): void {
  initialized = false;
  syncedUserId = null;
  inFlightUserId = null;
  selectionVersion = 0;
}
