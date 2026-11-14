import { state, store, notifyStateChange } from '../../app/state.ts';
import { computeBoardFocalZoom, renderBoardQuestion, scheduleBoardTransform, updateCanvasTransform } from './board-view.ts';

let panX = 0;
let panY = 0;
let boardScale = 1;
let pinchStartDist = 0;
let pinchStartScale = 1;
let pinchLastCenter = { x: 0, y: 0 };
let isDragging = false;
let isSpacePressed = false;
let dragStartX = 0;
let dragStartY = 0;
let initialPanX = 0;
let initialPanY = 0;
let activePointerId: number | null = null;

let lastBoardOpenedTime = 0;

export function openBoardFocusMode(questionId: number, event?: Event): void {
  if (typeof document === 'undefined') return;
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  const overlay = document.getElementById('boardSpaceOverlay');
  if (!overlay) return;

  // Tahta bu soru için zaten açıksa buton aç/kapa gibi çalışır (kazara çift tıklama koruması closeBoardFocusMode içinde)
  if (overlay.style.display === 'flex' && state.activeBoardQuestionId === questionId) {
    closeBoardFocusMode();
    return;
  }

  lastBoardOpenedTime = Date.now();
  store.setActiveBoardQuestionId(questionId);
  resetBoardPan();
  renderBoardQuestion(questionId);

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

  const closingQid = state.activeBoardQuestionId;
  store.setActiveBoardQuestionId(null);
  if (closingQid) {
    notifyStateChange('booklet:ensure-question', { qid: closingQid, scroll: true });
  }
}

export function resetBoardPan(): void {
  panX = 0;
  panY = 0;
  boardScale = 1;
  updateCanvasTransform(panX, panY, true, boardScale);
}

export function handleBoardOverlayClick(_event?: MouseEvent): void {
  // Akıllı tahtada veya dokunmatik ekranda not alırken kazara kapanmayı önle.
}

export function navigateBoardQuestion(delta: number): void {
  const questions = state.bookletQuestions.length > 0 ? state.bookletQuestions : state.allData;
  const currentQid = state.activeBoardQuestionId;
  if (questions.length === 0 || !currentQid) return;

  const currentIdx = questions.findIndex(q => q.id === currentQid);
  if (currentIdx === -1) return;

  const nextIdx = currentIdx + delta;
  if (nextIdx >= 0 && nextIdx < questions.length) {
    const nextQid = questions[nextIdx].id;
    store.setActiveBoardQuestionId(nextQid);
    resetBoardPan();
    renderBoardQuestion(nextQid);
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
  overlay.addEventListener('touchstart', handleBoardTouchStart, { passive: true });
  overlay.addEventListener('touchmove', handleBoardTouchMove, { passive: false });
  overlay.addEventListener('touchend', handleBoardTouchEnd);
  overlay.addEventListener('touchcancel', handleBoardTouchEnd);
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
  overlay.removeEventListener('touchstart', handleBoardTouchStart);
  overlay.removeEventListener('touchmove', handleBoardTouchMove);
  overlay.removeEventListener('touchend', handleBoardTouchEnd);
  overlay.removeEventListener('touchcancel', handleBoardTouchEnd);
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
  activePointerId = e.pointerId;
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
  if (!isDragging || pinchStartDist > 0) return;
  panX = initialPanX + (e.clientX - dragStartX);
  panY = initialPanY + (e.clientY - dragStartY);
  scheduleBoardTransform(panX, panY, boardScale);
}

function handleBoardPointerUp(e: PointerEvent): void {
  if (!isDragging) return;
  isDragging = false;
  activePointerId = null;

  const overlay = document.getElementById('boardSpaceOverlay');
  if (overlay) {
    overlay.classList.remove('is-dragging');
    try { overlay.releasePointerCapture(e.pointerId); } catch {}
    if (!isSpacePressed) overlay.classList.remove('is-space-panning');
  }
}

function handleBoardWheel(e: WheelEvent): void {
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) {
    const next = computeBoardFocalZoom(panX, panY, boardScale, boardScale - e.deltaY * 0.002, e.clientX, e.clientY);
    panX = next.panX;
    panY = next.panY;
    boardScale = next.scale;
    scheduleBoardTransform(panX, panY, boardScale);
    return;
  }

  panX -= e.deltaX;
  panY -= e.deltaY;
  scheduleBoardTransform(panX, panY, boardScale);
  const hint = document.getElementById('boardPanHint');
  if (hint) hint.style.opacity = '0';
}

function handleBoardTouchStart(e: TouchEvent): void {
  if (e.touches.length !== 2) return;
  const [first, second] = Array.from(e.touches);
  pinchStartDist = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
  pinchStartScale = boardScale;
  pinchLastCenter = { x: (first.clientX + second.clientX) / 2, y: (first.clientY + second.clientY) / 2 };
  isDragging = false;
  const overlay = document.getElementById('boardSpaceOverlay');
  if (overlay) {
    overlay.classList.remove('is-dragging');
    if (activePointerId !== null) {
      try { overlay.releasePointerCapture(activePointerId); } catch {}
      activePointerId = null;
    }
  }
}

function handleBoardTouchMove(e: TouchEvent): void {
  if (e.touches.length !== 2 || pinchStartDist <= 0) return;
  e.preventDefault();
  const [first, second] = Array.from(e.touches);
  const distance = Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
  const currentCenter = { x: (first.clientX + second.clientX) / 2, y: (first.clientY + second.clientY) / 2 };
  const targetScale = pinchStartScale * (distance / pinchStartDist);
  const dx = currentCenter.x - pinchLastCenter.x;
  const dy = currentCenter.y - pinchLastCenter.y;
  const next = computeBoardFocalZoom(panX, panY, boardScale, targetScale, currentCenter.x, currentCenter.y, dx, dy);
  pinchLastCenter = currentCenter;
  panX = next.panX;
  panY = next.panY;
  boardScale = next.scale;
  scheduleBoardTransform(panX, panY, boardScale);
}

function handleBoardTouchEnd(e: TouchEvent): void {
  if (e.touches.length < 2) pinchStartDist = 0;
}

function handleBoardKeydown(e: KeyboardEvent): void {
  if (e.code === 'Space') {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
    e.preventDefault();
    if (!isSpacePressed) {
      isSpacePressed = true;
      document.getElementById('boardSpaceOverlay')?.classList.add('is-space-panning');
    }
    return;
  }

  if (e.key === '0') resetBoardPan();
  else if (e.key === 'Escape') closeBoardFocusMode();
  else if (e.key === 'ArrowLeft') navigateBoardQuestion(-1);
  else if (e.key === 'ArrowRight') navigateBoardQuestion(1);
  else if (e.key.toLowerCase() === 'c' && state.activeBoardQuestionId) {
    notifyStateChange('answer:reveal', { questionId: state.activeBoardQuestionId });
  }
}

function handleBoardKeyup(e: KeyboardEvent): void {
  if (e.code !== 'Space') return;
  isSpacePressed = false;
  const overlay = document.getElementById('boardSpaceOverlay');
  if (!overlay) return;
  overlay.classList.remove('is-space-panning');
  if (!isDragging) overlay.classList.remove('is-dragging');
}

function handleWindowBlur(): void {
  isSpacePressed = false;
  isDragging = false;
  document.getElementById('boardSpaceOverlay')?.classList.remove('is-space-panning', 'is-dragging');
}
