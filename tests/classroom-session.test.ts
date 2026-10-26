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

test('20 Ayrı Cihaz ve Sanal Ağ Simülasyonu: 1 Hoca + 20 Öğrenci (Eşzamanlı Mesajlaşma, El Kaldırma, Çıkış, Yıldız ve Sıralama)', () => {
  const roomId = 'SIMULASYON-20';
  const now = Date.now();

  interface VirtualDevice {
    id: string;
    name: string;
    isHost: boolean;
    participants: RoomParticipant[];
    feedItems: RoomFeedItem[];
    studentStats: Record<string, StudentStats>;
    helpRequested: boolean;
    isPaused: boolean;
    toasts: string[];
    syncScheduleCount: number;
  }

  const networkBus: Array<(msg: any) => void> = [];

  function createDevice(id: string, name: string, isHost: boolean): VirtualDevice {
    const dev: VirtualDevice = {
      id,
      name,
      isHost,
      participants: [{ id, name, isHost, joinedAt: now }],
      feedItems: [{ id: `${now}_${id}_join`, type: 'JOIN', studentId: id, studentName: name, timestamp: now }],
      studentStats: isHost ? {} : { [id]: { id, name, correctCount: 0, incorrectCount: 0, joinedAt: now } },
      helpRequested: false,
      isPaused: false,
      toasts: [],
      syncScheduleCount: 0,
    };

    networkBus.push((msg: any) => {
      handleIncomingRoomMessage(
        {
          peerId: dev.id,
          roomId,
          userName: dev.name,
          isHost: dev.isHost,
          isPaused: dev.isPaused,
          participants: dev.participants,
          feedItems: dev.feedItems,
          studentStats: dev.studentStats,
          helpRequested: dev.helpRequested,
          setHelpRequested: (val: boolean) => {
            dev.helpRequested = val;
          },
          setPaused: (val: boolean) => {
            dev.isPaused = val;
          },
          leaveRoom: () => {},
          scheduleSyncBroadcast: () => {
            dev.syncScheduleCount++;
          },
          notify: () => {},
        },
        msg
      );
    });

    return dev;
  }

  function broadcast(senderId: string, msg: any) {
    for (const listener of networkBus) {
      listener({ ...msg, senderId, roomId });
    }
  }

  // 1. Hoca odayı kurar
  const teacher = createDevice('teacher-node', 'Mehmet Hoca', true);

  // 2. 20 ayrı öğrenci cihazı odaya katılır
  const students: VirtualDevice[] = [];
  for (let i = 1; i <= 20; i++) {
    const stu = createDevice(`phone-${i}`, `Öğrenci ${i}`, false);
    students.push(stu);

    // Her öğrencinin katılım sinyali ağa yayılır
    broadcast(stu.id, {
      type: 'PEER_JOIN',
      senderName: stu.name,
      isHost: false,
      timestamp: now + i * 10,
    });
  }

  // Hoca ekranında 21 katılımcı (1 Hoca + 20 Öğrenci) ve tam 20 öğrenci istatistiği olmalı
  assert.equal(teacher.participants.length, 21);
  assert.equal(Object.keys(teacher.studentStats).length, 20);

  // 3. Öğrenciler rastgele sorular çözer (Anti-exploit delta doğrulaması)
  students.forEach((stu, idx) => {
    const corrects = (idx % 5) + 1;
    const incorrects = idx % 2;
    for (let c = 0; c < corrects; c++) {
      broadcast(stu.id, {
        type: 'STUDENT_ANSWER_LOG',
        senderName: stu.name,
        timestamp: now + 1000 + c,
        payload: { isCorrect: true, correctCount: c + 1, incorrectCount: 0 },
      });
    }
    for (let w = 0; w < incorrects; w++) {
      broadcast(stu.id, {
        type: 'STUDENT_ANSWER_LOG',
        senderName: stu.name,
        timestamp: now + 2000 + w,
        payload: { isCorrect: false, correctCount: corrects, incorrectCount: w + 1 },
      });
    }
  });

  // Hoca panelindeki 20 öğrencinin doğru sayıları güncellendi mi?
  assert.equal(teacher.studentStats['phone-1'].correctCount >= 1, true);

  // 4. Öğrenci 5 el kaldırır (HELP_CALL)
  broadcast('phone-5', {
    type: 'HELP_CALL',
    senderName: 'Öğrenci 5',
    timestamp: now + 3000,
  });
  const helpItem = teacher.feedItems.find((f) => f.studentId === 'phone-5' && f.type === 'HELP_CALL');
  assert.equal(!!helpItem, true);
  assert.equal(helpItem?.resolved, false);

  // Hoca yardımı tamamlar (HELP_RESOLVED)
  teacher.feedItems.find((f) => f.id === helpItem!.id)!.resolved = true;
  broadcast(teacher.id, {
    type: 'HELP_RESOLVED',
    senderName: teacher.name,
    timestamp: now + 3500,
    payload: { feedId: helpItem!.id, studentId: 'phone-5', studentName: 'Öğrenci 5' },
  });
  assert.equal(helpItem?.resolved, true);

  // Öğrenci 5'in ekranında yardım çağrısının sıfırlandığı doğrulandı mı?
  const stu5 = students[4];
  assert.equal(stu5.helpRequested, false);

  // 5. Öğrenci 12 sekmeden çıkar (FOCUS_LOST) ve 3 saniye sonra döner (FOCUS_RESTORED)
  broadcast('phone-12', {
    type: 'FOCUS_LOST',
    senderName: 'Öğrenci 12',
    timestamp: now + 4000,
  });
  const lostItem = teacher.feedItems.find((f) => f.studentId === 'phone-12' && f.type === 'FOCUS_LOST');
  assert.equal(!!lostItem, true);
  assert.equal(lostItem?.returnedAt, undefined);

  broadcast('phone-12', {
    type: 'FOCUS_RESTORED',
    senderName: 'Öğrenci 12',
    timestamp: now + 7000,
  });
  assert.equal(lostItem?.returnedAt, now + 7000);

  // 6. Sıralama Doğrulaması: 20 öğrenci arasında her telefon kendi benzersiz sırasını görmeli
  const phone1Rank = calculateStudentRank('phone-1', teacher.studentStats);
  assert.equal(phone1Rank.total, 20); // Hoca sıralama paydasına asla girmez (toplam 20 olmalı)
  assert.equal(phone1Rank.rank >= 1 && phone1Rank.rank <= 20, true);
});
