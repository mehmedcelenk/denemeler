import { state, store, onStateChange } from '../../app/state.ts';
import { showAnswerExplanationBubble, hideAnswerExplanationBubble } from './explanation.ts';
import { saveChoicesToStorage, loadSavedChoices } from './storage.ts';
import { recordAnswerForCombo } from '../gamification/combo-toast.ts';
import { addStreakPoints, resetOrDeductStreak } from '../gamification/streak.ts';
import { addToRematch, removeFromRematch } from '../library/library-model.ts';
import { roomService } from '../classroom/room-service.ts';
import type { Choice } from '../../data/question.ts';

export { saveChoicesToStorage, loadSavedChoices };

/** Soru için geçici seçilen (taslak) şık */
const pendingSelections: Record<number, Choice> = {};

/** Optik şık baloncuğuna tıklama eylemini yönetir. */
export function handleSelectOpticalBubble(qid: number, letter: Choice): void {
  const targetQ = state.allData.find(x => x.id === qid);
  if (targetQ && targetQ.sekilli) return; // Görselli/şekilli soru pasif, tıklanamaz

  const alreadySubmitted = state.userMarkedChoices[qid];

  // 1. Zaten nihai cevap verilmişse ve aynı şıkka tıklandıysa: Cevabı iptal et / sil
  if (alreadySubmitted === letter) {
    store.removeUserMarkedChoice(qid);
    delete pendingSelections[qid];
    saveChoicesToStorage();
    roomService.revokeStudentAnswer(qid);
    if (typeof document !== 'undefined') {
      document.querySelectorAll<HTMLElement>(`[data-qid="${qid}"]`).forEach(card => {
        card.dataset.userMark = '';
      });
      (['A', 'B', 'C', 'D', 'E'] as Choice[]).forEach(l => {
        document.querySelectorAll(`#opt_${qid}_${l}`).forEach(row => {
          row.classList.remove('marked', 'marked-correct', 'marked-incorrect', 'revealed-correct');
        });
      });
      document.querySelectorAll(`#banner_${qid}`).forEach(bannerEl => {
        (bannerEl as HTMLElement).style.display = 'none';
      });
    }
    hideAnswerExplanationBubble();
    return;
  }

  // 2. Henüz nihai cevap verilmemişse veya başka bir şık seçilmek isteniyorsa:
  const pending = pendingSelections[qid];

  if (pending === letter) {
    // İkinci kez aynı şıkka tıklandı -> Nihai olarak cevapla (confirm)
    delete pendingSelections[qid];
    applyFinalChoice(qid, letter);
  } else {
    // İlk tıklama (veya farklı bir şıkka geçiş) -> Sadece moda göre seçili göster (marked)
    pendingSelections[qid] = letter;
    if (typeof document !== 'undefined') {
      document.querySelectorAll<HTMLElement>(`[data-qid="${qid}"]`).forEach(card => {
        card.dataset.userMark = letter;
      });
      (['A', 'B', 'C', 'D', 'E'] as Choice[]).forEach(l => {
        document.querySelectorAll(`#opt_${qid}_${l}`).forEach(row => {
          row.classList.remove('marked', 'marked-correct', 'marked-incorrect', 'revealed-correct');
          if (l === letter) {
            row.classList.add('marked');
          }
        });
      });
      document.querySelectorAll<HTMLElement>(`#banner_${qid}`).forEach(bannerEl => {
        if (!state.revealedAnswers.has(qid)) {
          bannerEl.style.display = 'none';
        }
      });
    }
  }
}

/** Nihai cevabı işler ve UI'yi günceller */
function applyFinalChoice(qid: number, choice: Choice): void {
  store.setUserMarkedChoice(qid, choice);
  saveChoicesToStorage();

  const q = state.bookletQuestions.find(item => item.id === qid)
    || state.allData.find(item => item.id === qid);

  if (q) {
    const isCorrect = (choice === q.dogru_cevap);
    recordAnswerForCombo(isCorrect);
    roomService.logStudentAnswer(qid, isCorrect);

    if (isCorrect) {
      addStreakPoints(1);
      if (state.rematchQuestionIds.has(qid)) {
        removeFromRematch(qid);
      }
    } else {
      resetOrDeductStreak(1);
      addToRematch(qid);
    }
  }

  updateQuestionMarkUI(qid, choice);
}

