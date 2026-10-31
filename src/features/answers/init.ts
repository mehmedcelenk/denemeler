import { registerActions } from '../../app/actions.ts';
import { clearAllMarks, toggleSingleAnswerReveal } from './marking.ts';

let initialized = false;

export function initAnswers(): void {
  if (initialized) return;
  initialized = true;
  registerActions({
    'clear-all-marks': () => clearAllMarks(),
    'toggle-answer-reveal': el => {
      if (el.dataset.qid) toggleSingleAnswerReveal(Number(el.dataset.qid));
    },
  });
}
