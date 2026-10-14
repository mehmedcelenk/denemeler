import { escapeHtml } from '../../shared/escape.ts';
import { state } from '../../app/state.ts';

let activeExplanationEl: HTMLElement | null = null;
let activeExplanationTimeout: ReturnType<typeof setTimeout> | null = null;
let activeTargetEl: HTMLElement | null = null;

/**
 * Sorunun doğru şıkkına veya hedeflenen elemente sivri uçlu açıklama baloncuğu açar.
 * İngilizce vocab-bubble mantığıyla %100 birebir aynı çalışır.
 */
export function showAnswerExplanationBubble(qid: number, targetEl?: HTMLElement | null): void {
  hideAnswerExplanationBubble();

  const q = state.bookletQuestions.find(item => item.id === qid)
    || state.allData.find(item => item.id === qid);
  if (!q || !q.dogru_nedeni) return;

  // Hedef element belirtilmemişse doğru cevabın şık satırını veya optik balonunu bul
  let el = targetEl;
  if (!el && q.dogru_cevap) {
    el = document.querySelector<HTMLElement>(`#opt_${qid}_${q.dogru_cevap} .optical-bubble`)
      || document.querySelector<HTMLElement>(`#opt_${qid}_${q.dogru_cevap}`);
  }
  if (!el) {
    el = document.querySelector<HTMLElement>(`#bq_${qid}`);
  }
  if (!el) return;

  activeTargetEl = el;

  const bubble = document.createElement('div');
  bubble.id = 'activeExplanationBubble';
  bubble.className = 'answer-explanation-bubble';

  // "Neden doğru?" başlığı olmadan, sadece doğrudan açıklama metni
  bubble.innerHTML = `<span>${escapeHtml(q.dogru_nedeni)}</span>`;

  document.body.appendChild(bubble);
  activeExplanationEl = bubble;

  // İngilizce vocabulary.js konumlandırmasının 100% aynısı
  const rect = el.getBoundingClientRect();
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  let top = rect.top + scrollTop;
  let left = rect.left + scrollLeft + (rect.width / 2);

  if (rect.top < 65) {
    bubble.classList.add('bubble-below');
    top = rect.bottom + scrollTop;
  }

  bubble.style.top = top + 'px';
  bubble.style.left = left + 'px';

  const bubbleRect = bubble.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
  const halfWidth = bubbleRect.width / 2;
  let adjustedLeft = left;
  if (adjustedLeft - halfWidth < 12) {
    adjustedLeft = 12 + halfWidth;
  } else if (adjustedLeft + halfWidth > viewportWidth - 12) {
    adjustedLeft = viewportWidth - 12 - halfWidth;
  }
  bubble.style.left = adjustedLeft + 'px';

  activeExplanationTimeout = setTimeout(() => {
    bubble.style.animation = 'vocabPopOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => {
      hideAnswerExplanationBubble();
    }, 180);
  }, 4500);
}

export function hideAnswerExplanationBubble(): void {
  if (activeExplanationTimeout) {
    clearTimeout(activeExplanationTimeout);
    activeExplanationTimeout = null;
  }
  if (activeExplanationEl) {
    activeExplanationEl.remove();
    activeExplanationEl = null;
  }
  activeTargetEl = null;
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (activeExplanationEl && !target.closest('.answer-explanation-bubble')) {
      hideAnswerExplanationBubble();
    }
  });
}
