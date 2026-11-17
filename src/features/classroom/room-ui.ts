import { updateTeacherFeed, updateTeacherStats } from './teacher-view.ts';
import { registerActions } from '../../app/actions.ts';
import { store, notifyStateChange } from '../../app/state.ts';
import { roomService } from './room-service.ts';
import type { RoomState } from './types.ts';
import { initFocusTracker } from './focus-tracker.ts';
import { initRoomAnswerEvents } from './room-answer-events.ts';
import { initClassroomCardHook } from './card-hook.ts';

let initialized = false;
let lastMetrics = '';
let actionError = '';

export function initRoomFeature(): void {
  initRoomAnswerEvents();
  initClassroomCardHook();
  if (initialized || typeof document === 'undefined') return;
  initialized = true;
  initFocusTracker();
  setupRoomEvents();
  roomService.subscribe(renderRoom);
}

function renderRoom(state: RoomState): void {
  document.body.classList.toggle('in-room', Boolean(state.roomId));
  const roomStats: Record<number, { correct: number; wrong: number }> = {};
  if (state.roomId && state.isHost) {
    for (const student of Object.values(state.studentStats)) {
      for (const [questionId, correct] of Object.entries(student.answers)) {
        const id = Number(questionId);
        const stat = roomStats[id] ?? { correct: 0, wrong: 0 };
        if (correct) stat.correct++;
        else stat.wrong++;
        roomStats[id] = stat;
      }
    }
  }
  const metrics = JSON.stringify([state.roomId, roomStats]);
  if (metrics !== lastMetrics) {
    lastMetrics = metrics;
    store.setIsRoomActive(Boolean(state.roomId));
    store.setRoomQuestionStats(roomStats);
    notifyStateChange('filter:updated');
  }
  if (!state.roomId || !state.isHost) closeTeacherDrawer();
  if (!state.roomId || state.isHost) closeStudentDrawer();
  updateTopRoomPill(state);
  renderStatus(state);
  updateStudentDrawer(state);
  updateTeacherFeed(state);
  updateTeacherStats(state);
}

function updateTopRoomPill(state: RoomState): void {
  const pill = document.getElementById('topRoomPill');
  if (!pill) return;
  pill.style.display = state.roomId || state.error ? 'inline-flex' : 'none';
  pill.title = state.error || 'Sınıf oturumu';
  pill.dataset.connection = state.connection;
  pill.dataset.role = state.isHost ? 'host' : 'participant';
  const text = pill.querySelector('.room-pill-text');
  if (text) {
    const role = state.isHost ? 'Öğretmen' : 'Katılımcı';
    const pending = state.connection === 'connected' ? '' : ' • Bağlantı bekleniyor';
    text.textContent = state.roomId
      ? `${state.roomName} • ${role} • ${state.participantCount} kişi${pending}`
      : state.error || '';
  }
}

function renderStatus(state: RoomState): void {
  const labels: Record<RoomState['connection'], string> = {
    idle: 'Oda bağlantısı kapalı',
    connecting: 'Odaya bağlanılıyor…',
    connected: 'Bağlı',
    reconnecting: 'Bağlantı bekleniyor; kayıtlar bu cihazda korunuyor.',
    error: 'Oda bağlantısı kurulamadı.',
  };
  document.querySelectorAll<HTMLElement>('[data-role="room-connection"]').forEach(el => {
    el.textContent = labels[state.connection];
  });
  document.querySelectorAll<HTMLElement>('[data-role="room-error"]').forEach(el => {
    el.textContent = actionError || state.error || '';
  });
  document.querySelectorAll<HTMLElement>('[data-role="room-announcement"]').forEach(el => {
    el.textContent = state.announcement?.text || 'Henüz duyuru yok.';
  });
}

function updateStudentDrawer(state: RoomState): void {
  const title = document.getElementById('studentDrawerTitle');
  if (title) title.textContent = `${state.roomName} • ${state.userName}`;
  const summary = document.getElementById('studentRoomSummary');
  const self = state.studentStats[roomService.getPeerId()];
  if (summary) {
    summary.textContent = `${state.participantCount} kişi • ${self?.correctCount ?? 0} doğru • ${self?.incorrectCount ?? 0} yanlış`;
  }
}

export function toggleRoomDrawer(): void {
  const state = roomService.getState();
  if (!state.roomId) return;
  const drawer = document.getElementById(state.isHost ? 'teacherDrawerOverlay' : 'studentDrawerOverlay');
  if (drawer) drawer.style.display = drawer.style.display === 'flex' ? 'none' : 'flex';
}

export function closeTeacherDrawer(): void {
  const drawer = document.getElementById('teacherDrawerOverlay');
  if (drawer) drawer.style.display = 'none';
}

export function closeStudentDrawer(): void {
  const drawer = document.getElementById('studentDrawerOverlay');
  if (drawer) drawer.style.display = 'none';
}

function switchTab(tab: string): void {
  for (const name of ['feed', 'stats']) {
    const content = document.getElementById(name === 'feed' ? 'roomTabContentFeed' : 'roomTabContentStats');
    if (content) content.style.display = name === tab ? 'block' : 'none';
    document.querySelectorAll<HTMLElement>(`[data-action="switch-room-tab"][data-tab="${name}"]`).forEach(el => {
      el.classList.toggle('active', name === tab);
      el.setAttribute('aria-selected', String(name === tab));
    });
  }
}

async function runRoomAction(element: HTMLElement | null, action: () => Promise<void>): Promise<void> {
  const button = element instanceof HTMLButtonElement ? element : null;
  if (button?.disabled) return;
  if (button) button.disabled = true;
  actionError = '';
  renderStatus(roomService.getState());
  try {
    await action();
  } catch (error) {
    actionError = error instanceof Error ? error.message : 'İşlem tamamlanamadı. Yeniden deneyin.';
  } finally {
    if (button) button.disabled = false;
    renderStatus(roomService.getState());
  }
}

async function sendAnnouncement(button: HTMLElement | null): Promise<void> {
  const input = document.getElementById('inputBroadcastMsg') as HTMLInputElement | null;
  const text = input?.value.trim();
  if (!input || !text || !roomService.isHost()) return;
  await runRoomAction(button, async () => {
    await roomService.broadcastAnnouncement(text);
    input.value = '';
  });
}

function setupRoomEvents(): void {
  registerActions({
    'toggle-teacher-drawer': () => toggleRoomDrawer(),
    'close-teacher-drawer': () => closeTeacherDrawer(),
    'close-student-drawer': () => closeStudentDrawer(),
    'switch-room-tab': el => switchTab(el.dataset.tab || 'feed'),
    'send-broadcast-message': el => sendAnnouncement(el),
    'close-room-globally': el => {
      if (!roomService.isHost() || !confirm('Odayı herkes için bitirmek istiyor musunuz?')) return;
      return runRoomAction(el, () => roomService.closeRoomGlobally());
    },
    'leave-current-room': el => runRoomAction(el, async () => {
      await roomService.leaveRoom();
      document.getElementById('consoleMenuPopup')?.classList.remove('open');
      document.querySelector<HTMLElement>('[data-action="welcome-home"]')?.click();
    }),
  });
  document.getElementById('inputBroadcastMsg')?.addEventListener('keydown', event => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    void sendAnnouncement(document.querySelector('[data-action="send-broadcast-message"]'));
  });
  document.addEventListener('click', event => {
    if (!(event.target instanceof HTMLElement)) return;
    if (event.target.id === 'teacherDrawerOverlay') closeTeacherDrawer();
    if (event.target.id === 'studentDrawerOverlay') closeStudentDrawer();
  });
}
