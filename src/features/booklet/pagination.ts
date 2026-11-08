import { notifyStateChange } from '../../app/state.ts';
import type { Question } from '../../data/question.ts';
import { getBookletCard } from './card-query.ts';
import { renderQuestionCardHtml } from './question-card.ts';

export const BOOKLET_CHUNK_SIZE = 20;

let currentQuestions: readonly Question[] = [];
let renderedCount = 0;
let sessionToken = 0;
let activeObserver: IntersectionObserver | null = null;

export function disconnectBookletPagination(): void {
  if (activeObserver) {
    activeObserver.disconnect();
    activeObserver = null;
  }
}

export function getRenderedQuestionCount(): number {
  return renderedCount;
}

function buildChunkHtml(questions: readonly Question[], startIdx: number, endIdx: number): string {
  let html = '';
  for (let idx = startIdx; idx < endIdx; idx++) {
    html += renderQuestionCardHtml(questions[idx], idx + 1);
  }
  return html;
}

function appendRange(startIdx: number, endIdx: number): void {
  const bodyEl = document.getElementById('bookletQuestionBody_1');
  if (!bodyEl || endIdx <= startIdx) return;

  const prevChildrenCount = bodyEl.children.length;
  const chunkHtml = buildChunkHtml(currentQuestions, startIdx, endIdx);
  bodyEl.insertAdjacentHTML('beforeend', chunkHtml);
  renderedCount = endIdx;

  const appendedCards = Array.from(bodyEl.children)
    .slice(prevChildrenCount)
    .filter((el): el is HTMLElement => el instanceof HTMLElement && el.classList.contains('booklet-question'));
  if (appendedCards.length > 0) {
    notifyStateChange('booklet:rendered', { cards: appendedCards });
  }

  const sentinelEl = document.getElementById('bookletLoadSentinel');
  if (renderedCount >= currentQuestions.length) {
    disconnectBookletPagination();
    sentinelEl?.remove();
  } else if (sentinelEl) {
    sentinelEl.textContent = `Diğer sorular yükleniyor (${renderedCount} / ${currentQuestions.length})…`;
  }
}

function appendNextChunk(token: number): void {
  if (token !== sessionToken) return;
  if (renderedCount >= currentQuestions.length) {
    disconnectBookletPagination();
    document.getElementById('bookletLoadSentinel')?.remove();
    return;
  }

  const nextEnd = Math.min(currentQuestions.length, renderedCount + BOOKLET_CHUNK_SIZE);
  appendRange(renderedCount, nextEnd);

  const sentinelEl = document.getElementById('bookletLoadSentinel');
  if (sentinelEl && renderedCount < currentQuestions.length && typeof window !== 'undefined') {
    const rect = sentinelEl.getBoundingClientRect();
    if (rect.top <= window.innerHeight + 400) {
      window.requestAnimationFrame(() => appendNextChunk(token));
    }
  }
}

export function mountPaginatedBooklet(
  questions: readonly Question[],
  bodyEl: HTMLElement,
  sentinelEl: HTMLElement | null,
  targetQuestionId: number | null = null,
): void {
  disconnectBookletPagination();
  sessionToken += 1;
  const token = sessionToken;
  currentQuestions = questions;

  let initialCount = Math.min(BOOKLET_CHUNK_SIZE, questions.length);
  if (targetQuestionId !== null && targetQuestionId !== undefined) {
    const targetIdx = questions.findIndex(q => q.id === Number(targetQuestionId));
    if (targetIdx !== -1) {
      initialCount = Math.min(
        questions.length,
        Math.max(BOOKLET_CHUNK_SIZE, Math.ceil((targetIdx + 1) / BOOKLET_CHUNK_SIZE) * BOOKLET_CHUNK_SIZE),
      );
    }
  }

  bodyEl.innerHTML = buildChunkHtml(questions, 0, initialCount);
  renderedCount = initialCount;

  const initialCards = Array.from(bodyEl.querySelectorAll<HTMLElement>('.booklet-question'));
  if (initialCards.length > 0) {
    notifyStateChange('booklet:rendered', { cards: initialCards });
  }

  if (renderedCount >= questions.length) {
    sentinelEl?.remove();
    return;
  }

  if (!sentinelEl) return;
  sentinelEl.textContent = `Diğer sorular yükleniyor (${renderedCount} / ${questions.length})…`;
  sentinelEl.onclick = () => appendNextChunk(token);

  if (typeof IntersectionObserver !== 'undefined') {
    activeObserver = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          appendNextChunk(token);
        }
      },
      { root: null, rootMargin: '400px 0px', threshold: 0 },
    );
    activeObserver.observe(sentinelEl);
  }
}

export function ensureQuestionRendered(qid: number): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const existing = getBookletCard(qid);
  if (existing) return existing;

  const targetIdx = currentQuestions.findIndex(q => q.id === qid);
  if (targetIdx === -1) return null;

  if (targetIdx >= renderedCount) {
    const targetEnd = Math.min(
      currentQuestions.length,
      Math.ceil((targetIdx + 1) / BOOKLET_CHUNK_SIZE) * BOOKLET_CHUNK_SIZE,
    );
    appendRange(renderedCount, targetEnd);
  }
  return getBookletCard(qid);
}

export function renderAllRemainingQuestions(): void {
  if (typeof document === 'undefined') return;
  if (renderedCount < currentQuestions.length) {
    appendRange(renderedCount, currentQuestions.length);
  } else {
    disconnectBookletPagination();
    document.getElementById('bookletLoadSentinel')?.remove();
  }
}
