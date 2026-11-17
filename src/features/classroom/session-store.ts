import { readJson, writeJson, readSessionJson, writeSessionJson, removeSession } from '../../app/storage.ts';
import { StorageKeys, type ClassroomPendingKey } from '../../shared/storage-keys.ts';

export interface RoomSession {
  userId: string;
  roomId: string;
  roomName: string;
  connectionId: string;
  sequence: number;
}
export interface PendingAnswer { value: boolean | null; revision: number }
export type PendingAnswers = Record<string, PendingAnswer>;

function isRoomSession(value: unknown): value is RoomSession {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return ['userId', 'roomId', 'roomName', 'connectionId'].every(k => typeof v[k] === 'string' && v[k] !== '')
    && Number.isSafeInteger(v.sequence) && Number(v.sequence) >= 0;
}

export function loadRoomSession(userId: string): RoomSession | null {
  const saved = readSessionJson(StorageKeys.CLASSROOM_TAB, isRoomSession);
  return saved?.userId === userId ? saved : null;
}

export function saveRoomSession(session: RoomSession): boolean {
  return writeSessionJson(StorageKeys.CLASSROOM_TAB, session);
}

export function clearRoomSession(): void { removeSession(StorageKeys.CLASSROOM_TAB); }

function pendingKey(userId: string, roomId: string): ClassroomPendingKey {
  return `${StorageKeys.CLASSROOM_PENDING_PREFIX}${encodeURIComponent(userId)}:${encodeURIComponent(roomId)}`;
}

function isPending(value: unknown): value is PendingAnswers {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.entries(value).every(([id, entry]) => {
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)) || !entry || typeof entry !== 'object') return false;
    const p = entry as Record<string, unknown>;
    return (typeof p.value === 'boolean' || p.value === null)
      && Number.isSafeInteger(p.revision) && Number(p.revision) >= 0;
  });
}

export function loadPendingAnswers(userId: string, roomId: string): PendingAnswers {
  return readJson(pendingKey(userId, roomId), isPending, {});
}

export function savePendingAnswers(userId: string, roomId: string, pending: PendingAnswers): boolean {
  return writeJson(pendingKey(userId, roomId), pending);
}
