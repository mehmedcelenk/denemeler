import { state } from '../../app/state.ts';
import { getShortCourseName } from '../../data/subjects.js';
import { getCefrInfo } from '../english/levels.js';
import { getQuestionDifficulty } from '../../shared/difficulty.ts';
import { getFormulasForQuestion } from '../formulas/formula-dict.ts';
import { MEB_TRAPS_DICT } from '../english/vocabulary.js';
import { escapeHtml } from '../../shared/escape.ts';
import type { Question } from '../../data/question.ts';

const lucideEyeSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;
const lucideCompassSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`;
const lucideXraySvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16"/><path d="M4 12h10"/><path d="M4 18h14"/></svg>`;
const lucideTrapSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`;
const lucideGridSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`;
const lucideStarSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

/** Soru kartının üst başlık satırını, rozetlerini ve araç butonlarını üretir. */
export function renderCardHeader(q: Question, globalIdx: number, isPassive: boolean): string {
  const isRevealed = state.revealedAnswers.has(q.id);
  const shortCourse = getShortCourseName(q.ders);
  const soonBadge = isPassive ? '<span class="q-soon-badge">🔒 Yakında</span>' : '';

  const isEnglish = (state.currentSubject === 'ING') || Boolean(q.ders && q.ders.includes('İNGİLİZCE'));
  const isMath = (state.currentSubject === 'MAT') || Boolean(q.ders && q.ders.includes('MATEMATİK'));
  const isTde = (state.currentSubject === 'TDE') || Boolean(q.ders && q.ders.includes('TÜRK DİLİ'));

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

  const speakerBtnHtml = (isEnglish && !isPassive) ? `
    <button class="btn-companion-icon btn-tts-icon" id="btnTTS_${q.id}" title="Soruyu Seslendir (Yavaş & Net) [Sağ Tık: Sesi Değiştir]" onclick="toggleSpeakQuestion(${q.id}, event)" oncontextmenu="toggleTTSVoiceGenderQuick(event)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
    </button>
  ` : '';

  const trBtnHtml = isEnglish ? `
    <button class="btn-companion-icon btn-text-badge" id="btnTransTR_${q.id}" title="Soruyu Türkçe'ye Çevir" onclick="toggleQuestionTranslation(${q.id}, 'tr', event)">TR</button>
  ` : '';

  const arBtnHtml = (isEnglish && q.soru_ar) ? `
    <button class="btn-companion-icon btn-text-badge" id="btnTransAR_${q.id}" title="Soruyu Arapça'ya Çevir" onclick="toggleQuestionTranslation(${q.id}, 'ar', event)">AR</button>
  ` : '';

  const xrayBtnHtml = isTde ? `
    <button class="btn-companion-icon" id="btnXray_${q.id}" title="Cümle Röntgeni (Özne • Yüklem • Nesne Vurgusu)" onclick="toggleCümleRöntgeni(${q.id}, event)">
      ${lucideXraySvg}
    </button>
  ` : '';

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
      ${lucideTrapSvg}
    </button>
  ` : '';

  const eyeClass = isRevealed ? 'revealed' : '';
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

  const isStarred = Boolean(state.starredQuestionIds && state.starredQuestionIds.has(q.id));
  const starClass = isStarred ? 'is-starred' : '';
  const starTitle = isStarred ? 'Yıldızı Kaldır' : 'Soruyu Yıldızla (Favorilere Ekle)';
  const starBtnHtml = `
    <button class="btn-companion-icon btn-star-action ${starClass}" id="btnStar_${q.id}" title="${starTitle}" onclick="toggleStarQuestionUI(${q.id}, event)">
      ${lucideStarSvg}
    </button>
  `;

  const isHintRevealed = state.revealedHints.has(q.id);
  const compassClass = isHintRevealed ? 'hint-revealed' : '';

  const isExpanded = state.isFeaturesExpanded || (Boolean(state.expandedQuestionIds) && state.expandedQuestionIds.has(q.id));
  const toggleIcon = isExpanded ? '‹' : '›';
  const drawerClass = isExpanded ? 'q-features-drawer is-expanded' : 'q-features-drawer';

  const pointsStr = typeof q.puan === 'number' ? q.puan.toFixed(2) : '5.00';
  const krediStr = q.kredi ? String(q.kredi) : '2';
  const sinavSoruSayisiStr = q.sinav_soru_sayisi ? String(q.sinav_soru_sayisi) : '20';
  return `
    <div class="q-top-row">
      <div class="q-header-meta">
        <span class="q-number">${globalIdx}.</span>
        ${soonBadge}
        ${cefrBadgeHtml}
        ${diffBadgeHtml}
        <span class="q-point-pill" title="Ders Kredisi: ${krediStr} | Bir Sınavdaki Soru: ${sinavSoruSayisiStr}">${pointsStr} Puan</span>
      </div>
      <button class="btn-features-toggle" data-action="toggle-question-features" data-qid="${q.id}" title="Özellik Çubuğunu Aç/Kapat">
        <span class="features-toggle-icon">${toggleIcon}</span>
      </button>
      <div class="${drawerClass}">
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
      </div>
    </div>
  `;
}

export function renderCardSourceTag(q: Question): string {
  const shortCourse = getShortCourseName(q.ders);
  const year = q.yil ? q.yil.substring(2, 4) : '24';
  const term = q.donem ? String(q.donem) : '1';
  const label = `${shortCourse} • ${year}-D${term}`;
  return `<div class="q-source-tag" title="Sınav kaynağı: ${escapeHtml(label)}">${escapeHtml(label)}</div>`;
}
