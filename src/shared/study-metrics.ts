import type { Choice, Question } from '../data/question.ts';
import type {
  CourseMetric,
  ResponsibleCourseMeta,
  StudyMetrics,
  SubjectMeta,
  SubjectMetric,
  TermMetric,
} from './study-metrics-types.ts';

export type {
  CourseMetric,
  ResponsibleCourseMeta,
  StudyMetrics,
  SubjectMeta,
  SubjectMetric,
  TermMetric,
} from './study-metrics-types.ts';

export const CALIBRATION_THRESHOLD = 10;

interface MutableTermBucket {
  order: number;
  label: string;
  solved: number;
  correct: number;
}

interface MutableSubjectBucket {
  solved: number;
  correct: number;
  rematchCount: number;
  terms: Map<string, MutableTermBucket>;
}

interface MutableCourseBucket {
  solved: number;
  correct: number;
  rematchCount: number;
}

export function extractCourseTerm(ders: string, subjectId: string): { order: number; label: string } | null {
  const match = ders.match(/[–-]\s*(\d+)\s*$/);
  if (!match) return null;
  const num = Number(match[1]);
  if (!Number.isFinite(num) || num <= 0) return null;
  const suffix = subjectId.startsWith('AOO_') ? 'Sınıf' : 'Dönem';
  return { order: num, label: `${num}. ${suffix}` };
}

export function computeThresholdPercent(
  correct: number,
  total: number,
  threshold = CALIBRATION_THRESHOLD,
): number {
  if (total <= 0 || total < threshold) return 0;
  return Math.round((Math.max(0, Math.min(correct, total)) / total) * 100);
}

function buildQuestionLookup(
  subjectQuestions: ReadonlyMap<string, readonly Question[]>,
): Map<number, { subjectId: string; correctChoice: Choice; ders: string }> {
  const lookup = new Map<number, { subjectId: string; correctChoice: Choice; ders: string }>();
  for (const [subjectId, questions] of subjectQuestions.entries()) {
    for (const q of questions) {
      if (!lookup.has(q.id)) lookup.set(q.id, { subjectId, correctChoice: q.dogru_cevap, ders: q.ders });
    }
  }
  return lookup;
}

function sortCoursesByPriority(items: CourseMetric[]): CourseMetric[] {
  const rank = (c: CourseMetric): number => {
    if (c.isCalibrated && c.percentage < 70) return 0;
    if (c.solved > 0 && !c.isCalibrated) return 1;
    if (c.solved === 0) return 2;
    return 3;
  };
  return [...items].sort((a, b) => {
    const r = rank(a) - rank(b);
    if (r !== 0) return r;
    if (a.isCalibrated && b.isCalibrated && a.percentage !== b.percentage) return a.percentage - b.percentage;
    if (a.kredi !== b.kredi) return b.kredi - a.kredi;
    return a.shortName.localeCompare(b.shortName, 'tr');
  });
}

