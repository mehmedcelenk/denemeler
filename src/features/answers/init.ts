import { registerActions } from '../../app/actions.ts';
import type { Choice } from '../../data/question.ts';
import { clearAllMarks, handleSelectOpticalBubble, toggleSingleAnswerReveal } from './marking.ts';
import { initAnswerRateLimit } from './rate-limit.ts';

let initialized = false;

export function initAnswers(): void {
  if (initialized) return;
  initialized = true;
  initAnswerRateLimit();
  registerActions({
    'clear-all-marks': () => clearAllMarks(),
    'select-optical-choice': el => {
      const qid = el.dataset.qid ? Number(el.dataset.qid) : NaN;
      const letter = el.dataset.letter as Choice | undefined;
      if (!Number.isNaN(qid) && letter) {
        handleSelectOpticalBubble(qid, letter, el);
      }
    },
    'toggle-answer-reveal': el => {
      if (el.dataset.qid) toggleSingleAnswerReveal(Number(el.dataset.qid), el);
    },
  });
}
