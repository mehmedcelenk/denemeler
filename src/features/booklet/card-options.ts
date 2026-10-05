import { state } from '../../app/state.ts';
import { escapeHtml } from '../../shared/escape.ts';
import { renderMathText } from '../../shared/math-render.ts';
import type { Question, Choice } from '../../data/question.ts';

const CHOICES: Choice[] = ['A', 'B', 'C', 'D'];

/** Soru için 4 optik şıkkı ve durum sınıflarını üretir. */
export function renderCardOptions(q: Question, isPassive: boolean): string {
  const userMark = state.userMarkedChoices[q.id];
  const isRevealed = state.revealedAnswers.has(q.id);
  const isEnglish = (state.currentSubject === 'ING') || Boolean(q.ders && q.ders.includes('İNGİLİZCE'));
  const isMath = (state.currentSubject === 'MAT') || Boolean(q.ders && q.ders.includes('MATEMATİK'));
  const isTde = (state.currentSubject === 'TDE') || Boolean(q.ders && q.ders.includes('TÜRK DİLİ'));

  let optHtml = '';
  CHOICES.forEach(letter => {
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

  return optHtml;
}
