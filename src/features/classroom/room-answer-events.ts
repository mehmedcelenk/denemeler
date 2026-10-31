import {
  onStateChange,
  type AnswerMarkedPayload,
  type AnswerRevokedPayload,
} from '../../app/state.ts';
import { roomService } from './room-service.ts';

let initialized = false;

function isAnswerMarkedPayload(value: unknown): value is AnswerMarkedPayload {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AnswerMarkedPayload>;
  return Number.isSafeInteger(candidate.qid) && typeof candidate.isCorrect === 'boolean';
}

function isAnswerRevokedPayload(value: unknown): value is AnswerRevokedPayload {
  if (!value || typeof value !== 'object') return false;
  return Number.isSafeInteger((value as Partial<AnswerRevokedPayload>).qid);
}

export function initRoomAnswerEvents(): void {
  if (initialized) return;
  initialized = true;
  onStateChange('answer:marked', (payload) => {
    if (isAnswerMarkedPayload(payload)) {
      roomService.logStudentAnswer(payload.qid, payload.isCorrect);
    }
  }, 20);
  onStateChange('answer:revoked', (payload) => {
    if (isAnswerRevokedPayload(payload)) roomService.revokeStudentAnswer(payload.qid);
  });
}
