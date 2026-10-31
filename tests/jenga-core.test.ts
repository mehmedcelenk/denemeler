import test from 'node:test';
import assert from 'node:assert/strict';
import { state, store } from '../src/app/state.ts';
import { handleSelectOpticalBubble } from '../src/features/answers/marking.ts';
import { renderQuestionCardHtml } from '../src/features/booklet/question-card.ts';
import type { Question } from '../src/data/question.ts';

test('eklenti başlangıçları olmadan çekirdek kart üretir ve cevap kaydeder', () => {
  const question: Question = {
    id: 93102,
    ders: 'İNGİLİZCE – 1',
    soru: 'Which answer is correct?',
    secenekler: { A: 'One', B: 'Two', C: 'Three', D: 'Four' },
    dogru_cevap: 'B',
  };
  store.setAllData([question]);
  store.setBookletQuestions([question]);
  store.clearAllUserMarkedChoices(false);
  store.setRematchQuestionIds([], false);
  store.setWaterStreak(0, false);

  const html = renderQuestionCardHtml(question, 1);
  assert.match(html, /Which answer is correct\?/);
  assert.doesNotMatch(html, /btnMeal_|btnSpeech_/);

  handleSelectOpticalBubble(question.id, 'B');
  handleSelectOpticalBubble(question.id, 'B');
  assert.equal(state.userMarkedChoices[question.id], 'B');
  assert.equal(state.waterStreak, 0);
  assert.equal(state.rematchQuestionIds.has(question.id), false);
});
