import { setSupabaseConfigOverride } from '../../src/data/supabase-client.ts';
import type { AuthSession } from '../../src/data/supabase-auth.ts';
import type { RoomSnapshot } from '../../src/data/classroom.ts';
import { saveActiveSession } from '../../src/features/welcome/cloud-sync.ts';
import { roomService } from '../../src/features/classroom/room-service.ts';

export interface ClassroomFixture {
  auth: AuthSession;
  snapshot: RoomSnapshot;
  requests: { name: string; args: Record<string, unknown> }[];
  offline: boolean;
  holdUpdate?: Promise<void>;
  holdJoin?: Promise<void>;
  values: Map<string, string>;
}

export async function withClassroom(run: (fixture: ClassroomFixture) => Promise<void>): Promise<void> {
  const auth: AuthSession = { accessToken: 'unit-token', refreshToken: 'unit-refresh',
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    user: { id: '00000000-0000-4000-8000-000000000001', username: 'Öğrenci' } };
  const fixture: ClassroomFixture = { auth, requests: [], offline: false, values: new Map(), snapshot: {
    roomId: '10000000-0000-4000-8000-000000000001', roomName: '12-A',
    hostId: '00000000-0000-4000-8000-000000000002', closed: false, sequence: 0, participantCount: 2,
    announcement: null, events: [], members: [{ userId: auth.user.id, name: 'Öğrenci',
      visible: true, online: true, joinedAt: 10, lastSeenAt: 10, answers: {} }],
  } };
  const originals = { local: globalThis.localStorage, session: globalThis.sessionStorage, fetch: globalThis.fetch };
  const mockStorage = (values: Map<string, string>) => ({
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: mockStorage(fixture.values) });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: mockStorage(new Map()) });
  setSupabaseConfigOverride({ url: 'https://unit.supabase.test', anonKey: 'unit-key' });
  saveActiveSession(auth);
  globalThis.fetch = async (input, init) => {
    const name = String(input).split('/').at(-1) ?? '';
    const args = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>;
    fixture.requests.push({ name, args });
    if (name === 'join_or_create_room') await fixture.holdJoin;
    if (name === 'update_room_member') await fixture.holdUpdate;
    if (fixture.offline) throw new TypeError('offline');
    const self = fixture.snapshot.members.find(m => m.userId === auth.user.id)!;
    if (name === 'update_room_member') {
      self.visible = Boolean(args.p_visible);
      fixture.snapshot.sequence = Number(args.p_sequence);
      for (const [qid, value] of Object.entries(args.p_answers as Record<string, boolean | null>)) {
        if (value === null) delete self.answers[qid]; else self.answers[qid] = value;
      }
    }
    if (['join_or_create_room', 'update_room_member', 'get_room_snapshot'].includes(name)) {
      const after = name === 'update_room_member' && typeof args.p_after_event === 'string'
        ? BigInt(args.p_after_event) : null;
      const events = after === null ? fixture.snapshot.events.slice(-100)
        : fixture.snapshot.events.filter(event => BigInt(event.id) > after).slice(0, 100);
      return new Response(JSON.stringify({ ...fixture.snapshot, events }), { status: 200 });
    }
    return new Response('null', { status: 200 });
  };
  try { await run(fixture); }
  finally {
    roomService.disconnect();
    saveActiveSession(null);
    globalThis.fetch = originals.fetch;
    setSupabaseConfigOverride(null);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originals.local });
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: originals.session });
  }
}
