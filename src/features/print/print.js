import { state, notifyStateChange } from '../../app/state.ts';
import { toggleConsoleMenu } from '../appearance/layout.js';
import { isEnglishQuestion } from '../../shared/english-utils.ts';

export function openPdfDialog() {
  toggleConsoleMenu();
  const isEnglish = (state.currentSubject === 'ING') || state.bookletQuestions.some(isEnglishQuestion);
  const engGroup = document.getElementById('pdfEnglishOptGroup');
  if (engGroup) {
    engGroup.style.display = isEnglish ? 'block' : 'none';
  }
  document.getElementById('pdfDialogOverlay').classList.add('open');
}

export function closePdfDialog() {
  document.getElementById('pdfDialogOverlay').classList.remove('open');
}

export function executePdfPrint() {
  const chkInterlinear = document.getElementById('chkPdfInterlinear');
  const printWithInterlinear = Boolean(chkInterlinear && chkInterlinear.checked);
  closePdfDialog();

  notifyStateChange('print:before', { interlinear: printWithInterlinear });

  window.print();

  setTimeout(() => {
    notifyStateChange('print:after', { interlinear: printWithInterlinear });
  }, 1000);
}
