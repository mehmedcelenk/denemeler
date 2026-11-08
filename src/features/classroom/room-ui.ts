import { markStudentStarred, updateTeacherFeed, updateTeacherStats } from './teacher-view.ts';
import { registerActions } from '../../app/actions.ts';
import { escapeHtml } from '../../shared/escape.ts';
import { roomService, type RoomState } from './room-service.ts';
import { initFocusTracker } from './focus-tracker.ts';
import { calculateStudentRank } from './ranking.ts';
import { initRoomAnswerEvents } from './room-answer-events.ts';
import { initClassroomCardHook } from './card-hook.ts';

let isInitialized = false;
let renderScheduled = false;
let lastHeavyRenderAt = 0;
let trailingRenderTimer: ReturnType<typeof setTimeout> | null = null;

export function initRoomFeature(): void {
  initRoomAnswerEvents();
  initClassroomCardHook();
  if (isInitialized || typeof document === 'undefined') return;
  isInitialized = true;

  initFocusTracker();
  setupRoomEvents();
  roomService.restoreSessionIfActive();

  roomService.subscribe((state) => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('in-room', !!state.roomId);
    }
    if (!state.roomId) {
      closeTeacherDrawer();
      closeStudentDrawer();
    } else if (state.isHost) {
      closeStudentDrawer();
    } else {
      closeTeacherDrawer();
    }
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
  if (!textEl) return;

  const safeRoomId = escapeHtml(state.roomId);

  if (state.isHost) {
    const students = Object.values(state.studentStats);
    const totalStudents = students.length;
    const openExitIds = new Set(
      state.feedItems
        .filter((f) => (f.type === 'FOCUS_LOST' || f.type === 'LEAVE') && !f.returnedAt)
        .map((f) => f.studentId)
    );
    const offlineCount = students.filter(
      (s) => !s.isOnline || openExitIds.has(s.id)
    ).length;
    const activeCount = Math.max(0, totalStudents - offlineCount);

    if (offlineCount > 0) {
      textEl.innerHTML = `${safeRoomId} • 👥 ${activeCount} <span class="room-pill-offline">🔴 ${offlineCount}</span>`;
    } else {
      textEl.innerHTML = `${safeRoomId} • 👥 ${totalStudents}`;
    }
  } else {
    textEl.innerHTML = `${safeRoomId} • 👥 ${state.participants.length}`;
  }
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

function submitBroadcastAnnouncement(): void {
  if (!roomService.isHost()) return;
  const input = document.getElementById('inputBroadcastMsg') as HTMLInputElement | null;
  const text = input?.value.trim();
  if (!input || !text) return;
  roomService.broadcastAnnouncement(text);
  input.value = '';
  const btn = document.querySelector<HTMLButtonElement>('[data-action="send-broadcast-message"]');
  if (btn) {
    const prev = btn.textContent;
    btn.textContent = '✓ Gönderildi';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = prev;
      btn.disabled = false;
    }, 1200);
  }
}

function setupRoomEvents(): void {
  if (typeof document === 'undefined') return;
  registerActions({
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
      if (!roomService.isHost() || !(el instanceof HTMLButtonElement) || !(el.dataset.id || el.dataset.name)) return;
      const studentId = el.dataset.id || '';
      const studentName = el.dataset.name || '';
      markStudentStarred(studentId || studentName, 1400);
      el.textContent = '⭐ Gönderildi';
      el.disabled = true;
      setTimeout(() => {
        updateTeacherStats(roomService.getState());
      }, 1450);
      roomService.awardStarToStudent(studentId, studentName);
    },
    'send-broadcast-message': () => submitBroadcastAnnouncement(),
    'toggle-pause-room': () => {
      if (!roomService.isHost()) return;
      roomService.togglePauseRoom();
    },
    'close-room-globally': () => {
      if (!roomService.isHost()) return;
      if (confirm('Tüm sınıf için oturumu sonlandırmak istediğinize emin misiniz?')) {
        roomService.closeRoomGlobally();
        closeTeacherDrawer();
      }
    },
    'leave-current-room': () => {
      roomService.leaveRoom();
      closeTeacherDrawer();
      closeStudentDrawer();
      document.getElementById('consoleMenuPopup')?.classList.remove('open');
      document.querySelector<HTMLElement>('[data-action="welcome-home"]')?.click();
    },
  });

  const broadcastInput = document.getElementById('inputBroadcastMsg');
  broadcastInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitBroadcastAnnouncement();
    }
  });

  document.addEventListener('click', event => {
    if (!(event.target instanceof HTMLElement)) return;
    if (event.target.id === 'teacherDrawerOverlay') closeTeacherDrawer();
    if (event.target.id === 'studentDrawerOverlay') closeStudentDrawer();
  });
}
