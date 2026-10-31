import { registerActions } from '../../app/actions.ts';
import {
  copyQuestionText,
  eliminateOneWrongChoice,
  toggleFeaturesBar,
  toggleGrammarLayer,
  toggleQuestionFeatures,
} from './features-bar.ts';
import { setBookletFilter, setUnifiedMode } from './filter.ts';
import { setContentViewMode } from './view-mode.ts';
import { dismissResumeBanner, resumeLastSession } from './resume.ts';

let initialized = false;

export function initBooklet(): void {
  if (initialized) return;
  initialized = true;
  registerActions({
    'set-booklet-filter': el => {
      const mode = el.dataset.filter;
      if (mode === 'all' || mode === 'rematch' || mode === 'starred'
        || mode === 'incorrect' || mode === 'unanswered') setBookletFilter(mode);
    },
    'set-content-view': el => {
      const view = el.dataset.view;
      if (view === 'questions' || view === 'notes') setContentViewMode(view);
    },
    'set-unified-mode': el => {
      const mode = el.dataset.mode;
      if (mode === 'all' || mode === 'rematch' || mode === 'starred' || mode === 'notes') {
        setUnifiedMode(mode);
      }
    },
    'resume-last-session': () => resumeLastSession(),
    'dismiss-resume-banner': () => dismissResumeBanner(),
    'toggle-features-bar': () => toggleFeaturesBar(),
    'toggle-question-features': el => {
      if (el.dataset.qid) toggleQuestionFeatures(Number(el.dataset.qid));
    },
    'eliminate-wrong-choice': el => {
      if (el.dataset.qid) eliminateOneWrongChoice(Number(el.dataset.qid));
    },
    'copy-question-text': async el => {
      if (el.dataset.qid) await copyQuestionText(Number(el.dataset.qid));
    },
    'toggle-xray-syntax': (el, ev) => {
      if (el.dataset.qid) toggleGrammarLayer(Number(el.dataset.qid), 'syntax', ev);
    },
    'toggle-xray-pos': (el, ev) => {
      if (el.dataset.qid) toggleGrammarLayer(Number(el.dataset.qid), 'pos', ev);
    },
    'toggle-xray-sound': (el, ev) => {
      if (el.dataset.qid) toggleGrammarLayer(Number(el.dataset.qid), 'sound', ev);
    },
  });
}
