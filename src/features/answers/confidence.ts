import { state, type Choice, type ConfidenceLevel } from '../../app/state.ts';
import { addStreakPoints, resetOrDeductStreak } from '../gamification/streak.ts';
import { addToRematch, removeFromRematch } from '../library/library-model.ts';
import { saveChoicesToStorage } from './storage.js';

let activeConfidencePrompt: { questionId: number; choice: Choice } | null = null;

export function promptConfidenceSelection(questionId: number, choice: Choice): void {
  // Eğer başka bir soru için açık picker varsa kapat ve varsayılanla tamamla
  if (activeConfidencePrompt && activeConfidencePrompt.questionId !== questionId) {
    cancelConfidencePrompt(activeConfidencePrompt.questionId);
  }

  activeConfidencePrompt = { questionId, choice };

  // Şıkkı sadece nötr seçim ('marked') olarak vurgula, henüz D-Y ve cevap bannerını GÖSTERME!
  if (typeof document !== 'undefined') {
    ['A', 'B', 'C', 'D'].forEach(letter => {
      document.querySelectorAll(`#opt_${questionId}_${letter}`).forEach(row => {
        row.classList.remove('marked', 'marked-correct', 'marked-incorrect', 'revealed-correct');
        if (letter === choice) {
          row.classList.add('marked');
        }
      });
    });
    document.querySelectorAll<HTMLElement>(`#banner_${questionId}`).forEach(bannerEl => {
      if (!state.revealedAnswers.has(questionId)) {
        bannerEl.style.display = 'none';
      }
    });
  }

  renderConfidencePickerUI(questionId, choice);
}

export function confirmConfidence(level: ConfidenceLevel): void {
  if (!activeConfidencePrompt) return;
  const { questionId, choice } = activeConfidencePrompt;
  activeConfidencePrompt = null;
  removeConfidencePickerUI(questionId);

  applyChoiceWithConfidence(questionId, choice, level);
}

export function cancelConfidencePrompt(questionId: number): void {
  if (activeConfidencePrompt && activeConfidencePrompt.questionId === questionId) {
    const { choice } = activeConfidencePrompt;
    activeConfidencePrompt = null;
    removeConfidencePickerUI(questionId);
    applyChoiceWithConfidence(questionId, choice, 'mid');
  } else {
    removeConfidencePickerUI(questionId);
  }
}

function applyChoiceWithConfidence(questionId: number, choice: Choice, confidence: ConfidenceLevel): void {
  state.undoHistoryStack.push({ ...state.userMarkedChoices });
  state.userMarkedChoices[questionId] = choice;
  state.userConfidences[questionId] = confidence;
  saveChoicesToStorage();

  const q = state.bookletQuestions.find(item => item.id === questionId)
    || state.allData.find(item => item.id === questionId);

  if (q) {
    const isCorrect = (choice === q.dogru_cevap);
    if (isCorrect) {
      if (confidence === 'high') {
        addStreakPoints(3);
      } else if (confidence === 'mid') {
        addStreakPoints(2);
      } else {
        addStreakPoints(1);
        addToRematch(questionId);
      }

      if (state.rematchQuestionIds.has(questionId) && confidence !== 'low') {
        removeFromRematch(questionId);
      }
    } else {
      resetOrDeductStreak(confidence === 'high' ? 2 : 1);
      addToRematch(questionId);
    }
  }

  updateQuestionMarkUI(questionId, choice);
}

function renderConfidencePickerUI(questionId: number, choice: Choice): void {
  if (typeof document === 'undefined') return;

  removeConfidencePickerUI(questionId);

  const qContainers = document.querySelectorAll(`#bq_${questionId}`);
  if (qContainers.length === 0) {
    activeConfidencePrompt = null;
    return;
  }

  qContainers.forEach(qContainer => {
    const picker = document.createElement('div');
    picker.className = `confidence-floating-picker confPicker_${questionId}`;
    picker.id = `confPicker_${questionId}`;
    picker.innerHTML = `
      <div class="conf-picker-title">
        <span>Cevabından emin misin?</span>
      </div>
      <div class="conf-picker-buttons">
        <button class="btn-conf-opt btn-conf-high" onclick="confirmConfidence('high')" title="Kesin Biliyorum (3x Damla)">
          <span>Eminim (+3)</span>
        </button>
        <button class="btn-conf-opt btn-conf-mid" onclick="confirmConfidence('mid')" title="Yarı Yarıya (2x Damla)">
          <span>Yarı Yarıya (+2)</span>
        </button>
        <button class="btn-conf-opt btn-conf-low" onclick="confirmConfidence('low')" title="Tahmin Ettim (Rövanşa Eklenir)">
          <span>Tahmin (+1)</span>
        </button>
      </div>
    `;

    const optionsContainer = qContainer.querySelector('.q-optical-options');
    if (optionsContainer) {
      optionsContainer.insertAdjacentElement('afterend', picker);
    } else {
      const optRow = qContainer.querySelector(`#opt_${questionId}_${choice}`);
      if (optRow) {
        optRow.insertAdjacentElement('afterend', picker);
      }
    }
  });
}

export function removeConfidencePickerUI(questionId: number): void {
  if (typeof document === 'undefined') return;
  document.querySelectorAll(`.confPicker_${questionId}`).forEach(el => el.remove());
}

export function updateQuestionMarkUI(questionId: number, choice: Choice): void {
  if (typeof document === 'undefined') return;

  const q = state.bookletQuestions.find(item => item.id === questionId)
    || state.allData.find(item => item.id === questionId);
  const correctChoice = q ? q.dogru_cevap : null;
  const isCorrect = (correctChoice && choice === correctChoice);

  ['A', 'B', 'C', 'D'].forEach(letter => {
    document.querySelectorAll(`#opt_${questionId}_${letter}`).forEach(row => {
      row.classList.remove('marked', 'marked-correct', 'marked-incorrect', 'revealed-correct');

      if (letter === choice) {
        row.classList.add('marked');
        if (isCorrect) {
          row.classList.add('marked-correct');
        } else {
          row.classList.add('marked-incorrect');
        }
      }
    });
  });

  const undoBtn = document.getElementById('btnUndoClear');
  if (undoBtn) undoBtn.style.opacity = '1';
}


