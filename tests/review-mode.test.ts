import assert from 'node:assert/strict';
import test from 'node:test';
import { state, store } from '../src/app/state.ts';
import type { Question } from '../src/data/question.ts';
import { filterQuestionsByMode } from '../src/shared/question-filter.ts';
import { handleSelectOpticalBubble, resetReviewSessionAnswers } from '../src/features/answers/marking.ts';
import { initGamification } from '../src/features/gamification/init.ts';
import { initLibrary } from '../src/features/library/library-model.ts';

function makeQ(id: number, correct: 'A' | 'B' | 'C' | 'D' = 'A'): Question {
  return {
    id,
    ders: 'TEST – 1',
    soru: `Soru ${id}`,
    secenekler: { A: 'A', B: 'B', C: 'C', D: 'D' },
    dogru_cevap: correct,
  };
}

test('review mode lists only correctly solved questions not in rematch', () => {
  const questions = [makeQ(1, 'A'), makeQ(2, 'B'), makeQ(3, 'C'), makeQ(4, 'D')];
  const choices = { 1: 'A', 2: 'A', 3: 'C' }; // 1 correct, 2 wrong, 3 correct, 4 unanswered
  const rematch = new Set<number>([2, 3]); // 3 is in rematch queue

  const result = filterQuestionsByMode(questions, 'review', choices, rematch);
  assert.deepEqual(result.map(q => q.id), [1]);
});

test('review mode awards 0 stars on correct answer and drops to rematch on wrong answer', () => {
  initGamification();
  initLibrary();
  resetReviewSessionAnswers();

  const q1 = makeQ(9101, 'A');
  const q2 = makeQ(9102, 'B');
  store.setAllData([q1, q2]);
  store.setBookletQuestions([q1, q2]);
  store.setUserMarkedChoices({ 9101: 'A', 9102: 'B' }, false);
  store.setRematchQuestionIds([], false);
  store.setWaterStreak(50, false);
  store.setBookletFilterMode('review');

  // 1) q1 doğru tekrar çözüldü -> yıldız (waterStreak) artmamalı, rövanşa düşmemeli
  handleSelectOpticalBubble(9101, 'A');
  handleSelectOpticalBubble(9101, 'A');
  assert.equal(state.waterStreak, 50, 'Tekrar modunda doğru cevap yıldız kazandırmamalı');
  assert.equal(state.rematchQuestionIds.has(9101), false);

  // 2) q2 yanlış tekrar çözüldü -> yıldız artmamalı VE rövanşa düşmeli
  handleSelectOpticalBubble(9102, 'C');
  handleSelectOpticalBubble(9102, 'C');
  assert.equal(state.waterStreak, 50, 'Tekrar modunda yanlış cevap yıldız kazandırmamalı');
  assert.equal(state.userMarkedChoices[9102], 'C');
  assert.equal(state.rematchQuestionIds.has(9102), true, 'Tekrar modunda yanlış bilinen soru rövanşa düşmeli');

  // Temizlik
  store.setBookletFilterMode('all');
  resetReviewSessionAnswers();
});
