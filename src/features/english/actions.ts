import { registerActions } from '../../app/actions.ts';
import { toggleQuestionMeal } from './interlinear.ts';
import { toggleQuestionTranslation } from './translations.js';
import { showVocabBubble } from './vocabulary.js';

export function initEnglishActions(): void {
  registerActions({
    'toggle-question-meal': (el, ev) => {
      if (el.dataset.qid) toggleQuestionMeal(Number(el.dataset.qid), ev);
    },
    'toggle-question-translation': (el, ev) => {
      if (el.dataset.qid && el.dataset.lang) {
        toggleQuestionTranslation(Number(el.dataset.qid), el.dataset.lang, ev);
      }
    },
  });
  if (typeof window !== 'undefined') Object.assign(window, { showVocabBubble });
}
