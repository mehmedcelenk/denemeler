import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { parseQuestionLesson, parseQuestionLessons } from '../src/data/lesson.ts';
import type { Question } from '../src/data/question.ts';
import { renderLessonInline, renderLessonRichText } from '../src/features/lessons/rich-text.ts';
import {
  renderLessonEmptyMarkup,
  renderLessonInlineHost,
  renderLessonInlineMarkup,
  renderLessonToolbarButton,
} from '../src/features/lessons/lesson-view.ts';

const sampleQuestion: Question = {
  id: 4201,
  subject: 'MAT',
  ders: 'MATEMATİK – 1',
  soru_no: 3,
  soru: '2^3 · 2^2 işleminin sonucu kaçtır?',
  secenekler: { A: '16', B: '32', C: '64', D: '128' },
  dogru_cevap: 'B',
};

const sampleLesson = parseQuestionLesson({
  questionId: 4201,
  subject: 'MAT',
  title: 'Üslü Sayılarda Taban Birliği',
  explanation: 'Aynı taban altında çarpılan sayılarda taban değişmez, yalnızca üsler toplanır: $2^3 \\cdot 2^2 = 2^5$.\n\n$2^5 = 32$ olduğundan doğru seçenek **B** şıkkıdır; tabanları da çarpmak en sık yapılan hatadır.',
  ezber: {
    rhyme: 'Taban birse durur saf,\nÜsler eklenir, netleşir taraf.',
  },
  concepts: [
    {
      term: 'Taban',
      definition: 'Kendisiyle art arda çarpılan ana sayıdır.',
      example: '$2^5$ ifadesinde taban 2’dir.',
      emoji: '🧱',
    },
    {
      term: 'Üs',
      definition: 'Tabanın kaç kere yan yana çarpılacağını söyleyen sayaçtır.',
      emoji: '⚡',
    },
  ],
  model: 'deepseek-v4.1-flash',
  version: 3,
});

test('rich-text: XSS saldırılarını temizler, KaTeX işler ve metin içi kavramları tıklanabilir yapar', () => {
  const xss = renderLessonRichText(
    '<script>alert(1)</script> **Taban** aynıysa $x^2 + 1$ olur.',
    sampleLesson.concepts,
  );
  assert.ok(!xss.includes('<script>'));
  assert.ok(xss.includes('&lt;script&gt;'));
  assert.ok(xss.includes('katex'));
  assert.ok(xss.includes('class="vocab-word concept-word lesson-concept-word"'));
  assert.ok(xss.includes('data-lesson-term="Taban"'));

  const inline = renderLessonInline('<img src=x onerror=alert(1)> *italik*');
  assert.ok(!inline.includes('<img'));
  assert.ok(inline.includes('<em>italik</em>'));
});

test('renderLessonToolbarButton ve renderLessonInlineHost: şekilli soruda boş döner, tekil ID üretmez', () => {
  assert.equal(renderLessonToolbarButton({ ...sampleQuestion, sekilli: true }, true), '');
  assert.equal(renderLessonInlineHost({ ...sampleQuestion, sekilli: true }), '');

  const readyHtml = renderLessonToolbarButton(sampleQuestion, true, true);
  assert.ok(readyHtml.includes('data-action="open-question-lesson"'));
  assert.ok(readyHtml.includes('is-ready'));
  assert.ok(readyHtml.includes('is-open'));
  assert.ok(readyHtml.includes('aria-expanded="true"'));

  const hostHtml = renderLessonInlineHost(sampleQuestion);
  assert.ok(hostHtml.includes('data-role="lesson-inline-host"'));
  assert.ok(!hostHtml.includes(' id='));
});

test('renderLessonInlineMarkup: sade başlık, Pareto anlatım, metin içi kavram ve Öğrenmenin Küçük Bir Hilesi üretir', () => {
  const html = renderLessonInlineMarkup(sampleLesson);
  assert.ok(html.includes('data-role="lesson-inline-panel"'));
  assert.ok(html.includes('Üslü Sayılarda Taban Birliği'));
  assert.ok(html.includes('Öğrenmenin Küçük Bir Hilesi'));
  assert.ok(html.includes('ağırlığı basmaya devam et'));
  assert.ok(!html.includes('lesson-ezber-box'));
  assert.ok(!html.includes('data-role="lesson-visual"'));
  assert.ok(!html.includes('lesson-minigame-card'));
  assert.ok(!html.includes('lesson-notebook-card'));
  assert.ok(html.includes('lesson-concept-word'));
});

test('renderLessonEmptyMarkup: anlatımı olmayan soruda zarif inline bilgilendirme üretir', () => {
  const html = renderLessonEmptyMarkup(sampleQuestion);
  assert.ok(html.includes('anlatım hazırlanıyor'));
  assert.ok(html.includes('data-lesson-close'));
});

test('data/lessons altındaki tüm pilot ders anlatımları KaTeX hatasız, inline kavramlı ve güvenli HTML olarak çizilir', () => {
  if (!existsSync('data/lessons')) return;
  const files = readdirSync('data/lessons').filter(name => name.endsWith('.json'));
  for (const file of files) {
    const lessons = parseQuestionLessons(JSON.parse(readFileSync(`data/lessons/${file}`, 'utf8')));
    for (const lesson of lessons) {
      const html = renderLessonInlineMarkup(lesson);
      assert.ok(!html.includes('katex-error'), `${file}#${lesson.questionId}: KaTeX render hatası`);
      assert.ok(!html.includes('<script'), `${file}#${lesson.questionId}: güvensiz script içeriği`);
      assert.ok(html.includes('lesson-trick-card'), `${file}#${lesson.questionId}: Öğrenmenin Küçük Bir Hilesi bölümü eksik`);
      assert.ok(html.includes('lesson-concept-word'), `${file}#${lesson.questionId}: metin içi tıklanabilir kavram eşleşmedi`);
    }
  }
});
