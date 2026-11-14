import type { Question } from '../data/question.ts';

export type BookletFilterMode =
  | 'all'
  | 'rematch'
  | 'starred'
  | 'incorrect'
  | 'unanswered'
  | 'institution'
  | 'room';

export interface QuestionStatMetrics {
  readonly total: number;
  readonly correct: number;
  readonly wrong: number;
  readonly wrongRate: number;
}

export function getQuestionInstitutionMetrics(
  q: Question,
  stat?: { readonly totalCount: number; readonly choiceCounts: Readonly<Partial<Record<string, number>>> }
): QuestionStatMetrics {
  if (!stat || stat.totalCount <= 0) {
    return { total: 0, correct: 0, wrong: 0, wrongRate: 0 };
  }
  const correct = stat.choiceCounts[q.dogru_cevap] || 0;
  const wrong = Math.max(0, stat.totalCount - correct);
  const wrongRate = stat.totalCount > 0 ? Math.round((wrong / stat.totalCount) * 100) : 0;
  return { total: stat.totalCount, correct, wrong, wrongRate };
}

export function getQuestionRoomMetrics(
  roomStat?: { readonly correct: number; readonly wrong: number }
): QuestionStatMetrics {
  if (!roomStat) {
    return { total: 0, correct: 0, wrong: 0, wrongRate: 0 };
  }
  const total = (roomStat.correct || 0) + (roomStat.wrong || 0);
  const wrongRate = total > 0 ? Math.round(((roomStat.wrong || 0) / total) * 100) : 0;
  return { total, correct: roomStat.correct || 0, wrong: roomStat.wrong || 0, wrongRate };
}

export function filterQuestionsByMode(
  questions: Question[],
  mode: BookletFilterMode,
  userChoices: Record<number, string>,
  rematchIds?: Set<number>,
  starredIds?: Set<number>,
  institutionStats?: Record<number, { readonly totalCount: number; readonly choiceCounts: Readonly<Partial<Record<string, number>>> }>,
  roomQuestionStats?: Record<number, { readonly correct: number; readonly wrong: number }>
): Question[] {
  if (mode === 'rematch' || mode === 'incorrect') {
    return questions.filter(q => {
      const choice = userChoices[q.id];
      const isIncorrect = Boolean(choice && choice !== q.dogru_cevap);
      const isQueued = Boolean(rematchIds && rematchIds.has(q.id));
      return isIncorrect || isQueued;
    });
  }
  if (mode === 'starred') {
    return questions.filter(q => Boolean(starredIds && starredIds.has(q.id)));
  }
  if (mode === 'unanswered') {
    return questions.filter(q => !userChoices[q.id]);
  }
  if (mode === 'institution') {
    const matched = questions.filter(q => {
      const m = getQuestionInstitutionMetrics(q, institutionStats?.[q.id]);
      return m.wrong > 0;
    });
    return matched.sort((a, b) => {
      const mA = getQuestionInstitutionMetrics(a, institutionStats?.[a.id]);
      const mB = getQuestionInstitutionMetrics(b, institutionStats?.[b.id]);
      if (mB.wrong !== mA.wrong) return mB.wrong - mA.wrong;
      return mB.wrongRate - mA.wrongRate;
    });
  }
  if (mode === 'room') {
    const matched = questions.filter(q => {
      const m = getQuestionRoomMetrics(roomQuestionStats?.[q.id]);
      return m.wrong > 0;
    });
    return matched.sort((a, b) => {
      const mA = getQuestionRoomMetrics(roomQuestionStats?.[a.id]);
      const mB = getQuestionRoomMetrics(roomQuestionStats?.[b.id]);
      if (mB.wrong !== mA.wrong) return mB.wrong - mA.wrong;
      return mB.wrongRate - mA.wrongRate;
    });
  }
  return questions;
}
