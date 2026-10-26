import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanGloss,
  getWordTurkishGloss,
  renderInterlinearText,
  isEnglishQuestion,
} from '../src/features/english/interlinear.ts';
import { renderCardHeader, renderCardStem, renderQuestionCardHtml } from '../src/features/booklet/question-card.ts';
import type { Question } from '../src/data/question.ts';

const mockEngQuestion: Question = {
  id: 8881,
  ders: 'İNGİLİZCE – 6',
  soru: 'People usually do water sports.',
  soru_xray: '<span class="xray-sub">People</span> <span class="xray-verb">usually do</span> <span class="xray-obj">water sports.</span>',
  secenekler: {
    A: 'Where did you travel last summer',
    B: 'When is the museum open',
    C: 'Who built Haydarpaşa Railway Station',
    D: 'Which activities are popular in the Aegean Sea',
  },
  dogru_cevap: 'D',
  ana_konu: 'Tenses',
};

test('cleanGloss: parantez içi açıklamaları ve çoklu alternatifleri sadeleştirir', () => {
  assert.equal(cleanGloss('yapmak / etmek'), 'yapmak');
  assert.equal(cleanGloss('saat (tam saat)'), 'saat');
  assert.equal(cleanGloss('yapmam/yapmaz'), 'yapmam');
  assert.equal(cleanGloss(''), '');
});

test('getWordTurkishGloss: sözlük ve kısaltmaları başarıyla çözümler', () => {
  // Sözlük kelimeleri
  const sportsGloss = getWordTurkishGloss('sports');
  assert.ok(sportsGloss, 'sports kelimesinin meali bulunmalı');
  assert.equal(sportsGloss, 'spor');

  const waterGloss = getWordTurkishGloss('water');
  assert.ok(waterGloss, 'water kelimesinin meali bulunmalı');
  assert.equal(waterGloss, 'su');

  // Kısaltmalar
  const dontGloss = getWordTurkishGloss("don't");
  assert.ok(dontGloss, "don't kısaltmasının meali bulunmalı");
  assert.equal(dontGloss, 'yapmam');

  // Aynı kelimeler (çeviri = kelime) meal olarak basılmamalı
  assert.equal(getWordTurkishGloss('the'), null, "'the' için meal basılmamalı");
});

test('renderInterlinearText: kelimeleri interlinear ruby etiketiyle sarar ve HTML etiketlerini korur', () => {
  const input = '<span class="xray-sub">People</span> <span class="xray-verb">usually do</span>';
  const output = renderInterlinearText(input);

  // HTML etiketleri korunmalı
  assert.ok(output.includes('<span class="xray-sub">'), 'HTML açılış etiketi korunmalı');
  assert.ok(output.includes('</span>'), 'HTML kapanış etiketi korunmalı');

  // Kelimeler ruby ile sarılmalı
  assert.ok(output.includes('<ruby class="interlinear-word">People<rt class="interlinear-gloss">insanlar</rt></ruby>'));
  assert.ok(output.includes('<ruby class="interlinear-word">usually<rt class="interlinear-gloss">genellikle</rt></ruby>'));
});

test('isEnglishQuestion: ders adına veya state bilgisine göre İngilizceyi tespit eder', () => {
  assert.equal(isEnglishQuestion(mockEngQuestion), true);
  assert.equal(isEnglishQuestion({
    id: 9992,
    ders: 'TARİH 1',
    soru: 'İlk Türk devleti hangisidir?',
    secenekler: { A: 'A', B: 'B', C: 'C', D: 'D' },
    dogru_cevap: 'A',
  }), false);
});

test('renderCardHeader: İngilizce sorusunda ML (Meal) butonunu üretir', () => {
  const headerHtml = renderCardHeader(mockEngQuestion, 1, false);
  assert.ok(headerHtml.includes('id="btnMeal_8881"'), 'ML butonu üretilmeli');
  assert.ok(headerHtml.includes('ML</button>'), 'ML metni yer almalı');
});

test('renderCardStem: soru kökünü standart veya mealli olarak hatasız üretir', () => {
  const stemHtml = renderCardStem(mockEngQuestion);
  assert.ok(stemHtml.length > 0);
  assert.ok(stemHtml.includes('People'));
});
