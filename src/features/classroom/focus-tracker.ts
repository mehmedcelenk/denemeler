import { roomService } from './room-service.ts';
import { handleVisibilityChangeForWakeLock } from './wake-lock.ts';

let isListening = false;
let isCurrentlyLost = false;
let pollIntervalTimer: ReturnType<typeof setInterval> | null = null;
let graceTimer: ReturnType<typeof setTimeout> | null = null;
let focusLostStartTimestamp: number = 0;

// Sayfa yenileme (F5/Reload) anındaki anlık kopmalarda hemen ayrıldı paniği yaratmamak için 1 sn tolerans
const RELOAD_GRACE_PERIOD_MS = 1000;

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
  // Eğer reload / 1 sn içinde geri döndüyse alarmı iptal et
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
