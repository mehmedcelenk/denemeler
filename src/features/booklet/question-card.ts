import { state, onStateChange } from '../../app/state.ts';
import { getShortCourseName } from '../../data/subjects.js';
import { getQuestionDifficulty } from '../../shared/difficulty.ts';
import { isEnglishQuestion } from '../../shared/english-utils.ts';
import { renderMathWithXray } from '../../shared/math-render.ts';
import { escapeHtml } from '../../shared/escape.ts';
import type { Question, Choice } from '../../data/question.ts';
import {
  applyStemHooks,
  renderHeaderExtraHooks,
  renderToolbarExtraHooks,
} from './card-hooks.ts';

const svgEye = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;
const svgBoard = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`;
const svgStar = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const svgEliminate = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`;
const svgCopy = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
/** Soru kartının üst başlık satırını ve araç butonlarını üretir. */
export function renderCardHeader(q: Question, globalIdx: number, isPassive: boolean): string {
  const isRevealed = state.revealedAnswers.has(q.id);
  const soonBadge = isPassive ? '<span class="q-soon-badge">🔒 Yakında</span>' : '';
  const isTde = (state.currentSubject === 'TDE') || Boolean(q.ders && q.ders.includes('TÜRK DİLİ'));
  const headerExtraHtml = renderHeaderExtraHooks(q);
  const toolbarExtraHtml = renderToolbarExtraHooks(q);

  const diff = getQuestionDifficulty(q);
  const diffBadgeHtml = `
    <span class="q-difficulty-badge difficulty-${diff.level}" title="Zorluk: ${diff.label}">
      ${diff.badge}
    </span>
  `;

  const hasGrammarXray = Boolean(q.soru_xray && (q.soru_xray.includes('xray-vag') || q.soru_xray.includes('xray-junction') || q.soru_xray.includes('pos-word') || q.soru_xray.includes('sound-')));
  const showGrammarToggles = isTde || hasGrammarXray;
  const grammarTogglesHtml = showGrammarToggles ? `
    <button class="btn-companion-icon btn-text-badge btn-xray-syntax active" id="btnXraySyntax_${q.id}" data-action="toggle-xray-syntax" data-qid="${q.id}" title="Özne / Yüklem (Cümle Ögeleri) Aç/Kapat">ÖZ</button>
    <button class="btn-companion-icon btn-text-badge btn-xray-pos active" id="btnXrayPos_${q.id}" data-action="toggle-xray-pos" data-qid="${q.id}" title="Sıfat / Zamir / Zarf (Sözcük Türleri) Aç/Kapat">SF</button>
    <button class="btn-companion-icon btn-text-badge btn-xray-sound active" id="btnXraySound_${q.id}" data-action="toggle-xray-sound" data-qid="${q.id}" title="Ses Olayları (Düşme, Benzeşme, Yumuşama) Aç/Kapat">ÜN</button>
  ` : '';

  const isEliminatedWrong = Boolean(state.eliminatedWrongChoices && state.eliminatedWrongChoices[q.id]);
  const eliminateWrongBtnHtml = isPassive ? '' : `
    <button class="btn-companion-icon btn-eliminate-wrong ${isEliminatedWrong ? 'active' : ''}" id="btnEliminateWrong_${q.id}" data-action="eliminate-wrong-choice" data-qid="${q.id}" title="${isEliminatedWrong ? 'Elenen Yanlış Şıkkı Geri Al' : 'Bir Yanlış Şıkkı Ele'}">
      ${svgEliminate}
    </button>
  `;

  const eyeClass = isRevealed ? 'revealed' : '';
  const eyeBtnHtml = isPassive ? '' : `
    <button class="btn-companion-icon ${eyeClass}" id="btnEye_${q.id}" data-action="toggle-answer-reveal" data-qid="${q.id}" title="Cevabı Göster / Gizle">
      ${svgEye}
    </button>
  `;

  const boardBtnHtml = `
    <button class="btn-companion-icon btn-board-mode" id="btnBoard_${q.id}" data-action="open-board-focus" data-qid="${q.id}" title="Akıllı Tahta Modu">
      ${svgBoard}
    </button>
  `;

  const isStarred = Boolean(state.starredQuestionIds && state.starredQuestionIds.has(q.id));
  const starBtnHtml = `
    <button class="btn-companion-icon btn-star-action ${isStarred ? 'is-starred' : ''}" id="btnStar_${q.id}" data-action="toggle-star-question" data-qid="${q.id}" title="${isStarred ? 'Yıldızı Kaldır' : 'Soruyu Yıldızla'}">
      ${svgStar}
    </button>
  `;

  const copyBtnHtml = `
    <button class="btn-companion-icon btn-copy-question" id="btnCopy_${q.id}" data-action="copy-question-text" data-qid="${q.id}" title="Soruyu Kopyala">
      ${svgCopy}
    </button>
  `;

  const isExpanded = Boolean(state.isFeaturesExpanded) || (Boolean(state.expandedQuestionIds) && state.expandedQuestionIds.has(q.id));
  const pointsStr = typeof q.puan === 'number' ? q.puan.toFixed(2) : '5.00';
  const krediStr = q.kredi ? String(q.kredi) : '2';

  return `
    <div class="q-top-row">
      <div class="q-header-meta">
        <span class="q-number" id="qnum_${q.id}">
          ${globalIdx}.
        </span>
        ${soonBadge}
        ${headerExtraHtml}
        ${diffBadgeHtml}
        <span class="q-point-pill" title="Kredi: ${krediStr}">${pointsStr} Puan</span>
      </div>
      <button class="btn-features-toggle" data-action="toggle-question-features" data-qid="${q.id}" title="Özellik Çubuğu">
        <span class="features-toggle-icon">${isExpanded ? '‹' : '›'}</span>
      </button>
      <div class="${isExpanded ? 'q-features-drawer is-expanded' : 'q-features-drawer'}">
        ${toolbarExtraHtml}
        ${grammarTogglesHtml}
        ${eliminateWrongBtnHtml}
        ${starBtnHtml}
        ${copyBtnHtml}
        ${eyeBtnHtml}
        ${boardBtnHtml}
      </div>
    </div>
  `;
}

