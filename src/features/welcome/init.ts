import { registerActions } from '../../app/actions.ts';
import { notifyStateChange, state, store } from '../../app/state.ts';
import { writeString } from '../../app/storage.ts';
import type { SubjectId } from '../../data/question.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';
import { roomService } from '../classroom/room-service.ts';
import {
  hideAuthModal,
  toggleAuthMode,
  setAuthMode,
  submitAuth,
  handleSignOut,
  isAuthenticated,
  getActiveSession,
  syncCloudProgress,
  refreshInstitutionStats,
} from './auth-modal.ts';
import {
  focusRoomInput,
  getWelcomeRoomId,
  hideWelcomePortal,
  renderWelcomePortal,
  setWelcomeBusy,
  setWelcomeProgram,
  showWelcomeError,
  showWelcomePortal,
  updateResumeAction,
  type ProgramMode,
} from './welcome-view.ts';

const DEFAULT_SUBJECTS: Readonly<Record<ProgramMode, SubjectId>> = {
  AOIHL: 'TDE',
  AOO: 'AOO_TURKCE',
  AOF: 'AOF_HADIS',
  ILMIHAL: 'ILM_TEMIZLIK',
  GIRISIMCILIK: 'GIR_TEMEL',
  TYT: 'TYT_TURKCE',
  AYT: 'AYT_MAT',
  YDT: 'YDT_ING',
};

let initialized = false;

interface WelcomeSession {
  readonly subject: string;
  readonly questionId?: number;
}

export interface WelcomeDependencies {
  readonly closeSubjectDrawer: () => void;
  readonly dismissResumeBanner: () => void;
  readonly getSavedSession: () => WelcomeSession | null;
  readonly joinRoom: (roomId: string, userName: string) => Promise<void>;
  readonly loadSubject: (subject: string) => Promise<boolean>;
  readonly openSubjectDrawer: () => void;
  readonly setUnifiedMode: (mode: 'all' | 'rematch') => void;
}

let dependencies: WelcomeDependencies;
let transitionPending = false;

function hasSavedSession(): boolean {
  return dependencies.getSavedSession() !== null;
}

async function loadProgramSubject(): Promise<boolean> {
  return dependencies.loadSubject(DEFAULT_SUBJECTS[state.programMode]);
}

async function runWelcomeTransition(action: () => Promise<void>, roomAction = false): Promise<void> {
  if (transitionPending) return;
  transitionPending = true;
  setWelcomeBusy(true);
  showWelcomeError();
  try {
    await action();
  } catch (error) {
    console.error('[Welcome]', error);
    showWelcomeError(roomAction && error instanceof Error
      ? error.message
      : 'Ders yüklenemedi. Bağlantını kontrol edip yeniden dene.');
  } finally {
    transitionPending = false;
    setWelcomeBusy(false);
  }
}

async function startMode(mode: 'all' | 'rematch', openDrawer = false): Promise<void> {
  if (!isAuthenticated()) {
    showWelcomePortal();
    return;
  }
  await runWelcomeTransition(async () => {
    if (!await loadProgramSubject()) throw new Error('Ders yüklenemedi. Bağlantını kontrol edip yeniden dene.');
    dependencies.setUnifiedMode(mode);
    hideWelcomePortal();
    if (openDrawer) dependencies.openSubjectDrawer();
  });
}

async function connectToRoom(roomId: string, userName: string): Promise<void> {
  if (!isAuthenticated()) {
    showWelcomePortal();
    return;
  }
  await runWelcomeTransition(async () => {
    if (!await loadProgramSubject()) throw new Error('Ders yüklenemedi. Bağlantını kontrol edip yeniden dene.');
    dependencies.setUnifiedMode('all');
    await dependencies.joinRoom(roomId, userName);
    hideWelcomePortal();
  }, true);
}

async function joinRoom(): Promise<void> {
  if (!isAuthenticated()) {
    showWelcomePortal();
    return;
  }
  const roomId = getWelcomeRoomId();
  if (!roomId) {
    showWelcomeError('Katılmak istediğin oda adını yaz.');
    focusRoomInput();
    return;
  }

  const session = getActiveSession();
  const userName = session?.user.username?.trim()
    || session?.user.displayName?.trim()
    || 'Katılımcı';
  writeString(StorageKeys.USER_NAME, userName);
  await connectToRoom(roomId, userName);
}

