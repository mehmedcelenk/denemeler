import test from 'node:test';
import assert from 'node:assert/strict';
import { state, store } from '../src/app/state.ts';
import { StorageKeys, progressStorageKey } from '../src/shared/storage-keys.ts';
import { readString, writeJson } from '../src/app/storage.ts';
import { getActiveSession, saveActiveSession, initializeStudySession, enterGuestMode,
  isAuthenticated, canStudyLocally } from '../src/features/welcome/study-session.ts';
import { ensureFreshSession, saveCloudProgress, syncCloudProgress, scheduleCloudSync,
  cancelCloudSync } from '../src/features/welcome/cloud-sync.ts';
import { setSupabaseConfigOverride } from '../src/data/supabase-client.ts';
import { RoomService } from '../src/features/classroom/room-service.ts';
import { toggleStarQuestion } from '../src/features/library/library-model.ts';
import { eliminateOneWrongChoice } from '../src/features/booklet/features-bar.ts';
import { isCurrentStudy } from '../src/app/study-context.ts';
import { withClassroom } from './fixtures/classroom.ts';
import { saveRoomSession, loadRoomSession } from '../src/features/classroom/session-store.ts';
import type { AuthSession } from '../src/data/supabase-auth.ts';

const account = (id: string): AuthSession => ({
  accessToken: `token-${id}`, refreshToken: `refresh-${id}`,
  expiresAt: Math.floor(Date.now() / 1000) + 3600, user: { id },
});
const tick = () => new Promise(resolve => setTimeout(resolve, 30));
function gate() {
  let release = () => {};
  const promise = new Promise<void>(resolve => { release = resolve; });
  return { promise, release };
}

async function workspace(run: (values: Map<string, string>, tab: Map<string, string>) => Promise<void>) {
  const values = new Map<string, string>();
  const tab = new Map<string, string>();
  const previous = { localStorage: globalThis.localStorage, sessionStorage: globalThis.sessionStorage, fetch: globalThis.fetch };
  for (const [key, entries] of [['localStorage', values], ['sessionStorage', tab]] as const) {
    Object.defineProperty(globalThis, key, { configurable: true, value: {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
      removeItem: (key: string) => entries.delete(key),
    } });
  }
  store.setProgressOwner('legacy');
  setSupabaseConfigOverride({ url: 'https://unit.supabase.test', anonKey: 'test-key' });
  try { await run(values, tab); }
  finally {
    cancelCloudSync();
    saveActiveSession(null);
    setSupabaseConfigOverride(null);
    for (const [key, value] of Object.entries(previous)) Object.defineProperty(globalThis, key, { configurable: true, value });
  }
}

test('guest: no identity or network writes; reload and browser reopen restore local progress', () => workspace(async (_values, tab) => {
  let networkCalls = 0;
  globalThis.fetch = async () => { networkCalls++; throw new Error('No network expected'); };
  enterGuestMode();
  store.setUserMarkedChoice(969, 'B');
  store.setStarredQuestionIds([969]);
  store.setRematchQuestionIds([970]);
  store.setEliminatedChoices({ 969: ['A'] });
  store.setEliminatedWrongChoices({ 969: 'D' });
  store.setWaterStreak(5);
  writeJson(StorageKeys.RESUME_STATE, { subject: 'TDE', questionId: 969, timestamp: 1 });
  assert.equal(isAuthenticated(), false);
  assert.equal(canStudyLocally(), true);
  assert.equal(getActiveSession(), null);
  assert.equal(readString(StorageKeys.AUTH_SESSION), null);
  assert.equal(await ensureFreshSession(), null);
  scheduleCloudSync(1);
  await syncCloudProgress();
  assert.equal(await saveCloudProgress(), false);
  await assert.rejects(new RoomService(false).joinOrCreateRoom('12-A'), /oturum açın/);
  await tick();
  assert.equal(networkCalls, 0);
  for (const reopenBrowser of [false, true]) {
    if (reopenBrowser) tab.clear();
    store.setProgressOwner('legacy');
    store.setUserMarkedChoices({}, false);
    initializeStudySession();
    assert.equal(state.progressOwner, 'guest');
    assert.deepEqual(state.userMarkedChoices, { 969: 'B' });
    assert.deepEqual([...state.starredQuestionIds], [969]);
    assert.deepEqual([...state.rematchQuestionIds], [970]);
    assert.deepEqual(state.eliminatedChoices, { 969: ['A'] });
    assert.deepEqual(state.eliminatedWrongChoices, { 969: 'D' });
    assert.equal(state.waterStreak, 5);
    assert.equal(JSON.parse(readString(StorageKeys.RESUME_STATE) || '{}').questionId, 969);
  }
}));

