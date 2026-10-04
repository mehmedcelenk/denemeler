import { state } from '../../app/state.ts';
import { escapeHtml } from '../../shared/escape.ts';
import { MEB_TRAPS_DICT } from '../english/vocabulary.js';
import { renderFormulaNoteBanner } from '../formulas/formula-modal.ts';
import type { Question } from '../../data/question.ts';

const lucideTrapSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;

/** Soru kartının ipucu, formül, tuzak ve cevap anahtarı afişlerini üretir. */
export function renderCardBanners(q: Question, isPassive: boolean): string {
  const userMark = state.userMarkedChoices[q.id];
  const isRevealed = state.revealedAnswers.has(q.id);
  const isRematchOrMistakes = (state.bookletFilterMode === 'incorrect' || (state.isLibraryMode && state.libraryTab === 'rematch'));
  const isWrongAnswered = Boolean(userMark && userMark !== q.dogru_cevap && !isRematchOrMistakes);
  const bannerDisplay = (isRevealed || isWrongAnswered) ? 'flex' : 'none';

  const isHintRevealed = state.revealedHints.has(q.id);
  const hintDisplay = isHintRevealed ? 'flex' : 'none';

  const topicLabel = (q.ana_konu && q.alt_konu && q.ana_konu !== q.alt_konu)
    ? `${escapeHtml(q.ana_konu)} <span class="topic-slash">/</span> ${escapeHtml(q.alt_konu)}`
    : escapeHtml(q.alt_konu || q.ana_konu || '');

  const hintHtml = (q.ipucu && !isPassive) ? `
    <div class="single-hint-banner" id="hint_${q.id}" style="display:${hintDisplay};">
      <div class="hint-header">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
        <span>PUSULA • İPUCU</span>
      </div>
      <div class="hint-content">${escapeHtml(q.ipucu)}</div>
    </div>
  ` : '';

  const formulaBannerHtml = renderFormulaNoteBanner(q.id, q.soru, q.alt_konu || q.ana_konu || '');

  const isEnglish = (state.currentSubject === 'ING') || Boolean(q.ders && q.ders.includes('İNGİLİZCE'));
  const traps = MEB_TRAPS_DICT as Record<string, { title: string; trap_type: string; explanation: string } | undefined>;
  const trapInfo = isEnglish ? (traps[String(q.id)] || null) : null;
  const trapBannerHtml = trapInfo ? `
    <div class="single-trap-banner" id="trap_${q.id}" style="display:none;">
      <div class="trap-header">
        ${lucideTrapSvg}
        <span>${escapeHtml(trapInfo.title)} (${escapeHtml(trapInfo.trap_type)})</span>
      </div>
      <div class="trap-content">${escapeHtml(trapInfo.explanation)}</div>
    </div>
  ` : '';

  const answerBannerHtml = `
    <div class="single-answer-banner" id="banner_${q.id}" style="display:${bannerDisplay};">
      <span>Doğru Cevap: <strong style="color:var(--brand-accent); font-size:13px;">${q.dogru_cevap}</strong></span>
      <span style="opacity:0.85; font-size:10.5px;">${topicLabel}</span>
    </div>
  `;

  return `${hintHtml}${formulaBannerHtml}${trapBannerHtml}${answerBannerHtml}`;
}