/** Sınav kaynağı etiketini üretir. */
export function renderCardSourceTag(q: Question): string {
  const shortCourse = getShortCourseName(q.ders);
  if (q.sinav_kodu) {
    const label = `${shortCourse} • ${q.sinav_kodu}`;
    return `<div class="q-source-tag" title="Sınav: ${escapeHtml(label)}">${escapeHtml(label)}</div>`;
  }
  if (q.yil === 'AÖF Alıştırma Soruları') {
    const label = `${shortCourse} • ${q.donem || 'Alıştırma'}`;
    return `<div class="q-source-tag" title="Sınav: ${escapeHtml(label)}">${escapeHtml(label)}</div>`;
  }
  const year = q.yil ? q.yil.substring(2, 4) : '24';
  const term = q.donem ? String(q.donem) : '1';
  const label = `${shortCourse} • ${year}-D${term}`;
  return `<div class="q-source-tag" title="Sınav: ${escapeHtml(label)}">${escapeHtml(label)}</div>`;
}

/** Soru kökünü dersin türüne göre zenginleştirir. */
export function renderCardStem(q: Question): string {
  const isMath = (state.currentSubject === 'MAT') || Boolean(q.ders && q.ders.includes('MATEMATİK'));

  if (isMath) return renderMathWithXray(q.soru, q.soru_xray).trim();
  const baseHtml = isEnglishQuestion(q)
    ? (q.soru_xray || q.soru)
    : (q.soru_xray || escapeHtml(q.soru));
  return applyStemHooks(q, baseHtml).trim();
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

    const isEliminated = Boolean(state.eliminatedChoices[q.id]?.includes(letter));
    const isEliminatedWrong = Boolean(state.eliminatedWrongChoices && state.eliminatedWrongChoices[q.id] === letter);

    let rowClass = 'optical-choice-row';
    if (isEliminated) {
      rowClass += ' eliminated';
    }
    if (isEliminatedWrong) {
      rowClass += ' marked-incorrect';
    }
    if (isMarked) {
      rowClass += ' marked';
      if (!isRematchOrMistakes) {
        rowClass += isUserCorrect ? ' marked-correct' : ' marked-incorrect';
      }
    } else if (isRevealed && isCorrect) {
      rowClass += ' revealed-correct';
    }

    const clickHandler = isPassive ? '' : `onclick="handleSelectOpticalBubble(${q.id}, '${letter}')"`;
    const optXray = q.secenekler_xray?.[letter];
    const baseOptContent = isEnglishQuestion(q)
      ? optText
      : (optXray || escapeHtml(optText));
    const renderedOptContent = isMath
      ? renderMathWithXray(optText, optXray)
      : applyStemHooks(q, baseOptContent);

    optHtml += `
      <div class="${rowClass}" id="opt_${q.id}_${letter}" data-letter="${letter}" ${clickHandler}>
        <div class="optical-bubble" data-qid="${q.id}" data-letter="${letter}" title="Basılı tut: Şıkkı ele / geri al">${letter}</div>
        <div class="choice-text-content">${renderedOptContent}</div>
      </div>
    `;
  });

  return optHtml;
}