test('guest/account namespaces preserve legacy originals and never merge across owners', () => workspace(async values => {
  const legacy = JSON.stringify({ 100: 'A' });
  values.set(StorageKeys.USER_CHOICES, legacy);
  values.set(StorageKeys.REMATCH_QUESTIONS, '[100]');
  initializeStudySession();
  assert.equal(canStudyLocally(), false);
  enterGuestMode();
  assert.deepEqual(state.userMarkedChoices, {});
  store.setUserMarkedChoice(200, 'B');
  saveActiveSession(account('A'));
  assert.deepEqual(state.userMarkedChoices, { 100: 'A' });
  store.setUserMarkedChoice(300, 'C');
  saveActiveSession(account('B'));
  assert.deepEqual(state.userMarkedChoices, {});
  store.setUserMarkedChoice(400, 'D');
  enterGuestMode();
  assert.deepEqual(state.userMarkedChoices, { 200: 'B' });
  saveActiveSession(account('A'));
  assert.deepEqual(state.userMarkedChoices, { 100: 'A', 300: 'C' });
  saveActiveSession(account('B'));
  assert.deepEqual(state.userMarkedChoices, { 400: 'D' });
  assert.equal(values.get(StorageKeys.USER_CHOICES), legacy);
  assert.equal(values.get(progressStorageKey(StorageKeys.USER_CHOICES, 'guest')), '{"200":"B"}');
}));

test('malformed cloud progress does not partially update local state or write back', () => workspace(async () => {
  let posts = 0;
  globalThis.fetch = async (_url, init) => {
    if (init?.method === 'POST') posts++;
    return new Response(JSON.stringify([{ choices: { 123: 'B' }, starred: 'invalid' }]));
  };
  saveActiveSession(account('A'));
  store.setUserMarkedChoices({ 100: 'A' });
  await syncCloudProgress();
  assert.deepEqual(state.userMarkedChoices, { 100: 'A' });
  assert.equal(posts, 0);
}));

test('account changes are reconciled before a star or elimination can mutate the old account', () => workspace(async values => {
  saveActiveSession(account('A'));
  store.setStarredQuestionIds([100]);
  writeJson(StorageKeys.AUTH_SESSION, account('B'));
  toggleStarQuestion(200);
  assert.equal(state.progressOwner, 'account:B');
  assert.deepEqual(JSON.parse(values.get(progressStorageKey(StorageKeys.STARRED_QUESTIONS, 'account:A')) || '[]'), [100]);
  assert.equal(values.has(progressStorageKey(StorageKeys.STARRED_QUESTIONS, 'account:B')), false);
  saveActiveSession(account('A'));
  writeJson(StorageKeys.AUTH_SESSION, account('B'));
  eliminateOneWrongChoice(100);
  assert.equal(state.progressOwner, 'account:B');
  assert.deepEqual(state.eliminatedWrongChoices, {});
}));

test('interrupted legacy migration preserves data, blocks writes and resumes for its owner', () => workspace(async values => {
  values.set(StorageKeys.USER_CHOICES, '{"100":"A"}');
  values.set(StorageKeys.STARRED_QUESTIONS, '[100]');
  values.set(StorageKeys.ANSWER_LOCK_UNTIL, '9999999999999');
  const storage = globalThis.localStorage;
  const set = storage.setItem;
  let blocked = true;
  storage.setItem = (key, value) => {
    if (blocked && key === progressStorageKey(StorageKeys.STARRED_QUESTIONS, 'account:A')) throw new Error('quota');
    set(key, value);
  };
  saveActiveSession(account('A'));
  assert.equal(state.progressReady, false);
  assert.deepEqual([...state.starredQuestionIds], [100]);
  assert.equal(writeJson(StorageKeys.STARRED_QUESTIONS, [200]), false);
  assert.equal(await saveCloudProgress(), false);
  blocked = false;
  assert.equal(isCurrentStudy(), false); // The interrupted action belongs to the old generation.
  assert.equal(state.progressReady, true);
  assert.deepEqual([...state.starredQuestionIds], [100]);
  assert.equal(values.get(StorageKeys.STARRED_QUESTIONS), '[100]');
  assert.equal(values.has(progressStorageKey(StorageKeys.ANSWER_LOCK_UNTIL, 'account:A')), true);
  saveActiveSession(account('B'));
  assert.deepEqual([...state.starredQuestionIds], []);
}));

test('recovery from an older claim does not resurrect a cleared answer lock or overwrite newer data', () => workspace(async values => {
  values.set(StorageKeys.LEGACY_PROGRESS_OWNER, 'A');
  values.set(StorageKeys.ANSWER_LOCK_UNTIL, '9999999999999');
  values.set(StorageKeys.USER_CHOICES, '{"100":"A"}');
  values.set(progressStorageKey(StorageKeys.USER_CHOICES, 'account:A'), '{"200":"B"}');
  saveActiveSession(account('A'));
  assert.equal(state.progressReady, true);
  assert.deepEqual(state.userMarkedChoices, { 200: 'B' });
  assert.equal(values.has(progressStorageKey(StorageKeys.ANSWER_LOCK_UNTIL, 'account:A')), false);
  assert.equal(values.get(StorageKeys.LEGACY_PROGRESS_COMPLETE), 'A');
}));

