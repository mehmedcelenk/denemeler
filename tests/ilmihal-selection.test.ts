import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { store } from '../src/app/state.ts';
import { getProgramSubjectList } from '../src/features/subjects/selection-model.ts';
import { matchesSubject } from '../src/data/subjects.js';
import { parseQuestions } from '../src/data/question.ts';

test('İlmihal programı ve ders listesi doğru döner', () => {
  const ilmihal = getProgramSubjectList('ILMIHAL');
  assert.equal(ilmihal.length, 10);
  assert.ok(ilmihal.some(s => s.id === 'ILM_TEMIZLIK'));
  assert.ok(ilmihal.some(s => s.id === 'ILM_NAMAZ'));
  assert.ok(ilmihal.some(s => s.id === 'ILM_CUMA'));
  assert.ok(ilmihal.some(s => s.id === 'ILM_CENAZE'));
  assert.ok(ilmihal.some(s => s.id === 'ILM_ORUC'));
  assert.ok(ilmihal.some(s => s.id === 'ILM_ZEKAT'));
  assert.ok(ilmihal.some(s => s.id === 'ILM_HAC'));
  assert.ok(ilmihal.some(s => s.id === 'ILM_HAC_FIKHI'));
  assert.ok(ilmihal.some(s => s.id === 'ILM_KURBAN'));
  assert.ok(ilmihal.some(s => s.id === 'ILM_DENEME'));
});

test('İlmihal ders eşleşmeleri branşlara doğru bağlanır', () => {
  assert.ok(matchesSubject({ ders: 'TEMİZLİK SORULARI' }, 'ILM_TEMIZLIK'));
  assert.ok(matchesSubject({ ders: 'NAMAZ SORULARI' }, 'ILM_NAMAZ'));
  assert.ok(matchesSubject({ ders: 'CUMA VE HUTBE SORULARI' }, 'ILM_CUMA'));
  assert.ok(matchesSubject({ ders: 'CENAZE SORULARI' }, 'ILM_CENAZE'));
  assert.ok(matchesSubject({ ders: 'ORUÇ SORULARI' }, 'ILM_ORUC'));
  assert.ok(matchesSubject({ ders: 'ZEKÂT TESTİ - 1' }, 'ILM_ZEKAT'));
  assert.ok(matchesSubject({ ders: 'ZEKÂT TESTİ - 2' }, 'ILM_ZEKAT'));
  assert.ok(matchesSubject({ ders: 'HAC VE UMRE SORULARI' }, 'ILM_HAC'));
  assert.ok(matchesSubject({ ders: 'HAC FIKHI - 1' }, 'ILM_HAC_FIKHI'));
  assert.ok(matchesSubject({ ders: 'KURBAN VE YEMİN SORULARI' }, 'ILM_KURBAN'));
  assert.ok(matchesSubject({ ders: 'GENEL DENEME SINAVI' }, 'ILM_DENEME'));
});

test('İlmihal ders dosyaları soru sözleşmesine ve cevap anahtarına uyar', () => {
  const expectedCounts: Record<string, number> = {
    ILM_TEMIZLIK: 73,
    ILM_NAMAZ: 130,
    ILM_CUMA: 38,
    ILM_CENAZE: 35,
    ILM_ORUC: 30,
    ILM_ZEKAT: 164,
    ILM_HAC: 84,
    ILM_HAC_FIKHI: 177,
    ILM_KURBAN: 13,
    ILM_DENEME: 60,
  };

  let totalQuestions = 0;
  for (const [subjId, expCount] of Object.entries(expectedCounts)) {
    const raw = JSON.parse(readFileSync(`data/subjects/${subjId}.json`, 'utf8'));
    const questions = parseQuestions(raw);
    assert.equal(questions.length, expCount, `${subjId} soru sayısı eşleşmedi`);
    for (const q of questions) {
      assert.ok(q.id >= 60000 && q.id < 70000, `Geçersiz ID aralığı: ${q.id}`);
      assert.ok(['A', 'B', 'C', 'D'].includes(q.dogru_cevap), `Geçersiz cevap: ${q.dogru_cevap}`);
      assert.ok(q.secenekler.A && q.secenekler.B && q.secenekler.C && q.secenekler.D);
      assert.ok(q.soru && q.soru.length > 5);
    }
    totalQuestions += questions.length;
  }
  assert.equal(totalQuestions, 804);
});

test('Girişimcilik programı ve ders eşleşmeleri doğru döner', () => {
  const gir = getProgramSubjectList('GIRISIMCILIK');
  assert.equal(gir.length, 1);
  assert.equal(gir[0].id, 'GIR_TEMEL');
  assert.ok(matchesSubject({ ders: 'GİRİŞİMCİLİK – 1' }, 'GIR_TEMEL'));
  assert.ok(matchesSubject({ ders: 'GİRİŞİMCİLİK – 2' }, 'GIR_TEMEL'));

  const raw = JSON.parse(readFileSync('data/subjects/GIR_TEMEL.json', 'utf8'));
  const questions = parseQuestions(raw);
  assert.equal(questions.length, 22);
  for (const q of questions) {
    assert.ok(q.id >= 70000 && q.id < 80000);
    assert.ok(['A', 'B', 'C', 'D'].includes(q.dogru_cevap));
  }
});
