import { StorageKeys } from '../../shared/storage-keys.ts';

interface StoredSession {
  peerId: string;
  roomId: string;
  userName: string;
  isHost: boolean;
  timestamp: number;
}

export function saveRoomSession(session: StoredSession): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(StorageKeys.CLASSROOM_SESSION, JSON.stringify(session));
  } catch {}
}

export function loadRoomSession(): StoredSession | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(StorageKeys.CLASSROOM_SESSION);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function clearRoomSession(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(StorageKeys.CLASSROOM_SESSION);
  } catch {}
}

