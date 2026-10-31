import { registerActions } from '../../app/actions.ts';
import { state } from '../../app/state.ts';
import { closeSubjectDrawer, openSubjectDrawer } from './drawer.ts';
import { loadAllTopicsToBooklet, setDrawerTab } from './topics.js';
import {
  addSubjectRow,
  handleIntersectionToggle,
  removeSubjectRow,
  setProgramMode,
  toggleSubjectDropdown,
} from './selection.js';
import { startInterleavedExam } from './exam-mode.ts';

let initialized = false;

export function initSubjects(): void {
  if (initialized) return;
  initialized = true;
  registerActions({
    'open-subject-drawer': () => openSubjectDrawer(),
    'close-subject-drawer': () => closeSubjectDrawer(),
    'toggle-subject-dropdown': () => toggleSubjectDropdown(),
    'start-interleaved-exam': () => startInterleavedExam(),
    'load-all-topics': () => loadAllTopicsToBooklet(),
    'toggle-intersection': el => {
      const checked = el instanceof HTMLInputElement
        ? el.checked
        : state.courseFilterMode !== 'AND';
      handleIntersectionToggle(checked);
    },
    'set-program-mode': async el => {
      if (el.dataset.program) await setProgramMode(el.dataset.program);
    },
    'set-drawer-tab': el => {
      if (el.dataset.tab) setDrawerTab(el.dataset.tab);
    },
    'add-subject-row': async () => { await addSubjectRow(); },
    'remove-subject-row': el => {
      if (el.dataset.subject) removeSubjectRow(el.dataset.subject);
    },
  });
}
