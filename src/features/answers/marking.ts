import { state, store, onStateChange, notifyStateChange } from '../../app/state.ts';
import {
  getActiveQuestionCard,
  getCardActionElements,
  getCardAnswerBanner,
  getCardChoiceRow,
  getQuestionCards,
} from '../booklet/card-query.ts';
import { showAnswerExplanationBubble, hideAnswerExplanationBubble } from './explanation.ts';
import { saveChoicesToStorage, loadSavedChoices } from './storage.ts';
import { canMarkAnswer } from './rate-limit.ts';
import type { Choice } from '../../data/question.ts';

export { saveChoicesToStorage, loadSavedChoices };

/** Optik şık baloncuğuna tıklama eylemini yönetir. */
export function handleSelectOpticalBubble(qid: number, letter: Choice, sourceEl?: HTMLElement | null): void {
  const targetQ = state.allData.find(x => x.id === qid);
  if (targetQ && targetQ.sekilli) return; // Görselli/şekilli soru pasif, tıklanamaz
  if (!canMarkAnswer(qid, sourceEl)) return;

  const alreadySubmitted = state.userMarkedChoices[qid];

  // 1. Zaten nihai cevap verilmişse ve aynı şıkka tıklandıysa: Cevabı iptal et / sil
  if (alreadySubmitted === letter) {
    store.removeUserMarkedChoice(qid);
    store.clearPendingChoice(qid);
    saveChoicesToStorage();
    notifyStateChange('answer:revoked', { qid });
    getQuestionCards(qid).forEach(card => {
      card.dataset.userMark = '';
      delete card.dataset.userStatus;
      (['A', 'B', 'C', 'D', 'E'] as Choice[]).forEach(l => {
        getCardChoiceRow(card, l)?.classList.remove('marked', 'marked-correct', 'marked-incorrect', 'revealed-correct');
      });
      const bannerEl = getCardAnswerBanner(card);
      if (bannerEl && !state.revealedAnswers.has(qid)) {
        bannerEl.style.display = 'none';
      }
    });
    hideAnswerExplanationBubble();
    return;
  }

  // 2. Henüz nihai cevap verilmemişse veya başka bir şık seçilmek isteniyorsa:
  const pending = state.pendingMarkedChoices[qid];

  if (pending === letter) {
    // İkinci kez aynı şıkka tıklandı -> Nihai olarak cevapla (confirm)
    store.clearPendingChoice(qid);
    applyFinalChoice(qid, letter, sourceEl);
  } else {
    // İlk tıklama (veya farklı bir şıkka geçiş) -> Sadece moda göre seçili göster (marked)
    store.setPendingChoice(qid, letter);
    getQuestionCards(qid).forEach(card => {
      card.dataset.userMark = letter;
      delete card.dataset.userStatus;
      (['A', 'B', 'C', 'D', 'E'] as Choice[]).forEach(l => {
        const row = getCardChoiceRow(card, l);
        if (!row) return;
        row.classList.remove('marked', 'marked-correct', 'marked-incorrect', 'revealed-correct');
        if (l === letter) {
          row.classList.add('marked');
        }
      });
      const bannerEl = getCardAnswerBanner(card);
      if (bannerEl && !state.revealedAnswers.has(qid)) {
        bannerEl.style.display = 'none';
      }
    });
  }
}

/** Nihai cevabı işler ve UI'yi günceller */
function applyFinalChoice(qid: number, choice: Choice, sourceEl?: HTMLElement | null): void {
  store.clearPendingChoice(qid);
  store.setUserMarkedChoice(qid, choice);
  saveChoicesToStorage();

  const q = state.bookletQuestions.find(item => item.id === qid)
    || state.allData.find(item => item.id === qid);

  if (q) {
    const isCorrect = (choice === q.dogru_cevap);
    notifyStateChange('answer:marked', { qid, choice, isCorrect });
  }

  updateQuestionMarkUI(qid, choice, sourceEl);
}

