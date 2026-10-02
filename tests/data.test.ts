import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { parseQuestions } from '../src/data/question.ts';
import { questionMatchesSearch, trNormalize } from '../src/shared/search.ts';

const sample = { id: 1, ders: 'TARİH – 1', soru: 'İstanbul hangi yılda fethedildi?', secenekler: { A: '1453', B: '1923', C: '1071', D: '1299' }, dogru_cevap: 'A', ana_konu: 'Osmanlı' };

test('tüm ders verileri sözleşmeye uyar ve manifest sayıları doğrudur', () => {
  const manifest = JSON.parse(readFileSync('src/data/generated/subjectManifest.json', 'utf8'));
  const ids = new Set<number>();
  for (const file of readdirSync('data/subjects').filter(name => name.endsWith('.json'))) {
    const questions = parseQuestions(JSON.parse(readFileSync(`data/subjects/${file}`, 'utf8')));
    assert.equal(questions.length, manifest[file.slice(0, -5)].questionCount);
    assert.equal(new Set(questions.map(q => q.ders)).size, manifest[file.slice(0, -5)].courseCount);
    for (const q of questions) {
      assert.ok(!ids.has(q.id), `Dersler arasında yinelenen kimlik: ${q.id}`);
      ids.add(q.id);
    }
  }
});

test('hatalı soru, seçenek ve yinelenen kimlik state öncesinde reddedilir', () => {
  assert.throws(() => parseQuestions({}));
  assert.throws(() => parseQuestions([{ ...sample, secenekler: { A: '1453' } }]));
  assert.throws(() => parseQuestions([{ ...sample, dogru_cevap: 'E' }]));
  assert.throws(() => parseQuestions([{ ...sample, puan: '5' }]));
  assert.throws(() => parseQuestions([sample, sample]));
});

test('Türkçe arama soru, konu ve seçenekleri bulur', () => {
  const [q] = parseQuestions([sample]);
  assert.equal(trNormalize('  İSTANBUL IĞDIR  '), 'istanbul ığdır');
  assert.ok(questionMatchesSearch(q, 'istanbul'));
  assert.ok(questionMatchesSearch(q, 'OSMANLI'));
  assert.ok(questionMatchesSearch(q, '1453'));
  assert.ok(questionMatchesSearch(q, ''));
  assert.equal(questionMatchesSearch(q, 'Ankara'), false);
});
