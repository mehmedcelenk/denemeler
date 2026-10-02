import test from 'node:test';
import assert from 'node:assert/strict';
import { state } from '../src/app/state.ts';
import { addStreakPoints, resetOrDeductStreak } from '../src/features/gamification/streak.ts';
import { promptConfidenceSelection, confirmConfidence } from '../src/features/answers/confidence.ts';
import type { Question } from '../src/data/question.ts';

test('addStreakPoints ve resetOrDeductStreak puanları doğru günceller', () => {
  state.waterStreak = 0;
  addStreakPoints(3);
  assert.equal(state.waterStreak, 3, 'Damla serisi 3 olmalı');

  resetOrDeductStreak(1);
  assert.equal(state.waterStreak, 2, 'Düşüş sonrası seri 2 olmalı');

  resetOrDeductStreak(10);
  assert.equal(state.waterStreak, 0, 'Seri 0 altına inmemeli');
});

test('confirmConfidence: Yüksek güvenli doğru cevap 3 damla puanı verir', () => {
  const dummyQ: Question = {
    id: 88881,
    ders: 'MATEMATİK – 1',
    soru: 'Test sorusu',
    secenekler: { A: '1', B: '2', C: '3', D: '4' },
    dogru_cevap: 'B',
  };
  state.allData = [dummyQ];
  state.bookletQuestions = [dummyQ];
  state.userMarkedChoices = {};
  state.userConfidences = {};
  state.waterStreak = 0;

  promptConfidenceSelection(88881, 'B');
  confirmConfidence('high');

  assert.equal(state.userMarkedChoices[88881], 'B', 'Şık B olarak işaretlenmeli');
  assert.equal(state.userConfidences[88881], 'high', 'Güven seviyesi high olmalı');
  assert.equal(state.waterStreak, 3, 'Yüksek güvenli doğru cevap 3 damla vermeli');
});

test('confirmConfidence: Tahmin ile doğru bilinen soru Rövanş sepetine eklenir', () => {
  const dummyQ: Question = {
    id: 88882,
    ders: 'İNGİLİZCE – 1',
    soru: 'Guess question',
    secenekler: { A: 'Apple', B: 'Banana', C: 'Orange', D: 'Peach' },
    dogru_cevap: 'C',
  };
  state.allData = [dummyQ];
  state.bookletQuestions = [dummyQ];
  state.userMarkedChoices = {};
  state.userConfidences = {};
  state.rematchQuestionIds = new Set();
  state.waterStreak = 0;

  promptConfidenceSelection(88882, 'C');
  confirmConfidence('low');

  assert.equal(state.waterStreak, 1, 'Tahmin ile doğru 1 damla vermeli');
  assert.ok(state.rematchQuestionIds.has(88882), 'Tahminle bilinen soru Rövanşlara alınmalı');
});

