import { state, onStateChange } from '../../app/state.ts';
import { getShortCourseName } from '../../data/subjects.js';
import { getCefrInfo } from '../english/levels.js';
import { getQuestionDifficulty } from '../../shared/difficulty.ts';
import { getFormulasForQuestion } from '../formulas/formula-dict.ts';
import { enrichEnglishVocab, MEB_TRAPS_DICT } from '../english/vocabulary.js';
import { renderFormulaNoteBanner } from '../formulas/formula-modal.ts';
import { enrichTurkishSentenceXray } from '../tde/cumle-xray.ts';
import { renderMathText } from '../../shared/math-render.ts';
import { escapeHtml } from '../../shared/escape.ts';
import type { Question, Choice } from '../../data/question.ts';

const svgEye = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;
const svgCompass = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;
const svgXray = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16"/><path d="M4 12h10"/><path d="M4 18h14"/></svg>`;
const svgTrap = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
const svgBoard = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`;
const svgStar = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

/** Soru kartının üst başlık satırını ve araç butonlarını üretir. */
export function renderCardHeader(q: Question, globalIdx: number, isPassive: boolean): string {
  const isRevealed = state.revealedAnswers.has(q.id);
  const soonBadge = isPassive ? '<span class="q-soon-badge">🔒 Yakında</span>' : '';
  const isEnglish = (state.currentSubject === 'ING') || Boolean(q.ders && q.ders.includes('İNGİLİZCE'));
  const isMath = (state.currentSubject === 'MAT') || Boolean(q.ders && q.ders.includes('MATEMATİK'));
  const isTde = (state.currentSubject === 'TDE') || Boolean(q.ders && q.ders.includes('TÜRK DİLİ'));

  const cefrInfo = isEnglish ? getCefrInfo(q.ders) : null;
  const cefrBadgeHtml = cefrInfo ? `
    <span class="q-cefr-badge" title="CEFR: ${cefrInfo.level} ${cefrInfo.label}" style="--cefr-c:${cefrInfo.color}; --cefr-bg:${cefrInfo.bg};">
      ${cefrInfo.level}
    </span>
  ` : '';

  const diff = getQuestionDifficulty(q);
  const diffBadgeHtml = `
    <span class="q-difficulty-badge difficulty-${diff.level}" title="Zorluk: ${diff.label}">
      ${diff.badge}
    </span>
  `;

  const trBtnHtml = isEnglish ? `<button class="btn-companion-icon btn-text-badge" id="btnTransTR_${q.id}" title="Soruyu Türkçe'ye Çevir" onclick="toggleQuestionTranslation(${q.id}, 'tr', event)">TR</button>` : '';
  const arBtnHtml = (isEnglish && q.soru_ar) ? `<button class="btn-companion-icon btn-text-badge" id="btnTransAR_${q.id}" title="Soruyu Arapça'ya Çevir" onclick="toggleQuestionTranslation(${q.id}, 'ar', event)">AR</button>` : '';
  const xrayBtnHtml = isTde ? `<button class="btn-companion-icon" id="btnXray_${q.id}" title="Cümle Röntgeni" onclick="toggleCümleRöntgeni(${q.id}, event)">${svgXray}</button>` : '';

  const matchingFormulas = (isMath || Boolean(q.ders && q.ders.includes('FİZİK'))) ? getFormulasForQuestion(q.soru, q.alt_konu || q.ana_konu || '') : [];
  const formulaBtnHtml = (matchingFormulas.length > 0 && !isPassive) ? `
    <button class="btn-companion-icon btn-formula-icon" id="btnFormula_${q.id}" title="Formül Notu / Pusula" onclick="toggleFormulaNote(${q.id}, event)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    </button>
  ` : '';

  const traps = MEB_TRAPS_DICT as Record<string, { title: string; trap_type: string; explanation: string } | undefined>;
  const trapInfo = isEnglish ? (traps[String(q.id)] || null) : null;
  const trapBtnHtml = trapInfo ? `
    <button class="btn-companion-icon btn-trap-toggle" id="btnTrap_${q.id}" title="${escapeHtml(trapInfo.title)}" onclick="toggleTrapExplanation(${q.id}, event)">
      ${svgTrap}
    </button>
  ` : '';

  const eyeClass = isRevealed ? 'revealed' : '';
  const eyeBtnHtml = isPassive ? '' : `
    <button class="btn-companion-icon ${eyeClass}" id="btnEye_${q.id}" title="Cevabı Göster / Gizle" onclick="toggleSingleAnswerReveal(${q.id})">
      ${svgEye}
    </button>
  `;

  const boardBtnHtml = `
    <button class="btn-companion-icon btn-board-mode" id="btnBoard_${q.id}" title="Akıllı Tahta Modu" onclick="openBoardFocusMode(${q.id}, event)">
      ${svgBoard}
    </button>
  `;

  const isStarred = Boolean(state.starredQuestionIds && state.starredQuestionIds.has(q.id));
  const starBtnHtml = `
    <button class="btn-companion-icon btn-star-action ${isStarred ? 'is-starred' : ''}" id="btnStar_${q.id}" title="${isStarred ? 'Yıldızı Kaldır' : 'Soruyu Yıldızla'}" onclick="toggleStarQuestionUI(${q.id}, event)">
      ${svgStar}
    </button>
  `;

  const isExpanded = state.isFeaturesExpanded || (Boolean(state.expandedQuestionIds) && state.expandedQuestionIds.has(q.id));
  const pointsStr = typeof q.puan === 'number' ? q.puan.toFixed(2) : '5.00';
  const krediStr = q.kredi ? String(q.kredi) : '2';

  return `
    <div class="q-top-row">
      <div class="q-header-meta">
        <span class="q-number">${globalIdx}.</span>
        ${soonBadge}
        ${cefrBadgeHtml}
        ${diffBadgeHtml}
        <span class="q-point-pill" title="Kredi: ${krediStr}">${pointsStr} Puan</span>
      </div>
      <button class="btn-features-toggle" data-action="toggle-question-features" data-qid="${q.id}" title="Özellik Çubuğu">
        <span class="features-toggle-icon">${isExpanded ? '‹' : '›'}</span>
      </button>
      <div class="${isExpanded ? 'q-features-drawer is-expanded' : 'q-features-drawer'}">
        ${trBtnHtml}
        ${arBtnHtml}
        ${xrayBtnHtml}
        ${formulaBtnHtml}
        ${trapBtnHtml}
        ${starBtnHtml}
        ${eyeBtnHtml}
        ${boardBtnHtml}
        <button class="btn-companion-icon ${state.revealedHints.has(q.id) ? 'hint-revealed' : ''}" id="btnCompass_${q.id}" title="Pusula / İpucu" onclick="toggleSingleHint(${q.id})" style="display:none;">
          ${svgCompass}
        </button>
      </div>
    </div>
  `;
}

/** Sınav kaynağı etiketini üretir. */
export function renderCardSourceTag(q: Question): string {
  const shortCourse = getShortCourseName(q.ders);
  const year = q.yil ? q.yil.substring(2, 4) : '24';
  const term = q.donem ? String(q.donem) : '1';
  const label = `${shortCourse} • ${year}-D${term}`;
  return `<div class="q-source-tag" title="Sınav: ${escapeHtml(label)}">${escapeHtml(label)}</div>`;
}

/** Soru kökünü dersin türüne göre zenginleştirir. */
export function renderCardStem(q: Question): string {
  const isEnglish = (state.currentSubject === 'ING') || Boolean(q.ders && q.ders.includes('İNGİLİZCE'));
  const isMath = (state.currentSubject === 'MAT') || Boolean(q.ders && q.ders.includes('MATEMATİK'));
  const isTde = (state.currentSubject === 'TDE') || Boolean(q.ders && q.ders.includes('TÜRK DİLİ'));

  if (isEnglish) return enrichEnglishVocab(q.soru_xray || q.soru).trim();
  if (isTde) return (q.soru_xray || enrichTurkishSentenceXray(q.soru, q.id)).trim();
  if (isMath) return renderMathText(q.soru).trim();
  return escapeHtml(q.soru).trim();
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
  const isRematchOrMistakes = (state.bookletFilterMode === 'incorrect' || (state.isLibraryMode && state.libraryTab === 'rematch'));

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
    if (isMarked) {
      rowClass += ' marked';
      if (!isRematchOrMistakes) {
        rowClass += isUserCorrect ? ' marked-correct' : ' marked-incorrect';
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

    const whyCorrectBtn = (isCorrect && q.dogru_nedeni) ? `
      <button class="btn-why-correct" id="btnWhy_${q.id}" onclick="showAnswerExplanationBubble(${q.id}, this, event)" title="Neden Doğru?">
        <span>💡 Neden?</span>
      </button>
    ` : '';

    optHtml += `
      <div class="${rowClass}" id="opt_${q.id}_${letter}" ${clickHandler}>
        <div class="optical-bubble">${letter}</div>
        <div class="choice-text-content">${renderedOptContent}</div>
        ${whyCorrectBtn}
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
  const topicLabel = (q.ana_konu && q.alt_konu && q.ana_konu !== q.alt_konu)
    ? `${escapeHtml(q.ana_konu)} <span class="topic-slash">/</span> ${escapeHtml(q.alt_konu)}`
    : escapeHtml(q.alt_konu || q.ana_konu || '');

  const hintHtml = (q.ipucu && !isPassive) ? `
    <div class="single-hint-banner" id="hint_${q.id}" style="display:${isHintRevealed ? 'flex' : 'none'};">
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
        ${svgTrap}
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

/** Tek bir sorunun tam kitapçık kartı HTML'ini üretir. */
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
