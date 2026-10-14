import test from 'node:test';
import assert from 'node:assert/strict';
import { state } from '../src/app/state.ts';
import { addStreakPoints, resetOrDeductStreak } from '../src/features/gamification/streak.ts';
import { handleSelectOpticalBubble } from '../src/features/answers/marking.ts';
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

test('handleSelectOpticalBubble: İlk tıklama taslak bırakır, ikinci tıklama onaylar ve doğru cevapta seri artar', () => {
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
  state.waterStreak = 0;

  // 1. Tıklama: henüz nihai işaretleme kaydedilmez
  handleSelectOpticalBubble(88881, 'B');
  assert.equal(state.userMarkedChoices[88881], undefined, 'İlk tıklamada nihai cevap verilmemeli');
  assert.equal(state.waterStreak, 0, 'İlk tıklamada seri değişmemeli');

  // 2. Tıklama: aynı şıkka tekrar tıklandığında cevap onaylanır
  handleSelectOpticalBubble(88881, 'B');
  assert.equal(state.userMarkedChoices[88881], 'B', 'Şık B olarak nihai işaretlenmeli');
  assert.equal(state.waterStreak, 1, 'Doğru cevap damla serisini artırmalı');
});

test('handleSelectOpticalBubble: Yanlış cevap verildiğinde soru Rövanş sepetine eklenir', () => {
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
  state.rematchQuestionIds = new Set();
  state.waterStreak = 5;

  // Yanlış şık olan A şıkkına 2 kez tıkla
  handleSelectOpticalBubble(88882, 'A');
  handleSelectOpticalBubble(88882, 'A');

  assert.equal(state.userMarkedChoices[88882], 'A', 'A şıkkı işaretlenmeli');
  assert.ok(state.rematchQuestionIds.has(88882), 'Yanlış bilinen soru Rövanşlara alınmalı');
  assert.equal(state.waterStreak, 4, 'Yanlış cevap seri puanını düşürmeli');
});

