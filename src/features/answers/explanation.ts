import { escapeHtml } from '../../shared/escape.ts';
import { state } from '../../app/state.ts';

let activeExplanationEl: HTMLElement | null = null;
let activeExplanationTimeout: ReturnType<typeof setTimeout> | null = null;

export function showAnswerExplanationBubble(qid: number, triggerEl: HTMLElement, event?: Event): void {
  if (event) {
    event.stopPropagation();
    event.preventDefault();
  }

  hideAnswerExplanationBubble();

  const q = state.bookletQuestions.find(item => item.id === qid)
    || state.allData.find(item => item.id === qid);
  if (!q || !q.dogru_nedeni) return;

  const bubble = document.createElement('div');
  bubble.id = 'activeExplanationBubble';
  bubble.className = 'answer-explanation-bubble';

  bubble.innerHTML = `
    <div class="explanation-bubble-header">
      <span class="explanation-bubble-icon">💡</span>
      <span class="explanation-bubble-title">Neden Doğru?</span>
      <button class="explanation-bubble-close" onclick="hideAnswerExplanationBubble(event)" title="Kapat">✕</button>
    </div>
    <div class="explanation-bubble-body">${escapeHtml(q.dogru_nedeni)}</div>
  `;

  document.body.appendChild(bubble);
  activeExplanationEl = bubble;

  positionExplanationBubble(triggerEl, bubble);

  activeExplanationTimeout = setTimeout(() => {
    hideAnswerExplanationBubble();
  }, 12000);
}

export function hideAnswerExplanationBubble(_event?: Event): void {
  if (activeExplanationTimeout) {
    clearTimeout(activeExplanationTimeout);
    activeExplanationTimeout = null;
  }
  if (activeExplanationEl) {
    activeExplanationEl.remove();
    activeExplanationEl = null;
  }
}

function positionExplanationBubble(triggerEl: HTMLElement, bubbleEl: HTMLElement): void {
  const rect = triggerEl.getBoundingClientRect();
  const bubbleRect = bubbleEl.getBoundingClientRect();

  let left = rect.left + (rect.width / 2) - (bubbleRect.width / 2);
  let top = rect.bottom + 8;

  if (left < 14) left = 14;
  if (left + bubbleRect.width > window.innerWidth - 14) {
    left = window.innerWidth - bubbleRect.width - 14;
  }

  if (top + bubbleRect.height > window.innerHeight - 14) {
    top = rect.top - bubbleRect.height - 8;
    if (top < 14) top = 14;
    bubbleEl.classList.add('bubble-above');
  }

  bubbleEl.style.position = 'fixed';
  bubbleEl.style.left = `${left}px`;
  bubbleEl.style.top = `${top}px`;
  bubbleEl.style.zIndex = '99999';
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('.btn-why-correct, .answer-explanation-bubble')) {
      return;
    }
    hideAnswerExplanationBubble();
  });
}