test('guest stays local when shared auth changes; account context reconciles before saving', () => workspace(async () => {
  const posts: Record<string, unknown>[] = [];
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('user_progress') && init?.method === 'POST') posts.push(JSON.parse(String(init.body)));
    return new Response('[]');
  };
  enterGuestMode();
  store.setUserMarkedChoice(200, 'B');
  writeJson(StorageKeys.AUTH_SESSION, account('A')); // Another tab's login, before storage event.
  assert.equal(getActiveSession(), null);
  assert.equal(await saveCloudProgress(), false);
  assert.equal(posts.length, 0);
  saveActiveSession(account('A'));
  store.setUserMarkedChoice(300, 'C');
  writeJson(StorageKeys.AUTH_SESSION, account('B'));
  await saveCloudProgress();
  assert.deepEqual(state.userMarkedChoices, {});
  assert.equal(posts.at(-1)?.user_id, 'B');
  assert.deepEqual(posts.at(-1)?.choices, {});
  enterGuestMode();
  assert.deepEqual(state.userMarkedChoices, { 200: 'B' });
}));

test('late cloud GET is aborted and discarded after account → guest → account change', () => workspace(async () => {
  const started = gate();
  const release = gate();
  let signal: AbortSignal | null | undefined;
  let writes = 0;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('user_progress') && init?.method === 'GET') {
      signal = init.signal;
      started.release();
      await release.promise; // Deliberately simulate a transport ignoring abort.
      return new Response('[{"choices":{"999":"D"},"starred":[999]}]');
    }
    if (init?.method === 'POST') writes++;
    return new Response('[]');
  };
  saveActiveSession(account('A'));
  const syncing = syncCloudProgress();
  await started.promise;
  enterGuestMode();
  store.setUserMarkedChoice(200, 'B');
  saveActiveSession(account('A')); // Same owner again, but a new operation generation.
  store.setUserMarkedChoice(300, 'C');
  release.release();
  await syncing;
  assert.equal(signal?.aborted, true);
  assert.deepEqual(state.userMarkedChoices, { 300: 'C' });
  assert.equal(writes, 0);
  enterGuestMode();
  assert.deepEqual(state.userMarkedChoices, { 200: 'B' });
}));

test('pending debounce, immutable in-flight POST, and queued save cannot cross sessions', () => workspace(async () => {
  const started = gate();
  const release = gate();
  const bodies: Record<string, unknown>[] = [];
  let signal: AbortSignal | null | undefined;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('user_progress') && init?.method === 'POST') {
      bodies.push(JSON.parse(String(init.body)));
      signal = init.signal;
      started.release();
      await release.promise;
      return new Response('', { status: 201 });
    }
    return new Response('[]');
  };
  saveActiveSession(account('A'));
  store.setUserMarkedChoice(100, 'A');
  scheduleCloudSync(10);
  enterGuestMode();
  store.setUserMarkedChoice(200, 'B');
  await tick();
  assert.equal(bodies.length, 0);
  saveActiveSession(account('A'));
  const saving = saveCloudProgress();
  await started.promise;
  assert.equal(await saveCloudProgress(), false); // Queue another account save.
  enterGuestMode();
  store.setUserMarkedChoice(201, 'D');
  release.release();
  assert.equal(await saving, false);
  await tick();
  assert.equal(signal?.aborted, true);
  assert.equal(bodies.length, 1);
  assert.deepEqual(bodies[0].choices, { 100: 'A' });
  assert.deepEqual(state.userMarkedChoices, { 200: 'B', 201: 'D' });
}));

test('room recording rejects guest answers even with an old service connection', () => withClassroom(async fixture => {
  const service = new RoomService(false);
  await service.joinOrCreateRoom('12-A');
  try {
    enterGuestMode();
    service.logStudentAnswer(969, true);
    service.revokeStudentAnswer(970);
    assert.equal([...fixture.values.keys()].some(key => key.startsWith(StorageKeys.CLASSROOM_PENDING_PREFIX)), false);
    const before = fixture.requests.length;
    await service.refresh();
    assert.equal(fixture.requests.length, before);
  } finally { service.disconnect(); }
}));

test('startup account activation preserves the saved classroom connection for restore', () => withClassroom(async fixture => {
  const saved = { userId: fixture.auth.user.id, connectionId: '20000000-0000-4000-8000-000000000001',
    roomId: fixture.snapshot.roomId, roomName: '12-A', sequence: 2 };
  saveRoomSession(saved);
  store.setProgressOwner('legacy');
  initializeStudySession();
  assert.deepEqual(loadRoomSession(fixture.auth.user.id), saved);
  const service = new RoomService(false);
  try { assert.equal(await service.restoreSessionIfActive(), true); }
  finally { service.disconnect(); }
}));
