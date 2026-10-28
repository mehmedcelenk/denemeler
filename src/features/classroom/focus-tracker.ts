import { roomService } from './room-service.ts';
import { handleVisibilityChangeForWakeLock } from './wake-lock.ts';
import type { FocusLossReason } from './types.ts';

let isListening = false;
let isCurrentlyLost = false;
let pollIntervalTimer: ReturnType<typeof setInterval> | null = null;
let graceTimer: ReturnType<typeof setTimeout> | null = null;
let focusLostStartTimestamp: number = 0;
let lastHeartbeatRafTime: number = 0;
let detectedReason: FocusLossReason = 'APP_SWITCH';

// 4 saniyelik tolerans penceresi (anlık bildirim kaydırması, klavye açılması vb. yanlış alarmları önler)
const GRACE_PERIOD_MS = 4000;

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
      triggerPotentialFocusLoss();
    });

    // Soru kopyalama tespiti (Şüpheli hareket)
    document.addEventListener('copy', (e) => {
      handleCopyAttempt(e);
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
      if ((document.hidden || isUnfocused) && !isCurrentlyLost && !graceTimer) {
        triggerPotentialFocusLoss();
      } else if (!document.hidden && (!isUnfocused || typeof document.hasFocus !== 'function') && (isCurrentlyLost || graceTimer)) {
        triggerPotentialFocusRestored();
      }
    }, 2000);

    // Arka plan JS dondurma / ekran kilitlenmesi tespiti için hafif kalp atışı
    startRafHeartbeat();
  }
}

function startRafHeartbeat(): void {
  if (typeof window === 'undefined') return;
  const loop = (now: number) => {
    lastHeartbeatRafTime = now;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

function detectLossReason(): FocusLossReason {
  // Eğer ekran kapandıysa / telefon uykuya girdiyse requestAnimationFrame hemen dondurulur
  // ve uyanırken geçen süre sıçrar. Sekme değiştirildiğinde ise Chrome RAF'ı saniyede 1 çağırır.
  if (typeof document !== 'undefined' && document.hidden) {
    return 'APP_SWITCH';
  }
  return 'APP_SWITCH';
}

function handleCopyAttempt(e: ClipboardEvent): void {
  const state = roomService.getState();
  if (!state.roomId || state.isHost) return;

  const target = e.target as HTMLElement | null;
  const isQuestionArea = target?.closest('.question-card, .stem-box, .q-text, #bookletMain');
  if (isQuestionArea) {
    const selection = window.getSelection()?.toString().trim() || '';
    const details = selection ? `"${selection.slice(0, 40)}..."` : 'Soru metni kopyalandı';
    roomService.notifySuspiciousAct('COPY_TEXT', details);
  }
}

export function checkFocusAfterResume(): void {
  if (typeof document === 'undefined') return;
  const isUnfocused = typeof document.hasFocus === 'function' ? !document.hasFocus() : false;
  if (document.hidden || isUnfocused) {
    triggerPotentialFocusLoss(true); // mola bittiğinde toleranssız anında tetikle
  }
}

function triggerPotentialFocusLoss(immediate: boolean = false): void {
  const state = roomService.getState();
  if (!state.roomId || state.isPaused || isCurrentlyLost) return;

  detectedReason = detectLossReason();
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
  }, GRACE_PERIOD_MS);
}

function confirmFocusLoss(lostAt: number): void {
  const state = roomService.getState();
  if (!state.roomId || state.isPaused || isCurrentlyLost) return;

  isCurrentlyLost = true;
  roomService.notifyFocusLost(detectedReason, lostAt);
}

function triggerPotentialFocusRestored(): void {
  // Eğer 4 sn tolerans dolmadan geri döndüyse alarmı iptal et
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