export function updateQuestionMarkUI(questionId: number, choice: Choice): void {
  if (typeof document === 'undefined') return;

  const q = state.bookletQuestions.find(item => item.id === questionId)
    || state.allData.find(item => item.id === questionId);
  const correctChoice = q ? q.dogru_cevap : null;
  const isCorrect = (correctChoice && choice === correctChoice);

  document.querySelectorAll<HTMLElement>(`[data-qid="${questionId}"]`).forEach(card => {
    card.dataset.userMark = choice;
    card.dataset.userStatus = isCorrect ? 'correct' : 'incorrect';
  });

  (['A', 'B', 'C', 'D', 'E'] as Choice[]).forEach(letter => {
    document.querySelectorAll(`#opt_${questionId}_${letter}`).forEach(row => {
      row.classList.remove('marked', 'marked-correct', 'marked-incorrect', 'revealed-correct');

      if (letter === choice) {
        row.classList.add('marked');
        if (isCorrect) {
          row.classList.add('marked-correct');
        } else {
          row.classList.add('marked-incorrect');
        }
      } else if (!isCorrect && letter === correctChoice) {
        row.classList.add('revealed-correct');
      }
    });
  });

  // Doğru da yapılsa yanlış da yapılsa doğru şıkkın üzerine açıklama toast'ı aç
  if (q && q.dogru_nedeni) {
    const targetOpt = document.querySelector<HTMLElement>(`#opt_${questionId}_${correctChoice}`)
      || document.querySelector<HTMLElement>(`#opt_${questionId}_${choice}`);
    showAnswerExplanationBubble(questionId, targetOpt);
  }
}

/** Tüm işaretlemeleri temizler. */
export function clearAllMarks(): void {
  for (const key of Object.keys(pendingSelections)) {
    delete pendingSelections[Number(key)];
  }
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
export function toggleSingleAnswerReveal(qid: number): void {
  const q = state.allData.find(item => item.id === qid);
  if (q && q.sekilli) return;

  const wasRevealed = state.revealedAnswers.has(qid);
  const isNowRevealed = store.toggleAnswerReveal(qid);
  if (!isNowRevealed) {
    hideAnswerExplanationBubble();
  }

  const correctLetter = q ? q.dogru_cevap : null;

  document.querySelectorAll<HTMLElement>(`[data-qid="${qid}"]`).forEach(card => {
    card.dataset.revealed = isNowRevealed ? 'true' : 'false';
  });

  document.querySelectorAll(`#btnEye_${qid}`).forEach(eyeBtn => {
    eyeBtn.classList.toggle('revealed', isNowRevealed);
  });
  document.querySelectorAll(`#banner_${qid}`).forEach(bannerEl => {
    (bannerEl as HTMLElement).style.display = isNowRevealed ? 'flex' : 'none';
  });

  if (correctLetter) {
    document.querySelectorAll(`#opt_${qid}_${correctLetter}`).forEach(correctRow => {
      correctRow.classList.toggle('revealed-correct', isNowRevealed);
    });

    if (!wasRevealed && q && q.dogru_nedeni) {
      const targetOpt = document.querySelector(`#opt_${qid}_${correctLetter}`) as HTMLElement | null;
      if (targetOpt) showAnswerExplanationBubble(qid, targetOpt);
    }
  }
}

/** Pusula / ipucu gösterip gizler. */
export function toggleSingleHint(qid: number): void {
  const isNowRevealed = store.toggleHintReveal(qid);

  document.querySelectorAll(`#btnCompass_${qid}`).forEach(compassBtn => {
    compassBtn.classList.toggle('hint-revealed', isNowRevealed);
  });
  document.querySelectorAll(`#hint_${qid}`).forEach(hintEl => {
    (hintEl as HTMLElement).style.display = isNowRevealed ? 'flex' : 'none';
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