function buildResponsibleMetrics(
  responsibleCourses: readonly ResponsibleCourseMeta[],
  courseBuckets: ReadonlyMap<string, MutableCourseBucket>,
  subjectById: ReadonlyMap<string, SubjectMeta>,
  unresolvedCount: number,
  otherSolvedCount: number,
): StudyMetrics {
  let totalCredits = 0;
  let weightedPctSum = 0;
  let weightedPotentialSum = 0;
  let startedCourseCount = 0;
  let calibratedCourseCount = 0;
  let scopedSolved = 0;
  let scopedCorrect = 0;
  let scopedRematch = 0;

  const rawCourses: CourseMetric[] = responsibleCourses.map(meta => {
    const b = courseBuckets.get(meta.ders);
    const solved = b?.solved ?? 0;
    const correct = b?.correct ?? 0;
    const rematchCount = b?.rematchCount ?? 0;
    const threshold = Math.min(CALIBRATION_THRESHOLD, Math.max(1, meta.questionCount || CALIBRATION_THRESHOLD));
    const isCalibrated = solved >= threshold;
    const percentage = computeThresholdPercent(correct, solved, threshold);
    const potentialCorrect = Math.min(solved, correct + rematchCount);
    const potentialPct = computeThresholdPercent(potentialCorrect, solved, threshold);
    const credit = meta.kredi > 0 ? meta.kredi : 1;

    totalCredits += credit;
    weightedPctSum += percentage * credit;
    weightedPotentialSum += potentialPct * credit;
    if (solved > 0) startedCourseCount++;
    if (isCalibrated) calibratedCourseCount++;
    scopedSolved += solved;
    scopedCorrect += correct;
    scopedRematch += rematchCount;

    const subjectMeta = subjectById.get(meta.subjectId);
    const term = extractCourseTerm(meta.ders, meta.subjectId);
    return {
      subjectId: meta.subjectId,
      subjectName: subjectMeta?.name ?? meta.shortName,
      icon: subjectMeta?.icon ?? '📘',
      ders: meta.ders,
      shortName: meta.shortName,
      termLabel: term?.label ?? null,
      kredi: credit,
      questionCount: meta.questionCount,
      solved,
      correct,
      rematchCount,
      percentage,
      isCalibrated,
      isPriority: false,
    };
  });

  const sorted = sortCoursesByPriority(rawCourses);
  const priorityIndex = sorted.findIndex(c => c.percentage < 100);
  const courses = sorted.map((c, idx) => (idx === priorityIndex ? { ...c, isPriority: true } : c));
  const isTotalCalibrated = responsibleCourses.length > 0 && calibratedCourseCount === responsibleCourses.length;
  const totalPercentage = isTotalCalibrated && totalCredits > 0 ? Math.round(weightedPctSum / totalCredits) : 0;
  const rawPotentialPercentage = isTotalCalibrated && totalCredits > 0 ? Math.round(weightedPotentialSum / totalCredits) : 0;
  const isAttemptedCalibrated = scopedSolved >= CALIBRATION_THRESHOLD;
  const attemptedPercentage = computeThresholdPercent(scopedCorrect, scopedSolved);

  return {
    hasResponsibleCourses: true,
    responsibleCount: responsibleCourses.length,
    startedCourseCount,
    calibratedCourseCount,
    unstartedCourseCount: responsibleCourses.length - startedCourseCount,
    totalCredits,
    totalSolved: scopedSolved,
    totalCorrect: scopedCorrect,
    totalPercentage,
    attemptedPercentage,
    isAttemptedCalibrated,
    isTotalCalibrated,
    rematchCount: scopedRematch,
    potentialPercentage: Math.max(totalPercentage, rawPotentialPercentage),
    unresolvedCount,
    otherSolvedCount,
    courses,
    subjects: [],
  };
}

