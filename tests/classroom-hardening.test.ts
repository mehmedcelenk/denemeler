import test from 'node:test';
import assert from 'node:assert/strict';
import { handleIncomingRoomMessage, type MessageContext } from '../src/features/classroom/message-handler.ts';
import { resetFocusTrackerForTest, triggerPotentialFocusLoss, triggerPotentialFocusRestored } from '../src/features/classroom/focus-tracker.ts';
import { roomService } from '../src/features/classroom/room-service.ts';
import type { RoomFeedItem, RoomMessage, RoomParticipant, StudentStats } from '../src/features/classroom/types.ts';

function createMockContext(isHost = true, peerId = isHost ? 'host_peer' : 'student_peer', joinedAt = 1000): {
  ctx: MessageContext;
  getNotifyCalls: () => number;
  getSyncCalls: () => number;
} {
  let notifyCalls = 0;
  let syncCalls = 0;

  const participants: RoomParticipant[] = [
    { id: peerId, name: isHost ? 'Hoca' : 'Öğrenci', isHost, joinedAt, lastSeenAt: joinedAt },
  ];
  const feedItems: RoomFeedItem[] = [];
  const studentStats: Record<string, StudentStats> = {};

  const ctx: MessageContext = {
    peerId,
    roomId: 'TEST_ROOM',
    userName: isHost ? 'Hoca' : 'Öğrenci',
    isHost,
    isPaused: false,
    participants,
    feedItems,
    studentStats,
    helpRequested: false,
    setHelpRequested: (val: boolean) => { ctx.helpRequested = val; },
    setPaused: (val: boolean) => { ctx.isPaused = val; },
    demoteToStudent: () => {
      ctx.isHost = false;
      const myPeer = ctx.participants.find((p) => p.id === ctx.peerId);
      if (myPeer) myPeer.isHost = false;
    },
    leaveRoom: () => {},
    scheduleSyncBroadcast: () => { syncCalls++; },
    notify: () => { notifyCalls++; },
  };

  return { ctx, getNotifyCalls: () => notifyCalls, getSyncCalls: () => syncCalls };
}

test('mesaj tablosu bilinmeyen ve prototip isimli paketleri yok sayar', () => {
  const { ctx } = createMockContext();
  for (const type of ['UNKNOWN', '__proto__', 'constructor', 'toString']) {
    const message = {
      type,
      roomId: 'TEST_ROOM',
      senderId: 'unknown_peer',
      senderName: 'Anonim',
      timestamp: 1000,
    } as unknown as RoomMessage;
    assert.doesNotThrow(() => handleIncomingRoomMessage(ctx, message));
  }
  assert.equal(ctx.participants.length, 1);
  assert.equal(ctx.feedItems.length, 0);
  assert.deepEqual(ctx.studentStats, {});
});

test('Hoca Ekranı İzolasyonu: Hoca ekranında ayrılma ve geri dönme doğru işlenir', () => {
  const { ctx } = createMockContext(true);

  handleIncomingRoomMessage(ctx, {
    type: 'PEER_JOIN',
    roomId: 'TEST_ROOM',
    senderId: 'std_1',
    senderName: 'Ali',
    isHost: false,
    timestamp: 1000,
  });

  assert.equal(ctx.participants.length, 2);
  assert.equal(ctx.studentStats['std_1'].name, 'Ali');
  assert.equal(ctx.studentStats['std_1'].exitCount, 0);
  assert.equal(ctx.studentStats['std_1'].totalAwayMs, 0);

  handleIncomingRoomMessage(ctx, {
    type: 'FOCUS_LOST',
    roomId: 'TEST_ROOM',
    senderId: 'std_1',
    senderName: 'Ali',
    timestamp: 2000,
  });

  assert.equal(ctx.studentStats['std_1'].exitCount, 1);
  assert.equal(ctx.studentStats['std_1'].isOnline, false);
  assert.equal(ctx.feedItems[0].type, 'FOCUS_LOST');

  handleIncomingRoomMessage(ctx, {
    type: 'FOCUS_RESTORED',
    roomId: 'TEST_ROOM',
    senderId: 'std_1',
    senderName: 'Ali',
    timestamp: 7000,
    payload: { durationMs: 5000 },
  });

  assert.equal(ctx.studentStats['std_1'].exitCount, 1);
  assert.equal(ctx.studentStats['std_1'].isOnline, true);
  assert.equal(ctx.studentStats['std_1'].totalAwayMs, 5000);
  assert.equal(ctx.feedItems[0].returnedAt, 7000);

  handleIncomingRoomMessage(ctx, {
    type: 'PEER_LEAVE',
    roomId: 'TEST_ROOM',
    senderId: 'std_1',
    senderName: 'Ali',
    timestamp: 8000,
  });
  assert.equal(ctx.studentStats['std_1'].isOnline, false);
  assert.equal(ctx.feedItems[0].type, 'LEAVE');
});

