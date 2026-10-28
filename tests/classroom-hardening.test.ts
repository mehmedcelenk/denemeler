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

test('Hoca Ekranı İzolasyonu: Hoca ekranında duraklatma ve ihlal kümülatifi doğru çalışır', () => {
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

  // 2. FOCUS_LOST (Öğrenci çıktı bildirimi)
  const lostMsg: RoomMessage = {
    type: 'FOCUS_LOST',
    roomId: 'TEST_ROOM',
    senderId: 'std_1',
    senderName: 'Ali',
    timestamp: 2000,
    payload: { reason: 'APP_SWITCH' },
  };
  handleIncomingRoomMessage(ctx, lostMsg);

  assert.equal(ctx.studentStats['std_1'].exitCount, 1);
  assert.equal(ctx.feedItems[0].type, 'FOCUS_LOST');
  assert.equal(ctx.feedItems[0].reason, 'APP_SWITCH');

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

  // 4. SUSPICIOUS_ACT (Soru kopyalama girişimi)
  const copyMsg: RoomMessage = {
    type: 'SUSPICIOUS_ACT',
    roomId: 'TEST_ROOM',
    senderId: 'std_1',
    senderName: 'Ali',
    timestamp: 8000,
    payload: { actType: 'COPY_TEXT', details: 'Soru 1' },
  };
  handleIncomingRoomMessage(ctx, copyMsg);

  assert.equal(ctx.feedItems[0].type, 'SUSPICIOUS_COPY');
  assert.equal(ctx.feedItems[0].details, 'Soru 1');
});

test('Watchdog ve Heartbeat: Öğrenci kalp atışı ve senkronizasyon kümülatif süreleri korur', () => {
  const { ctx } = createMockContext(true);

  // Başlangıç istatistiği
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

  // Kalp atışı mesajı
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

