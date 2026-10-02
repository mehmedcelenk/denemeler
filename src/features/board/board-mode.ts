import { state } from '../../app/state.ts';
import type { Question } from '../../data/question.ts';
import { renderQuestionCardHtml } from '../booklet/question-card.js';
import { toggleSingleAnswerReveal } from '../answers/reveal.js';

let activeBoardQuestionId: number | null = null;
let panX = 0;
let panY = 0;
let isDragging = false;
let isSpacePressed = false;
let dragStartX = 0;
let dragStartY = 0;
let initialPanX = 0;
let initialPanY = 0;

let lastBoardOpenedTime = 0;

export function openBoardFocusMode(questionId: number, event?: Event): void {
  if (typeof document === 'undefined') return;
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const overlay = document.getElementById('boardSpaceOverlay');
  if (!overlay) return;

  // Eğer tahta zaten bu soru için açıksa, kazara çift tıklama/dokunmada tahtayı kapatma
  if (overlay.style.display === 'flex' && activeBoardQuestionId === questionId) {
    return;
  }

  lastBoardOpenedTime = Date.now();
  activeBoardQuestionId = questionId;
  resetBoardPan();
  renderActiveBoardQuestion();

  overlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  overlay.focus();

  attachBoardListeners(overlay);
}

export function closeBoardFocusMode(): void {
  if (typeof document === 'undefined') return;

  // Tahta yeni açıldıysa sentezlenmiş hayalet tıklamalarla anında kapanmasını engelle
  if (Date.now() - lastBoardOpenedTime < 350) return;

  const overlay = document.getElementById('boardSpaceOverlay');
  if (overlay) {
    detachBoardListeners(overlay);
    overlay.style.display = 'none';
    overlay.classList.remove('is-space-panning', 'is-dragging');
  }
  document.body.style.overflow = '';

  isDragging = false;
  isSpacePressed = false;

  if (activeBoardQuestionId) {
    const el = document.getElementById(`bq_${activeBoardQuestionId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  activeBoardQuestionId = null;
}

export function resetBoardPan(): void {
  panX = 0;
  panY = 0;
  updateCanvasTransform(true);
}

export function handleBoardOverlayClick(_event?: MouseEvent): void {
  // Akıllı tahtada veya dokunmatik ekranda not alırken kazara kapanmayı önle.
}

export function navigateBoardQuestion(delta: number): void {
  const questions = state.bookletQuestions.length > 0 ? state.bookletQuestions : state.allData;
  if (questions.length === 0 || !activeBoardQuestionId) return;

  const currentIdx = questions.findIndex(q => q.id === activeBoardQuestionId);
  if (currentIdx === -1) return;

  const nextIdx = currentIdx + delta;
  if (nextIdx >= 0 && nextIdx < questions.length) {
    activeBoardQuestionId = questions[nextIdx].id;
    resetBoardPan();
    renderActiveBoardQuestion();
  }
}

function attachBoardListeners(overlay: HTMLElement): void {
  window.addEventListener('keydown', handleBoardKeydown);
  window.addEventListener('keyup', handleBoardKeyup);
  window.addEventListener('blur', handleWindowBlur);

  overlay.addEventListener('pointerdown', handleBoardPointerDown);
  overlay.addEventListener('pointermove', handleBoardPointerMove);
  overlay.addEventListener('pointerup', handleBoardPointerUp);
  overlay.addEventListener('pointercancel', handleBoardPointerUp);
  overlay.addEventListener('wheel', handleBoardWheel, { passive: false });
}

function detachBoardListeners(overlay: HTMLElement): void {
  window.removeEventListener('keydown', handleBoardKeydown);
  window.removeEventListener('keyup', handleBoardKeyup);
  window.removeEventListener('blur', handleWindowBlur);

  overlay.removeEventListener('pointerdown', handleBoardPointerDown);
  overlay.removeEventListener('pointermove', handleBoardPointerMove);
  overlay.removeEventListener('pointerup', handleBoardPointerUp);
  overlay.removeEventListener('pointercancel', handleBoardPointerUp);
  overlay.removeEventListener('wheel', handleBoardWheel);
}

function updateCanvasTransform(animate = false): void {
  if (typeof document === 'undefined') return;
  const stage = document.getElementById('boardQuestionStage');
  const overlay = document.getElementById('boardSpaceOverlay');
  const recenterBtn = document.getElementById('btnBoardRecenter');

  if (stage) {
    stage.style.transition = animate ? 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
    stage.style.transform = `translate3d(${panX}px, ${panY}px, 0)`;
  }

  if (overlay) {
    overlay.style.backgroundPosition = `${panX}px ${panY}px`;
  }

  if (recenterBtn) {
    const isOffset = Math.hypot(panX, panY) > 30;
    recenterBtn.style.display = isOffset ? 'inline-flex' : 'none';
  }
}

function handleBoardPointerDown(e: PointerEvent): void {
  if (e.pointerType === 'mouse' && e.button !== 0) return;

  const target = e.target as HTMLElement | null;
  if (!target) return;

  // Çıkış butonu, odakla butonu veya soru içi özel etkileşim butonları sürüklemeyi başlatmaz
  if (target.closest('.btn-board-exit, .btn-board-recenter, .btn-companion-icon, .btn-opt-tts, .btn-conf-opt, .btn-conf-close, .btn-text-badge')) {
    return;
  }

  const isInsideStage = !!target.closest('#boardQuestionStage');

  // Soru kartının içi: Space basılı DEĞİLSE standart soru çözme etkileşimidir (tıklama serbest)
  if (isInsideStage && !isSpacePressed) {
    return;
  }

  // Boş tuval alanı VEYA Space tuşu basılı iken: Sonsuz tuval kaydırması başlar
  isDragging = true;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  initialPanX = panX;
  initialPanY = panY;

  const overlay = document.getElementById('boardSpaceOverlay');
  if (overlay) {
    overlay.classList.add('is-dragging');
    try {
      overlay.setPointerCapture(e.pointerId);
    } catch {
      // Tarayıcı yakalama hatası yok sayılır
    }
  }

  const hint = document.getElementById('boardPanHint');
  if (hint) {
    hint.style.opacity = '0';
  }
}

function handleBoardPointerMove(e: PointerEvent): void {
  if (!isDragging) return;
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  panX = initialPanX + dx;
  panY = initialPanY + dy;
  updateCanvasTransform(false);
}

function handleBoardPointerUp(e: PointerEvent): void {
  if (!isDragging) return;
  isDragging = false;

  const overlay = document.getElementById('boardSpaceOverlay');
  if (overlay) {
    overlay.classList.remove('is-dragging');
    try {
      overlay.releasePointerCapture(e.pointerId);
    } catch {
      // Yok say
    }
    if (!isSpacePressed) {
      overlay.classList.remove('is-space-panning');
    }
  }
}

function handleBoardWheel(e: WheelEvent): void {
  e.preventDefault();
  panX -= e.deltaX;
  panY -= e.deltaY;
  updateCanvasTransform(false);

  const hint = document.getElementById('boardPanHint');
  if (hint) {
    hint.style.opacity = '0';
  }
}

function handleBoardKeydown(e: KeyboardEvent): void {
  if (e.code === 'Space') {
    const target = e.target as HTMLElement | null;
    const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    if (!isInput) {
      e.preventDefault();
      if (!isSpacePressed) {
        isSpacePressed = true;
        const overlay = document.getElementById('boardSpaceOverlay');
        if (overlay) overlay.classList.add('is-space-panning');
      }
    }
    return;
  }

  if (e.key === '0') {
    resetBoardPan();
    return;
  }

  if (e.key === 'Escape') {
    closeBoardFocusMode();
  } else if (e.key === 'ArrowLeft') {
    navigateBoardQuestion(-1);
  } else if (e.key === 'ArrowRight') {
    navigateBoardQuestion(1);
  } else if (e.key.toLowerCase() === 'c' && activeBoardQuestionId) {
    toggleSingleAnswerReveal(activeBoardQuestionId);
  }
}

function handleBoardKeyup(e: KeyboardEvent): void {
  if (e.code === 'Space') {
    isSpacePressed = false;
    const overlay = document.getElementById('boardSpaceOverlay');
    if (overlay) {
      overlay.classList.remove('is-space-panning');
      if (!isDragging) {
        overlay.classList.remove('is-dragging');
      }
    }
  }
}

function handleWindowBlur(): void {
  isSpacePressed = false;
  isDragging = false;
  const overlay = document.getElementById('boardSpaceOverlay');
  if (overlay) {
    overlay.classList.remove('is-space-panning', 'is-dragging');
  }
}

function renderActiveBoardQuestion(): void {
  if (!activeBoardQuestionId) return;

  const questions = state.bookletQuestions.length > 0 ? state.bookletQuestions : state.allData;
  const idx = questions.findIndex(q => q.id === activeBoardQuestionId);
  const q: Question | undefined = (idx !== -1) ? questions[idx] : state.allData.find(item => item.id === activeBoardQuestionId);
  if (!q) return;

  const currentNum = (idx !== -1) ? (idx + 1) : 1;
  const stage = document.getElementById('boardQuestionStage');
  if (!stage) return;

  // Soru birebir kitapçık kartı component'i olarak render edilir
  stage.innerHTML = renderQuestionCardHtml(q, currentNum);
}
