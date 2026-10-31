import { registerClassroomNetworkTest } from './scenarios/classroom-network.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { roomService } from '../src/features/classroom/room-service.ts';
import { handleIncomingRoomMessage } from '../src/features/classroom/message-handler.ts';
import { calculateStudentRank } from '../src/features/classroom/ranking.ts';
import type { RoomFeedItem, RoomParticipant, StudentStats } from '../src/features/classroom/types.ts';

test('roomService: Oda oluşturma ve katılımcı durumu', () => {
  roomService.joinOrCreateRoom('12-A', 'Hasan Hoca', true);
  const state = roomService.getState();

  assert.equal(state.roomId, '12-A');
  assert.equal(state.userName, 'Hasan Hoca');
  assert.equal(state.isHost, true);
  assert.equal(state.participants.length, 1);
  assert.equal(state.participants[0].name, 'Hasan Hoca');

  roomService.leaveRoom();
  const leftState = roomService.getState();
  assert.equal(leftState.roomId, null);
  assert.equal(leftState.participants.length, 0);
});

test('roomService: Akış olayları (feedItems) ve el kaldırma kaydı', () => {
  roomService.joinOrCreateRoom('FEN-101', 'Zeynep Hoca', true);
  
  // Odak kaybı bildirimi
  roomService.notifyFocusLost();
  let state = roomService.getState();
  assert.equal(state.feedItems.some(f => f.type === 'FOCUS_LOST'), true);

  // Geri dönme bildirimi: ayrılma kaydına returnedAt eklenir
  roomService.notifyFocusRestored();
  state = roomService.getState();
  const lostItem = state.feedItems.find(f => f.type === 'FOCUS_LOST');
  assert.equal(typeof lostItem?.returnedAt, 'number');

  // Hoca çağırma bildirimi
  roomService.callTeacherHelp();
  state = roomService.getState();
  assert.equal(state.helpRequested, true);
  assert.equal(state.feedItems.some(f => f.type === 'HELP_CALL'), true);

  // Hoca çağrıyı çözer
  const helpItem = state.feedItems.find(f => f.type === 'HELP_CALL');
  if (helpItem) {
    roomService.resolveTeacherHelp(helpItem.id, 'Zeynep Hoca');
    state = roomService.getState();
    assert.equal(state.helpRequested, false);
    assert.equal(helpItem.resolved, true);
  }

  roomService.leaveRoom();
});

test('roomService: Duraklatma (Pause) modu durumu günceller', () => {
  roomService.joinOrCreateRoom('FIZ-1', 'Ahmet Hoca', true);
  assert.equal(roomService.getState().isPaused, false);

  roomService.togglePauseRoom();
  assert.equal(roomService.getState().isPaused, true);

  roomService.togglePauseRoom();
  assert.equal(roomService.getState().isPaused, false);

  roomService.leaveRoom();
});

test('calculateStudentRank: Öğrenci sıralamasını doğru hesaplar', () => {
  const now = Date.now();
  const stats = {
    p1: { id: 'p1', name: 'Ali', correctCount: 10, incorrectCount: 1, joinedAt: now - 60000 },
    p2: { id: 'p2', name: 'Ayşe', correctCount: 15, incorrectCount: 0, joinedAt: now - 60000 },
    p3: { id: 'p3', name: 'Mehmet', correctCount: 5, incorrectCount: 5, joinedAt: now - 60000 },
  };

  const ayseRank = calculateStudentRank('Ayşe', stats);
  assert.equal(ayseRank.rank, 1);
  assert.equal(ayseRank.total, 3);

  const aliRank = calculateStudentRank('Ali', stats);
  assert.equal(aliRank.rank, 2);

  const mehmetRank = calculateStudentRank('Mehmet', stats);
  assert.equal(mehmetRank.rank, 3);
});

