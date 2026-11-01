import { state, notifyStateChange } from '../../app/state.ts';
import { toggleStarQuestion, addToRematch, saveLibraryToStorage } from './library-model.ts';

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
    const label = isStarred ? 'Kaydı Kaldır' : 'Soruyu Kaydet';
    btn.setAttribute('title', label);
    btn.setAttribute('aria-label', label);
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

  if (typeof document === 'undefined') return;
  const qContainer = document.getElementById(`bq_${questionId}`);
  if (qContainer) {
    qContainer.classList.add('rematch-acknowledged');
  }
}

