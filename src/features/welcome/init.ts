import { registerActions } from '../../app/actions.ts';
import { notifyStateChange, state, store } from '../../app/state.ts';
import { readString, writeString } from '../../app/storage.ts';
import type { SubjectId } from '../../data/question.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';
import { roomService } from '../classroom/room-service.ts';
import {
  showAuthModal,
  hideAuthModal,
  toggleAuthMode,
  submitAuth,
  handleSignOut,
} from './auth-modal.ts';
import {
  focusRoomInput,
  getDialogUserName,
  getWelcomeRoomId,
  hideWelcomePortal,
  hideNameDialog,
  renderWelcomePortal,
  setWelcomeBusy,
  setWelcomeProgram,
  showNameDialog,
  showNameError,
  showWelcomeError,
  showWelcomePortal,
  updateResumeAction,
  type ProgramMode,
} from './welcome-view.ts';

const DEFAULT_SUBJECTS: Readonly<Record<ProgramMode, SubjectId>> = {
  AOIHL: 'TDE',
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
  readonly joinRoom: (roomId: string, userName: string) => void;
  readonly loadSubject: (subject: string) => Promise<boolean>;
  readonly openSubjectDrawer: () => void;
  readonly setUnifiedMode: (mode: 'all' | 'rematch') => void;
}

let dependencies: WelcomeDependencies;
let pendingRoomId: string | null = null;

function hasSavedSession(): boolean {
  return dependencies.getSavedSession() !== null;
}

async function loadProgramSubject(): Promise<boolean> {
  return dependencies.loadSubject(DEFAULT_SUBJECTS[state.programMode]);
}

async function runWelcomeTransition(action: () => Promise<void>): Promise<void> {
  setWelcomeBusy(true);
  showWelcomeError();
  try {
    await action();
  } catch (error) {
    console.error('[Welcome]', error);
    showWelcomeError('Ders yüklenemedi. Bağlantını kontrol edip yeniden dene.');
  } finally {
    setWelcomeBusy(false);
  }
}

async function startSinglePlayer(): Promise<void> {
  await runWelcomeTransition(async () => {
    if (!await loadProgramSubject()) throw new Error('Default subject could not be loaded.');
    dependencies.setUnifiedMode('all');
    hideWelcomePortal();
    dependencies.openSubjectDrawer();
  });
}

async function startRematch(): Promise<void> {
  await runWelcomeTransition(async () => {
    if (!await loadProgramSubject()) throw new Error('Default subject could not be loaded.');
    dependencies.setUnifiedMode('rematch');
    hideWelcomePortal();
  });
}

async function connectToRoom(roomId: string, userName: string): Promise<void> {
  await runWelcomeTransition(async () => {
    if (!await loadProgramSubject()) throw new Error('Default subject could not be loaded.');
    dependencies.setUnifiedMode('all');
    dependencies.joinRoom(roomId, userName);
    pendingRoomId = null;
    hideWelcomePortal();
  });
}

async function joinRoom(): Promise<void> {
  const roomId = getWelcomeRoomId();
  if (!roomId) {
    showWelcomeError('Katılmak istediğin oda adını yaz.');
    focusRoomInput();
    return;
  }

  const savedName = readString(StorageKeys.USER_NAME)?.trim();
  if (savedName) {
    await connectToRoom(roomId, savedName);
    return;
  }

  pendingRoomId = roomId;
  showNameDialog();
}

async function confirmUserName(): Promise<void> {
  const userName = getDialogUserName();
  if (!userName) {
    showNameError('Devam etmek için adınızı yazın.');
    document.getElementById('welcomeNameInput')?.focus();
    return;
  }
  if (!pendingRoomId) {
    hideNameDialog();
    return;
  }

  writeString(StorageKeys.USER_NAME, userName);
  hideNameDialog();
  await connectToRoom(pendingRoomId, userName);
}

function cancelUserName(): void {
  pendingRoomId = null;
  hideNameDialog();
  focusRoomInput();
}

function returnHome(): void {
  dependencies.closeSubjectDrawer();
  dependencies.dismissResumeBanner();
  updateResumeAction(hasSavedSession());
  pendingRoomId = null;
  hideNameDialog();
  showWelcomeError();
  showWelcomePortal();
}

export interface WelcomeOptions {
  readonly autoShow?: boolean;
}

export { hideWelcomePortal, showWelcomePortal } from './welcome-view.ts';

export async function resumeSavedSession(): Promise<void> {
  const snapshot = dependencies.getSavedSession();
  const subject = snapshot?.subject ?? DEFAULT_SUBJECTS[state.programMode];

  await runWelcomeTransition(async () => {
    if (!await dependencies.loadSubject(subject)) throw new Error('Saved subject could not be loaded.');
    dependencies.setUnifiedMode('all');
    dependencies.dismissResumeBanner();
    hideWelcomePortal();
    requestAnimationFrame(() => {
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
  roomInput?.addEventListener('input', () => {
    if (roomInput instanceof HTMLInputElement) {
      roomInput.value = roomInput.value.toLocaleUpperCase('tr-TR');
    }
    showWelcomeError();
  });
  roomInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') void joinRoom();
  });
  const nameInput = document.getElementById('welcomeNameInput');
  nameInput?.addEventListener('input', () => showNameError());
  nameInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') void confirmUserName();
    if (event.key === 'Escape') cancelUserName();
  });
  const passInput = document.getElementById('authPasswordInput');
  passInput?.addEventListener('keydown', event => {
    if (event.key === 'Enter') void submitAuth();
    if (event.key === 'Escape') hideAuthModal();
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
      const validModes: readonly ProgramMode[] = ['AOIHL', 'AOF', 'ILMIHAL', 'GIRISIMCILIK', 'TYT', 'AYT', 'YDT'];
      if (!mode || !validModes.includes(mode as ProgramMode)) return;
      const programMode = mode as ProgramMode;
      store.setProgramMode(programMode);
      setWelcomeProgram(programMode);
    },
    'welcome-start-rematch': () => startRematch(),
    'welcome-start-single': () => startSinglePlayer(),
    'welcome-join-room': () => joinRoom(),
    'welcome-confirm-name': () => confirmUserName(),
    'welcome-cancel-name': () => cancelUserName(),
    'welcome-open-auth': () => showAuthModal('signin'),
    'welcome-cancel-auth': () => hideAuthModal(),
    'welcome-submit-auth': () => void submitAuth(),
    'welcome-toggle-auth-mode': () => toggleAuthMode(),
    'welcome-signout': (_element, event) => {
      event?.stopPropagation();
      void handleSignOut();
    },
    'welcome-home': () => returnHome(),
    'welcome-resume': () => resumeSavedSession(),
  });

  if (roomService.getState().roomId || options.autoShow === false) {
    hideWelcomePortal();
    void resumeSavedSession();
  } else {
    showWelcomePortal();
  }
}
