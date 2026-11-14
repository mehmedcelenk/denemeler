import test from 'node:test';
import assert from 'node:assert/strict';
import type { Question } from '../src/data/question.ts';
import {
  getQuestionInstitutionMetrics,
  getQuestionRoomMetrics,
  filterQuestionsByMode,
} from '../src/shared/question-filter.ts';

function createDummyQuestion(id: number, correct: 'A' | 'B' | 'C' | 'D'): Question {
  return {
    id,
    subject: 'TDE',
    ders: 'TÜRK DİLİ VE EDEBİYATI 1',
    soru: `Soru metni ${id}`,
    dogru_cevap: correct,
    secenekler: { A: 'A', B: 'B', C: 'C', D: 'D' },
    sekilli: false,
  };
}

test('getQuestionInstitutionMetrics: kurum şık dağılımından doğru, yanlış ve yüzdeyi doğru hesaplar', () => {
  const q = createDummyQuestion(101, 'B');
  const stat = {
    totalCount: 20,
    choiceCounts: { A: 5, B: 4, C: 10, D: 1 },
  };

  const metrics = getQuestionInstitutionMetrics(q, stat);
  assert.equal(metrics.total, 20);
  assert.equal(metrics.correct, 4); // B şıkkı
  assert.equal(metrics.wrong, 16); // 20 - 4
  assert.equal(metrics.wrongRate, 80); // 16 / 20 = %80
});

test('getQuestionInstitutionMetrics: istatistik yoksa sıfır döner', () => {
  const q = createDummyQuestion(102, 'A');
  const metrics = getQuestionInstitutionMetrics(q, undefined);
  assert.deepEqual(metrics, { total: 0, correct: 0, wrong: 0, wrongRate: 0 });
});

test('getQuestionRoomMetrics: oda doğru/yanlış toplamlarını ve hata oranını hesaplar', () => {
  const roomStat = { correct: 2, wrong: 6 };
  const metrics = getQuestionRoomMetrics(roomStat);
  assert.equal(metrics.total, 8);
  assert.equal(metrics.correct, 2);
  assert.equal(metrics.wrong, 6);
  assert.equal(metrics.wrongRate, 75); // 6 / 8 = %75
});

test('filterQuestionsByMode (institution): en çok hata yapılandan en aza doğru sıralar ve 0 hatalıları eler', () => {
  const q1 = createDummyQuestion(1, 'A'); // 1 yanlış
  const q2 = createDummyQuestion(2, 'B'); // 10 yanlış
  const q3 = createDummyQuestion(3, 'C'); // 0 yanlış (hepsi doğru)
  const q4 = createDummyQuestion(4, 'D'); // hiç çözülmemiş

  const instStats = {
    1: { totalCount: 5, choiceCounts: { A: 4, B: 1 } },
    2: { totalCount: 12, choiceCounts: { A: 6, B: 2, C: 4 } },
    3: { totalCount: 8, choiceCounts: { C: 8 } },
  };

  const filtered = filterQuestionsByMode(
    [q1, q2, q3, q4],
    'institution',
    {},
    undefined,
    undefined,
    instStats,
    undefined
  );

  assert.equal(filtered.length, 2);
  assert.equal(filtered[0].id, 2); // 10 yanlış ile en başta
  assert.equal(filtered[1].id, 1); // 1 yanlış ile ikinci
});

test('filterQuestionsByMode (room): odadaki hatalı soruları sıralar', () => {
  const q1 = createDummyQuestion(1, 'A');
  const q2 = createDummyQuestion(2, 'B');
  const q3 = createDummyQuestion(3, 'C');

  const roomStats = {
    1: { correct: 1, wrong: 4 },
    2: { correct: 0, wrong: 7 },
    3: { correct: 5, wrong: 0 },
  };

  const filtered = filterQuestionsByMode(
    [q1, q2, q3],
    'room',
    {},
    undefined,
    undefined,
    undefined,
    roomStats
  );

  assert.equal(filtered.length, 2);
  assert.equal(filtered[0].id, 2); // 7 yanlış
  assert.equal(filtered[1].id, 1); // 4 yanlış
});
