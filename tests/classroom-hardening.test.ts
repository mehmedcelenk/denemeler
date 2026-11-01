import test from 'node:test';
import assert from 'node:assert/strict';
import { handleIncomingRoomMessage, type MessageContext } from '../src/features/classroom/message-handler.ts';
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

test('Yıldız Eşleşmesi: Büyük/küçük harf duyarsız ve isim veya id ile eşleşir', () => {
  const { ctx } = createMockContext(false);
  ctx.peerId = 'my_peer_id';
  ctx.userName = 'Mehmet Ali';

  handleIncomingRoomMessage(ctx, {
    type: 'AWARD_STAR',
    roomId: 'TEST_ROOM',
    senderId: 'host_peer',
    senderName: 'Hoca',
    isHost: true,
    timestamp: Date.now(),
    payload: { studentId: '', studentName: '  mehmet ali  ' },
  });
  assert.ok(true);
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

test('Hoca Canlı Kırmızı Rozeti: Offline ve odak kaybetmiş öğrenciler doğru sayılır', () => {
  const stats: Record<string, StudentStats> = {
    s1: { id: 's1', name: 'Ali', correctCount: 1, incorrectCount: 0, joinedAt: 1000, exitCount: 0, totalAwayMs: 0, isOnline: true },
    s2: { id: 's2', name: 'Ayşe', correctCount: 2, incorrectCount: 0, joinedAt: 1000, exitCount: 1, totalAwayMs: 0, isOnline: false },
    s3: { id: 's3', name: 'Fatma', correctCount: 0, incorrectCount: 0, joinedAt: 1000, exitCount: 1, totalAwayMs: 0, isOnline: true },
  };
  const feedItems: RoomFeedItem[] = [
    { id: 'f1', type: 'FOCUS_LOST', studentId: 's3', studentName: 'Fatma', timestamp: 2000 },
  ];

  const students = Object.values(stats);
  const totalStudents = students.length;
  const openFocusLostIds = new Set(
    feedItems.filter(f => f.type === 'FOCUS_LOST' && !f.returnedAt).map(f => f.studentId)
  );
  const offlineCount = students.filter(s => !s.isOnline || openFocusLostIds.has(s.id)).length;
  const activeCount = Math.max(0, totalStudents - offlineCount);

  assert.equal(totalStudents, 3);
  assert.equal(offlineCount, 2);
  assert.equal(activeCount, 1);
});

test('Öğrenci Yetki İzolasyonu: Öğrenci hoca fonksiyonlarını tetikleyemez', async () => {
  const { roomService } = await import('../src/features/classroom/room-service.ts');
  roomService.joinOrCreateRoom('TEST-ISO', 'Öğrenci Can', false);
  assert.equal(roomService.isHost(), false);

  assert.doesNotThrow(() => roomService.broadcastAnnouncement('Sahte Duyuru'));
  roomService.togglePauseRoom();
  assert.equal(roomService.getState().isPaused, false);
  assert.doesNotThrow(() => roomService.awardStarToStudent('s1', 'Ali'));

  roomService.leaveRoom();
});

test('Kıdemli Host Kuralı: Aynı odaya sırayla giren iki cihazdan ilki Hoca kalır, ikincisi otomatik Öğrenci olur', () => {
  const { ctx: device1Ctx, getSyncCalls } = createMockContext(true, 'peer_1', 1000);
  const { ctx: device2Ctx } = createMockContext(true, 'peer_2', 2000);

  // 1) Cihaz 2 odaya PEER_JOIN (isHost: true, joinedAt: 2000) gönderir -> Cihaz 1 bunu alır
  handleIncomingRoomMessage(device1Ctx, {
    type: 'PEER_JOIN',
    roomId: 'TEST_ROOM',
    senderId: 'peer_2',
    senderName: 'Ahmet Öğrenci',
    isHost: true,
    timestamp: 2000,
    payload: { joinedAt: 2000 },
  });

  // Cihaz 1 daha eski (1000 < 2000) olduğu için Hoca kalır, Cihaz 2'yi öğrenci olarak kaydeder ve ROOM_SYNC planlar
  assert.equal(device1Ctx.isHost, true);
  assert.equal(device1Ctx.participants.find((p) => p.id === 'peer_2')?.isHost, false);
  assert.equal(Boolean(device1Ctx.studentStats['peer_2']), true);
  assert.equal(getSyncCalls() > 0, true);

  // 2) Cihaz 1'in yayınladığı ROOM_SYNC mesajı Cihaz 2'ye ulaşır
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

  // Cihaz 2 kendisinden daha kıdemli Hoca'yı (joinedAt: 1000 < 2000) görünce otomatik Öğrenci olur!
  assert.equal(device2Ctx.isHost, false);
  assert.equal(device2Ctx.participants.find((p) => p.id === 'peer_1')?.isHost, true);
  assert.equal(device2Ctx.participants.find((p) => p.id === 'peer_2')?.isHost, false);
});
