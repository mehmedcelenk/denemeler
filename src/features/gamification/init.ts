import { onStateChange, type AnswerMarkedPayload } from '../../app/state.ts';
import { recordAnswerForCombo } from './combo-toast.ts';
import { addStreakPoints, resetOrDeductStreak } from './streak.ts';

let initialized = false;

function isAnswerMarkedPayload(value: unknown): value is AnswerMarkedPayload {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AnswerMarkedPayload>;
  return Number.isSafeInteger(candidate.qid)
    && ['A', 'B', 'C', 'D', 'E'].includes(candidate.choice ?? '')
    && typeof candidate.isCorrect === 'boolean';
}

export function initGamification(): void {
  if (initialized) return;
  initialized = true;

  onStateChange('answer:marked', (payload) => {
    if (!isAnswerMarkedPayload(payload)) return;
    recordAnswerForCombo(payload.isCorrect);
  }, 10);
  onStateChange('answer:marked', (payload) => {
    if (!isAnswerMarkedPayload(payload)) return;
    if (payload.isCorrect) {
      addStreakPoints(1);
    } else {
      resetOrDeductStreak(1);
    }
  }, 30);
}
