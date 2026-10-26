import { roomService } from './room-service.ts';
import { handleVisibilityChangeForWakeLock } from './wake-lock.ts';

let isListening = false;
let isCurrentlyLost = false;
let pollIntervalTimer: ReturnType<typeof setInterval> | null = null;

export function initFocusTracker(): void {
  if (isListening || typeof document === 'undefined') return;
  isListening = true;

  document.addEventListener('visibilitychange', () => {
    handleVisibilityChangeForWakeLock();
    if (document.hidden) {
      handleFocusLost();
    } else {
      handleFocusRestored();
    }
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('blur', () => {
      handleFocusLost();
    });

    window.addEventListener('focus', () => {
      handleFocusRestored();
    });

    window.addEventListener('pagehide', () => {
      handleFocusLost();
    });

    // Mola bittiğinde öğrenci dışarıdaysa anında yakala
    roomService.onResume(() => {
      checkFocusAfterResume();
    });

    // Mobil ve tabletlerde split-screen / floating window kontrolü (her 2 sn yoklama)
    pollIntervalTimer = setInterval(() => {
      const state = roomService.getState();
      if (!state.roomId || state.isPaused) return;

      const isUnfocused = typeof document.hasFocus === 'function' ? !document.hasFocus() : false;
      if ((document.hidden || isUnfocused) && !isCurrentlyLost) {
        handleFocusLost();
      } else if (!document.hidden && (!isUnfocused || typeof document.hasFocus !== 'function') && isCurrentlyLost) {
        handleFocusRestored();
      }
    }, 2000);
  }
}

export function checkFocusAfterResume(): void {
  if (typeof document === 'undefined') return;
  const isUnfocused = typeof document.hasFocus === 'function' ? !document.hasFocus() : false;
  if (document.hidden || isUnfocused) {
    handleFocusLost();
  }
}

function handleFocusLost(): void {
  if (roomService.getState().isPaused) return;

  isCurrentlyLost = true;
  roomService.notifyFocusLost();
}

function handleFocusRestored(): void {
  if (!isCurrentlyLost) return;
  isCurrentlyLost = false;

  roomService.notifyFocusRestored();
}
