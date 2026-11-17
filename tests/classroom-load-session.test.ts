import test from 'node:test';
import assert from 'node:assert/strict';
import { joinPilotRoom, signInPilotClients, type LoadParticipant } from '../scripts/core/classroom-load-session.ts';
import type { RoomSnapshot } from '../src/data/classroom.ts';

const snapshot: RoomSnapshot = { roomId: 'r', roomName: 'pilot', hostId: 'host', closed: false,
  participantCount: 2, sequence: 0, members: [], events: [], announcement: null };

test('yük denemesi giriş sınırını sayar, yalnız başarısız girişleri yeniden dener', async () => {
  const attempts = Array(6).fill(0) as number[];
  const waits: number[] = [];
  const clients = attempts.map((_count, index) => ({ signIn: async () => {
    attempts[index]++;
    if (index === 1 && attempts[index] === 1) throw new Error('Test authentication failed (HTTP 429).');
  } }));
  const limited = await signInPilotClients(clients, async ms => { waits.push(ms); });
  assert.equal(limited, 1);
  assert.deepEqual(attempts, [1, 2, 1, 1, 1, 1]);
  assert.deepEqual(waits, [10000, 10000]);
});

test('başarılı eşzamanlı girişte oda sahibi sunucu yanıtından belirlenir', async () => {
  const clients: LoadParticipant[] = ['student', 'host'].map(userId => ({ userId, connectionId: userId,
    join: async () => snapshot, rpc: async () => null }));
  const result = await joinPilotRoom(clients, 'pilot');
  assert.equal(result.host.userId, 'host');
  assert.equal(result.roomId, 'r');
});

test('başarısız girişte geç kalan istekleri bekler ve oluşturulan odayı kapatır', async () => {
  const operations: string[] = [];
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const clients: LoadParticipant[] = [
    { userId: 'host', connectionId: 'host-conn',
      join: async (_name, roomId) => {
        if (!roomId) { await gate; operations.push('joined'); }
        else operations.push('resume');
        return snapshot;
      },
      rpc: async (name, args) => { operations.push(`${name}:${(args as {p_room_id: string}).p_room_id}`); } },
    { userId: 'student', connectionId: 's', join: async () => { throw new Error('network'); }, rpc: async () => null },
  ];
  const joining = joinPilotRoom(clients, 'pilot');
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(operations, []);
  release();
  await assert.rejects(joining, /joins failed/);
  assert.deepEqual(operations, ['joined', 'resume', 'close_classroom_room:r']);
});

test('host yanıtı kaybolsa da diğer yanıttaki kimlikle oda temizlenir', async () => {
  const actions: string[] = [];
  const clients: LoadParticipant[] = [
    { userId: 'host', connectionId: 'h',
      join: async (_name, roomId) => {
        if (!roomId) throw new Error('response lost');
        actions.push('resume');
        return snapshot;
      },
      rpc: async (name) => { actions.push(name); } },
    { userId: 'student', connectionId: 's', join: async () => snapshot, rpc: async () => null },
  ];
  await assert.rejects(joinPilotRoom(clients, 'pilot'), /joins failed/);
  assert.deepEqual(actions, ['resume', 'close_classroom_room']);
});
