import { registerActions } from '../../app/actions.ts';
import { closePdfDialog, executePdfPrint, openPdfDialog } from './print.js';

let initialized = false;

export function initPrint(): void {
  if (initialized) return;
  initialized = true;
  registerActions({
    'open-pdf-dialog': () => openPdfDialog(),
    'close-pdf-dialog': () => closePdfDialog(),
    'execute-pdf-print': () => executePdfPrint(),
  });
}
