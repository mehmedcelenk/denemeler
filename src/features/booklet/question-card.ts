import { state, onStateChange } from '../../app/state.ts';
import { escapeHtml } from '../../shared/escape.ts';
import { renderMathText } from '../../shared/math-render.ts';
import { enrichTurkishSentenceXray } from '../tde/cumle-xray.ts';
import { enrichEnglishVocab, MEB_TRAPS_DICT } from '../english/vocabulary.js';
import { renderFormulaNoteBanner } from '../formulas/formula-modal.ts';
import { renderCardHeader, renderCardSourceTag } from './card-header.ts';
import type { Question, Choice } from '../../data/question.ts';

const lucideTrapSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;

/** Soru kökünü dersin türüne göre (İngilizce sözlük, TDE röntgen, KaTeX matematik) zenginleştirir. */
export function renderCardStem(q: Question): string {
  const isEnglish = (state.currentSubject === 'ING') || Boolean(q.ders && q.ders.includes('İNGİLİZCE'));
  const isMath = (state.currentSubject === 'MAT') || Boolean(q.ders && q.ders.includes('MATEMATİK'));
  const isTde = (state.currentSubject === 'TDE') || Boolean(q.ders && q.ders.includes('TÜRK DİLİ'));

  let renderedStemText: string;
  if (isEnglish) {
    renderedStemText = enrichEnglishVocab(q.soru_xray || q.soru);
  } else if (isTde) {
    renderedStemText = q.soru_xray || enrichTurkishSentenceXray(q.soru, q.id);
  } else if (isMath) {
    renderedStemText = renderMathText(q.soru);
  } else {
    renderedStemText = escapeHtml(q.soru);
  }

  return renderedStemText.trim();
}

/** Şekilli / pasif soru için bilgilendirme afişi üretir. */
export function renderSoonBanner(isPassive: boolean): string {
  if (!isPassive) return '';
  return `
    <div class="q-soon-banner">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>Bu soru şekil / görsel içerdiğinden geçici olarak çözüme kapatılmıştır (Yakında).</span>
    </div>
  `;
}

/** Soru için optik şık kartlarını ve durum sınıflarını üretir. */
export function renderCardOptions(q: Question, isPassive: boolean): string {
  const userMark = state.userMarkedChoices[q.id];
  const isRevealed = state.revealedAnswers.has(q.id);
  const isEnglish = (state.currentSubject === 'ING') || Boolean(q.ders && q.ders.includes('İNGİLİZCE'));
  const isMath = (state.currentSubject === 'MAT') || Boolean(q.ders && q.ders.includes('MATEMATİK'));

  const availableChoices: Choice[] = (q.secenekler && q.secenekler['E'])
    ? ['A', 'B', 'C', 'D', 'E']
    : ['A', 'B', 'C', 'D'];

  let optHtml = '';
  availableChoices.forEach(letter => {
    const optText = (q.secenekler && q.secenekler[letter]) || '';
    const isMarked = (userMark === letter);
    const isCorrect = (q.dogru_cevap === letter);
    const isUserCorrect = (userMark === q.dogru_cevap);

    let rowClass = 'optical-choice-row';
    const isRematchOrMistakes = (state.bookletFilterMode === 'incorrect' || (state.isLibraryMode && state.libraryTab === 'rematch'));

    if (isMarked) {
      rowClass += ' marked';
      if (!isRematchOrMistakes) {
        if (isUserCorrect) {
          rowClass += ' marked-correct';
        } else {
          rowClass += ' marked-incorrect';
        }
      }
    } else if (isRevealed && isCorrect) {
      rowClass += ' revealed-correct';
    }

    const clickHandler = isPassive ? '' : `onclick="handleSelectOpticalBubble(${q.id}, '${letter}')"`;
    const renderedOptContent = isMath
      ? renderMathText(optText)
      : isEnglish
        ? enrichEnglishVocab(optText)
        : escapeHtml(optText);

    optHtml += `
      <div class="${rowClass}" id="opt_${q.id}_${letter}" ${clickHandler}>
        <div class="optical-bubble">${letter}</div>
        <div class="choice-text-content">${renderedOptContent}</div>
      </div>
    `;
  });

  return optHtml;
}

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

/** Tek bir sorunun tam kitapçık kartı HTML'ini alt modülleri birleştirerek üretir. */
export function renderQuestionCardHtml(q: Question, globalIdx: number): string {
  const isPassive = !!q.sekilli;
  const questionClass = isPassive ? 'booklet-question is-passive-question' : 'booklet-question';

  return `
    <div class="${questionClass}" id="bq_${q.id}">
      ${renderCardHeader(q, globalIdx, isPassive)}
      ${renderSoonBanner(isPassive)}
      <div class="q-stem-text" id="stem_${q.id}">${renderCardStem(q)}</div>
      <div class="q-optical-options">
        ${renderCardOptions(q, isPassive)}
      </div>
      ${renderCardSourceTag(q)}
      ${renderCardBanners(q, isPassive)}
    </div>
  `;
}

// Akıllı Tahta (board-mode) için soru render olayı
onStateChange('board:render-question', (payload) => {
  const stage = document.getElementById('boardQuestionStage');
  if (stage && payload && typeof payload === 'object' && 'q' in payload) {
    const q = payload.q as Question;
    const currentNum = (payload as { currentNum?: number }).currentNum || 1;
    stage.innerHTML = renderQuestionCardHtml(q, currentNum);
  }
});
