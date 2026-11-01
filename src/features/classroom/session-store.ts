import { readJson, remove, writeJson } from '../../app/storage.ts';
import { StorageKeys } from '../../shared/storage-keys.ts';
import type { RoomState, StudentStats } from './types.ts';

export interface StoredSession {
  peerId: string;
  roomId: string;
  userName: string;
  isHost: boolean;
  joinedAt: number;
  timestamp: number;
  myStats?: StudentStats;
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

export function saveRoomSession(session: StoredSession): void {
  writeJson(StorageKeys.CLASSROOM_SESSION, session);
}

export function loadRoomSession(): StoredSession | null {
  return readJson<StoredSession | null>(StorageKeys.CLASSROOM_SESSION, isStoredSession, null);
}

export function clearRoomSession(): void {
  remove(StorageKeys.CLASSROOM_SESSION);
}

export function persistCurrentRoomSession(state: RoomState, peerId: string): void {
  if (!state.roomId) return;
  const myPeer = state.participants.find((p) => p.id === peerId);
  const existing = loadRoomSession();
  const joinedAt = myPeer?.joinedAt ?? existing?.joinedAt ?? Date.now();
  saveRoomSession({
    peerId,
    roomId: state.roomId,
    userName: state.userName,
    isHost: state.isHost,
    joinedAt,
    timestamp: Date.now(),
    myStats: state.studentStats[peerId],
  });
}
