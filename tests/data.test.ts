import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { parseQuestions } from '../src/data/question.ts';
import { questionMatchesSearch, trNormalize } from '../src/shared/search.ts';

const sample = { id: 1, ders: 'TARİH – 1', soru: 'İstanbul hangi yılda fethedildi?', secenekler: { A: '1453', B: '1923', C: '1071', D: '1299' }, dogru_cevap: 'A', ana_konu: 'Osmanlı' };

test('tüm ders verileri sözleşmeye uyar ve manifest sayıları doğrudur', () => {
  const manifest = JSON.parse(readFileSync('src/data/generated/subjectManifest.json', 'utf8'));
  const courseCatalog = JSON.parse(readFileSync('src/data/generated/courseCatalog.json', 'utf8')) as Array<{
    subjectId: string; ders: string; questionCount: number; kredi: number;
  }>;
  const catalogBySubject = new Map<string, Map<string, number>>();
  for (const entry of courseCatalog) {
    let map = catalogBySubject.get(entry.subjectId);
    if (!map) { map = new Map(); catalogBySubject.set(entry.subjectId, map); }
    map.set(entry.ders, entry.questionCount);
  }
  const ids = new Set<number>();
  for (const file of readdirSync('data/subjects').filter(name => name.endsWith('.json'))) {
    const sid = file.slice(0, -5);
    const questions = parseQuestions(JSON.parse(readFileSync(`data/subjects/${file}`, 'utf8')));
    assert.equal(questions.length, manifest[sid].questionCount);
    assert.equal(new Set(questions.map(q => q.ders)).size, manifest[sid].courseCount);
    const actualCounts = new Map<string, number>();
    for (const q of questions) {
      assert.ok(!ids.has(q.id), `Dersler arasında yinelenen kimlik: ${q.id}`);
      ids.add(q.id);
      actualCounts.set(q.ders, (actualCounts.get(q.ders) ?? 0) + 1);
    }
    const catMap = catalogBySubject.get(sid);
    assert.ok(catMap, `courseCatalog.json içinde eksik branş: ${sid}`);
    assert.equal(catMap.size, actualCounts.size);
    for (const [ders, count] of actualCounts.entries()) {
      assert.equal(catMap.get(ders), count, `courseCatalog.json soru sayısı uyuşmuyor: ${ders}`);
    }
  }
});

test('hatalı soru, seçenek ve yinelenen kimlik state öncesinde reddedilir', () => {
  assert.throws(() => parseQuestions({}));
  assert.throws(() => parseQuestions([{ ...sample, secenekler: { A: '1453' } }]));
  assert.throws(() => parseQuestions([{ ...sample, dogru_cevap: 'E' }]));
  assert.throws(() => parseQuestions([{ ...sample, secenekler: { ...sample.secenekler, E: 123 } }]));
  assert.throws(() => parseQuestions([{ ...sample, dogru_cevap: 'E', secenekler: { ...sample.secenekler, E: ' ' } }]));
  assert.throws(() => parseQuestions([{ ...sample, secenekler_xray: { A: 123 } }]));
  assert.equal(parseQuestions([{ ...sample, secenekler_xray: { A: '<span>1453</span>' } }]).length, 1);
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
