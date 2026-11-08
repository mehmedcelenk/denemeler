import { readJson, remove, writeJson } from '../../app/storage.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';
import type { RoomFeedItem, RoomState, StudentStats } from './types.ts';

const RELOAD_TOLERANCE_MS = 2500;

export interface StoredSession {
  peerId: string;
  roomId: string;
  userName: string;
  isHost: boolean;
  joinedAt: number;
  timestamp: number;
  myStats?: StudentStats;
  awayStartedAt?: number;
  leftRoomId?: string;
  leftAt?: number;
  hostStudentStats?: Record<string, StudentStats>;
  hostFeedItems?: RoomFeedItem[];
}

export interface RestoredSessionPlan {
  peerId: string;
  roomId: string;
  userName: string;
  isHost: boolean;
  joinedAt: number;
  restoredStats?: StudentStats;
  awayDurationMs: number;
  hostStudentStats?: Record<string, StudentStats>;
  hostFeedItems?: RoomFeedItem[];
}

function isStoredSession(value: unknown): value is StoredSession | null {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.peerId === 'string' &&
    typeof record.roomId === 'string' &&
    typeof record.userName === 'string' &&
    typeof record.isHost === 'boolean' &&
    typeof record.timestamp === 'number'
  );
}

function readRawStoredSession(): StoredSession | null {
  return readJson<StoredSession | null>(StorageKeys.CLASSROOM_SESSION, isStoredSession, null);
}

export function saveRoomSession(session: StoredSession): void {
  writeJson(StorageKeys.CLASSROOM_SESSION, session);
}

export function loadRoomSession(): StoredSession | null {
  const session = readRawStoredSession();
  if (!session || !session.roomId) return null;
  return session;
}

export function clearRoomSession(state?: RoomState, peerId?: string): void {
  if (state && state.roomId && !state.isHost && peerId) {
    const now = Date.now();
    const currentStats = state.studentStats[peerId];
    saveRoomSession({
      peerId,
      roomId: '',
      leftRoomId: state.roomId,
      leftAt: now,
      userName: state.userName,
      isHost: false,
      joinedAt: currentStats?.joinedAt ?? now,
      timestamp: now,
      myStats: currentStats,
    });
    return;
  }
  remove(StorageKeys.CLASSROOM_SESSION);
}

export function consumeArchivedRoomJoin(
  targetRoomId: string,
  userName: string,
  now = Date.now()
): { peerId: string; joinedAt: number; stats: StudentStats; awayDurationMs: number } | null {
  const raw = readRawStoredSession();
  if (!raw || raw.roomId || !raw.leftRoomId || raw.leftRoomId !== targetRoomId || !raw.myStats) {
    return null;
  }
  const awayDurationMs = raw.leftAt && raw.leftAt > 0 ? Math.max(0, now - raw.leftAt) : 0;
  const joinedAt = Number.isFinite(raw.joinedAt) && raw.joinedAt > 0 ? raw.joinedAt : now;
  const stats: StudentStats = {
    id: raw.peerId,
    name: userName,
    correctCount: Math.max(0, raw.myStats.correctCount || 0),
    incorrectCount: Math.max(0, raw.myStats.incorrectCount || 0),
    joinedAt,
    exitCount: Math.max(0, raw.myStats.exitCount || 0) + 1,
    totalAwayMs: Math.max(0, raw.myStats.totalAwayMs || 0) + awayDurationMs,
    lastSeenAt: now,
    isOnline: true,
  };
  return { peerId: raw.peerId, joinedAt, stats, awayDurationMs };
}

export function persistCurrentRoomSession(
  state: RoomState,
  peerId: string,
  awayStartedAt?: number | null
): void {
  if (!state.roomId) return;
  const myPeer = state.participants.find((p) => p.id === peerId);
  const existing = loadRoomSession();
  const joinedAt = myPeer?.joinedAt ?? existing?.joinedAt ?? Date.now();
  const resolvedAway = awayStartedAt === null
    ? undefined
    : (awayStartedAt ?? existing?.awayStartedAt);

  saveRoomSession({
    peerId,
    roomId: state.roomId,
    userName: state.userName,
    isHost: state.isHost,
    joinedAt,
    timestamp: Date.now(),
    myStats: state.isHost ? undefined : state.studentStats[peerId],
    awayStartedAt: state.isHost ? undefined : resolvedAway,
    hostStudentStats: state.isHost ? state.studentStats : undefined,
    hostFeedItems: state.isHost ? state.feedItems.slice(0, 100) : undefined,
  });
}

export function persistAwayStartIfUnset(state: RoomState, peerId: string, timestamp: number): void {
  if (!state.roomId || state.isHost || state.isPaused) return;
  if (loadRoomSession()?.awayStartedAt) return;
  persistCurrentRoomSession(state, peerId, timestamp);
}

export function buildRestoredSessionPlan(now = Date.now()): RestoredSessionPlan | null {
  const data = loadRoomSession();
  if (!data || !data.roomId || !data.userName || !data.peerId) return null;

  const joinedAt = Number.isFinite(data.joinedAt) && data.joinedAt > 0 ? data.joinedAt : data.timestamp;
  let restoredStats = data.myStats;
  let awayDurationMs = 0;

  if (!data.isHost && typeof data.awayStartedAt === 'number' && data.awayStartedAt > 0) {
    const elapsed = Math.max(0, now - data.awayStartedAt);
    if (elapsed > RELOAD_TOLERANCE_MS) {
      awayDurationMs = elapsed;
      restoredStats = {
        id: data.peerId,
        name: data.userName,
        correctCount: Math.max(0, restoredStats?.correctCount || 0),
        incorrectCount: Math.max(0, restoredStats?.incorrectCount || 0),
        joinedAt,
        exitCount: Math.max(0, restoredStats?.exitCount || 0) + 1,
        totalAwayMs: Math.max(0, restoredStats?.totalAwayMs || 0) + elapsed,
        lastSeenAt: now,
        isOnline: true,
      };
    }
  }

  return {
    peerId: data.peerId,
    roomId: data.roomId,
    userName: data.userName,
    isHost: !!data.isHost,
    joinedAt,
    restoredStats,
    awayDurationMs,
    hostStudentStats: data.hostStudentStats,
    hostFeedItems: data.hostFeedItems,
  };
}
