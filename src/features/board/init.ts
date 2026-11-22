import { registerActions } from '../../app/actions.ts';
import { onStateChange, state } from '../../app/state.ts';
import { closeBoardFocusMode, openBoardFocusMode, resetBoardPan } from './board-mode.ts';

let initialized = false;

export function initBoard(): void {
  if (initialized) return;
  initialized = true;
  onStateChange('welcome:home', () => {
    if (state.activeBoardQuestionId !== null) closeBoardFocusMode(true);
  });
  registerActions({
    'reset-board-pan': () => resetBoardPan(),
    'close-board-focus': () => closeBoardFocusMode(),
    'open-board-focus': (el, ev) => {
      if (el.dataset.qid) openBoardFocusMode(Number(el.dataset.qid), ev);
    },
  });
}