function returnHome(): void {
  dependencies.closeSubjectDrawer();
  dependencies.dismissResumeBanner();
  updateResumeAction(hasSavedSession());
  showWelcomeError();
  showWelcomePortal();
}

export interface WelcomeOptions {
  readonly autoShow?: boolean;
}

export { hideWelcomePortal, showWelcomePortal } from './welcome-view.ts';

export async function resumeSavedSession(): Promise<void> {
  if (!isAuthenticated()) {
    showWelcomePortal();
    return;
  }
  const snapshot = dependencies.getSavedSession();
  const subject = snapshot?.subject ?? DEFAULT_SUBJECTS[state.programMode];

  await runWelcomeTransition(async () => {
    if (!await dependencies.loadSubject(subject)) throw new Error('Saved subject could not be loaded.');
    dependencies.setUnifiedMode('all');
    dependencies.dismissResumeBanner();
    hideWelcomePortal();
    const scheduleFrame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn: () => void) => setTimeout(fn, 0);
    scheduleFrame(() => {
      if (snapshot?.questionId !== undefined) {
        notifyStateChange('booklet:ensure-question', { qid: snapshot.questionId, scroll: true });
        return;
      }
      document.querySelector<HTMLElement>('.booklet-question')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  });
}

function bindWelcomeInputs(): void {
  const roomInput = document.getElementById('welcomeRoomId');
  roomInput?.addEventListener('input', () => showWelcomeError());
  roomInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') void joinRoom();
  });
  ['authEmailInput', 'authPasswordInput', 'authPasswordConfirmInput', 'authUsernameInput'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', event => {
      if (event.key === 'Enter') void submitAuth();
    });
  });
}

export function initWelcome(
  welcomeDependencies: WelcomeDependencies,
  options: WelcomeOptions = {}
): void {
  if (initialized || typeof document === 'undefined') return;
  initialized = true;
  dependencies = welcomeDependencies;

  renderWelcomePortal({
    programMode: state.programMode,
    canResume: hasSavedSession(),
  });
  bindWelcomeInputs();
  registerActions({
    'welcome-set-program': element => {
      const mode = element.dataset.program;
      const validModes: readonly ProgramMode[] = ['AOIHL', 'AOO', 'AOF', 'ILMIHAL', 'GIRISIMCILIK', 'TYT', 'AYT', 'YDT'];
      if (!mode || !validModes.includes(mode as ProgramMode)) return;
      const programMode = mode as ProgramMode;
      store.setProgramMode(programMode);
      setWelcomeProgram(programMode);
    },
    'welcome-start-rematch': () => startMode('rematch'),
    'welcome-start-single': () => startMode('all', true),
    'welcome-join-room': () => joinRoom(),
    'welcome-set-auth-signin': () => setAuthMode('signin'),
    'welcome-set-auth-signup': () => setAuthMode('signup'),
    'welcome-open-auth': () => setAuthMode('signin'),
    'welcome-cancel-auth': () => hideAuthModal(),
    'welcome-submit-auth': () => void submitAuth(),
    'welcome-toggle-auth-mode': () => toggleAuthMode(),
    'welcome-signout': (_element, event) => {
      event?.stopPropagation();
      return runWelcomeTransition(async () => {
        await roomService.leaveRoom();
        await handleSignOut();
        updateResumeAction(false);
      }, true);
    },
    'welcome-home': () => returnHome(),
    'welcome-resume': () => resumeSavedSession(),
  });

  if (!isAuthenticated() || (!roomService.getState().roomId && options.autoShow !== false)) {
    showWelcomePortal();
    if (isAuthenticated()) {
      void syncCloudProgress().then(() => updateResumeAction(hasSavedSession()));
    }
  } else {
    hideWelcomePortal();
    void syncCloudProgress().finally(() => {
      void resumeSavedSession();
    });
  }
  void refreshInstitutionStats();
}
