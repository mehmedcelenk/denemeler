import { state } from '../../app/state.ts';
import { toggleStarQuestion, addToRematch, saveLibraryToStorage } from './library-model.ts';
import { toggleSingleAnswerReveal } from '../answers/reveal.js';

export function toggleStarQuestionUI(questionId: number, event?: Event): void {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  toggleStarQuestion(questionId);

  if (typeof document === 'undefined') return;

  const isStarred = state.starredQuestionIds.has(questionId);
  document.querySelectorAll(`#btnStar_${questionId}`).forEach(btn => {
    btn.classList.toggle('is-starred', isStarred);
    btn.setAttribute('title', isStarred ? 'Yıldızı Kaldır' : 'Soruyu Yıldızla (Favorilere Ekle)');
  });

  const starredCountEl = document.getElementById('libStarredCount');
  if (starredCountEl) {
    starredCountEl.textContent = String(state.starredQuestionIds.size);
  }
}

export function handleRematchDontKnow(questionId: number): void {
  addToRematch(questionId);
  saveLibraryToStorage();
  toggleSingleAnswerReveal(questionId);

  if (typeof document === 'undefined') return;
  const qContainer = document.getElementById(`bq_${questionId}`);
  if (qContainer) {
    qContainer.classList.add('rematch-acknowledged');
  }
}

