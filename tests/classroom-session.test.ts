import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomService } from '../src/features/classroom/room-service.ts';
import { loadPendingAnswers, loadRoomSession } from '../src/features/classroom/session-store.ts';
import { saveActiveSession } from '../src/features/welcome/cloud-sync.ts';
import { withClassroom } from './fixtures/classroom.ts';

test('oda rolü yalnız sunucu yanıtından gelir; cevap tekrarları ve silme idempotenttir', () => withClassroom(async f => {
  const service = new RoomService(false);
  try {
    await service.joinOrCreateRoom('12-A');
    assert.equal(service.isHost(), false);
    assert.equal(service.getPeerId(), f.auth.user.id);
    assert.equal(f.requests[0].args.isHost, undefined);
    service.logStudentAnswer(101, false);
    service.logStudentAnswer(101, false);
    await service.refresh();
    assert.equal(service.getState().studentStats[f.auth.user.id].incorrectCount, 1);
    service.revokeStudentAnswer(101);
    await service.refresh();
    assert.equal(service.getState().studentStats[f.auth.user.id].incorrectCount, 0);
    assert.deepEqual(f.snapshot.members[0].answers, {});
  } finally { service.disconnect(); }
}));

test('offline cevaplar oda ve hesaba bağlı saklanır, yeniden bağlanınca gönderilir', () => withClassroom(async f => {
  const service = new RoomService(false);
  try {
    await service.joinOrCreateRoom('12-A');
    f.offline = true;
    service.logStudentAnswer(9, true);
    await service.refresh();
    assert.equal(service.getState().connection, 'reconnecting');
    assert.equal(loadPendingAnswers(f.auth.user.id, f.snapshot.roomId)['9'].value, true);
    assert.deepEqual(loadPendingAnswers('another-user', f.snapshot.roomId), {});
    assert.deepEqual(loadPendingAnswers(f.auth.user.id, 'another-room'), {});
    f.offline = false;
    await service.refresh();
    assert.equal(service.getState().studentStats[f.auth.user.id].correctCount, 1);
    assert.deepEqual(loadPendingAnswers(f.auth.user.id, f.snapshot.roomId), {});
  } finally { service.disconnect(); }
}));

test('HTTP isteği sırasında gelen yeni cevap değişikliği eski onayla silinmez', () => withClassroom(async f => {
  const service = new RoomService(false);
  try {
    await service.joinOrCreateRoom('12-A');
    service.logStudentAnswer(9, true);
    let release!: () => void;
    f.holdUpdate = new Promise<void>(resolve => { release = resolve; });
    const updating = service.refresh();
    await new Promise(resolve => setImmediate(resolve));
    service.revokeStudentAnswer(9);
    release();
    await updating;
    assert.equal(loadPendingAnswers(f.auth.user.id, f.snapshot.roomId)['9'].value, null);
    await service.refresh();
    assert.deepEqual(f.snapshot.members[0].answers, {});
  } finally { service.disconnect(); }
}));

test('yenileme sunucudan aynı oda/bağlantıyı doğrular, eski kayda host yetkisi vermez', () => withClassroom(async f => {
  const service = new RoomService(false);
  const restored = new RoomService(false);
  try {
    await service.joinOrCreateRoom('12-A');
    const saved = loadRoomSession(f.auth.user.id)!;
    assert.equal(await restored.restoreSessionIfActive(), true);
    const join = f.requests.filter(r => r.name === 'join_or_create_room').at(-1)!;
    assert.equal(join.args.p_room_id, f.snapshot.roomId);
    assert.equal(join.args.p_connection_id, saved.connectionId);
    assert.equal(restored.isHost(), false);
    assert.equal(loadRoomSession('other'), null);
  } finally { service.disconnect(); restored.disconnect(); }
}));

test('arka plandaki heartbeat görünürlüğü true yapmaz; istekler üst üste binmez', () => withClassroom(async f => {
  const service = new RoomService(false);
  try {
    await service.joinOrCreateRoom('12-A');
    service.setVisibility(false);
    await service.refresh();
    await Promise.all([service.refresh(), service.refresh(), service.refresh()]);
    const updates = f.requests.filter(r => r.name === 'update_room_member');
    assert.equal(updates.length, 2);
    assert.ok(updates.every(r => r.args.p_visible === false));
    assert.equal(service.getState().studentStats[f.auth.user.id].visible, false);
  } finally { service.disconnect(); }
}));

test('yüzden fazla yeni olayda öğretmen sayfaları sırayla alır ve son 100 kayıt korunur', () => withClassroom(async f => {
  const service = new RoomService(false);
  f.snapshot.hostId = f.auth.user.id;
  try {
    await service.joinOrCreateRoom('12-A');
    f.snapshot.events = Array.from({ length: 120 }, (_, i) => ({ id: String(i + 1),
      type: 'AWAY' as const, userId: `student-${i}`, name: 'Öğrenci', at: i + 1 }));
    await service.refresh();
    assert.equal(service.getState().feedItems.length, 100);
    await service.refresh();
    const updates = f.requests.filter(r => r.name === 'update_room_member');
    assert.equal(updates[0].args.p_after_event, '0');
    assert.equal(updates[1].args.p_after_event, '100');
    assert.equal(service.getState().feedItems.length, 100);
    assert.equal(service.getState().feedItems[0].id, '21');
    assert.equal(service.getState().feedItems.at(-1)?.id, '120');
    await service.refresh();
    assert.equal(service.getState().feedItems.length, 100);
  } finally { service.disconnect(); }
}));

test('çıkıştan sonra gelen eski yanıt odayı geri açmaz', () => withClassroom(async f => {
  const service = new RoomService(false);
  await service.joinOrCreateRoom('12-A');
  let release!: () => void;
  f.holdUpdate = new Promise<void>(resolve => { release = resolve; });
  const updating = service.refresh();
  await new Promise(resolve => setImmediate(resolve));
  service.disconnect();
  release();
  await updating;
  assert.equal(service.getState().roomId, null);
}));

test('giriş sırasında hesap değişirse gecikmiş sunucu yanıtı başarılı sayılmaz', () => withClassroom(async f => {
  const service = new RoomService(false);
  let release!: () => void;
  f.holdJoin = new Promise<void>(resolve => { release = resolve; });
  const joining = service.joinOrCreateRoom('12-A');
  await new Promise(resolve => setImmediate(resolve));
  service.disconnect();
  release();
  await assert.rejects(joining, /iptal edildi/);
  assert.equal(service.getState().roomId, null);
}));

test('hesap değişince eski hesaba ait oda otomatik yüklenmez', () => withClassroom(async f => {
  const service = new RoomService(false);
  try {
    await service.joinOrCreateRoom('12-A');
    saveActiveSession({ ...f.auth, user: { id: 'other' } });
    const other = new RoomService(false);
    assert.equal(await other.restoreSessionIfActive(), false);
    other.disconnect();
  } finally { service.disconnect(); }
}));

test('cihaz depolaması başarısız ve bağlantı yoksa gönderilmemiş cevaplarla çıkış reddedilir', () => withClassroom(async f => {
  const service = new RoomService(false);
  try {
    await service.joinOrCreateRoom('12-A');
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
      getItem: original.getItem.bind(original), removeItem: original.removeItem.bind(original),
      setItem: () => { throw new Error('full'); },
    } });
    f.offline = true;
    service.logStudentAnswer(1, true);
    await assert.rejects(service.leaveRoom(), /kaydedilemedi/);
    assert.equal(service.getState().roomId, f.snapshot.roomId);
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original });
  } finally { service.disconnect(); }
}));
