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

  // Dinamik Yatay Konumlandırma (Taşmayı %100 Engelleyen Çözüm):
  // Baloncuğun genişliğini al
  const bubbleRect = bubble.getBoundingClientRect();
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

  // Balon genişliği ekranı aşmasın
  const maxBubbleWidth = Math.min(380, viewportWidth - 24);
  bubble.style.maxWidth = `${maxBubbleWidth}px`;

  // Varsayılan olarak oku sol köşeye yakın hizala (ok = sol kenardan 24px)
  let bubbleLeft = targetCenterX - 24;

  // Eğer sağa taşıyorsa, balonu sola çek (ekranda sağdan 12px boşluk bırak)
  if (bubbleLeft + bubbleRect.width > viewportWidth - 12) {
    bubbleLeft = viewportWidth - 12 - bubbleRect.width;
  }

  // Eğer sola taşıyorsa, balonu sağa çek (ekranda soldan 12px boşluk bırak)
  if (bubbleLeft < 12) {
    bubbleLeft = 12;
  }

  bubble.style.left = `${bubbleLeft}px`;

  // Sivri okun (arrow) balon üzerindeki sol pozisyonunu doğrudan ABCD dairesinin merkezine kilitle
  // Okun balon sınırları dışına çıkmasını engelle (en az 12px, en çok balonGenisligi - 12px)
  const arrowPos = Math.max(12, Math.min(bubbleRect.width - 12, targetCenterX - bubbleLeft));
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
