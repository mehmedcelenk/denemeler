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

  // Hedef element: Şık satırı verilmişse içindeki optik harf dairesini (.optical-bubble) seç
  let el: HTMLElement | null = targetEl || null;
  if (el && !el.classList.contains('optical-bubble')) {
    el = el.querySelector<HTMLElement>('.optical-bubble') || el;
  }
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
  bubble.innerHTML = `<span>${escapeHtml(q.dogru_nedeni)}</span>`;

  document.body.appendChild(bubble);
  activeExplanationEl = bubble;

  // Konumlandırma: Dikeyde şıkkın üstü (veya altı)
  const rect = el.getBoundingClientRect();
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  let top = rect.top + scrollTop;
  const targetCenterX = rect.left + scrollLeft + (rect.width / 2);

  if (rect.top < 70) {
    bubble.classList.add('bubble-below');
    top = rect.bottom + scrollTop;
  }

  bubble.style.top = top + 'px';

  // Yatay Kapsayıcı Sınırları (Sütun ve Soru Kartı Düzeyinde Taşma Önleme):
  const questionCard = el.closest<HTMLElement>('.booklet-question');
  const pageContainer = el.closest<HTMLElement>('.booklet-page') || document.body;

  // Sınır olarak soru kartı veya sayfa sütun genişliğini baz al
  const containerRect = questionCard
    ? questionCard.getBoundingClientRect()
    : pageContainer.getBoundingClientRect();

  const containerLeft = containerRect.left + scrollLeft;
  const containerRight = containerRect.right + scrollLeft;
  const containerWidth = containerRect.width;

  // Balon genişliği kart/sütun genişliğine dinamik uyarlansın (karttan asla geniş olamaz)
  const maxAllowedWidth = Math.min(380, Math.max(220, containerWidth - 8));
  bubble.style.maxWidth = `${maxAllowedWidth}px`;
  bubble.style.width = 'max-content';

  // Boyut ölçümü
  const bubbleRect = bubble.getBoundingClientRect();

  // Varsayılan olarak oku sol köşeye yakın tut (ABCD dairesinin üzerine)
  let bubbleLeft = targetCenterX - 24;

  // Sağ sınır kontrolü (Soru kartının veya sütunun sağına taşamaz)
  if (bubbleLeft + bubbleRect.width > containerRight - 4) {
    bubbleLeft = containerRight - 4 - bubbleRect.width;
  }

  // Sol sınır kontrolü (Soru kartının veya sütunun soluna taşamaz)
  if (bubbleLeft < containerLeft + 4) {
    bubbleLeft = containerLeft + 4;
  }

  bubble.style.left = `${bubbleLeft}px`;

  // Sivri okun (arrow) balon üzerindeki yerini doğrudan ABCD dairesinin merkezine kilitle
  const arrowPos = Math.max(14, Math.min(bubbleRect.width - 14, targetCenterX - bubbleLeft));
  bubble.style.setProperty('--arrow-left', `${arrowPos}px`);

  // Süre: 13.5 saniye (3 katı)
  activeExplanationTimeout = setTimeout(() => {
    bubble.style.animation = 'explanationBubblePopOut 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    setTimeout(() => {
      hideAnswerExplanationBubble();
    }, 180);
  }, 13500);
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
    if (
      activeExplanationEl &&
      !target.closest('.answer-explanation-bubble') &&
      !target.closest('.optical-choice-row') &&
      !target.closest('[id^="btnEye_"]') &&
      !target.closest('.btn-conf-opt')
    ) {
      hideAnswerExplanationBubble();
    }
  });
}
