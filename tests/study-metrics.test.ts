import assert from 'node:assert/strict';
import test from 'node:test';
import type { Choice, Question } from '../src/data/question.ts';
import {
  buildStudyMetrics,
  CALIBRATION_THRESHOLD,
  computeThresholdPercent,
  extractCourseTerm,
  type ResponsibleCourseMeta,
  type SubjectMeta,
} from '../src/shared/study-metrics.ts';

function makeQuestion(id: number, correct: Choice, ders = 'Test Dersi'): Question {
  return {
    id,
    ders,
    soru: `Soru ${id}`,
    secenekler: { A: 'A', B: 'B', C: 'C', D: 'D' },
    dogru_cevap: correct,
  };
}

const CATALOG: SubjectMeta[] = [
  { id: 'TDE', name: 'Türk Dili ve Ed.', icon: '📚' },
  { id: 'MAT', name: 'Matematik', icon: '📐' },
  { id: 'TAR', name: 'Tarih', icon: '🏺' },
  { id: 'AOO_TURKCE', name: 'Türkçe', icon: '📚' },
  { id: 'TYT_TURKCE', name: 'TYT Türkçe', icon: '📚' },
];

test('extractCourseTerm parses AÖL dönem and AÖO sınıf properly', () => {
  assert.deepEqual(extractCourseTerm('TÜRK DİLİ VE EDEBİYATI – 3', 'TDE'), { order: 3, label: '3. Dönem' });
  assert.deepEqual(extractCourseTerm('AÖO TÜRKÇE – 6', 'AOO_TURKCE'), { order: 6, label: '6. Sınıf' });
  assert.equal(extractCourseTerm('TYT TÜRKÇE', 'TYT_TURKCE'), null);
});

test('computeThresholdPercent returns 0 below threshold', () => {
  assert.equal(CALIBRATION_THRESHOLD, 10);
  assert.equal(computeThresholdPercent(0, 0), 0);
  assert.equal(computeThresholdPercent(9, 9), 0);
  assert.equal(computeThresholdPercent(10, 10), 100);
  assert.equal(computeThresholdPercent(7, 10), 70);
});

test('buildStudyMetrics locks totalPercentage at 0 when no responsible courses are selected', () => {
  const tdeQuestions = Array.from({ length: 10 }, (_, i) => makeQuestion(100 + i, 'A', 'TÜRK DİLİ VE EDEBİYATI – 1'));
  const choices: Record<number, Choice> = {};
  for (let i = 0; i < 10; i++) choices[100 + i] = i < 8 ? 'A' : 'B';

  const metrics = buildStudyMetrics(choices, new Set([108, 109]), new Map([['TDE', tdeQuestions]]), CATALOG, []);
  assert.equal(metrics.hasResponsibleCourses, false);
  assert.equal(metrics.totalPercentage, 0);
  assert.equal(metrics.isTotalCalibrated, false);
  assert.equal(metrics.attemptedPercentage, 80);
  assert.equal(metrics.subjects.length, 1);
  assert.equal(metrics.subjects[0].percentage, 80);
});

test('buildStudyMetrics: 10 sorumlu dersten 3 tanesi çözülüp kalanlar çözülmediyse sorumlu başarı %0 kilitli kalır', () => {
  const responsible: ResponsibleCourseMeta[] = Array.from({ length: 10 }, (_, i) => ({
    subjectId: 'TDE',
    ders: `DERS – ${i + 1}`,
    shortName: `DERS-${i + 1}`,
    termOrder: i + 1,
    kredi: 2,
    questionCount: 80,
  }));

  const questions: Question[] = [];
  const choices: Record<number, Choice> = {};
  const rematch = new Set<number>();

  // İlk 3 dersten 20'şer soru çözülüp 13'er doğru (%65) yapılsın; kalan 7 dersten 0 soru
  for (let c = 0; c < 3; c++) {
    const ders = `DERS – ${c + 1}`;
    for (let i = 0; i < 20; i++) {
      const qid = (c + 1) * 100 + i;
      questions.push(makeQuestion(qid, 'A', ders));
      choices[qid] = i < 13 ? 'A' : 'B';
      if (i >= 13) rematch.add(qid);
    }
  }

  const metrics = buildStudyMetrics(choices, rematch, new Map([['TDE', questions]]), CATALOG, responsible);
  assert.equal(metrics.hasResponsibleCourses, true);
  assert.equal(metrics.responsibleCount, 10);
  assert.equal(metrics.startedCourseCount, 3);
  assert.equal(metrics.calibratedCourseCount, 3);
  assert.equal(metrics.unstartedCourseCount, 7);
  assert.equal(metrics.isTotalCalibrated, false);
  assert.equal(metrics.attemptedPercentage, 65);
  assert.equal(metrics.totalPercentage, 0);
  assert.equal(metrics.potentialPercentage, 0);
  assert.equal(metrics.courses.length, 10);
});

