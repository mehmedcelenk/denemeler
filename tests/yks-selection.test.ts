import test from 'node:test';
import assert from 'node:assert/strict';
import { store } from '../src/app/state.ts';
import { getProgramSubjectList } from '../src/features/subjects/selection-model.ts';
import { renderSubjectRowsHtml } from '../src/features/subjects/subject-rows.ts';
import { matchesSubject } from '../src/data/subjects.js';
import { choices, parseQuestions } from '../src/data/question.ts';
import { readFileSync } from 'node:fs';

test('YKS ve AÖL/AÖF program ders listeleri doğru döner', () => {
  const aoihl = getProgramSubjectList('AOIHL');
  assert.equal(aoihl.length, 13);

  const aof = getProgramSubjectList('AOF');
  assert.equal(aof.length, 6);

  const tyt = getProgramSubjectList('TYT');
  assert.equal(tyt.length, 9);
  assert.ok(tyt.some(s => s.id === 'TYT_TURKCE'));
  assert.ok(tyt.some(s => s.id === 'TYT_MAT'));

  const ayt = getProgramSubjectList('AYT');
  assert.equal(ayt.length, 11);
  assert.ok(ayt.some(s => s.id === 'AYT_MAT'));
  assert.ok(ayt.some(s => s.id === 'AYT_EDB'));
  assert.ok(ayt.some(s => s.id === 'AYT_FIZ'));

  const ydt = getProgramSubjectList('YDT');
  assert.equal(ydt.length, 1);
  assert.equal(ydt[0].id, 'YDT_ING');
});

test('YKS modlarında dönem çipleri ve bölü çizgisi gizlenir', () => {
  store.setProgramMode('TYT');
  const tytHtml = renderSubjectRowsHtml([{ id: 'TYT_TURKCE', name: 'TYT Türkçe', icon: '📚' }]);
  assert.ok(!tytHtml.includes('row-level-chips'));
  assert.ok(!tytHtml.includes('row-slash'));

  store.setProgramMode('AYT');
  const aytHtml = renderSubjectRowsHtml([{ id: 'AYT_MAT', name: 'AYT Matematik', icon: '📐' }]);
  assert.ok(!aytHtml.includes('row-level-chips'));
  assert.ok(!aytHtml.includes('row-slash'));

  store.setProgramMode('YDT');
  const ydtHtml = renderSubjectRowsHtml([{ id: 'YDT_ING', name: 'YDT İngilizce', icon: '🌐' }]);
  assert.ok(!ydtHtml.includes('row-level-chips'));
  assert.ok(!ydtHtml.includes('row-slash'));

  store.setProgramMode('AOIHL');
  const aoihlHtml = renderSubjectRowsHtml([{ id: 'TDE', name: 'Türk Dili ve Ed.', icon: '📚' }]);
  assert.ok(aoihlHtml.includes('row-level-chips'));
  assert.ok(aoihlHtml.includes('row-slash'));
});

test('YKS soruları doğru branşlarla eşleşir ve AÖL ile karışmaz', () => {
  assert.ok(matchesSubject({ ders: 'TYT TÜRKÇE' }, 'TYT_TURKCE'));
  assert.ok(matchesSubject({ ders: 'AYT MATEMATİK' }, 'AYT_MAT'));
  assert.ok(matchesSubject({ ders: 'YDT İNGİLİZCE' }, 'YDT_ING'));

  // AÖL branşlarına sızmama garantisi
  assert.equal(matchesSubject({ ders: 'TYT MATEMATİK' }, 'MAT'), false);
  assert.equal(matchesSubject({ ders: 'AYT TÜRK DİLİ VE EDEBİYATI' }, 'TDE'), false);
  assert.equal(matchesSubject({ ders: 'TYT COĞRAFYA' }, 'COG'), false);
});

test('5 seçenekli soru yapısı A-E sözleşmesini karşılar', () => {
  assert.deepEqual(choices, ['A', 'B', 'C', 'D', 'E']);
});

test('AYT_MAT.json 349 sorunun tamamını, eksiksiz soru köklerini ve KaTeX şemasını içerir', () => {
  const raw = JSON.parse(readFileSync('data/subjects/AYT_MAT.json', 'utf8'));
  const questions = parseQuestions(raw);
  assert.equal(questions.length, 349);
  assert.equal(questions[0].id, 51001);
  assert.equal(questions[0].soru_no, 1);
  assert.ok(questions[0].soru.startsWith('x, y ve z birbirinden farklı birer asal sayı olmak üzere,'));
  assert.ok(questions[0].soru.includes('$x(z - y) = 18$'));
  assert.equal(questions[0].dogru_cevap, 'B');
  assert.equal(questions[0].donem, undefined);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    assert.equal(q.soru_no, i + 1);
    assert.equal(q.ders, 'AYT MATEMATİK');
    assert.equal(q.sinav_adi, 'AYT');
    assert.equal(q.donem, undefined);
    assert.ok(q.secenekler.E && q.secenekler.E.length > 0, `Soru ${q.soru_no} E şıkkı boş olamaz`);
  }
});

