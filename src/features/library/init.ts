import { registerActions } from '../../app/actions.ts';
import { notifyStateChange } from '../../app/state.ts';
import { initLibrary as initLibraryAnswerEvents } from './library-model.ts';
import { exitLibraryView } from './library-drawer.ts';
import { toggleStarQuestionUI } from './library-actions.ts';

let initialized = false;

export function initLibrary(): void {
  if (initialized) return;
  initialized = true;
  initLibraryAnswerEvents();
  registerActions({
    'toggle-star-question': (el, ev) => {
      if (el.dataset.qid) toggleStarQuestionUI(Number(el.dataset.qid), ev);
    },
    'exit-library-and-close-drawer': () => {
      exitLibraryView();
      notifyStateChange('drawer:close');
    },
  });
}
