import { getFormulasForQuestion } from './formula-dict.ts';
import { renderMathFormula } from '../../shared/math-render.ts';
import { escapeHtml } from '../../shared/escape.ts';

/**
 * Sorunun formül notu banner'ını açar / kapatır.
 */
export function toggleFormulaNote(questionId: number, event?: Event): void {
  if (event) event.stopPropagation();

  const banner = document.getElementById(`formulaBanner_${questionId}`);
  const btn = document.getElementById(`btnFormula_${questionId}`);
  if (!banner) return;

  const isHidden = banner.style.display === 'none' || !banner.style.display;
  if (isHidden) {
    banner.style.display = 'flex';
    if (btn) btn.classList.add('formula-active');
  } else {
    banner.style.display = 'none';
    if (btn) btn.classList.remove('formula-active');
  }
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
    <div class="single-formula-banner" id="formulaBanner_${questionId}" style="display:none;">
      <div class="formula-banner-header">
        <div class="formula-header-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <span>FORMÜL PUSULASI & NOT</span>
        </div>
        <button class="btn-formula-close" onclick="toggleFormulaNote(${questionId}, event)" title="Kapat">✕</button>
      </div>
      <div class="formula-banner-body">
        ${cardsHtml}
      </div>
    </div>
  `;
}
