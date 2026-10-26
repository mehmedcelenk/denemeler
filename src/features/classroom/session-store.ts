interface StoredSession {
  peerId: string;
  roomId: string;
  userName: string;
  isHost: boolean;
  timestamp: number;
}

const STORAGE_SESSION_KEY = 'aol_classroom_session';

export function saveRoomSession(session: StoredSession): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(session));
  } catch {}
}

export function loadRoomSession(): StoredSession | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function clearRoomSession(): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_SESSION_KEY);
  } catch {}
}

