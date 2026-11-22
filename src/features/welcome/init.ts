import { canStudyLocally, enterGuestMode, isStudyGeneration } from './study-session.ts';
import { registerActions } from '../../app/actions.ts';
import { openDisplayNameEditor, closeDisplayNameEditor, saveDisplayName } from './display-name.ts';
import { notifyStateChange, onStateChange, state, store } from '../../app/state.ts';
import { writeString } from '../../app/storage.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';
import { roomService } from '../classroom/room-service.ts';
import {
  hideAuthModal,
  showAuthModal,
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
  closeProfileMenu,
  DEFAULT_SUBJECTS,
  focusRoomInput,
  getWelcomeRoomId,
  hideWelcomePortal,
  openTeamInput,
  renderWelcomePortal,
  resetTeamInput,
  setWelcomeBusy,
  setWelcomeProgram,
  showWelcomeError,
  showWelcomePortal,
  updateResumeAction,
  updateWelcomeActiveRoom,
  type ProgramMode,
} from './welcome-view.ts';
import { initArenaReport, renderArenaReport } from './arena-report.ts';
import { closeProfileScreen } from './profile-screen.ts';

let initialized = false;

interface WelcomeSession {
  readonly subject: string;
  readonly questionId?: number;
  readonly programMode?: ProgramMode;
}

export interface WelcomeDependencies {
  readonly closeSubjectDrawer: () => void;
  readonly dismissResumeBanner: () => void;
  readonly getSavedSession: () => WelcomeSession | null;
  readonly joinRoom: (roomId: string, userName: string) => Promise<void>;
  readonly loadSubject: (subject: string, preferredCourses?: readonly string[]) => Promise<boolean>;
  readonly openSubjectDrawer: () => void;
  readonly setUnifiedMode: (mode: 'all' | 'rematch') => void;
}

let dependencies: WelcomeDependencies;
let transitionPending = false;
let roomHomeScrollY: number | null = null;

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
  const generation = state.studyGeneration;
  try {
    await action();
    if (!isStudyGeneration(generation)) showWelcomePortal();
  } catch (error) {
    if (!isStudyGeneration(generation)) return;
    console.error('[Welcome]', error);
    showWelcomeError(roomAction && error instanceof Error
      ? error.message
      : 'Ders yüklenemedi. Bağlantını kontrol edip yeniden dene.');
  } finally {
    transitionPending = false;
    setWelcomeBusy(false);
  }
}

