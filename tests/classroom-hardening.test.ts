import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRoomSnapshot, ClassroomError } from '../src/data/classroom.ts';
import { acknowledgeAnswers } from '../src/features/classroom/room-model.ts';

const snapshot = { roomId: 'room', roomName: '12-A', hostId: 'host', closed: false,
  participantCount: 1, sequence: 1, announcement: null, members: [], events: [] };

test('sınıf sunucusunun bozuk yanıtı reddedilir', () => {
  assert.equal(parseRoomSnapshot(snapshot).hostId, 'host');
  for (const bad of [null, {}, { ...snapshot, participantCount: -1 },
    { ...snapshot, events: [{ id: 'x', type: 'JOIN' }] },
    { ...snapshot, members: [{ userId: 'x', name: 'x', visible: true, online: true,
      joinedAt: 1, lastSeenAt: 1, answers: { 1: 'true' } }] }]) {
    assert.throws(() => parseRoomSnapshot(bad), ClassroomError);
  }
});

test('istek sürerken değişen cevap yeni revizyon olarak saklanır', () => {
  const sent = { '1': { value: true, revision: 1 }, '2': { value: false, revision: 2 } };
  const current = { '1': { value: null, revision: 3 }, '2': { value: false, revision: 2 } };
  assert.deepEqual(acknowledgeAnswers(current, sent), { '1': { value: null, revision: 3 } });
});

test('Web Locks bulunmayan tarayıcı eski sekmenin bağlantı kimliğini devralmaz', async () => {
  const { claimClassroomTab } = await import('../src/features/classroom/tab-lock.ts');
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  try {
    Object.defineProperty(globalThis, 'window', { value: {}, configurable: true });
    Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
    const lock = await claimClassroomTab('student');
    assert.equal(lock.canResume, false);
    lock.release();
  } finally {
    if (oldWindow) Object.defineProperty(globalThis, 'window', oldWindow);
    else delete (globalThis as { window?: Window }).window;
    if (oldNavigator) Object.defineProperty(globalThis, 'navigator', oldNavigator);
    else delete (globalThis as { navigator?: Navigator }).navigator;
  }
});
