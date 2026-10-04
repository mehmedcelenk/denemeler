import { state } from '../../app/state.ts';
import { escapeHtml } from '../../shared/escape.ts';
import { renderMathText } from '../../shared/math-render.ts';
import { enrichTurkishSentenceXray } from '../tde/cumle-xray.ts';
import type { Question } from '../../data/question.ts';

/** Soru kökünü dersin türüne göre (İngilizce sözlük, TDE röntgen, KaTeX matematik) zenginleştirir. */
export function renderCardStem(q: Question): string {
  const isEnglish = (state.currentSubject === 'ING') || Boolean(q.ders && q.ders.includes('İNGİLİZCE'));
  const isMath = (state.currentSubject === 'MAT') || Boolean(q.ders && q.ders.includes('MATEMATİK'));
  const isTde = (state.currentSubject === 'TDE') || Boolean(q.ders && q.ders.includes('TÜRK DİLİ'));

  let renderedStemText: string;
  if (isEnglish) {
    renderedStemText = escapeHtml(q.soru);
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