test('Dışarıdayken F5 / Heartbeat Dönüş Mutabakatı: Açık FOCUS_LOST kaydı otomatik kapanır ve kırmızı rozet düşer', () => {
  const { ctx } = createMockContext(true);

  handleIncomingRoomMessage(ctx, {
    type: 'PEER_JOIN',
    roomId: 'TEST_ROOM',
    senderId: 'std_reload',
    senderName: 'Zeynep',
    isHost: false,
    timestamp: 1000,
  });

  // Öğrenci sekmeden ayrılır (FOCUS_LOST)
  handleIncomingRoomMessage(ctx, {
    type: 'FOCUS_LOST',
    roomId: 'TEST_ROOM',
    senderId: 'std_reload',
    senderName: 'Zeynep',
    timestamp: 3000,
  });

  assert.equal(ctx.studentStats['std_reload'].isOnline, false);
  const lostItem = ctx.feedItems.find((f) => f.type === 'FOCUS_LOST' && f.studentId === 'std_reload');
  assert.equal(lostItem?.returnedAt, undefined);

  // Öğrenci FOCUS_RESTORED göndermeden F5 atıp PEER_JOIN ile döner (10 sn sonra)
  handleIncomingRoomMessage(ctx, {
    type: 'PEER_JOIN',
    roomId: 'TEST_ROOM',
    senderId: 'std_reload',
    senderName: 'Zeynep',
    isHost: false,
    timestamp: 13000,
  });

  // Açık FOCUS_LOST otomatik kapanmalı, süre eklenmeli ve mükerrer JOIN satırı eklenmemeli!
  assert.equal(ctx.studentStats['std_reload'].isOnline, true);
  assert.equal(lostItem?.returnedAt, 13000);
  assert.equal(ctx.studentStats['std_reload'].totalAwayMs, 10000);
  const joinItems = ctx.feedItems.filter((f) => f.type === 'JOIN' && f.studentId === 'std_reload');
  assert.equal(joinItems.length, 1);
});

test('Çık-Gir Spam (Burst) Kalkanı: 15 sn içinde ikinci kez çıkınca 1 sn beklemeden ANINDA yakalar', () => {
  resetFocusTrackerForTest();
  roomService.joinOrCreateRoom('SPAM-TEST', 'Kurnaz Öğrenci', false);
  const peerId = roomService.getPeerId();

  // 1. Çıkış denemesi (t = 10000): 400ms sonra geri döner (1 sn dolmadan F5/kırpma gibi iptal edilir)
  triggerPotentialFocusLoss(false, 10000);
  triggerPotentialFocusRestored(10400);
  assert.equal(roomService.getState().studentStats[peerId].exitCount, 0);

  // 2. Çıkış denemesi (t = 12000, yani 2 sn sonra): Çık-gir spam olduğu için 0ms'de ANINDA yakalanmalı!
  triggerPotentialFocusLoss(false, 12000);
  assert.equal(roomService.getState().studentStats[peerId].exitCount, 1);
  assert.equal(roomService.getState().feedItems.some((f) => f.type === 'FOCUS_LOST'), true);

  resetFocusTrackerForTest();
  roomService.leaveRoom();
});

test('Hoca Odak İzolasyonu: Hoca başka pencereye geçtiğinde focus-tracker hocayı ayrıldı saymaz', () => {
  resetFocusTrackerForTest();
  roomService.joinOrCreateRoom('HOST-FOCUS', 'Hasan Hoca', true);

  triggerPotentialFocusLoss(true, 5000);
  assert.equal(roomService.getState().feedItems.some((f) => f.type === 'FOCUS_LOST'), false);

  resetFocusTrackerForTest();
  roomService.leaveRoom();
});