test('buildStudyMetrics: bir sorumlu derste 9 soru çözülse bile genel yüzdelik açılmaz', () => {
  const responsible: ResponsibleCourseMeta[] = [
    { subjectId: 'MAT', ders: 'MATEMATİK – 1', shortName: 'MAT-1', termOrder: 1, kredi: 6, questionCount: 82 },
    { subjectId: 'TAR', ders: 'TARİH – 1', shortName: 'TAR-1', termOrder: 1, kredi: 2, questionCount: 82 },
  ];
  const matQs = Array.from({ length: 10 }, (_, i) => makeQuestion(100 + i, 'A', 'MATEMATİK – 1'));
  const tarQs = Array.from({ length: 10 }, (_, i) => makeQuestion(200 + i, 'B', 'TARİH – 1'));
  const choices: Record<number, Choice> = {};
  for (let i = 0; i < 10; i++) choices[100 + i] = 'A';
  for (let i = 0; i < 9; i++) choices[200 + i] = 'B';

  const metrics = buildStudyMetrics(
    choices,
    new Set(),
    new Map([['MAT', matQs], ['TAR', tarQs]]),
    CATALOG,
    responsible,
  );
  assert.equal(metrics.calibratedCourseCount, 1);
  assert.equal(metrics.isTotalCalibrated, false);
  assert.equal(metrics.totalPercentage, 0);
  assert.equal(metrics.potentialPercentage, 0);
  assert.equal(metrics.attemptedPercentage, 100);
});

test('buildStudyMetrics: tüm sorumlu derslerden en az 10 soru çözülünce kredi ağırlıklı başarı açılır', () => {
  const responsible: ResponsibleCourseMeta[] = [
    { subjectId: 'MAT', ders: 'MATEMATİK – 1', shortName: 'MAT-1', termOrder: 1, kredi: 6, questionCount: 82 },
    { subjectId: 'TAR', ders: 'TARİH – 1', shortName: 'TAR-1', termOrder: 1, kredi: 2, questionCount: 82 },
  ];
  const matQs = Array.from({ length: 10 }, (_, i) => makeQuestion(100 + i, 'A', 'MATEMATİK – 1'));
  const tarQs = Array.from({ length: 10 }, (_, i) => makeQuestion(200 + i, 'B', 'TARİH – 1'));
  const choices: Record<number, Choice> = {};
  const rematch = new Set<number>();
  for (let i = 0; i < 10; i++) choices[100 + i] = 'A'; // MAT-1: %100 (6 kredi)
  for (let i = 0; i < 10; i++) {
    choices[200 + i] = i < 6 ? 'B' : 'A'; // TAR-1: %60 (2 kredi)
    if (i >= 6) rematch.add(200 + i);
  }

  const metrics = buildStudyMetrics(
    choices,
    rematch,
    new Map([['MAT', matQs], ['TAR', tarQs]]),
    CATALOG,
    responsible,
  );
  assert.equal(metrics.totalCredits, 8);
  assert.equal(metrics.calibratedCourseCount, 2);
  assert.equal(metrics.isTotalCalibrated, true);
  assert.equal(metrics.totalPercentage, 90); // (100*6 + 60*2) / 8 = 90
  assert.equal(metrics.potentialPercentage, 100); // Rövanşlar temizlenince (100*6 + 100*2) / 8 = 100
  assert.equal(metrics.attemptedPercentage, 80); // 16/20 = %80
});
