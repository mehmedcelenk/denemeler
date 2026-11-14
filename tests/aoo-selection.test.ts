import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getProgramSubjectList } from '../src/features/subjects/selection-model.ts';
import { getCondensedCourseCode, getShortCourseName, matchesSubject } from '../src/data/subjects.js';
import { parseQuestions } from '../src/data/question.ts';

test('AÖO (Ortaokul) programı ve 6 branş listesi doğru döner', () => {
  const aoo = getProgramSubjectList('AOO');
  assert.equal(aoo.length, 6);
  assert.deepEqual(
    aoo.map(s => s.id),
    ['AOO_TURKCE', 'AOO_MAT', 'AOO_FEN', 'AOO_SOS', 'AOO_DIN', 'AOO_ING']
  );
});

test('AÖO soruları kendi branşlarıyla eşleşir ve AOİHL dersleriyle karışmaz', () => {
  assert.ok(matchesSubject({ ders: 'AÖO TÜRKÇE – 5' }, 'AOO_TURKCE'));
  assert.ok(matchesSubject({ ders: 'AÖO MATEMATİK – 6' }, 'AOO_MAT'));
  assert.ok(matchesSubject({ ders: 'AÖO FEN BİLİMLERİ – 7' }, 'AOO_FEN'));
  assert.ok(matchesSubject({ ders: 'AÖO SOSYAL BİLGİLER – 7' }, 'AOO_SOS'));
  assert.ok(matchesSubject({ ders: 'AÖO T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 8' }, 'AOO_SOS'));
  assert.ok(matchesSubject({ ders: 'AÖO DİN KÜLTÜRÜ VE AHLAK BİLGİSİ – 8' }, 'AOO_DIN'));
  assert.ok(matchesSubject({ ders: 'AÖO İNGİLİZCE – 5' }, 'AOO_ING'));

  // AOİHL branşlarına sızmama garantisi
  assert.equal(matchesSubject({ ders: 'AÖO MATEMATİK – 5' }, 'MAT'), false);
  assert.equal(matchesSubject({ ders: 'AÖO DİN KÜLTÜRÜ VE AHLAK BİLGİSİ – 6' }, 'DIN'), false);
  assert.equal(matchesSubject({ ders: 'AÖO İNGİLİZCE – 7' }, 'ING'), false);
  assert.equal(matchesSubject({ ders: 'AÖO T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 8' }, 'INK'), false);
  assert.equal(matchesSubject({ ders: 'MATEMATİK – 1' }, 'AOO_MAT'), false);

  assert.equal(getShortCourseName('AÖO FEN BİLİMLERİ – 5'), 'FEN-5');
  assert.equal(getShortCourseName('AÖO SOSYAL BİLGİLER – 6'), 'SOS-6');
  assert.equal(getCondensedCourseCode(new Set(['AÖO FEN BİLİMLERİ – 5', 'AÖO FEN BİLİMLERİ – 6']), 'AOO_FEN'), 'FEN56');
});

test('AÖO ders dosyaları 2023-2026 dönemlerinin tamamını ve cevap anahtarlarını içerir', () => {
  const subjects = ['AOO_TURKCE', 'AOO_MAT', 'AOO_FEN', 'AOO_SOS', 'AOO_DIN', 'AOO_ING'];
  let total = 0;

  for (const subjId of subjects) {
    const raw = JSON.parse(readFileSync(`data/subjects/${subjId}.json`, 'utf8'));
    const questions = parseQuestions(raw);
    assert.equal(questions.length, 372, `${subjId} soru sayısı 372 olmalı`);
    const courses = new Set(questions.map(q => q.ders));
    assert.equal(courses.size, 4, `${subjId} 5, 6, 7 ve 8. sınıf olmak üzere 4 kademe içermeli`);

    for (const q of questions) {
      assert.ok(q.id >= 80001 && q.id < 90000, `Geçersiz ID aralığı: ${q.id}`);
      assert.ok(['A', 'B', 'C', 'D'].includes(q.dogru_cevap), `Geçersiz cevap: ${q.dogru_cevap}`);
      assert.ok(q.yil && ['2023-2024', '2024-2025', '2025-2026'].includes(q.yil));
      assert.ok(q.donem && ['1', '2', '3'].includes(String(q.donem)));
    }
    total += questions.length;
  }

  assert.equal(total, 2232);
});
