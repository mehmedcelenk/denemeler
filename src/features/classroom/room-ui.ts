import { roomService } from './room-service.ts';
import type { RoomFeedItem, RoomState, StudentStats } from './types.ts';
import { initFocusTracker } from './focus-tracker.ts';
import { calculateStudentRank } from './ranking.ts';
import { openRoomModal, closeRoomModal, handleJoinClick, handleCreateClick } from './room-modal.ts';

let isInitialized = false;
let renderScheduled = false;
let lastHeavyRenderAt = 0;
let trailingRenderTimer: ReturnType<typeof setTimeout> | null = null;

export function initRoomFeature(): void {
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
  // ÖNEMLİ DÜZELTME: Pause perdesi sadece ÖĞRENCİDE açılır, hocanın ekranını ASLA kapatmaz!
  if (overlay) {
    overlay.style.display = state.roomId && state.isPaused && !state.isHost ? 'flex' : 'none';
  }
  const btnPause = document.getElementById('btnTogglePauseRoom');
  if (btnPause) {
    btnPause.textContent = state.isPaused ? '▶️ Devam Et' : '⏸️ Durdur';
  }
}

function updateTeacherFeed(state: RoomState): void {
  const listEl = document.getElementById('teacherExitLogsList');
  if (!listEl) return;
  if (state.feedItems.length === 0) {
    listEl.innerHTML = '<div class="exit-log-empty">Henüz bir hareket yok.</div>';
    return;
  }
  listEl.innerHTML = state.feedItems.map((item) => renderFeedRow(item)).join('');
}

function renderFeedRow(item: RoomFeedItem): string {
  const timeStr = formatTime(item.timestamp);
  let icon = 'ℹ️';
  let statusText = '';
  let rowClass = '';
  let actionBtn = '';

  switch (item.type) {
    case 'JOIN':
      icon = '🟢';
      statusText = 'katıldı';
      rowClass = 'row-success';
      break;
    case 'LEAVE':
      icon = '⚪';
      statusText = 'ayrıldı';
      break;
    case 'DISCONNECTED':
      icon = '⚡';
      statusText = 'bağlantısı koptu (çevrimdışı)';
      rowClass = 'row-danger';
      break;
    case 'SUSPICIOUS_COPY':
      icon = '📋';
      statusText = item.details ? `soru kopyaladı: ${escapeHtml(item.details)}` : 'soru metnini kopyaladı';
      rowClass = 'row-warning';
      break;
    case 'FOCUS_LOST':
      if (item.returnedAt) {
        icon = '🔄';
        const returnedTime = formatTime(item.returnedAt);
        const diffSec = Math.round((item.returnedAt - item.timestamp) / 1000);
        statusText = `ayrıldı, geri döndü (${diffSec} sn sonra - ${returnedTime})`;
        rowClass = 'row-warning';
      } else {
        const reasonBadge = item.reason === 'SCREEN_LOCK' ? '📱 Ekran kapandı/kilitlendi' : '🚨 Uygulamadan ayrıldı';
        icon = item.reason === 'SCREEN_LOCK' ? '📱' : '🚨';
        statusText = reasonBadge;
        rowClass = 'row-danger';
      }
      break;
    case 'HELP_CALL':
      icon = '✋';
      statusText = 'hoca çağırdı!';
      rowClass = 'row-warning';
      if (!item.resolved) {
        actionBtn = `<button type="button" class="btn-resolve-help" data-action="resolve-help" data-id="${item.id}" data-student-id="${item.studentId}" data-name="${escapeHtml(item.studentName)}" title="Gidildi / Tamamlandı">Tamam ✓</button>`;
      } else {
        statusText = 'hoca ilgilendi ✓';
        rowClass = 'row-success';
      }
      break;
  }

  return `<div class="exit-log-row ${rowClass}" id="feed_${item.id}">
    <span class="exit-log-bullet">${icon}</span>
    <span class="exit-log-name">${escapeHtml(item.studentName)}</span>
    <span class="exit-log-status">${statusText}</span>
    <span class="exit-log-time">(${timeStr})</span>
    ${actionBtn}
  </div>`;
}

function updateTeacherStats(state: RoomState): void {
  const listEl = document.getElementById('teacherStatsList');
  if (!listEl) return;

  const statsList = Object.values(state.studentStats);
  if (statsList.length === 0) {
    listEl.innerHTML = '<div class="exit-log-empty">Henüz soru çözen öğrenci yok.</div>';
    return;
  }

  listEl.innerHTML = statsList.map((s) => renderStudentStatRow(s)).join('');
}