/** Soru kartının AI soru kutusu ve cevap anahtarı afişlerini üretir. */
export function renderCardBanners(q: Question, isPassive: boolean): string {
  const userMark = state.userMarkedChoices[q.id];
  const isRevealed = state.revealedAnswers.has(q.id);
  const isRematchOrMistakes = (state.bookletFilterMode === 'incorrect' || (state.isLibraryMode && state.libraryTab === 'rematch'));
  const isWrongAnswered = Boolean(userMark && userMark !== q.dogru_cevap && !isRematchOrMistakes);
  const bannerDisplay = (isRevealed || isWrongAnswered) ? 'flex' : 'none';

  const topicLabel = (q.ana_konu && q.alt_konu && q.ana_konu !== q.alt_konu)
    ? `${escapeHtml(q.ana_konu)} <span class="topic-slash">/</span> ${escapeHtml(q.alt_konu)}`
    : escapeHtml(q.alt_konu || q.ana_konu || '');

  return `
    <div class="single-answer-banner" id="banner_${q.id}" style="display:${bannerDisplay};">
      <span>Doğru Cevap: <strong style="color:var(--brand-accent); font-size:13px;">${q.dogru_cevap}</strong></span>
      <span style="opacity:0.85; font-size:10.5px;">${topicLabel}</span>
    </div>
  `;
}

/** Tek bir sorunun tam kitapçık kartı HTML'ini üretir. */
export function renderQuestionCardHtml(q: Question, globalIdx: number): string {
  const isPassive = !!q.sekilli;
  const stemHtml = renderCardStem(q);
  let questionClass = isPassive ? 'booklet-question is-passive-question' : 'booklet-question';
  if (stemHtml.includes('class="interlinear-word"')) {
    questionClass += ' has-interlinear';
  }
  const userMark = state.userMarkedChoices[q.id] || '';
  const isRevealed = state.revealedAnswers.has(q.id);
  const statusAttr = userMark ? `data-user-status="${userMark === q.dogru_cevap ? 'correct' : 'incorrect'}"` : '';

  return `
    <div class="${questionClass}" id="bq_${q.id}" data-qid="${q.id}" data-correct="${q.dogru_cevap}" data-user-mark="${userMark}" data-revealed="${isRevealed ? 'true' : 'false'}" ${statusAttr}>
      ${renderCardHeader(q, globalIdx, isPassive)}
      ${renderSoonBanner(isPassive)}
      <div class="q-stem-text" id="stem_${q.id}">${stemHtml}</div>
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
