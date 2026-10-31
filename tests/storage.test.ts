import test from 'node:test';
import assert from 'node:assert/strict';
import { readJson, readString, remove, writeJson, writeString } from '../src/app/storage.ts';
import { StorageKeys } from '../src/shared/storage-keys.ts';

interface StoredProfile {
  readonly name: string;
}

function isStoredProfile(value: unknown): value is StoredProfile {
  return Boolean(value)
    && typeof value === 'object'
    && typeof (value as Record<string, unknown>).name === 'string';
}

function withStorage(run: (values: Map<string, string>) => void, setItem?: (key: string, value: string) => void): void {
  const values = new Map<string, string>();
  const previous = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: setItem ?? ((key: string, value: string) => { values.set(key, value); }),
      removeItem: (key: string) => { values.delete(key); },
    },
    configurable: true,
  });
  try {
    run(values);
  } finally {
    Object.defineProperty(globalThis, 'localStorage', { value: previous, configurable: true });
  }
}

test('readJson bozuk JSON, eksik anahtar ve geçersiz tipte fallback döndürür', () => {
  withStorage(values => {
    const fallback = { name: 'fallback' };
    values.set(StorageKeys.AI_EXPLANATIONS, '{bozuk');
    assert.equal(readJson(StorageKeys.AI_EXPLANATIONS, isStoredProfile, fallback), fallback);
    values.set(StorageKeys.AI_EXPLANATIONS, JSON.stringify({ name: 42 }));
    assert.equal(readJson(StorageKeys.AI_EXPLANATIONS, isStoredProfile, fallback), fallback);
    values.delete(StorageKeys.AI_EXPLANATIONS);
    assert.equal(readJson(StorageKeys.AI_EXPLANATIONS, isStoredProfile, fallback), fallback);
  });
});

test('normal string ve JSON okuma, yazma ve silme çalışır', () => {
  withStorage(values => {
    assert.equal(writeString(StorageKeys.THEME, 'dark'), true);
    assert.equal(readString(StorageKeys.THEME), 'dark');
    assert.equal(writeJson(StorageKeys.AI_EXPLANATIONS, { name: 'Ada' }), true);
    assert.deepEqual(readJson(StorageKeys.AI_EXPLANATIONS, isStoredProfile, { name: '' }), { name: 'Ada' });
    remove(StorageKeys.THEME);
    assert.equal(readString(StorageKeys.THEME), null);
    assert.equal(values.has(StorageKeys.THEME), false);
  });
});

test('depolama kotası aşıldığında yazma fonksiyonları false döndürür', () => {
  withStorage(() => {
    assert.equal(writeString(StorageKeys.THEME, 'dark'), false);
    assert.equal(writeJson(StorageKeys.AI_EXPLANATIONS, { name: 'Ada' }), false);
  }, () => { throw new DOMException('Kota doldu', 'QuotaExceededError'); });
});
