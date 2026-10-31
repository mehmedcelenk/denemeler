import { registerActions } from '../../app/actions.ts';
import { closeBoardFocusMode, openBoardFocusMode, resetBoardPan } from './board-mode.ts';

let initialized = false;

export function initBoard(): void {
  if (initialized) return;
  initialized = true;
  registerActions({
    'reset-board-pan': () => resetBoardPan(),
    'close-board-focus': () => closeBoardFocusMode(),
    'open-board-focus': (el, ev) => {
      if (el.dataset.qid) openBoardFocusMode(Number(el.dataset.qid), ev);
    },
  });
}
