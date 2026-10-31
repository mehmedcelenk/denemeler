import { runAction } from './actions.ts';
import { handleSelectOpticalBubble, togglePageKey } from '../features/answers/marking.ts';
import {
  handleDropdownItemSelect,
  removeSubjectRow,
  toggleCourseLevel,
  toggleSubjectDropdown,
} from '../features/subjects/selection.js';
import { toggleExamCourseSelection } from '../features/subjects/exam-mode.ts';

/** Yalnızca mevcut inline HTML şablonlarının kullandığı çekirdek isimler. */
export function registerLegacyHandlers() {
  Object.assign(window, {
    handleSelectOpticalBubble,
    togglePageKey,
    handleDropdownItemSelect,
    removeSubjectRow,
    toggleCourseLevel,
    toggleSubjectDropdown,
    toggleExamCourseSelection,
  });
  setupEventDelegation();
}

let initialized = false;

/** Statik ve dinamik kontroller aynı kayıtlı eylemleri kullanır. */
export function setupEventDelegation() {
  if (initialized || typeof document === 'undefined') return;
  initialized = true;

  const delegate = (event) => {
    if (!(event.target instanceof Element)) return;
    const el = event.target.closest('[data-action]');
    if (!(el instanceof HTMLElement)) return;
    const eventType = el.dataset.actionEvent || 'click';
    if (event.type !== eventType) return;
    if (el.dataset.actionSelf === 'true' && event.target !== el) return;
    runAction(el.dataset.action, el, event);
  };

  document.addEventListener('click', delegate);
  document.addEventListener('change', delegate);
}


