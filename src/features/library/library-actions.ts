import { state, notifyStateChange } from '../../app/state.ts';
import { getCardActionElements, getQuestionCards } from '../booklet/card-query.ts';
import { toggleStarQuestion, addToRematch, saveLibraryToStorage } from './library-model.ts';

export function toggleStarQuestionUI(questionId: number, event?: Event): void {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }
  toggleStarQuestion(questionId);

  if (typeof document === 'undefined') return;

  const isStarred = state.starredQuestionIds.has(questionId);
  const label = isStarred ? 'Kaydı Kaldır' : 'Soruyu Kaydet';
  getQuestionCards(questionId).forEach(card => {
    getCardActionElements(card, 'toggle-star-question').forEach(btn => {
      btn.classList.toggle('is-starred', isStarred);
      btn.setAttribute('title', label);
      btn.setAttribute('aria-label', label);
    });
  });

  const starredCountEl = document.getElementById('libStarredCount');
  if (starredCountEl) {
    starredCountEl.textContent = String(state.starredQuestionIds.size);
  }
}

export function handleRematchDontKnow(questionId: number): void {
  addToRematch(questionId);
  saveLibraryToStorage();
  notifyStateChange('answer:reveal', { questionId });

  getQuestionCards(questionId).forEach(card => {
    card.classList.add('rematch-acknowledged');
  });
}

