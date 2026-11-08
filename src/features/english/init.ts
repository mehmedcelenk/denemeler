import { onStateChange } from '../../app/state.ts';
import { registerCardHook, type CardHook } from '../booklet/card-hooks.ts';
import { escapeHtml } from '../../shared/escape.ts';
import { isEnglishQuestion } from '../../shared/english-utils.ts';
import { getCefrInfo } from './levels.js';
import {
  applyInterlinearToBooklet,
  isQuestionMealActive,
  renderInterlinearText,
} from './interlinear.ts';
import { enrichEnglishVocab } from './vocabulary.js';
import { initEnglishActions } from './actions.ts';

let initialized = false;

const englishCardHook: CardHook = {
  stem(q, html) {
    if (!isEnglishQuestion(q)) return html;
    return (isQuestionMealActive(q.id)
      ? renderInterlinearText(html)
      : enrichEnglishVocab(html)).trim();
  },
  header(q) {
    if (!isEnglishQuestion(q)) return '';
    const info = getCefrInfo(q.ders);
    if (!info) return '';
    return `<span class="q-cefr-badge" title="CEFR: ${escapeHtml(info.level)} ${escapeHtml(info.label)}" style="--cefr-c:${escapeHtml(info.color)}; --cefr-bg:${escapeHtml(info.bg)};">${escapeHtml(info.level)}</span>`;
  },
  toolbar(q) {
    if (!isEnglishQuestion(q)) return '';
    const mealActive = isQuestionMealActive(q.id);
    const arabicButton = q.soru_ar
      ? `<button class="btn-companion-icon btn-text-badge" data-action="toggle-question-translation" data-lang="ar" data-qid="${q.id}" title="Soruyu Arapça'ya Çevir">AR</button>`
      : '';
    return `<button class="btn-companion-icon btn-text-badge ${mealActive ? 'active' : ''}" data-action="toggle-question-meal" data-qid="${q.id}" title="${mealActive ? 'Kelime Mealini Kapat' : 'Kelime Meali (Alt Çeviri) Aç/Kapat'}">ML</button><button class="btn-companion-icon btn-text-badge" data-action="toggle-question-translation" data-lang="tr" data-qid="${q.id}" title="Soruyu Türkçe'ye Çevir">TR</button>${arabicButton}`;
  },
};

export function initEnglish(): void {
  if (initialized) return;
  initialized = true;
  initEnglishActions();
  registerCardHook(englishCardHook);
  onStateChange('print:before', (payload) => {
    const p = (payload && typeof payload === 'object') ? payload as { interlinear?: boolean } : undefined;
    if (p?.interlinear !== false) applyInterlinearToBooklet(true);
  });
  onStateChange('print:after', (payload) => {
    const p = (payload && typeof payload === 'object') ? payload as { interlinear?: boolean } : undefined;
    if (p?.interlinear !== false) applyInterlinearToBooklet(false);
  });
}
