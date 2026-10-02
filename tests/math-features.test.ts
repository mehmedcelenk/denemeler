import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMathText, renderMathFormula } from '../src/shared/math-render.ts';
import { getFormulasForQuestion } from '../src/features/formulas/formula-dict.ts';
import { getQuestionDifficulty } from '../src/shared/difficulty.ts';
import type { Question } from '../src/data/question.ts';

test('renderMathFormula: LaTeX ifadelerini KaTeX HTML yapısına dönüştürür', () => {
  const result = renderMathFormula('\\Delta = b^2 - 4ac');
  assert.ok(result.includes('class="katex"'), 'KaTeX span üretilmeli');
});

test('renderMathText: Soru metnindeki inline $...$ veya matematik formüllerini dönüştürür', () => {
  const input = 'x 2 + 6x + 10 = 0 denkleminin diskriminantı $\\Delta$ kaçtır?';
  const result = renderMathText(input);
  assert.ok(result.includes('class="katex"'), 'Inline LaTeX tespit edilip render edilmeli');
});

test('getFormulasForQuestion: Anahtar sembol ve kavramlara göre doğru formülleri çeker', () => {
  const formulas = getFormulasForQuestion('x 2 + 6x + 10 = 0 denkleminin kökleri nedir?', 'İkinci Dereceden Denklemler');
  assert.ok(formulas.length > 0, 'Diskriminant veya kök formülü bulunmalı');
  const hasDelta = formulas.some(f => f.id === 'diskriminant' || f.id === 'kokler_bagintisi');
  assert.ok(hasDelta, 'Diskriminant veya kök bağıntısı kartı dönmeli');
});

test('getQuestionDifficulty: Soru özelliklerine göre Kek, Orta veya Boss seviyesi belirler', () => {
  const bossQ: Question = {
    id: 99991,
    ders: 'MATEMATİK – 4',
    soru: 'Şekildeki prizmanın cisim köşegen uzunluğu 12 birimdir.',
    secenekler: { A: '1', B: '2', C: '3', D: '4' },
    dogru_cevap: 'A',
    ana_konu: 'Katı Cisimler',
    alt_konu: 'Katı Cisimler (Prizma, Silindir, Piramit, Küp)',
  };
  const diff = getQuestionDifficulty(bossQ);
  assert.equal(diff.level, 'boss', 'Prizma/katı cisim sorusu boss olmalı');
});