async function startMode(mode: 'all' | 'rematch', openDrawer = false, subjectId?: string, preferredCourses?: readonly string[]): Promise<void> {
  if (!canStudyLocally()) {
    showWelcomePortal();
    if (!state.progressReady) showWelcomeError('İlerleme taşınamadı. Tarayıcı depolamasında yer açıp yeniden deneyin.');
    return;
  }
  const generation = state.studyGeneration;
  await runWelcomeTransition(async () => {
    const loaded = subjectId ? await dependencies.loadSubject(subjectId, preferredCourses) : await loadProgramSubject();
    if (!loaded) throw new Error('Ders yüklenemedi. Bağlantını kontrol edip yeniden dene.');
    if (!isStudyGeneration(generation)) return;
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
  const generation = state.studyGeneration;
  await runWelcomeTransition(async () => {
    if (!await loadProgramSubject()) throw new Error('Ders yüklenemedi. Bağlantını kontrol edip yeniden dene.');
    if (!isStudyGeneration(generation)) return;
    dependencies.setUnifiedMode('all');
    await dependencies.joinRoom(roomId, userName);
    if (!isStudyGeneration(generation)) return;
    hideWelcomePortal();
  }, true);
}

async function joinRoom(): Promise<void> {
  if (!isAuthenticated()) {
    resetTeamInput(true);
    showAuthModal('signin', 'Odaya katılmak için gerçek hesabınla giriş yap.');
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
  closeProfileScreen();
  notifyStateChange('welcome:home');
  roomHomeScrollY = roomService.getState().roomId ? window.scrollY : null;
  dependencies.closeSubjectDrawer();
  dependencies.dismissResumeBanner();
  updateResumeAction(hasSavedSession());
  showWelcomeError();
  showWelcomePortal();
}

function returnToRoom(): void {
  if (!canStudyLocally() || !roomService.getState().roomId) return;
  hideWelcomePortal();
  const scrollY = roomHomeScrollY;
  const generation = state.studyGeneration;
  roomHomeScrollY = null;
  if (scrollY !== null) requestAnimationFrame(() => {
    if (isStudyGeneration(generation) && roomService.getState().roomId) window.scrollTo({ top: scrollY, behavior: 'auto' });
  });
}

export interface WelcomeOptions { readonly autoShow?: boolean; }
export { hideWelcomePortal, showWelcomePortal } from './welcome-view.ts';

export async function resumeSavedSession(): Promise<void> {
  closeProfileScreen();
  if (!canStudyLocally()) {
    showWelcomePortal();
    return;
  }
  const snapshot = dependencies.getSavedSession();
  if (snapshot?.programMode) store.setProgramMode(snapshot.programMode);
  const subject = snapshot?.subject ?? DEFAULT_SUBJECTS[state.programMode];

  const generation = state.studyGeneration;
  await runWelcomeTransition(async () => {
    if (!await dependencies.loadSubject(subject)) throw new Error('Saved subject could not be loaded.');
    if (!isStudyGeneration(generation)) return;
    dependencies.setUnifiedMode('all');
    dependencies.dismissResumeBanner();
    hideWelcomePortal();
    const scheduleFrame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn: () => void) => setTimeout(fn, 0);
    scheduleFrame(() => {
      if (!isStudyGeneration(generation)) return;
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
    if (event.key === 'Escape') resetTeamInput(true);
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
  initArenaReport();
  onStateChange('study:changed', () => {
    setWelcomeProgram(state.programMode);
    updateResumeAction(hasSavedSession());
    renderArenaReport();
    if (!state.progressReady) showWelcomeError('İlerleme taşınamadı. Tarayıcı depolamasında yer açıp yeniden deneyin.');
  });

  renderWelcomePortal({
    programMode: state.programMode,
    canResume: hasSavedSession(),
  });
  roomService.subscribe(room => {
    updateWelcomeActiveRoom(room.roomId, room.roomName, room.participantCount);
    if (!room.roomId) roomHomeScrollY = null;
  });
  if (!state.progressReady) showWelcomeError('İlerleme taşınamadı. Tarayıcı depolamasında yer açıp yeniden deneyin.');
  bindWelcomeInputs();
  onStateChange('subjects:drawer-opened', () => {
    if (!document.body.classList.contains('welcome-active') || !canStudyLocally()) return;
    hideWelcomePortal();
    if (!state.allData.length) void loadProgramSubject();
  });
  registerActions({
    'welcome-open-team': () => openTeamInput(),
    'welcome-close-team': () => resetTeamInput(true),
    'welcome-start-rematch': () => startMode('rematch'),
    'welcome-start-single': () => startMode('all', true),
    'welcome-open-subject': (el) => {
      const subjectId = el?.dataset.subject;
      const ders = el?.dataset.ders;
      if (subjectId) void startMode('all', false, subjectId, ders ? [ders] : undefined);
    },
    'welcome-return-room': () => returnToRoom(),
    'welcome-join-room': () => joinRoom(),
    'welcome-set-auth-signin': () => setAuthMode('signin'),
    'welcome-set-auth-signup': () => setAuthMode('signup'),
    'welcome-enter-guest': () => enterGuestMode(),
    'welcome-open-auth': () => { closeProfileMenu(); showAuthModal('signin'); },
    'welcome-edit-name': () => openDisplayNameEditor(),
    'welcome-save-name': () => saveDisplayName(),
    'welcome-cancel-name': () => closeDisplayNameEditor(),
    'welcome-cancel-auth': () => hideAuthModal(),
    'welcome-submit-auth': () => void submitAuth(),
    'welcome-toggle-auth-mode': () => toggleAuthMode(),
    'welcome-signout': (_element, event) => {
      event?.stopPropagation();
      closeProfileMenu();
      return runWelcomeTransition(async () => {
        await roomService.leaveRoom();
        await handleSignOut();
        updateResumeAction(hasSavedSession());
      }, true);
    },
    'welcome-home': () => returnHome(),
    'welcome-resume': () => resumeSavedSession(),
    'bottom-nav-questions': () => (roomService.getState().roomId && state.allData.length > 0 ? returnToRoom() : resumeSavedSession()),
  });

  const generation = state.studyGeneration;
  if (!isAuthenticated() || (!roomService.getState().roomId && options.autoShow !== false)) {
    showWelcomePortal();
    if (isAuthenticated()) {
      void syncCloudProgress().then(() => {
        if (isStudyGeneration(generation)) updateResumeAction(hasSavedSession());
      });
    }
  } else {
    hideWelcomePortal();
    void syncCloudProgress().finally(() => {
      if (isStudyGeneration(generation)) void resumeSavedSession();
    });
  }
  void refreshInstitutionStats();
}
