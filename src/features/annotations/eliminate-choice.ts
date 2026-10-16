import { state, store } from '../../app/state.ts';
import type { Choice } from '../../data/question.ts';

let longPressTimer: ReturnType<typeof setTimeout> | null = null;
let longPressTriggered = false;
let activeBubble: HTMLElement | null = null;
let startX = 0;
let startY = 0;

/** Şıkkı elenmiş veya aktif durumuna geçirir */
export function toggleEliminateChoice(qid: number, letter: Choice): boolean {
  const isNowEliminated = store.toggleEliminatedChoice(qid, letter);
  
  if (typeof document !== 'undefined') {
    const rows = document.querySelectorAll<HTMLElement>(`#opt_${qid}_${letter}`);
    rows.forEach(row => {
      if (isNowEliminated) {
        row.classList.add('eliminated');
      } else {
        row.classList.remove('eliminated');
      }
    });
  }

  // Dokunmatik cihazlarda minik haptic titreşim
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(isNowEliminated ? 35 : 20);
    } catch {}
  }

  return isNowEliminated;
}

function handlePointerDown(e: PointerEvent): void {
  const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('.optical-bubble');
  if (!target) return;

  const qidStr = target.dataset.qid;
  const letter = target.dataset.letter as Choice | undefined;
  if (!qidStr || !letter) return;

  activeBubble = target;
  longPressTriggered = false;
  startX = e.clientX;
  startY = e.clientY;

  clearTimer();

  // 450ms basılı tutulursa uzun basma say
  longPressTimer = setTimeout(() => {
    longPressTriggered = true;
    const qid = Number(qidStr);
    toggleEliminateChoice(qid, letter);
    clearTimer();
  }, 450);
}

function handlePointerMove(e: PointerEvent): void {
  if (!longPressTimer) return;
  // Kullanıcı parmağını kaydırırsa (scroll yaparsa) uzun basmayı iptal et
  const moveX = Math.abs(e.clientX - startX);
  const moveY = Math.abs(e.clientY - startY);
  if (moveX > 10 || moveY > 10) {
    clearTimer();
  }
}

function handlePointerUp(): void {
  clearTimer();
}

function handlePointerCancel(): void {
  clearTimer();
}

function handleClickCapture(e: MouseEvent): void {
  // Eğer az önce uzun basma tetiklendiyse, bırakıldığında tetiklenecek normal click olayını engelle
  if (longPressTriggered) {
    const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('.optical-bubble');
    if (target && target === activeBubble) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
    longPressTriggered = false;
    activeBubble = null;
  }
}

function clearTimer(): void {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
}

let isInitialized = false;

/** Şık harflerine uzun basarak eleme özelliğini dinler */
export function initChoiceElimination(): void {
  if (isInitialized || typeof document === 'undefined') return;
  isInitialized = true;

  document.addEventListener('pointerdown', handlePointerDown, { passive: true });
  document.addEventListener('pointermove', handlePointerMove, { passive: true });
  document.addEventListener('pointerup', handlePointerUp, { passive: true });
  document.addEventListener('pointercancel', handlePointerCancel, { passive: true });
  // Normal click'in bubbling aşamasından önce yakalamak için capture: true
  document.addEventListener('click', handleClickCapture, true);
}