export function updateQuestionMarkUI(questionId: number, choice: Choice, sourceEl?: HTMLElement | null): void {
  if (typeof document === 'undefined') return;

  const q = state.bookletQuestions.find(item => item.id === questionId)
    || state.allData.find(item => item.id === questionId);
  const correctChoice = q ? q.dogru_cevap : null;
  const isCorrect = (correctChoice && choice === correctChoice);

  getQuestionCards(questionId).forEach(card => {
    card.dataset.userMark = choice;
    card.dataset.userStatus = isCorrect ? 'correct' : 'incorrect';

    (['A', 'B', 'C', 'D', 'E'] as Choice[]).forEach(letter => {
      const row = getCardChoiceRow(card, letter);
      if (!row) return;
      row.classList.remove('marked', 'marked-correct', 'marked-incorrect', 'revealed-correct');

      if (letter === choice) {
        row.classList.add('marked', isCorrect ? 'marked-correct' : 'marked-incorrect');
      } else if (!isCorrect && letter === correctChoice) {
        row.classList.add('revealed-correct');
      }
    });
  });

  // Doğru da yapılsa yanlış da yapılsa doğru şıkkın üzerine açıklama toast'ı aç
  if (q && q.dogru_nedeni) {
    const activeCard = getActiveQuestionCard(questionId, sourceEl);
    const targetOpt = activeCard
      ? ((correctChoice && getCardChoiceRow(activeCard, correctChoice)) || getCardChoiceRow(activeCard, choice))
      : null;
    showAnswerExplanationBubble(questionId, targetOpt);
  }
}

/** Tüm işaretlemeleri temizler. */
export function clearAllMarks(): void {
  store.clearAllPendingChoices();
  store.clearAllEliminatedWrongChoices();
  const hasDom = typeof document !== 'undefined';
  if (hasDom) {
    document.querySelectorAll('.btn-eliminate-wrong').forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('title', 'Bir Yanlış Şıkkı Ele');
    });
  }

  if (Object.keys(state.userMarkedChoices).length === 0) {
    if (hasDom) {
      document.querySelectorAll('.optical-choice-row').forEach(el => {
        el.classList.remove('marked-incorrect');
      });
    }
    return;
  }

  store.clearAllUserMarkedChoices();
  saveChoicesToStorage();

  if (hasDom) {
    document.querySelectorAll<HTMLElement>('.booklet-question').forEach(card => {
      card.dataset.userMark = '';
      delete card.dataset.userStatus;
    });

    document.querySelectorAll('.optical-choice-row').forEach(el => {
      el.classList.remove('marked', 'marked-correct', 'marked-incorrect', 'revealed-correct');
    });
  }
}

/** Tek bir sorunun doğru cevabını gösterir veya gizler. */
export function toggleSingleAnswerReveal(qid: number, sourceEl?: HTMLElement | null): void {
  const q = state.allData.find(item => item.id === qid);
  if (q && q.sekilli) return;

  const wasRevealed = state.revealedAnswers.has(qid);
  const isNowRevealed = store.toggleAnswerReveal(qid);
  if (!isNowRevealed) {
    hideAnswerExplanationBubble();
  }

  const correctLetter = q ? q.dogru_cevap : null;

  getQuestionCards(qid).forEach(card => {
    card.dataset.revealed = isNowRevealed ? 'true' : 'false';
    getCardActionElements(card, 'toggle-answer-reveal').forEach(eyeBtn => {
      eyeBtn.classList.toggle('revealed', isNowRevealed);
    });
    const bannerEl = getCardAnswerBanner(card);
    if (bannerEl) bannerEl.style.display = isNowRevealed ? 'flex' : 'none';
    if (correctLetter) {
      getCardChoiceRow(card, correctLetter)?.classList.toggle('revealed-correct', isNowRevealed);
    }
  });

  if (correctLetter && !wasRevealed && q && q.dogru_nedeni) {
    const activeCard = getActiveQuestionCard(qid, sourceEl);
    const targetOpt = activeCard ? getCardChoiceRow(activeCard, correctLetter) : null;
    if (targetOpt) showAnswerExplanationBubble(qid, targetOpt);
  }
}

/** Pusula / ipucu gösterip gizler. */
export function toggleSingleHint(qid: number): void {
  const isNowRevealed = store.toggleHintReveal(qid);

  getQuestionCards(qid).forEach(card => {
    getCardActionElements(card, 'toggle-question-hint').forEach(compassBtn => {
      compassBtn.classList.toggle('hint-revealed', isNowRevealed);
    });
    card.querySelectorAll<HTMLElement>('[data-role="question-hint"]').forEach(hintEl => {
      hintEl.style.display = isNowRevealed ? 'flex' : 'none';
    });
  });
}

/** Sayfa altındaki cevap anahtarı şeridini açar veya kapatır. */
export function togglePageKey(pageNum?: number): void {
  const strip = pageNum
    ? (document.getElementById(`pageBottomKey_${pageNum}`) || document.getElementById('pageBottomKey'))
    : document.getElementById('pageBottomKey');
  const lbl = pageNum
    ? (document.getElementById(`lblPageKey_${pageNum}`) || document.getElementById('lblPageKey'))
    : document.getElementById('lblPageKey');
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
