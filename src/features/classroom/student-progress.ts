import type { RoomMessagePayload, RoomState, StudentStats } from './types.ts';
import { addFeedItem } from './message-handlers/feed.ts';
import { persistCurrentRoomSession } from './session-store.ts';

export function demoteHostToStudent(state: RoomState, peerId: string): void {
  if (!state.isHost) return;
  state.isHost = false;
  const myPeer = state.participants.find((p) => p.id === peerId);
  const joinedAt = myPeer?.joinedAt ?? Date.now();
  if (myPeer) myPeer.isHost = false;
  if (!state.studentStats[peerId]) {
    state.studentStats[peerId] = {
      id: peerId,
      name: state.userName,
      correctCount: 0,
      incorrectCount: 0,
      joinedAt,
      exitCount: 0,
      totalAwayMs: 0,
      lastSeenAt: Date.now(),
      isOnline: true,
    };
  }
  persistCurrentRoomSession(state, peerId);
}

export function applyHelpCallState(state: RoomState, peerId: string, now: number): boolean {
  if (!state.roomId || state.helpRequested) return false;
  state.helpRequested = true;
  addFeedItem(state.feedItems, {
    id: `${now}_${peerId}_help`,
    type: 'HELP_CALL',
    studentId: peerId,
    studentName: state.userName,
    timestamp: now,
  });
  return true;
}

export function applyResolveHelpState(state: RoomState, peerId: string, feedId: string, studentIdOrName: string): boolean {
  if (!state.roomId) return false;
  const item = state.feedItems.find((f) => f.id === feedId);
  if (item) item.resolved = true;
  if (studentIdOrName === peerId || studentIdOrName === state.userName) {
    state.helpRequested = false;
  }
  return true;
}

export function applyFocusLostState(state: RoomState, peerId: string, timestamp: number): boolean {
  if (!state.roomId || state.isPaused) return false;
  const openLost = state.feedItems.find(
    (f) => f.type === 'FOCUS_LOST' && f.studentId === peerId && !f.returnedAt
  );
  if (openLost) return false;

  const stats = state.studentStats[peerId];
  if (stats) {
    stats.exitCount = (stats.exitCount || 0) + 1;
    persistCurrentRoomSession(state, peerId, timestamp);
  }

  addFeedItem(state.feedItems, {
    id: `${timestamp}_${peerId}_lost`,
    type: 'FOCUS_LOST',
    studentId: peerId,
    studentName: state.userName,
    timestamp,
  });
  return true;
}

export function applyFocusRestoredState(
  state: RoomState,
  peerId: string,
  durationMs: number,
  timestamp: number
): RoomMessagePayload | null {
  if (!state.roomId || state.isPaused) return null;
  const lastLost = state.feedItems.find(
    (f) => f.type === 'FOCUS_LOST' && f.studentId === peerId && !f.returnedAt
  );
  if (lastLost) lastLost.returnedAt = timestamp;

  const stats = state.studentStats[peerId];
  if (stats && durationMs > 0) {
    stats.totalAwayMs = (stats.totalAwayMs || 0) + durationMs;
  }
  persistCurrentRoomSession(state, peerId, null);

  return {
    durationMs,
    exitCount: stats?.exitCount,
    totalAwayMs: stats?.totalAwayMs,
  };
}

export function buildMyStatsPayload(
  state: RoomState,
  peerId: string,
  joinedAt: number,
  awayDurationMs?: number
): RoomMessagePayload {
  const stats = state.studentStats[peerId];
  if (!stats || state.isHost) return { joinedAt };
  return {
    joinedAt,
    correctCount: stats.correctCount,
    incorrectCount: stats.incorrectCount,
    exitCount: stats.exitCount,
    totalAwayMs: stats.totalAwayMs,
    awayDurationMs: awayDurationMs && awayDurationMs > 0 ? awayDurationMs : undefined,
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
    return {
      id: peerId,
      name: userName,
      correctCount: Math.max(0, savedStats.correctCount || 0),
      incorrectCount: Math.max(0, savedStats.incorrectCount || 0),
      joinedAt,
      exitCount: Math.max(0, savedStats.exitCount || 0),
      totalAwayMs: Math.max(0, savedStats.totalAwayMs || 0),
      lastSeenAt: now,
      isOnline: true,
    };
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
    exitCount: stats?.exitCount ?? 0,
    totalAwayMs: stats?.totalAwayMs ?? 0,
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
    exitCount: stats?.exitCount ?? 0,
    totalAwayMs: stats?.totalAwayMs ?? 0,
  };
}
