import { getFormulasForQuestion } from './formula-dict.ts';
import { getActiveQuestionCard, getCardActionElements, getQuestionCards } from '../booklet/card-query.ts';
import { renderMathFormula } from '../../shared/math-render.ts';
import { escapeHtml } from '../../shared/escape.ts';

/**
 * Sorunun formül notu banner'ını açar / kapatır.
 */
export function toggleFormulaNote(questionId: number, event?: Event, sourceEl?: HTMLElement): void {
  if (event) event.stopPropagation();
  if (typeof document === 'undefined') return;

  const targetEl = sourceEl || (event?.currentTarget instanceof HTMLElement ? event.currentTarget : null);
  const activeCard = getActiveQuestionCard(questionId, targetEl);
  const cards = getQuestionCards(questionId);
  const refBanner = activeCard?.querySelector<HTMLElement>('[data-role="formula-banner"]')
    || cards[0]?.querySelector<HTMLElement>('[data-role="formula-banner"]');
  if (!refBanner) return;

  const shouldShow = refBanner.style.display === 'none' || !refBanner.style.display;
  cards.forEach(card => {
    const banner = card.querySelector<HTMLElement>('[data-role="formula-banner"]');
    if (banner) banner.style.display = shouldShow ? 'flex' : 'none';
    getCardActionElements(card, 'toggle-formula-note').forEach(btn => {
      btn.classList.toggle('formula-active', shouldShow);
    });
  });
}

/**
 * Bir soru için formül notu HTML çıktısını üretir.
 */
export function renderFormulaNoteBanner(questionId: number, stem: string, topic: string): string {
  const cards = getFormulasForQuestion(stem, topic);
  if (cards.length === 0) return '';

  const cardsHtml = cards.map(card => {
    const renderedLatex = renderMathFormula(card.latex, true);
    return `
      <div class="formula-card-item">
        <div class="formula-card-title">📐 ${escapeHtml(card.title)}</div>
        <div class="formula-card-math">${renderedLatex}</div>
        <div class="formula-card-desc">${escapeHtml(card.explanation)}</div>
      </div>
    `;
  }).join('');

  return `
    <div class="single-formula-banner" data-role="formula-banner" style="display:none;">
      <div class="formula-banner-header">
        <div class="formula-header-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <span>FORMÜL PUSULASI & NOT</span>
        </div>
        <button class="btn-formula-close" onclick="toggleFormulaNote(${questionId}, event, this)" title="Kapat">✕</button>
      </div>
      <div class="formula-banner-body">
        ${cardsHtml}
      </div>
    </div>
  `;
}
