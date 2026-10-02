import { state } from '../../app/state.ts';
import { getShortCourseName } from '../../data/subjects.js';
import { getCefrInfo } from '../english/levels.js';
import { MEB_TRAPS_DICT, enrichEnglishVocab } from '../english/vocabulary.js';
import { ttsVoiceGender } from '../audio/audio.js';
import { escapeHtml } from '../../shared/escape.ts';
import { renderMathText } from '../../shared/math-render.ts';
import { getQuestionDifficulty } from '../../shared/difficulty.ts';
import { getFormulasForQuestion } from '../formulas/formula-dict.ts';
import { renderFormulaNoteBanner } from '../formulas/formula-modal.ts';
import { enrichTdeContent } from '../tde/edebiyat-pusulasi.ts';
import { enrichTurkishSentenceXray } from '../tde/cumle-xray.ts';

export function renderQuestionCardHtml(q, globalIdx) {
  const userMark = state.userMarkedChoices[q.id];
  const isRevealed = state.revealedAnswers.has(q.id);

  const shortCourse = getShortCourseName(q.ders);
  const isPassive = !!q.sekilli;
  const questionClass = isPassive ? 'booklet-question is-passive-question' : 'booklet-question';
  const soonBadge = isPassive ? '<span class="q-soon-badge">🔒 Yakında</span>' : '';
  const soonBanner = isPassive ? `
    <div class="q-soon-banner">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>Bu soru şekil / görsel içerdiğinden geçici olarak çözüme kapatılmıştır (Yakında).</span>
    </div>
  ` : '';

  const lucideEyeSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;
  const lucideCompassSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;
  const lucideXraySvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16"/><path d="M4 12h10"/><path d="M4 18h14"/></svg>`;
  const lucideTrapSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
  const lucideGridSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`;
  const lucideStarSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

  const isEnglish = (state.currentSubject === 'ING') || (q.ders && q.ders.includes('İNGİLİZCE'));
  const isMath = (state.currentSubject === 'MAT') || (q.ders && q.ders.includes('MATEMATİK'));
  const isTde = (state.currentSubject === 'TDE') || (q.ders && q.ders.includes('TÜRK DİLİ'));
  const cefrInfo = isEnglish ? getCefrInfo(q.ders) : null;
  const cefrBadgeHtml = cefrInfo ? `
    <span class="q-cefr-badge" title="Avrupa Ortak Dil Portfolyosu (CEFR): ${cefrInfo.level} ${cefrInfo.label}" style="--cefr-c:${cefrInfo.color}; --cefr-bg:${cefrInfo.bg};">
      ${cefrInfo.level}
    </span>
  ` : '';

  const diff = getQuestionDifficulty(q);
  const diffBadgeHtml = `
    <span class="q-difficulty-badge difficulty-${diff.level}" title="Zorluk Derecesi: ${diff.label}">
      ${diff.badge}
    </span>
  `;

  const genderLabel = (ttsVoiceGender === 'male') ? 'Erkek Sesi' : 'Kadın Sesi';
  const speakerBtnHtml = (isEnglish && !isPassive) ? `
    <button class="btn-companion-icon btn-tts-icon" id="btnTTS_${q.id}" title="Soruyu Seslendir (${genderLabel} • Yavaş & Net) [Sağ Tık: Sesi Değiştir]" onclick="toggleSpeakQuestion(${q.id}, event)" oncontextmenu="toggleTTSVoiceGenderQuick(event)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
    </button>
  ` : '';

  const trBtnHtml = isEnglish ? `
    <button class="btn-companion-icon btn-text-badge" id="btnTransTR_${q.id}" title="Soruyu Türkçe'ye Çevir" onclick="toggleQuestionTranslation(${q.id}, 'tr', event)">TR</button>
  ` : '';

  const arBtnHtml = (isEnglish && q.soru_ar) ? `
    <button class="btn-companion-icon btn-text-badge" id="btnTransAR_${q.id}" title="Soruyu Arapça'ya Çevir" onclick="toggleQuestionTranslation(${q.id}, 'ar', event)">AR</button>
  ` : '';

  const xrayBtnHtml = (isEnglish || isTde) ? `
    <button class="btn-companion-icon" id="btnXray_${q.id}" title="Cümle Röntgeni (Özne • Yüklem • Nesne Vurgusu)" onclick="toggleCümleRöntgeni(${q.id}, event)">
      ${lucideXraySvg}
    </button>
  ` : '';

  const matchingFormulas = (isMath || (q.ders && q.ders.includes('FİZİK'))) ? getFormulasForQuestion(q.soru, q.alt_konu || q.ana_konu || '') : [];
  const formulaBtnHtml = (matchingFormulas.length > 0 && !isPassive) ? `
    <button class="btn-companion-icon btn-formula-icon" id="btnFormula_${q.id}" title="Formül Notu / Pusula" onclick="toggleFormulaNote(${q.id}, event)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
    </button>
  ` : '';

  const trapInfo = isEnglish ? (MEB_TRAPS_DICT[q.id] || null) : null;
  const trapBtnHtml = trapInfo ? `
    <button class="btn-companion-icon btn-trap-toggle" id="btnTrap_${q.id}" title="${escapeHtml(trapInfo.title)}" onclick="toggleTrapExplanation(${q.id}, event)">
      ${lucideTrapSvg}
    </button>
  ` : '';

  let optHtml = '';
  ['A', 'B', 'C', 'D'].forEach(letter => {
    const optText = q.secenekler[letter] || '';
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
    } else if (userMark && !isUserCorrect && isCorrect) {
      if (!isRematchOrMistakes) {
        rowClass += ' revealed-correct';
      }
    } else if (isRevealed && isCorrect) {
      rowClass += ' revealed-correct';
    }

    const clickHandler = isPassive ? '' : `onclick="handleSelectOpticalBubble(${q.id}, '${letter}')"`;
    const renderedOptContent = isEnglish
      ? enrichEnglishVocab(optText)
      : isTde
        ? enrichTdeContent(optText)
        : isMath
          ? renderMathText(optText)
          : escapeHtml(optText);

    const optSpeakerBtn = (isEnglish && !isPassive && optText.trim()) ? `
      <button class="btn-opt-tts" title="Şıkkı Dinle" onclick="speakSingleOption(${q.id}, '${letter}', event)">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
      </button>
    ` : '';

    optHtml += `
      <div class="${rowClass}" id="opt_${q.id}_${letter}" ${clickHandler}>
        <div class="optical-bubble">${letter}</div>
        <div class="choice-text-content">${renderedOptContent}</div>
        ${optSpeakerBtn}
      </div>
    `;
  });

  const eyeClass = isRevealed ? 'revealed' : '';
  const isRematchOrMistakes = (state.bookletFilterMode === 'incorrect' || (state.isLibraryMode && state.libraryTab === 'rematch'));
  const isWrongAnswered = (userMark && userMark !== q.dogru_cevap && !isRematchOrMistakes);
  const bannerDisplay = (isRevealed || isWrongAnswered) ? 'flex' : 'none';

  const eyeBtnHtml = isPassive ? '' : `
    <button class="btn-companion-icon ${eyeClass}" id="btnEye_${q.id}" title="Cevabı Göster / Gizle" onclick="toggleSingleAnswerReveal(${q.id})">
      ${lucideEyeSvg}
    </button>
  `;

  const boardBtnHtml = `
    <button class="btn-companion-icon btn-board-mode" id="btnBoard_${q.id}" title="Akıllı Tahta / Not Alanı (Tahta Modu)" onclick="openBoardFocusMode(${q.id}, event)">
      ${lucideGridSvg}
    </button>
  `;

  const isHintRevealed = state.revealedHints.has(q.id);
  const compassClass = isHintRevealed ? 'hint-revealed' : '';
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

  const trapBannerHtml = trapInfo ? `
    <div class="single-trap-banner" id="trap_${q.id}" style="display:none;">
      <div class="trap-header">
        ${lucideTrapSvg}
        <span>${escapeHtml(trapInfo.title)} (${escapeHtml(trapInfo.trap_type)})</span>
      </div>
      <div class="trap-content">${escapeHtml(trapInfo.explanation)}</div>
    </div>
  ` : '';

  let renderedStemText;
  if (isEnglish) {
    renderedStemText = enrichEnglishVocab(q.soru_xray || q.soru);
  } else if (isTde) {
    renderedStemText = enrichTdeContent(enrichTurkishSentenceXray(q.soru, q.id));
  } else if (isMath) {
    renderedStemText = renderMathText(q.soru);
  } else {
    renderedStemText = escapeHtml(q.soru);
  }

  const isStarred = state.starredQuestionIds && state.starredQuestionIds.has(q.id);
  const starClass = isStarred ? 'is-starred' : '';
  const starTitle = isStarred ? 'Yıldızı Kaldır' : 'Soruyu Yıldızla (Favorilere Ekle)';
  const starBtnHtml = `
    <button class="btn-companion-icon btn-star-action ${starClass}" id="btnStar_${q.id}" title="${starTitle}" onclick="toggleStarQuestionUI(${q.id}, event)">
      ${lucideStarSvg}
    </button>
  `;

  return `
    <div class="${questionClass}" id="bq_${q.id}">
      <div class="q-top-row">
        <span class="q-number">${globalIdx}.</span>
        ${soonBadge}
        ${cefrBadgeHtml}
        ${diffBadgeHtml}
        <span class="q-point-pill" title="Ders Kredisi: ${q.kredi} | Bir Sınavdaki Soru: ${q.sinav_soru_sayisi}">${q.puan.toFixed(2)} Puan</span>
        ${speakerBtnHtml}
        ${trBtnHtml}
        ${arBtnHtml}
        ${xrayBtnHtml}
        ${formulaBtnHtml}
        ${trapBtnHtml}
        ${starBtnHtml}
        ${eyeBtnHtml}
        ${boardBtnHtml}
        <button class="btn-companion-icon ${compassClass}" id="btnCompass_${q.id}" title="Pusula / İpucu Göster" onclick="toggleSingleHint(${q.id})" style="display:none;">
          ${lucideCompassSvg}
        </button>
        <span class="q-source-tag">${escapeHtml(shortCourse)} • ${q.yil.substring(2,4)}-D${q.donem}</span>
      </div>

      ${soonBanner}
      <div class="q-stem-text" id="stem_${q.id}">${renderedStemText.trim()}</div>

      <div class="q-optical-options">
        ${optHtml}
      </div>

      ${hintHtml}
      ${formulaBannerHtml}
      ${trapBannerHtml}

      <div class="single-answer-banner" id="banner_${q.id}" style="display:${bannerDisplay};">
        <span>Doğru Cevap: <strong style="color:var(--brand-accent); font-size:13px;">${q.dogru_cevap}</strong></span>
        <span style="opacity:0.85; font-size:10.5px;">${topicLabel}</span>
      </div>
    </div>
  `;
}