export function buildStudyMetrics(
  choices: Readonly<Record<number, Choice>>,
  rematchIds: ReadonlySet<number>,
  subjectQuestions: ReadonlyMap<string, readonly Question[]>,
  subjectCatalog: readonly SubjectMeta[],
  responsibleCourses: readonly ResponsibleCourseMeta[] = [],
): StudyMetrics {
  const questionLookup = buildQuestionLookup(subjectQuestions);
  const subjectById = new Map(subjectCatalog.map(s => [s.id, s]));
  const responsibleSet = new Set(responsibleCourses.map(c => c.ders));
  const hasResponsible = responsibleCourses.length > 0;

  const subjectBuckets = new Map<string, MutableSubjectBucket>();
  const courseBuckets = new Map<string, MutableCourseBucket>();
  let totalSolved = 0;
  let matchedSolved = 0;
  let totalCorrect = 0;
  let otherSolvedCount = 0;

  for (const [idKey, userChoice] of Object.entries(choices)) {
    const qid = Number(idKey);
    if (!Number.isSafeInteger(qid)) continue;
    totalSolved++;
    const info = questionLookup.get(qid);
    if (!info) continue;
    matchedSolved++;
    const isCorrect = userChoice === info.correctChoice;
    if (isCorrect) totalCorrect++;

    if (hasResponsible) {
      if (responsibleSet.has(info.ders)) {
        let cb = courseBuckets.get(info.ders);
        if (!cb) { cb = { solved: 0, correct: 0, rematchCount: 0 }; courseBuckets.set(info.ders, cb); }
        cb.solved++;
        if (isCorrect) cb.correct++;
        if (rematchIds.has(qid)) cb.rematchCount++;
      } else {
        otherSolvedCount++;
      }
      continue;
    }

    let bucket = subjectBuckets.get(info.subjectId);
    if (!bucket) { bucket = { solved: 0, correct: 0, rematchCount: 0, terms: new Map() }; subjectBuckets.set(info.subjectId, bucket); }
    bucket.solved++;
    if (isCorrect) bucket.correct++;
    if (rematchIds.has(qid)) bucket.rematchCount++;
    const term = extractCourseTerm(info.ders, info.subjectId);
    if (term) {
      let tb = bucket.terms.get(term.label);
      if (!tb) { tb = { order: term.order, label: term.label, solved: 0, correct: 0 }; bucket.terms.set(term.label, tb); }
      tb.solved++;
      if (isCorrect) tb.correct++;
    }
  }

  const unresolvedCount = Math.max(0, totalSolved - matchedSolved);
  if (hasResponsible) {
    return buildResponsibleMetrics(responsibleCourses, courseBuckets, subjectById, unresolvedCount, otherSolvedCount);
  }

  const rawSubjects: SubjectMetric[] = subjectCatalog.filter(meta => subjectBuckets.has(meta.id)).map(meta => {
    const b = subjectBuckets.get(meta.id)!;
    const terms: TermMetric[] = Array.from(b.terms.values()).sort((a, c) => a.order - c.order).map(t => ({
      termOrder: t.order, termLabel: t.label, solved: t.solved, correct: t.correct,
      percentage: computeThresholdPercent(t.correct, t.solved), isCalibrated: t.solved >= CALIBRATION_THRESHOLD,
    }));
    return {
      subjectId: meta.id, name: meta.name, icon: meta.icon, solved: b.solved, correct: b.correct,
      rematchCount: b.rematchCount, percentage: computeThresholdPercent(b.correct, b.solved),
      isCalibrated: b.solved >= CALIBRATION_THRESHOLD, isPriority: false, terms,
    };
  });
  rawSubjects.sort((a, b) => (a.isCalibrated !== b.isCalibrated ? (a.isCalibrated ? -1 : 1)
    : (a.isCalibrated && b.isCalibrated && a.percentage !== b.percentage ? a.percentage - b.percentage : b.solved - a.solved)));
  const priorityIdx = rawSubjects.findIndex(s => s.isCalibrated && s.percentage < 100);
  const subjects = rawSubjects.map((s, idx) => (idx === priorityIdx ? { ...s, isPriority: true } : s));
  const attemptedPercentage = unresolvedCount === 0
    ? computeThresholdPercent(totalCorrect, totalSolved)
    : computeThresholdPercent(totalCorrect, matchedSolved);

  return {
    hasResponsibleCourses: false, responsibleCount: 0, startedCourseCount: 0, calibratedCourseCount: 0,
    unstartedCourseCount: 0, totalCredits: 0, totalSolved, totalCorrect,
    totalPercentage: 0, attemptedPercentage, isAttemptedCalibrated: totalSolved >= CALIBRATION_THRESHOLD,
    isTotalCalibrated: false, rematchCount: rematchIds.size, potentialPercentage: 0,
    unresolvedCount, otherSolvedCount: 0, courses: [], subjects,
  };
}
