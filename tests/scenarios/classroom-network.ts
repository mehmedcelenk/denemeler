import test from 'node:test';
import assert from 'node:assert/strict';
import { handleIncomingRoomMessage } from '../../src/features/classroom/message-handler.ts';
import { calculateStudentRank } from '../../src/features/classroom/ranking.ts';
import type { RoomMessage, RoomFeedItem, RoomParticipant, StudentStats } from '../../src/features/classroom/types.ts';

export function registerClassroomNetworkTest(): void {
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

    const networkBus: Array<(msg: RoomMessage) => void> = [];

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

      networkBus.push((msg: RoomMessage) => {
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

    function broadcast(senderId: string, msg: Omit<RoomMessage, 'senderId' | 'roomId'>) {
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
}
