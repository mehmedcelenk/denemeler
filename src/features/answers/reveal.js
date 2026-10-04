import { state, onStateChange } from '../../app/state.ts';

export function toggleSingleAnswerReveal(qid) {
  const q = state.allData.find(item => item.id === qid);
  if (q && q.sekilli) return; // Görselli soru pasif

  const isRevealed = state.revealedAnswers.has(qid);
  if (isRevealed) {
    state.revealedAnswers.delete(qid);
  } else {
    state.revealedAnswers.add(qid);
  }

  const correctLetter = q ? q.dogru_cevap : null;

  document.querySelectorAll(`#btnEye_${qid}`).forEach(eyeBtn => {
    eyeBtn.classList.toggle('revealed', !isRevealed);
  });
  document.querySelectorAll(`#banner_${qid}`).forEach(bannerEl => {
    bannerEl.style.display = !isRevealed ? 'flex' : 'none';
  });

  if (correctLetter) {
    document.querySelectorAll(`#opt_${qid}_${correctLetter}`).forEach(correctRow => {
      correctRow.classList.toggle('revealed-correct', !isRevealed);
    });
  }
}

export function toggleSingleHint(qid) {
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
    hintEl.style.display = !isRevealed ? 'flex' : 'none';
  });
}

export function togglePageKey(pageNum) {
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

