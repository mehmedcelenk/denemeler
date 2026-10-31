import { updateTeacherFeed, updateTeacherStats } from './teacher-view.ts';
import { registerActions } from '../../app/actions.ts';
import { roomService } from './room-service.ts';
import type { RoomState } from './types.ts';
import { initFocusTracker } from './focus-tracker.ts';
import { calculateStudentRank } from './ranking.ts';
import { openRoomModal, closeRoomModal, handleJoinClick, handleCreateClick } from './room-modal.ts';
import { initRoomAnswerEvents } from './room-answer-events.ts';

let isInitialized = false;
let renderScheduled = false;
let lastHeavyRenderAt = 0;
let trailingRenderTimer: ReturnType<typeof setTimeout> | null = null;

export function initRoomFeature(): void {
  initRoomAnswerEvents();
  if (isInitialized || typeof document === 'undefined') return;
  isInitialized = true;

  initFocusTracker();
  setupRoomEvents();
  roomService.restoreSessionIfActive();

  roomService.subscribe((state) => {
    updateTopRoomPill(state);
    updatePauseOverlay(state);
    updateStudentDrawer(state);
    scheduleHeavyListRender();
  });
}

function scheduleHeavyListRender(): void {
  const now = Date.now();
  const elapsed = now - lastHeavyRenderAt;

  if (elapsed >= 120 && !renderScheduled) {
    lastHeavyRenderAt = now;
    const current = roomService.getState();
    updateTeacherFeed(current);
    updateTeacherStats(current);
    return;
  }

  if (trailingRenderTimer) return;
  renderScheduled = true;
  trailingRenderTimer = setTimeout(() => {
    trailingRenderTimer = null;
    renderScheduled = false;
    lastHeavyRenderAt = Date.now();
    const latest = roomService.getState();
    updateTeacherFeed(latest);
    updateTeacherStats(latest);
  }, Math.max(20, 120 - elapsed));
}

function updateTopRoomPill(state: RoomState): void {
  const pill = document.getElementById('topRoomPill');
  if (!pill) return;
  pill.style.display = state.roomId ? 'inline-flex' : 'none';
  if (!state.roomId) return;
  const textEl = pill.querySelector('.room-pill-text');
  if (textEl) textEl.textContent = `${state.roomId} • 👥 ${state.participants.length}`;
}

function updatePauseOverlay(state: RoomState): void {
  const overlay = document.getElementById('roomPauseOverlay');
  if (overlay) {
    overlay.style.display = state.roomId && state.isPaused && !state.isHost ? 'flex' : 'none';
  }
  const btnPause = document.getElementById('btnTogglePauseRoom');
  if (btnPause) {
    btnPause.textContent = state.isPaused ? '▶️ Devam Et' : '⏸️ Durdur';
  }
}

function updateStudentDrawer(state: RoomState): void {
  const titleEl = document.getElementById('studentDrawerTitle');
  if (titleEl && state.roomId) {
    titleEl.textContent = `${state.roomId} • ${state.userName}`;
  }

  const rankTextEl = document.getElementById('studentRankText');
  if (rankTextEl && state.roomId) {
    const { rank, total } = calculateStudentRank(roomService.getPeerId(), state.studentStats);
    rankTextEl.textContent = `Sıralaman: ${rank}. / ${total} kişi`;
  }

  const btnCall = document.getElementById('btnCallTeacher');
  if (btnCall) {
    if (state.helpRequested) {
      btnCall.classList.add('called');
      btnCall.title = 'Hoca Çağrıldı (Hoca gelince sıfırlanır)';
    } else {
      btnCall.classList.remove('called');
      btnCall.title = 'Hoca Çağır';
    }
  }
}

export function toggleRoomDrawer(): void {
  const state = roomService.getState();
  if (!state.roomId) return;

  const targetId = state.isHost ? 'teacherDrawerOverlay' : 'studentDrawerOverlay';
  const drawer = document.getElementById(targetId);
  if (!drawer) return;
  drawer.style.display = drawer.style.display === 'flex' ? 'none' : 'flex';
}

export function closeTeacherDrawer(): void {
  const drawer = document.getElementById('teacherDrawerOverlay');
  if (drawer) drawer.style.display = 'none';
}

export function closeStudentDrawer(): void {
  const drawer = document.getElementById('studentDrawerOverlay');
  if (drawer) drawer.style.display = 'none';
}

function handleTabSwitch(tabName: string): void {
  const feedContent = document.getElementById('roomTabContentFeed');
  const statsContent = document.getElementById('roomTabContentStats');
  const tabButtons = document.querySelectorAll('.btn-drawer-tab');

  tabButtons.forEach((btn) => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.tab === tabName);
  });

  if (feedContent && statsContent) {
    feedContent.style.display = tabName === 'feed' ? 'block' : 'none';
    statsContent.style.display = tabName === 'stats' ? 'block' : 'none';
  }
}

function setupRoomEvents(): void {
  if (typeof document === 'undefined') return;
  registerActions({
    'open-room-modal': () => openRoomModal(),
    'close-room-modal': () => closeRoomModal(),
    'submit-room-join': () => handleJoinClick(),
    'submit-room-create': () => handleCreateClick(),
    'toggle-teacher-drawer': () => toggleRoomDrawer(),
    'close-teacher-drawer': () => closeTeacherDrawer(),
    'close-student-drawer': () => closeStudentDrawer(),
    'switch-room-tab': el => {
      if (el.dataset.tab) handleTabSwitch(el.dataset.tab);
    },
    'call-teacher-help': () => roomService.callTeacherHelp(),
    'resolve-help': el => {
      if (el.dataset.id && (el.dataset.studentId || el.dataset.name)) {
        roomService.resolveTeacherHelp(el.dataset.id, el.dataset.studentId || el.dataset.name || '');
      }
    },
    'award-star': el => {
      if (!(el instanceof HTMLButtonElement) || !(el.dataset.id || el.dataset.name)) return;
      const originalText = el.textContent;
      el.textContent = '⭐ Gönderildi';
      el.disabled = true;
      setTimeout(() => {
        el.textContent = originalText;
        el.disabled = false;
      }, 1200);
      roomService.awardStarToStudent(el.dataset.id || '', el.dataset.name || '');
    },
    'send-broadcast-message': () => {
      const input = document.getElementById('inputBroadcastMsg') as HTMLInputElement | null;
      if (input && input.value.trim()) {
        roomService.broadcastAnnouncement(input.value.trim());
        input.value = '';
      }
    },
    'toggle-pause-room': () => roomService.togglePauseRoom(),
    'close-room-globally': () => {
      if (confirm('Tüm sınıf için oturumu sonlandırmak istediğinize emin misiniz?')) {
        roomService.closeRoomGlobally();
        closeTeacherDrawer();
      }
    },
    'leave-current-room': () => {
      roomService.leaveRoom();
      closeTeacherDrawer();
      closeStudentDrawer();
    },
  });
  document.addEventListener('click', event => {
    if (!(event.target instanceof HTMLElement)) return;
    if (event.target.id === 'roomModalOverlay') closeRoomModal();
    if (event.target.id === 'teacherDrawerOverlay') closeTeacherDrawer();
    if (event.target.id === 'studentDrawerOverlay') closeStudentDrawer();
  });
}
