import type { Question } from '../data/question.ts';

export type BookletFilterMode = 'all' | 'rematch' | 'starred' | 'incorrect' | 'unanswered';

export function filterQuestionsByMode(
  questions: Question[],
  mode: BookletFilterMode,
  userChoices: Record<number, string>,
  rematchIds?: Set<number>,
  starredIds?: Set<number>
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
  return questions;
}

