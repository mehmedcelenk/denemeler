import { state, onStateChange } from '../../app/state.ts';
import { promptConfidenceSelection, removeConfidencePickerUI, updateQuestionMarkUI } from './confidence.ts';
import { showAnswerExplanationBubble, hideAnswerExplanationBubble } from './explanation.ts';
import { saveChoicesToStorage, loadSavedChoices } from './storage.ts';
import type { Choice } from '../../data/question.ts';

export { saveChoicesToStorage, loadSavedChoices };

/** Optik şık baloncuğuna tıklama eylemini yönetir. */
export function handleSelectOpticalBubble(qid: number, letter: Choice): void {
  const targetQ = state.allData.find(x => x.id === qid);
  if (targetQ && targetQ.sekilli) return; // Görselli/şekilli soru pasif, tıklanamaz

  const current = state.userMarkedChoices[qid];
  if (current === letter) {
    state.undoHistoryStack.push({ ...state.userMarkedChoices });
    delete state.userMarkedChoices[qid];
    delete state.userConfidences[qid];
    saveChoicesToStorage();
    (['A', 'B', 'C', 'D'] as Choice[]).forEach(l => {
      document.querySelectorAll(`#opt_${qid}_${l}`).forEach(row => {
        row.classList.remove('marked', 'marked-correct', 'marked-incorrect', 'revealed-correct');
      });
    });
    document.querySelectorAll(`#banner_${qid}`).forEach(bannerEl => {
      (bannerEl as HTMLElement).style.display = 'none';
    });
    removeConfidencePickerUI(qid);
    return;
  }

  promptConfidenceSelection(qid, letter);
}

/** Tüm işaretlemeleri temizler. */
export function clearAllMarks(): void {
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

/** İşaretleme temizliğini geri alır. */
export function undoClearMarks(): void {
  if (state.undoHistoryStack.length === 0) return;
  const previous = state.undoHistoryStack.pop();
  if (previous) state.userMarkedChoices = previous;
  saveChoicesToStorage();

  Object.entries(state.userMarkedChoices).forEach(([qidStr, letter]) => {
    if (letter) updateQuestionMarkUI(parseInt(qidStr, 10), letter as Choice);
  });

  const undoBtn = document.getElementById('btnUndoClear');
  if (undoBtn && state.undoHistoryStack.length === 0) {
    undoBtn.style.opacity = '0.35';
  }
}

/** Tek bir sorunun doğru cevabını gösterir veya gizler. */
export function toggleSingleAnswerReveal(qid: number): void {
  const q = state.allData.find(item => item.id === qid);
  if (q && q.sekilli) return;

  const isRevealed = state.revealedAnswers.has(qid);
  if (isRevealed) {
    state.revealedAnswers.delete(qid);
    hideAnswerExplanationBubble();
  } else {
    state.revealedAnswers.add(qid);
  }

  const correctLetter = q ? q.dogru_cevap : null;

  document.querySelectorAll(`#btnEye_${qid}`).forEach(eyeBtn => {
    eyeBtn.classList.toggle('revealed', !isRevealed);
  });
  document.querySelectorAll(`#banner_${qid}`).forEach(bannerEl => {
    (bannerEl as HTMLElement).style.display = !isRevealed ? 'flex' : 'none';
  });

  if (correctLetter) {
    document.querySelectorAll(`#opt_${qid}_${correctLetter}`).forEach(correctRow => {
      correctRow.classList.toggle('revealed-correct', !isRevealed);
    });

    if (!isRevealed && q && q.dogru_nedeni) {
      const targetOpt = document.querySelector(`#opt_${qid}_${correctLetter}`) as HTMLElement | null;
      if (targetOpt) showAnswerExplanationBubble(qid, targetOpt);
    }
  }
}

/** Pusula / ipucu gösterip gizler. */
export function toggleSingleHint(qid: number): void {
  const isRevealed = state.revealedHints.has(qid);
  if (isRevealed) {
    state.revealedHints.delete(qid);
  } else {
    state.revealedHints.add(qid);
  }

  document.querySelectorAll(`#btnCompass_${qid}`).forEach(compassBtn => {
    compassBtn.classList.toggle('hint-revealed', !isRevealed);
  });
  document.querySelectorAll(`#hint_${qid}`).forEach(hintEl => {
    (hintEl as HTMLElement).style.display = !isRevealed ? 'flex' : 'none';
  });
}

/** Sayfa altındaki cevap anahtarı şeridini açar veya kapatır. */
export function togglePageKey(pageNum: number): void {
  const strip = document.getElementById(`pageBottomKey_${pageNum}`);
  const lbl = document.getElementById(`lblPageKey_${pageNum}`);
  if (!strip) return;

  const isHidden = (strip.style.display === 'none' || !strip.style.display);
  strip.style.display = isHidden ? 'flex' : 'none';
  if (lbl) lbl.textContent = isHidden ? 'Gizle' : 'Cevaplar';
}

onStateChange('answer:reveal', (payload) => {
  if (payload && typeof payload === 'object' && 'questionId' in payload && typeof payload.questionId === 'number') {
    toggleSingleAnswerReveal(payload.questionId);
  }
});
