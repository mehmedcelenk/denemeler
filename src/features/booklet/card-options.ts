import { state } from '../../app/state.ts';
import { escapeHtml } from '../../shared/escape.ts';
import { renderMathText } from '../../shared/math-render.ts';
import { enrichEnglishVocab } from '../english/vocabulary.js';
import type { Question, Choice } from '../../data/question.ts';

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

    // Şık seslendirme butonu kullanıcı isteğiyle geçici olarak devre dışı bırakıldı
    const optSpeakerBtn = '';

    const whyCorrectBtn = (isCorrect && q.dogru_nedeni) ? `
      <button class="btn-why-correct" id="btnWhy_${q.id}" onclick="showAnswerExplanationBubble(${q.id}, this, event)" title="Neden Doğru? (Kazanım Açıklaması)">
        <span>💡 Neden?</span>
      </button>
    ` : '';

    optHtml += `
      <div class="${rowClass}" id="opt_${q.id}_${letter}" ${clickHandler}>
        <div class="optical-bubble">${letter}</div>
        <div class="choice-text-content">${renderedOptContent}</div>
        ${whyCorrectBtn}
        ${optSpeakerBtn}
      </div>
    `;
  });


  return optHtml;
}
