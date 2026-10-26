import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMathText, renderMathFormula, renderMathWithXray, formatConceptBubbleHtml } from '../src/shared/math-render.ts';
import { renderCardStem, renderCardOptions } from '../src/features/booklet/question-card.ts';
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

test('renderMathWithXray ve renderCardStem: Matematik sorularında soru_xray kavram balonlarını korur ve matematik sembollerini işler', () => {
  const matQ: Question = {
    id: 88801,
    ders: 'MATEMATİK – 1',
    soru: 'x ! R olmak üzere x 2 - 4 = 0 denkleminin çözüm kümesi aşağıdakilerden hangisidir?',
    soru_xray: 'x ! R olmak üzere x 2 - 4 = 0 <span class="vocab-word concept-word" data-tr="İyi tanımlanmış nesneler topluluğudur." data-ar="" data-note="MAT 1 • s. 36" onclick="showVocabBubble(this, event)">denkleminin</span> <span class="vocab-word concept-word" data-tr="Denklemi sağlayan elemanların kümesidir." data-ar="" data-note="MAT 1 • s. 92" onclick="showVocabBubble(this, event)">çözüm kümesi</span> aşağıdakilerden hangisidir?',
    secenekler: { A: 'Boş küme', B: '{-2, 2}', C: '{2}', D: '{-2}' },
    secenekler_xray: {
      A: '<span class="vocab-word concept-word" data-tr="Elemanı olmayan kümedir ($\\emptyset$)." data-ar="" data-note="MAT 1 • s. 36" onclick="showVocabBubble(this, event)">Boş küme</span>',
      B: '{-2, 2}',
      C: '{2}',
      D: '{-2}',
    },
    dogru_cevap: 'B',
  };

  const stemHtml = renderCardStem(matQ);
  assert.ok(stemHtml.includes('class="vocab-word concept-word"'), 'Matematik soru kökünde kavram balonu korunmalı');
  assert.ok(stemHtml.includes('x ∈ R'), 'Matematik soru kökünde x ! R sembolü x ∈ R olarak düzeltilmeli');
  assert.ok(stemHtml.includes('x<sup>2</sup>'), 'Matematik soru kökünde üslü ifade x² olarak işlenmeli');

  const optionsHtml = renderCardOptions(matQ, false);
  assert.ok(optionsHtml.includes('Boş küme</span>'), 'Matematik şıklarında secenekler_xray kavram balonu korunmalı');
});

test('formatConceptBubbleHtml: Kısa düz cümleyi sade bırakır, madde işaretli ve formüllü balonları liste + KaTeX olarak biçimlendirir', () => {
  const plain = formatConceptBubbleHtml('İyi tanımlanmış nesneler topluluğudur.');
  assert.equal(plain, '<span>İyi tanımlanmış nesneler topluluğudur.</span>');

  const rich = formatConceptBubbleHtml(
    'Kesin olarak doğru ($1$) ya da yanlış ($0$) hüküm bildiren ifadelere **önerme** denir.\n' +
    '• **Ve ($p \\wedge q$):** Yalnızca her ikisi de $1$ iken $1$&#x27;dir.\n' +
    '• **De Morgan:** $(p \\vee q)&#x27; \\equiv p&#x27; \\wedge q&#x27;$\n' +
    '💡 Formül: $s(A \\cup B) = s(A) + s(B) - s(A \\cap B)$'
  );
  assert.ok(rich.includes('<ul class="vocab-bubble-list"><li>'), 'Madde işaretleri liste olarak render edilmeli');
  assert.ok(rich.includes('<strong>önerme</strong>'), 'Markdown **kalın** vurgusu <strong> olarak render edilmeli');
  assert.ok(rich.includes('<strong>Ve (<span class="katex">'), 'Matematik içeren **bold** etiketleri düzgün sarılmalı');
  assert.ok(!rich.includes('katex-error'), 'KaTeX parse hatası içermemeli, prime ve tek tırnaklar çözülmeli');
  assert.ok(rich.includes('<div class="vocab-bubble-tip">'), '💡 satırı ipucu/formül kutusu olarak render edilmeli');

  const htmlTagsSample = formatConceptBubbleHtml(
    "🔊 <b>Ünlü Düşmesi</b>: Kökü 'yalın'dır (yalın-ız > yalnız).\n" +
    "💡 <b>Sınav Şifresi:</b> MEB sınavlarında en çok sorulan orta hece düşmesidir."
  );
  assert.ok(htmlTagsSample.includes('<strong>Ünlü Düşmesi</strong>'), '<b> etiketleri <strong> olarak çözümlenmeli');
  assert.ok(!htmlTagsSample.includes('&lt;b&gt;'), 'Ham &lt;b&gt; metni ekrana basılmamalı');
  assert.ok(htmlTagsSample.includes('<strong>Sınav Şifresi:</strong>'), 'İpucu içindeki <b> etiketleri <strong> olarak çözümlenmeli');
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