function renderStudentStatRow(s: StudentStats): string {
  const totalSolved = s.correctCount + s.incorrectCount;
  const elapsedMinutes = Math.max(0.2, (Date.now() - s.joinedAt) / 60000);
  const pace = totalSolved > 0 ? (elapsedMinutes / totalSolved).toFixed(1) : '-';

  const exitCount = s.exitCount || 0;
  const awaySec = Math.round((s.totalAwayMs || 0) / 1000);
  const awayStr = awaySec >= 60 ? `${Math.floor(awaySec / 60)}d ${awaySec % 60}s` : `${awaySec}s`;
  const violationBadge = exitCount > 0
    ? `<span class="stat-violation" style="color:#ef4444; font-weight:700;" title="Toplam ${exitCount} kez ayrıldı (Dışarıda: ${awayStr})">🚨 ${exitCount} çıkış (${awayStr})</span>`
    : `<span class="stat-clean" style="color:#10b981;" title="Hiç ayrılmadı">🛡️ 0 ihlal</span>`;

  const onlineDot = s.isOnline !== false ? '🟢' : '⚪ (Koptu)';

  return `<div class="student-stat-row">
    <div style="display:flex; flex-direction:column; gap:2px;">
      <span class="stat-name">${onlineDot} ${escapeHtml(s.name)}</span>
      <div style="font-size:0.82em;">${violationBadge}</div>
    </div>
    <div class="stat-badges">
      <span class="stat-correct" title="Doğru Sayısı">🟢 ${s.correctCount}</span>
      <span class="stat-incorrect" title="Yanlış Sayısı">🔴 ${s.incorrectCount}</span>
      <span class="stat-pace" title="Soru Başına Ortalama Süre">⏱️ ${pace} dk</span>
      <button type="button" class="btn-star-student" data-action="award-star" data-id="${s.id}" data-name="${escapeHtml(s.name)}" title="Öğrenciye Yıldız Gönder">⭐</button>
    </div>
  </div>`;
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

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    if (!target) return;

    if (target.id === 'roomModalOverlay') {
      closeRoomModal();
      return;
    }
    if (target.id === 'teacherDrawerOverlay') {
      closeTeacherDrawer();
      return;
    }
    if (target.id === 'studentDrawerOverlay') {
      closeStudentDrawer();
      return;
    }

    const actionEl = target.closest('[data-action]') as HTMLElement | null;
    if (!actionEl) return;

    const action = actionEl.dataset.action;
    switch (action) {
      case 'open-room-modal':
        openRoomModal();
        break;
      case 'close-room-modal':
        closeRoomModal();
        break;
      case 'submit-room-join':
        handleJoinClick();
        break;
      case 'submit-room-create':
        handleCreateClick();
        break;
      case 'toggle-teacher-drawer':
        toggleRoomDrawer();
        break;
      case 'close-teacher-drawer':
        closeTeacherDrawer();
        break;
      case 'close-student-drawer':
        closeStudentDrawer();
        break;
      case 'switch-room-tab':
        if (actionEl.dataset.tab) handleTabSwitch(actionEl.dataset.tab);
        break;
      case 'call-teacher-help':
        roomService.callTeacherHelp();
        break;
      case 'resolve-help':
        if (actionEl.dataset.id && (actionEl.dataset.studentId || actionEl.dataset.name)) {
          roomService.resolveTeacherHelp(actionEl.dataset.id, actionEl.dataset.studentId || actionEl.dataset.name || '');
        }
        break;
      case 'award-star':
        if (actionEl.dataset.id || actionEl.dataset.name) {
          roomService.awardStarToStudent(actionEl.dataset.id || actionEl.dataset.name || '');
        }
        break;
      case 'send-broadcast-message': {
        const input = document.getElementById('inputBroadcastMsg') as HTMLInputElement;
        if (input && input.value.trim()) {
          roomService.broadcastAnnouncement(input.value.trim());
          input.value = '';
        }
        break;
      }
      case 'toggle-pause-room':
        roomService.togglePauseRoom();
        break;
      case 'close-room-globally':
        if (confirm('Tüm sınıf için oturumu sonlandırmak istediğinize emin misiniz?')) {
          roomService.closeRoomGlobally();
          closeTeacherDrawer();
        }
        break;
      case 'leave-current-room':
        roomService.leaveRoom();
        closeTeacherDrawer();
        closeStudentDrawer();
        break;
      default:
        break;
    }
  });
}
