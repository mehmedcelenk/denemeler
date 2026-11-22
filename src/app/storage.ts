import { StorageKeys, progressStorageKey, progressKeys, type ProgressOwner, type StorageKey } from '../shared/storage-keys.ts';

// The provider reads the central store; this module owns no session state.
let progressOwner: () => ProgressOwner = () => 'legacy';
export function bindProgressOwner(provider: () => ProgressOwner): void { progressOwner = provider; }
let progressReady: () => boolean = () => true;
export function bindProgressReady(provider: () => boolean): void { progressReady = provider; }

const fixedKeys = new Set<string>(Object.values(StorageKeys));
const classroomSyncPrefix = `sync_${StorageKeys.CLASSROOM_CHANNEL_PREFIX}`;

function isSupportedKey(key: string): key is StorageKey {
  return fixedKeys.has(key) || key.startsWith(classroomSyncPrefix)
    || key.startsWith(StorageKeys.CLASSROOM_PENDING_PREFIX);
}

function getStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function readString(key: StorageKey): string | null {
  if (!isSupportedKey(key)) return null;
  if (progressKeys.has(key) && progressOwner() === 'locked') return null;
  try {
    const target = getStorage();
    const owner = progressOwner();
    const value = target?.getItem(progressStorageKey(key, owner)) ?? null;
    if (value === null && target && !progressReady() && owner.startsWith('account:')
      && key !== StorageKeys.ANSWER_LOCK_UNTIL && progressKeys.has(key)
      && target.getItem(StorageKeys.LEGACY_PROGRESS_OWNER) === owner.slice(8)) return target.getItem(key);
    return value;
  } catch {
    return null;
  }
}

export function readJson<T>(key: StorageKey, isValid: (value: unknown) => value is T, fallback: T): T {
  const raw = readString(key);
  if (raw === null) return fallback;
  try {
    const value: unknown = JSON.parse(raw);
    return isValid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function writeString(key: StorageKey, value: string): boolean {
  if (!isSupportedKey(key)) return false;
  try {
    const target = getStorage();
    if (!target) return false;
    if (progressKeys.has(key) && (progressOwner() === 'locked' || !progressReady())) return false;
    target.setItem(progressStorageKey(key, progressOwner()), value);
    return true;
  } catch {
    return false;
  }
}

export function writeJson(key: StorageKey, value: unknown): boolean {
  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? false : writeString(key, serialized);
  } catch {
    return false;
  }
}

export function remove(key: StorageKey): void {
  if (!isSupportedKey(key)) return;
  if (progressKeys.has(key) && (progressOwner() === 'locked' || !progressReady())) return;
  try {
    getStorage()?.removeItem(progressStorageKey(key, progressOwner()));
  } catch {}
}

/** Sekmeye ait oda bağlantısı; ortak kullanıcı verisini değiştirmez. */
export function readSessionJson<T>(key: StorageKey, isValid: (value: unknown) => value is T): T | null {
  if (!isSupportedKey(key)) return null;
  try {
    const raw = typeof sessionStorage === 'undefined' ? null : sessionStorage.getItem(key);
    const value: unknown = raw ? JSON.parse(raw) : null;
    return isValid(value) ? value : null;
  } catch { return null; }
}

export function writeSessionJson(key: StorageKey, value: unknown): boolean {
  if (!isSupportedKey(key)) return false;
  try {
    if (typeof sessionStorage === 'undefined') return false;
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch { return false; }
}

export function removeSession(key: StorageKey): void {
  if (!isSupportedKey(key)) return;
  try { if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem(key); } catch {}
}

/** Copy once, keep legacy originals, never adopt legacy account data into guest. */
export function migrateLegacyProgress(userId: string): boolean {
  const target = getStorage();
  if (!target) return false;
  try {
    const claimed = target.getItem(StorageKeys.LEGACY_PROGRESS_OWNER);
    if (claimed && claimed !== userId) return true;
    if (target.getItem(StorageKeys.LEGACY_PROGRESS_COMPLETE) === userId) return true;
    if (!claimed) target.setItem(StorageKeys.LEGACY_PROGRESS_OWNER, userId);
    for (const key of progressKeys) {
      if (claimed && key === StorageKeys.ANSWER_LOCK_UNTIL) continue;
      const destination = progressStorageKey(key, `account:${userId}`);
      const old = target.getItem(key);
      if (old !== null && target.getItem(destination) === null) target.setItem(destination, old);
    }
    target.setItem(StorageKeys.LEGACY_PROGRESS_COMPLETE, userId);
    return true;
  } catch { return false; }
}
