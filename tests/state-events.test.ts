import test from 'node:test';
import assert from 'node:assert/strict';
import { notifyStateChange, onStateChange } from '../src/app/state-events.ts';

test('durum olayı dinleyicileri öncelik, sonra kayıt sırasıyla çalışır', () => {
  const calls: string[] = [];
  const cleanups = [
    onStateChange('answer:revoked', () => calls.push('streak'), 30),
    onStateChange('answer:revoked', () => calls.push('combo'), 10),
    onStateChange('answer:revoked', () => calls.push('room'), 20),
    onStateChange('answer:revoked', () => calls.push('library'), 40),
  ];

  notifyStateChange('answer:revoked', { qid: 1 });
  assert.deepEqual(calls, ['combo', 'room', 'streak', 'library']);
  cleanups.forEach(cleanup => cleanup());
});
