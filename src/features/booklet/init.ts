import { onStateChange, state } from '../../app/state.ts';
import { registerActions } from '../../app/actions.ts';
import {
  copyQuestionText,
  eliminateOneWrongChoice,
  syncXraySoundOptionVisibility,
  toggleFeaturesBar,
  toggleGrammarLayer,
  toggleQuestionFeatures,
} from './features-bar.ts';
import { setBookletFilter, setUnifiedMode, toggleUnifiedDropdown } from './filter.ts';
import { setContentViewMode } from './view-mode.ts';
import { dismissResumeBanner, resumeLastSession, saveSessionSnapshot } from './resume.ts';

let initialized = false;

export function initBooklet(): void {
  if (initialized) return;
  initialized = true;
  onStateChange('answer:marked', payload => {
    if (state.currentSubject && payload && typeof payload === 'object' && 'qid' in payload && typeof payload.qid === 'number') {
      saveSessionSnapshot(state.currentSubject, payload.qid);
    }
  });
  onStateChange('booklet:updated', syncXraySoundOptionVisibility);
  onStateChange('view-mode:updated', syncXraySoundOptionVisibility);
  onStateChange('filter:updated', syncXraySoundOptionVisibility);
  onStateChange('subject:select', syncXraySoundOptionVisibility);
  onStateChange('study:changed', syncXraySoundOptionVisibility);
  syncXraySoundOptionVisibility();
  registerActions({
    'set-booklet-filter': el => {
      const mode = el.dataset.filter;
      if (mode === 'all' || mode === 'rematch' || mode === 'review' || mode === 'starred'
        || mode === 'incorrect' || mode === 'unanswered') setBookletFilter(mode);
    },
    'set-content-view': el => {
      const view = el.dataset.view;
      if (view === 'questions' || view === 'notes') setContentViewMode(view);
    },
    'set-unified-mode': el => {
      const mode = el.dataset.mode;
      if (mode === 'all' || mode === 'rematch' || mode === 'review' || mode === 'starred' || mode === 'notes'
        || mode === 'institution' || mode === 'room') {
        setUnifiedMode(mode);
      }
    },
    'toggle-unified-dropdown': () => toggleUnifiedDropdown(),
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
    'toggle-xray-sound': (_el, ev) => {
      toggleGrammarLayer(undefined, 'sound', ev);
    },
  });
}
