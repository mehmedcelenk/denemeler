import { roomService } from './room-service.ts';

let initialized = false;

/** Görünürlük ile ağ bağlantısı farklı durumlardır. Odak kaybı çıkış sayılmaz. */
export function initFocusTracker(): void {
  if (initialized || typeof document === 'undefined') return;
  initialized = true;
  document.addEventListener('visibilitychange', () => {
    roomService.setVisibility(!document.hidden);
  });
  window.addEventListener('pagehide', () => roomService.setVisibility(false));
  window.addEventListener('pageshow', () => roomService.setVisibility(!document.hidden));
}
