import { state } from '../../app/state.ts';
import { saveChoicesToStorage } from './storage.js';
import { promptConfidenceSelection, removeConfidencePickerUI, updateQuestionMarkUI } from './confidence.ts';

export function handleSelectOpticalBubble(qid, letter) {
  const targetQ = state.allData.find(x => x.id === qid);
  if (targetQ && targetQ.sekilli) return; // Görselli/şekilli soru pasif, tıklanamaz

  const current = state.userMarkedChoices[qid];
  if (current === letter) {
    state.undoHistoryStack.push({ ...state.userMarkedChoices });
    delete state.userMarkedChoices[qid];
    delete state.userConfidences[qid];
    saveChoicesToStorage();
    ['A', 'B', 'C', 'D'].forEach(l => {
      document.querySelectorAll(`#opt_${qid}_${l}`).forEach(row => {
        row.classList.remove('marked', 'marked-correct', 'marked-incorrect', 'revealed-correct');
      });
    });
    document.querySelectorAll(`#banner_${qid}`).forEach(bannerEl => {
      bannerEl.style.display = 'none';
    });
    removeConfidencePickerUI(qid);
    return;
  }

  promptConfidenceSelection(qid, letter);
}

export function clearAllMarks() {
  if (Object.keys(state.userMarkedChoices).length === 0) return;

  state.undoHistoryStack.push({ ...state.userMarkedChoices });
  state.userMarkedChoices = {};
  saveChoicesToStorage();

  document.querySelectorAll('.optical-choice-row').forEach(el => {
    el.classList.remove('marked', 'marked-correct', 'marked-incorrect', 'revealed-correct');
  });

  const undoBtn = document.getElementById('btnUndoClear');
  if (undoBtn) undoBtn.style.opacity = '1';
}

export function undoClearMarks() {
  if (state.undoHistoryStack.length === 0) return;
  state.userMarkedChoices = state.undoHistoryStack.pop();
  saveChoicesToStorage();

  Object.entries(state.userMarkedChoices).forEach(([qidStr, letter]) => {
    updateQuestionMarkUI(parseInt(qidStr, 10), letter);
  });

  const undoBtn = document.getElementById('btnUndoClear');
  if (undoBtn && state.undoHistoryStack.length === 0) {
    undoBtn.style.opacity = '0.35';
  }
}

