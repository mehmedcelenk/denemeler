import { StorageKeys, type StorageKey } from '../shared/storage-keys.ts';

const fixedKeys = new Set<string>(Object.values(StorageKeys));
const classroomSyncPrefix = `sync_${StorageKeys.CLASSROOM_CHANNEL_PREFIX}`;

function isSupportedKey(key: string): key is StorageKey {
  return fixedKeys.has(key) || key.startsWith(classroomSyncPrefix);
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
  try {
    return getStorage()?.getItem(key) ?? null;
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
    target.setItem(key, value);
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
  try {
    getStorage()?.removeItem(key);
  } catch {}
}
