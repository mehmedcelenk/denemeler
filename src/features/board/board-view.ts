import { state, notifyStateChange } from '../../app/state.ts';
import type { Question } from '../../data/question.ts';

export function updateCanvasTransform(panX: number, panY: number, animate = false): void {
  if (typeof document === 'undefined') return;
  const stage = document.getElementById('boardQuestionStage');
  const overlay = document.getElementById('boardSpaceOverlay');
  const recenterBtn = document.getElementById('btnBoardRecenter');

  if (stage) {
    stage.style.transition = animate ? 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
    stage.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${state.canvasZoomScale})`;
  }

  if (overlay) {
    overlay.style.backgroundPosition = `${panX}px ${panY}px`;
  }

  if (recenterBtn) {
    const isOffset = Math.hypot(panX, panY) > 30;
    recenterBtn.style.display = isOffset ? 'inline-flex' : 'none';
  }
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