test('100 Kişilik Sınıf Ölçeklenebilirlik Testi: N x N mesaj patlamasını önler ve mükerrer bildirimleri birleştirir', () => {
  const now = Date.now();
  const hostParticipants: RoomParticipant[] = [
    { id: 'host-1', name: 'Kemal Hoca', isHost: true, joinedAt: now - 10000 },
  ];
  const hostFeed: RoomFeedItem[] = [];
  const hostStats: Record<string, StudentStats> = {
    'host-1': { id: 'host-1', name: 'Kemal Hoca', correctCount: 0, incorrectCount: 0, joinedAt: now - 10000 },
  };
  let hostSyncScheduleCount = 0;

  const hostCtx = {
    peerId: 'host-1',
    roomId: 'MEGA-100',
    userName: 'Kemal Hoca',
    isHost: true,
    isPaused: false,
    participants: hostParticipants,
    feedItems: hostFeed,
    studentStats: hostStats,
    helpRequested: false,
    setHelpRequested: () => {},
    setPaused: () => {},
    leaveRoom: () => {},
    scheduleSyncBroadcast: () => {
      hostSyncScheduleCount++;
    },
    notify: () => {},
  };

  // Sıradan bir öğrencinin bağlamı (Odada hoca varken öğrenci PEER_JOIN'e ROOM_SYNC dönmemeli)
  let studentSyncScheduleCount = 0;
  const studentCtx = {
    ...hostCtx,
    peerId: 'stu-1',
    userName: 'Öğrenci 1',
    isHost: false,
    scheduleSyncBroadcast: () => {
      studentSyncScheduleCount++;
    },
  };

  // 100 öğrenci odaya katılır ve her biri soru çözer
  for (let i = 1; i <= 100; i++) {
    const stuId = `stu-${i}`;
    const stuName = `Öğrenci ${i}`;
    const joinMsg = {
      type: 'PEER_JOIN' as const,
      roomId: 'MEGA-100',
      senderId: stuId,
      senderName: stuName,
      isHost: false,
      timestamp: now + i,
    };

    handleIncomingRoomMessage(hostCtx, joinMsg);
    if (i > 1) {
      handleIncomingRoomMessage(studentCtx, joinMsg);
    }

    // Her öğrenci i adet doğru cevap gönderir
    for (let q = 0; q < (i % 10) + 1; q++) {
      handleIncomingRoomMessage(hostCtx, {
        type: 'STUDENT_ANSWER_LOG',
        roomId: 'MEGA-100',
        senderId: stuId,
        senderName: stuName,
        timestamp: now + i + q,
        payload: { isCorrect: true },
      });
    }
  }

  // 1 Hoca + 100 Öğrenci = 101 Katılımcı
  assert.equal(hostParticipants.length, 101);
  assert.equal(Object.keys(hostStats).length, 101);

  // Öğrenci düğümü odada Hoca varken ASLA ROOM_SYNC tetiklememeli (0 olmalı)
  assert.equal(studentSyncScheduleCount, 0);
  assert.equal(hostSyncScheduleCount, 100);

  // Feed listesi 100 eleman sınırını (cap) aşmamalı
  assert.equal(hostFeed.length, 100);

  // Aynı öğrenci arka arkaya 5 kez odak kaybetse bile açık odak kaybı varken yalnızca 1 satır eklenmeli
  for (let k = 0; k < 5; k++) {
    handleIncomingRoomMessage(hostCtx, {
      type: 'FOCUS_LOST',
      roomId: 'MEGA-100',
      senderId: 'stu-50',
      senderName: 'Öğrenci 50',
      timestamp: now + 5000 + k,
    });
  }
  const stu50LostItems = hostFeed.filter((f) => f.type === 'FOCUS_LOST' && f.studentName === 'Öğrenci 50');
  assert.equal(stu50LostItems.length, 1);
});

test('Anti-Exploit Testi: Aynı soruyu silip tekrar işaretlemek sonsuz puan kazandırmaz', () => {
  roomService.joinOrCreateRoom('MATH-1', 'Zeki Öğrenci', false);

  // 1. soru doğru cevaplanır
  roomService.logStudentAnswer(101, true);
  let state = roomService.getState();
  const peerId = roomService.getPeerId();
  assert.equal(state.studentStats[peerId].correctCount, 1);

  // Öğrenci aynı soruyu tekrar işaretlerse (mükerrer tıklama) sayı artmaz
  roomService.logStudentAnswer(101, true);
  state = roomService.getState();
  assert.equal(state.studentStats[peerId].correctCount, 1);

  // Öğrenci cevabı siler (revoke)
  roomService.revokeStudentAnswer(101);
  state = roomService.getState();
  assert.equal(state.studentStats[peerId].correctCount, 0);

  // Tekrar işaretlerse sadece 1 olur (toplam 2 olmaz)
  roomService.logStudentAnswer(101, true);
  state = roomService.getState();
  assert.equal(state.studentStats[peerId].correctCount, 1);

  roomService.leaveRoom();
});

test('Hoca İzolasyonu Testi: Hoca (isHost: true) öğrenci sıralamasına ve Durum tablosuna dahil edilmez', () => {
  roomService.joinOrCreateRoom('SINIF-A', 'Müdür Bey', true);
  const state = roomService.getState();
  const hostPeerId = roomService.getPeerId();

  // Hoca studentStats içinde bulunmamalıdır
  assert.equal(state.studentStats[hostPeerId], undefined);
  assert.equal(Object.keys(state.studentStats).length, 0);

  roomService.leaveRoom();
});

test('İkiz İsim ("İki Ali") Testi: Aynı isimli iki öğrenci peerId ile doğru ayrışır', () => {
  const now = Date.now();
  const stats: Record<string, StudentStats> = {
    'stu-ali-1': { id: 'stu-ali-1', name: 'Ali', correctCount: 10, incorrectCount: 0, joinedAt: now },
    'stu-ali-2': { id: 'stu-ali-2', name: 'Ali', correctCount: 2, incorrectCount: 5, joinedAt: now },
  };

  const rank1 = calculateStudentRank('stu-ali-1', stats);
  const rank2 = calculateStudentRank('stu-ali-2', stats);

  assert.equal(rank1.rank, 1);
  assert.equal(rank2.rank, 2);
  assert.equal(rank1.total, 2);
});

registerClassroomNetworkTest();
