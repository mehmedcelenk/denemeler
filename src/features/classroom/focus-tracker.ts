import { roomService } from './room-service.ts';
import { handleVisibilityChangeForWakeLock } from './wake-lock.ts';

let isListening = false;
let isCurrentlyLost = false;
let pollIntervalTimer: ReturnType<typeof setInterval> | null = null;
let graceTimer: ReturnType<typeof setTimeout> | null = null;
let focusLostStartTimestamp: number = 0;

// Sayfa yenileme (F5/Reload) anındaki anlık sıçramayı yutacak kadar (1.2 saniye)
const RELOAD_GRACE_PERIOD_MS = 1200;

export function initFocusTracker(): void {
  if (isListening || typeof document === 'undefined') return;
  isListening = true;

  document.addEventListener('visibilitychange', () => {
    handleVisibilityChangeForWakeLock();
    if (document.hidden) {
      triggerPotentialFocusLoss();
    } else {
      triggerPotentialFocusRestored();
    }
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('blur', () => {
      triggerPotentialFocusLoss();
    });

    window.addEventListener('focus', () => {
      triggerPotentialFocusRestored();
    });

    // Sekme kapatılırken veya sayfadan çıkılırken anında kesin ayrılma bildirimi
    window.addEventListener('beforeunload', () => {
      handleImmediateUnload();
    });

    window.addEventListener('pagehide', () => {
      handleImmediateUnload();
    });

    // Mola bittiğinde öğrenci dışarıdaysa anında yakala
    roomService.onResume(() => {
      checkFocusAfterResume();
    });

    // Mobil ve tabletlerde split-screen / floating window kontrolü (her 1.5 sn yoklama)
    pollIntervalTimer = setInterval(() => {
      const state = roomService.getState();
      if (!state.roomId || state.isPaused) return;

      const isUnfocused = typeof document.hasFocus === 'function' ? !document.hasFocus() : false;
      if ((document.hidden || isUnfocused) && !isCurrentlyLost && !graceTimer) {
        triggerPotentialFocusLoss();
      } else if (!document.hidden && (!isUnfocused || typeof document.hasFocus !== 'function') && (isCurrentlyLost || graceTimer)) {
        triggerPotentialFocusRestored();
      }
    }, 1500);
  }
}

function handleImmediateUnload(): void {
  const state = roomService.getState();
  if (!state.roomId) return;
  if (graceTimer) {
    clearTimeout(graceTimer);
    graceTimer = null;
  }
  // Sekme kapandığında soket kapanmadan hemen önce PEER_LEAVE sinyalini gönder
  roomService.leaveRoom();
}

export function checkFocusAfterResume(): void {
  if (typeof document === 'undefined') return;
  const isUnfocused = typeof document.hasFocus === 'function' ? !document.hasFocus() : false;
  if (document.hidden || isUnfocused) {
    triggerPotentialFocusLoss(true);
  }
}

function triggerPotentialFocusLoss(immediate: boolean = false): void {
  const state = roomService.getState();
  if (!state.roomId || state.isPaused || isCurrentlyLost) return;

  const lostAt = Date.now();

  if (immediate) {
    confirmFocusLoss(lostAt);
    return;
  }

  if (graceTimer) return;

  focusLostStartTimestamp = lostAt;
  graceTimer = setTimeout(() => {
    graceTimer = null;
    confirmFocusLoss(focusLostStartTimestamp);
  }, RELOAD_GRACE_PERIOD_MS);
}

function confirmFocusLoss(lostAt: number): void {
  const state = roomService.getState();
  if (!state.roomId || state.isPaused || isCurrentlyLost) return;

  isCurrentlyLost = true;
  roomService.notifyFocusLost(lostAt);
}

function triggerPotentialFocusRestored(): void {
  // Eğer reload / 1.2 sn içinde geri döndüyse alarmı iptal et
  if (graceTimer) {
    clearTimeout(graceTimer);
    graceTimer = null;
    return;
  }

  if (!isCurrentlyLost) return;
  isCurrentlyLost = false;

  const restoredAt = Date.now();
  const awayDurationMs = focusLostStartTimestamp > 0 ? Math.max(0, restoredAt - focusLostStartTimestamp) : 0;
  focusLostStartTimestamp = 0;

  roomService.notifyFocusRestored(awayDurationMs, restoredAt);
}
