import type { RoomMessagePayload, RoomState, StudentStats } from './types.ts';
import { persistCurrentRoomSession } from './session-store.ts';

export function buildMyStatsPayload(state: RoomState, peerId: string, joinedAt: number): RoomMessagePayload {
  const stats = state.studentStats[peerId];
  if (!stats || state.isHost) return { joinedAt };
  return {
    joinedAt,
    correctCount: stats.correctCount,
    incorrectCount: stats.incorrectCount,
    exitCount: stats.exitCount,
    totalAwayMs: stats.totalAwayMs,
  };
}

export function createInitialStudentStats(
  peerId: string,
  userName: string,
  joinedAt: number,
  now: number,
  savedStats?: StudentStats
): StudentStats {
  if (savedStats) {
    return { ...savedStats, id: peerId, name: userName, joinedAt, lastSeenAt: now, isOnline: true };
  }
  return {
    id: peerId,
    name: userName,
    correctCount: 0,
    incorrectCount: 0,
    joinedAt,
    exitCount: 0,
    totalAwayMs: 0,
    lastSeenAt: now,
    isOnline: true,
  };
}

export function applyStudentAnswer(
  state: RoomState,
  peerId: string,
  answeredQuestions: Map<number, boolean>,
  questionId: number,
  isCorrect: boolean
): RoomMessagePayload | null {
  if (!state.roomId || state.isHost) return null;
  const prev = answeredQuestions.get(questionId);
  if (prev === isCorrect) return null;

  const stats = state.studentStats[peerId];
  if (stats) {
    if (prev === undefined) {
      if (isCorrect) stats.correctCount++;
      else stats.incorrectCount++;
    } else if (prev === false && isCorrect) {
      stats.incorrectCount = Math.max(0, stats.incorrectCount - 1);
      stats.correctCount++;
    } else if (prev === true && !isCorrect) {
      stats.correctCount = Math.max(0, stats.correctCount - 1);
      stats.incorrectCount++;
    }
    persistCurrentRoomSession(state, peerId);
  }

  answeredQuestions.set(questionId, isCorrect);
  return {
    questionId,
    isCorrect,
    correctCount: stats?.correctCount ?? 0,
    incorrectCount: stats?.incorrectCount ?? 0,
  };
}

export function applyRevokeStudentAnswer(
  state: RoomState,
  peerId: string,
  answeredQuestions: Map<number, boolean>,
  questionId: number
): RoomMessagePayload | null {
  if (!state.roomId || state.isHost) return null;
  const prev = answeredQuestions.get(questionId);
  if (prev === undefined) return null;

  const stats = state.studentStats[peerId];
  if (stats) {
    if (prev === true) stats.correctCount = Math.max(0, stats.correctCount - 1);
    else stats.incorrectCount = Math.max(0, stats.incorrectCount - 1);
    persistCurrentRoomSession(state, peerId);
  }

  answeredQuestions.delete(questionId);
  return {
    questionId,
    correctCount: stats?.correctCount ?? 0,
    incorrectCount: stats?.incorrectCount ?? 0,
  };
}