test('Watchdog ve Heartbeat: Öğrenci kalp atışı ve senkronizasyon kümülatif süreleri korur', () => {
  const { ctx } = createMockContext(true);

  ctx.studentStats['std_2'] = {
    id: 'std_2',
    name: 'Veli',
    correctCount: 2,
    incorrectCount: 1,
    joinedAt: 1000,
    exitCount: 2,
    totalAwayMs: 12000,
    lastSeenAt: 1000,
    isOnline: true,
  };

  handleIncomingRoomMessage(ctx, {
    type: 'STUDENT_HEARTBEAT',
    roomId: 'TEST_ROOM',
    senderId: 'std_2',
    senderName: 'Veli',
    timestamp: 15000,
  });

  assert.equal(ctx.studentStats['std_2'].lastSeenAt, 15000);
  assert.equal(ctx.studentStats['std_2'].isOnline, true);
  assert.equal(ctx.studentStats['std_2'].exitCount, 2);
  assert.equal(ctx.studentStats['std_2'].totalAwayMs, 12000);
});

test('Kıdemli Host Kuralı: Aynı odaya sırayla giren iki cihazdan ilki Hoca kalır, ikincisi otomatik Öğrenci olur', () => {
  const { ctx: device1Ctx, getSyncCalls } = createMockContext(true, 'peer_1', 1000);
  const { ctx: device2Ctx } = createMockContext(true, 'peer_2', 2000);

  handleIncomingRoomMessage(device1Ctx, {
    type: 'PEER_JOIN',
    roomId: 'TEST_ROOM',
    senderId: 'peer_2',
    senderName: 'Ahmet Öğrenci',
    isHost: true,
    timestamp: 2000,
    payload: { joinedAt: 2000 },
  });

  assert.equal(device1Ctx.isHost, true);
  assert.equal(device1Ctx.participants.find((p) => p.id === 'peer_2')?.isHost, false);
  assert.equal(Boolean(device1Ctx.studentStats['peer_2']), true);
  assert.equal(getSyncCalls() > 0, true);

  handleIncomingRoomMessage(device2Ctx, {
    type: 'ROOM_SYNC',
    roomId: 'TEST_ROOM',
    senderId: 'peer_1',
    senderName: 'Hoca',
    isHost: true,
    timestamp: 2050,
    payload: {
      participants: device1Ctx.participants,
      studentStats: device1Ctx.studentStats,
      isPaused: false,
    },
  });

  assert.equal(device2Ctx.isHost, false);
  assert.equal(device2Ctx.participants.find((p) => p.id === 'peer_1')?.isHost, true);
  assert.equal(device2Ctx.participants.find((p) => p.id === 'peer_2')?.isHost, false);
});

test('Çık-Gir & Çerez Sıfırlama Kalkanı: Oturumdan ayrılıp yeni peerId ile dönen öğrencinin ihlalleri korunur', () => {
  const { ctx } = createMockContext(true);

  handleIncomingRoomMessage(ctx, {
    type: 'PEER_JOIN',
    roomId: 'TEST_ROOM',
    senderId: 'ali_old_id',
    senderName: 'Ali Yılmaz',
    isHost: false,
    timestamp: 1000,
    payload: { exitCount: 2, totalAwayMs: 8000 },
  });

  // Öğrenci "Oturumdan Ayrıl" butonuna basar (exitCount 2 -> 3 olur, LEAVE kaydı açılır)
  handleIncomingRoomMessage(ctx, {
    type: 'PEER_LEAVE',
    roomId: 'TEST_ROOM',
    senderId: 'ali_old_id',
    senderName: 'Ali Yılmaz',
    timestamp: 5000,
  });
  assert.equal(ctx.studentStats['ali_old_id'].exitCount, 3);
  assert.equal(ctx.studentStats['ali_old_id'].isOnline, false);

  // Öğrenci çerezlerini silip / gizli sekmeden YENİ peerId ile 10 sn sonra tekrar girer
  handleIncomingRoomMessage(ctx, {
    type: 'PEER_JOIN',
    roomId: 'TEST_ROOM',
    senderId: 'ali_new_id',
    senderName: 'Ali Yılmaz',
    isHost: false,
    timestamp: 15000,
  });

  // Eski çevrimdışı kayıt yeni kimliğe devredilmeli, hayalet kopya kalmamalı ve 10 sn dışarıda kalma süresi eklenmeli!
  assert.equal(ctx.studentStats['ali_old_id'], undefined);
  assert.equal(ctx.studentStats['ali_new_id'].exitCount, 3);
  assert.equal(ctx.studentStats['ali_new_id'].totalAwayMs, 18000);
  assert.equal(ctx.studentStats['ali_new_id'].isOnline, true);
  const leaveItem = ctx.feedItems.find((f) => f.type === 'LEAVE' && f.studentId === 'ali_new_id');
  assert.equal(leaveItem?.returnedAt, 15000);
});

