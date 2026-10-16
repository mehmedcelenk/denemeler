import { roomService } from './room-service.ts';

let isListening = false;
let isCurrentlyLost = false;
let lastHiddenTime = 0;

export function initFocusTracker(): void {
  if (isListening || typeof document === 'undefined') return;
  isListening = true;

  document.addEventListener('visibilitychange', () => {
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
  }
}

function handleFocusLost(): void {
  // Oda duraklatılmışsa (mola/dinleme modu) çıkış takibi yapma, öğrencileri rahat bırak
  if (roomService.getState().isPaused) return;

  const now = Date.now();
  if (now - lastHiddenTime < 1500) return;
  lastHiddenTime = now;
  isCurrentlyLost = true;

  roomService.notifyFocusLost();
}

function handleFocusRestored(): void {
  if (!isCurrentlyLost) return;
  isCurrentlyLost = false;

  roomService.notifyFocusRestored();
}
