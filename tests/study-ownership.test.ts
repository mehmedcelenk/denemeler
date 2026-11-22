import test from 'node:test';
import assert from 'node:assert/strict';
import { state, store, onStateChange } from '../src/app/state.ts';
import { handleRematchDontKnow, toggleStarQuestionUI } from '../src/features/library/library-actions.ts';
import { resumeLastSession } from '../src/features/booklet/resume.ts';
import { migrateLegacyProgress, readString, remove, writeString } from '../src/app/storage.ts';
import { StorageKeys, progressStorageKey } from '../src/shared/storage-keys.ts';

test('stale library and resume actions stop when reconciliation changes the study owner', async () => {
  for (const action of [() => handleRematchDontKnow(721), () => toggleStarQuestionUI(721), resumeLastSession]) {
    store.setProgressOwner('legacy');
    store.setRematchQuestionIds([], false);
    store.setStarredQuestionIds([], false);
    let reveals = 0;
    const removeReveal = onStateChange('answer:reveal', () => { reveals++; });
    const removeReconcile = onStateChange('study:reconcile', () => { store.setProgressOwner('guest'); });
    try {
      await action();
      assert.equal(state.progressOwner, 'guest');
      assert.equal(state.rematchQuestionIds.has(721), false);
      assert.equal(state.starredQuestionIds.has(721), false);
      assert.equal(reveals, 0);
    } finally {
      removeReconcile();
      removeReveal();
    }
  }
});

test('incomplete legacy migration exposes originals only to the claimant and prevents deletion', () => {
  const previous = globalThis.localStorage;
  const values = new Map<string, string>([[StorageKeys.STARRED_QUESTIONS, '[42]']]);
  let fail = true;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (fail && key === progressStorageKey(StorageKeys.STARRED_QUESTIONS, 'account:A')) throw new Error('quota');
      values.set(key, value);
    },
    removeItem: (key: string) => values.delete(key),
  } });
  try {
    assert.equal(migrateLegacyProgress('A'), false);
    store.setProgressOwner('account:A', false);
    assert.equal(readString(StorageKeys.STARRED_QUESTIONS), '[42]');
    assert.equal(writeString(StorageKeys.STARRED_QUESTIONS, '[7]'), false);
    remove(StorageKeys.STARRED_QUESTIONS);
    assert.equal(values.get(StorageKeys.STARRED_QUESTIONS), '[42]');
    assert.equal(migrateLegacyProgress('B'), true);
    store.setProgressOwner('account:B');
    assert.equal(readString(StorageKeys.STARRED_QUESTIONS), null);
    store.setProgressOwner('guest');
    assert.equal(readString(StorageKeys.STARRED_QUESTIONS), null);
    fail = false;
    assert.equal(migrateLegacyProgress('A'), true);
    store.setProgressOwner('account:A');
    assert.equal(readString(StorageKeys.STARRED_QUESTIONS), '[42]');
    assert.equal(values.get(StorageKeys.STARRED_QUESTIONS), '[42]');
  } finally {
    store.setProgressOwner('legacy');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: previous });
  }
});
