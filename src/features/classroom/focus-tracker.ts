import { roomService } from './room-service.ts';
import { handleVisibilityChangeForWakeLock } from './wake-lock.ts';

let isListening = false;
let isCurrentlyLost = false;
let graceTimer: ReturnType<typeof setTimeout> | null = null;
let focusLostStartTimestamp: number = 0;
let lastFocusEventTimestamp: number = 0;

// Tekil F5 / Reload anındaki anlık kırpmada yanlış alarm vermemek için 1 sn tolerans
const RELOAD_GRACE_PERIOD_MS = 1000;
// Çık-gir spam (15 sn içinde tekrarlanan odak kaybı) tespitinde tolerans 0 ms olur!
const SPAM_BURST_WINDOW_MS = 15000;

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

    window.addEventListener('pagehide', () => {
      roomService.handlePageUnload(Date.now());
    });

    window.addEventListener('beforeunload', () => {
      roomService.handlePageUnload(Date.now());
    });

    roomService.onResume(() => {
      checkFocusAfterResume();
    });

    // Mobil ve tabletlerde split-screen / floating window kontrolü (her 1.5 sn yoklama)
    setInterval(() => {
      const state = roomService.getState();
      if (!state.roomId || state.isPaused || state.isHost) return;

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

export function triggerPotentialFocusLoss(immediate: boolean = false, now: number = Date.now()): void {
  const state = roomService.getState();
  if (!state.roomId || state.isPaused || state.isHost || isCurrentlyLost) return;
  // Aynı odak kaybı geçişinde (blur + visibilitychange arka arkaya tetiklendiğinde) graceTimer'ı bozma
  if (graceTimer && !immediate) return;

  roomService.markAwayStarted(now);

  // Son 15 sn içinde zaten odak kaybı denendiyse (çık-gir spam), 1 sn beklemeden ANINDA yakala!
  const isRapidSpam = lastFocusEventTimestamp > 0 && (now - lastFocusEventTimestamp) < SPAM_BURST_WINDOW_MS;
  lastFocusEventTimestamp = now;

  if (immediate || isRapidSpam) {
    if (graceTimer) {
      clearTimeout(graceTimer);
      graceTimer = null;
    }
    focusLostStartTimestamp = now;
    confirmFocusLoss(now);
    return;
  }

  focusLostStartTimestamp = now;
  graceTimer = setTimeout(() => {
    graceTimer = null;
    confirmFocusLoss(focusLostStartTimestamp);
  }, RELOAD_GRACE_PERIOD_MS);
}

function confirmFocusLoss(lostAt: number): void {
  const state = roomService.getState();
  if (!state.roomId || state.isPaused || state.isHost || isCurrentlyLost) return;

  isCurrentlyLost = true;
  roomService.notifyFocusLost(lostAt);
}

export function triggerPotentialFocusRestored(now: number = Date.now()): void {
  if (graceTimer) {
    clearTimeout(graceTimer);
    graceTimer = null;
    roomService.clearAwayStarted();
    return;
  }

  if (!isCurrentlyLost) return;
  isCurrentlyLost = false;

  const awayDurationMs = focusLostStartTimestamp > 0 ? Math.max(0, now - focusLostStartTimestamp) : 0;
  focusLostStartTimestamp = 0;

  roomService.notifyFocusRestored(awayDurationMs, now);
}

export function resetFocusTrackerForTest(): void {
  if (graceTimer) clearTimeout(graceTimer);
  graceTimer = null;
  isCurrentlyLost = false;
  focusLostStartTimestamp = 0;
  lastFocusEventTimestamp = 0;
}
