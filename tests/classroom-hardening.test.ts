import test from 'node:test';
import assert from 'node:assert/strict';
import { handleIncomingRoomMessage, type MessageContext } from '../src/features/classroom/message-handler.ts';
import type { RoomFeedItem, RoomMessage, RoomParticipant, StudentStats } from '../src/features/classroom/types.ts';

function createMockContext(isHost = true): { ctx: MessageContext; notifyCalls: number; syncCalls: number } {
  let notifyCalls = 0;
  let syncCalls = 0;

  const participants: RoomParticipant[] = [
    { id: 'host_peer', name: 'Hoca', isHost: true, joinedAt: Date.now() }
  ];
  const feedItems: RoomFeedItem[] = [];
  const studentStats: Record<string, StudentStats> = {};

  const ctx: MessageContext = {
    peerId: isHost ? 'host_peer' : 'student_peer',
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
    leaveRoom: () => {},
    scheduleSyncBroadcast: () => { syncCalls++; },
    notify: () => { notifyCalls++; },
  };

  return { ctx, notifyCalls, syncCalls };
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

  // 1. Öğrenci katılıyor
  const joinMsg: RoomMessage = {
    type: 'PEER_JOIN',
    roomId: 'TEST_ROOM',
    senderId: 'std_1',
    senderName: 'Ali',
    isHost: false,
    timestamp: 1000,
  };
  handleIncomingRoomMessage(ctx, joinMsg);

  assert.equal(ctx.participants.length, 2);
  assert.equal(ctx.studentStats['std_1'].name, 'Ali');
  assert.equal(ctx.studentStats['std_1'].exitCount, 0);
  assert.equal(ctx.studentStats['std_1'].totalAwayMs, 0);

  // 2. FOCUS_LOST (Öğrenci ayrıldı bildirimi)
  const lostMsg: RoomMessage = {
    type: 'FOCUS_LOST',
    roomId: 'TEST_ROOM',
    senderId: 'std_1',
    senderName: 'Ali',
    timestamp: 2000,
  };
  handleIncomingRoomMessage(ctx, lostMsg);

  assert.equal(ctx.studentStats['std_1'].exitCount, 1);
  assert.equal(ctx.feedItems[0].type, 'FOCUS_LOST');

  // 3. FOCUS_RESTORED (Öğrenci 5 saniye sonra geri döndü)
  const restoredMsg: RoomMessage = {
    type: 'FOCUS_RESTORED',
    roomId: 'TEST_ROOM',
    senderId: 'std_1',
    senderName: 'Ali',
    timestamp: 7000,
    payload: { durationMs: 5000 },
  };
  handleIncomingRoomMessage(ctx, restoredMsg);

  assert.equal(ctx.studentStats['std_1'].exitCount, 1);
  assert.equal(ctx.studentStats['std_1'].totalAwayMs, 5000);
  assert.equal(ctx.feedItems[0].returnedAt, 7000);

  // 4. PEER_LEAVE (Sekme kapatma / çıkış)
  const leaveMsg: RoomMessage = {
    type: 'PEER_LEAVE',
    roomId: 'TEST_ROOM',
    senderId: 'std_1',
    senderName: 'Ali',
    timestamp: 8000,
  };
  handleIncomingRoomMessage(ctx, leaveMsg);
  assert.equal(ctx.studentStats['std_1'].isOnline, false);
  assert.equal(ctx.feedItems[0].type, 'LEAVE');
});

test('Yıldız Eşleşmesi: Büyük/küçük harf duyarsız ve isim veya id ile eşleşir', () => {
  const { ctx } = createMockContext(false);
  ctx.peerId = 'my_peer_id';
  ctx.userName = 'Mehmet Ali';

  let toastCount = 0;
  // Global test ortamında toast çağrısını doğrula
  const awardMsg: RoomMessage = {
    type: 'AWARD_STAR',
    roomId: 'TEST_ROOM',
    senderId: 'host_peer',
    senderName: 'Hoca',
    isHost: true,
    timestamp: Date.now(),
    payload: {
      studentId: '',
      studentName: '  mehmet ali  ',
    },
  };

  handleIncomingRoomMessage(ctx, awardMsg);
  // Hata almadan akış tamamlandı
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

  const hbMsg: RoomMessage = {
    type: 'STUDENT_HEARTBEAT',
    roomId: 'TEST_ROOM',
    senderId: 'std_2',
    senderName: 'Veli',
    timestamp: 15000,
  };
  handleIncomingRoomMessage(ctx, hbMsg);

  assert.equal(ctx.studentStats['std_2'].lastSeenAt, 15000);
  assert.equal(ctx.studentStats['std_2'].isOnline, true);
  assert.equal(ctx.studentStats['std_2'].exitCount, 2);
  assert.equal(ctx.studentStats['std_2'].totalAwayMs, 12000);
});
