import test from 'node:test';
import assert from 'node:assert/strict';
import { state, store } from '../src/app/state.ts';
import { addStreakPoints, resetOrDeductStreak } from '../src/features/gamification/streak.ts';
import { initGamification } from '../src/features/gamification/init.ts';
import { initLibrary } from '../src/features/library/library-model.ts';
import { initRoomFeature } from '../src/features/classroom/room-ui.ts';
import { handleSelectOpticalBubble } from '../src/features/answers/marking.ts';
import type { Question } from '../src/data/question.ts';

initGamification();
initRoomFeature();
initLibrary();

test('addStreakPoints ve resetOrDeductStreak puanları doğru günceller', () => {
  store.setWaterStreak(0, false);
  addStreakPoints(3);
  assert.equal(state.waterStreak, 3, 'Yıldız sayısı 3 olmalı');

  resetOrDeductStreak(1);
  assert.equal(state.waterStreak, 2, 'Düşüş sonrası sayı 2 olmalı');

  resetOrDeductStreak(10);
  assert.equal(state.waterStreak, 0, 'Sayı 0 altına inmemeli');
});

test('handleSelectOpticalBubble: İlk tıklama taslak bırakır, ikinci tıklama onaylar ve kredi kadar yıldız ekler', () => {
  const dummyQ: Question = {
    id: 88881,
    ders: 'MATEMATİK – 1',
    kredi: 6,
    soru: 'Test sorusu',
    secenekler: { A: '1', B: '2', C: '3', D: '4' },
    dogru_cevap: 'B',
  };
  store.setAllData([dummyQ]);
  store.setBookletQuestions([dummyQ]);
  store.clearAllUserMarkedChoices(false);
  store.setRematchQuestionIds([], false);
  store.setWaterStreak(0, false);

  // 1. Tıklama: henüz nihai işaretleme kaydedilmez
  handleSelectOpticalBubble(88881, 'B');
  assert.equal(state.userMarkedChoices[88881], undefined, 'İlk tıklamada nihai cevap verilmemeli');
  assert.equal(state.waterStreak, 0, 'İlk tıklamada yıldız değişmemeli');

  // 2. Tıklama: aynı şıkka tekrar tıklandığında cevap onaylanır (MAT = 6 kredi -> +6 yıldız)
  handleSelectOpticalBubble(88881, 'B');
  assert.equal(state.userMarkedChoices[88881], 'B', 'Şık B olarak nihai işaretlenmeli');
  assert.equal(state.waterStreak, 6, 'MAT (6 kredi) doğru cevabı 6 yıldız eklemeli');
});

test('handleSelectOpticalBubble: Yanlış cevapta yıldız düşmez ve soru Rövanş sepetine eklenir', () => {
  const dummyQ: Question = {
    id: 88882,
    ders: 'İNGİLİZCE – 1',
    kredi: 4,
    soru: 'Guess question',
    secenekler: { A: 'Apple', B: 'Banana', C: 'Orange', D: 'Peach' },
    dogru_cevap: 'C',
  };
  store.setAllData([dummyQ]);
  store.setBookletQuestions([dummyQ]);
  store.clearAllUserMarkedChoices(false);
  store.setRematchQuestionIds([], false);
  store.setWaterStreak(5, false);

  handleSelectOpticalBubble(88882, 'A');
  handleSelectOpticalBubble(88882, 'A');

  assert.equal(state.userMarkedChoices[88882], 'A', 'A şıkkı işaretlenmeli');
  assert.ok(state.rematchQuestionIds.has(88882), 'Yanlış bilinen soru Rövanşlara alınmalı');
  assert.equal(state.waterStreak, 5, 'Yanlış cevap yıldız düşürmemeli');
});

test('Rövanş sepetindeki soru doğru bilindiğinde kredinin %50 yıldızını verir', () => {
  const dummyQ: Question = {
    id: 88883,
    ders: 'MATEMATİK – 2',
    kredi: 6,
    soru: 'Rematch sorusu',
    secenekler: { A: '1', B: '2', C: '3', D: '4' },
    dogru_cevap: 'D',
  };
  store.setAllData([dummyQ]);
  store.setBookletQuestions([dummyQ]);
  store.clearAllUserMarkedChoices(false);
  store.setRematchQuestionIds([88883], false);
  store.setWaterStreak(10, false);

  handleSelectOpticalBubble(88883, 'D');
  handleSelectOpticalBubble(88883, 'D');

  assert.equal(state.waterStreak, 13, 'Rövanşta 6 kredilik MAT sorusu %50 (+3) yıldız vermeli');
  assert.equal(state.rematchQuestionIds.has(88883), false, 'Rövanş çözüldüğünde sepetten çıkmalı');
});
