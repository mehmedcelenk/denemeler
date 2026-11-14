import { state, notifyStateChange } from '../../app/state.ts';
import type { Question } from '../../data/question.ts';

let boardRafId = 0;

export function updateCanvasTransform(panX: number, panY: number, animate = false, scale = state.canvasZoomScale): void {
  if (typeof document === 'undefined') return;
  const stage = document.getElementById('boardQuestionStage');
  const recenterBtn = document.getElementById('btnBoardRecenter');

  if (stage) {
    stage.style.transition = animate ? 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
    stage.style.transform = `translate3d(${panX.toFixed(2)}px, ${panY.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
  }

  if (recenterBtn) {
    const isOffset = Math.hypot(panX, panY) > 30 || Math.abs(scale - 1) > 0.03;
    recenterBtn.style.display = isOffset ? 'inline-flex' : 'none';
  }
}

export function scheduleBoardTransform(panX: number, panY: number, scale: number): void {
  if (boardRafId) return;
  if (typeof requestAnimationFrame === 'undefined') {
    updateCanvasTransform(panX, panY, false, scale);
    return;
  }
  boardRafId = requestAnimationFrame(() => {
    boardRafId = 0;
    updateCanvasTransform(panX, panY, false, scale);
  });
}

export function computeBoardFocalZoom(
  panX: number,
  panY: number,
  currentScale: number,
  targetScale: number,
  focusX: number,
  focusY: number,
  deltaPanX = 0,
  deltaPanY = 0
): { panX: number; panY: number; scale: number } {
  const nextScale = Math.min(2.5, Math.max(0.85, targetScale));
  const ratio = nextScale / currentScale;
  const cx = (typeof window !== 'undefined' ? window.innerWidth / 2 : 0) + panX;
  const cy = (typeof window !== 'undefined' ? window.innerHeight / 2 : 0) + panY;
  return {
    panX: panX + (focusX - cx) * (1 - ratio) + deltaPanX,
    panY: panY + (focusY - cy) * (1 - ratio) + deltaPanY,
    scale: nextScale,
  };
}

export function renderBoardQuestion(activeBoardQuestionId: number | null): void {
  if (!activeBoardQuestionId) return;

  const questions = state.bookletQuestions.length > 0 ? state.bookletQuestions : state.allData;
  const idx = questions.findIndex(q => q.id === activeBoardQuestionId);
  const q: Question | undefined = (idx !== -1) ? questions[idx] : state.allData.find(item => item.id === activeBoardQuestionId);
  if (!q) return;

  const currentNum = (idx !== -1) ? (idx + 1) : 1;
  notifyStateChange('board:render-question', { q, currentNum });
}
