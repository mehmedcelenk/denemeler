import test from 'node:test';
import assert from 'node:assert/strict';
import { roomService } from '../src/features/classroom/room-service.ts';
import { buildRestoredSessionPlan, loadRoomSession, persistCurrentRoomSession, saveRoomSession } from '../src/features/classroom/session-store.ts';
import { syncCloudProgress, saveActiveSession } from '../src/features/welcome/cloud-sync.ts';
import { setSupabaseConfigOverride } from '../src/data/supabase-client.ts';
import { store, state } from '../src/app/state.ts';
import type { RoomMessage } from '../src/features/classroom/types.ts';

function withStorage(run: () => Promise<void> | void): Promise<void> {
  const values = new Map<string, string>();
  const previous = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (k: string) => values.get(k) ?? null,
      setItem: (k: string, v: string) => { values.set(k, v); },
      removeItem: (k: string) => { values.delete(k); },
    },
    configurable: true,
  });
  const cleanup = () => Object.defineProperty(globalThis, 'localStorage', { value: previous, configurable: true });
  try {
    const res = run();
    return Promise.resolve(res).finally(cleanup);
  } catch (err) {
    cleanup();
    throw err;
  }
}

test('Canlı Sınıf İnsan Simülasyonu: 50 öğrenci eşzamanlı soru çözer, kopanlar geri döner, sıralama ve veriler tutarlıdır', () => {
  const now = 100000;
  roomService.joinOrCreateRoom('SINIF-50', 'Hoca Can', true);
  const hostState = roomService.getState();

  // 1. 50 öğrenci katılır
  for (let i = 1; i <= 50; i++) {
    const stuId = `student_${i}`;
    const stuName = `Öğrenci ${i}`;
    const joinMsg: RoomMessage = {
      type: 'PEER_JOIN',
      roomId: 'SINIF-50',
      senderId: stuId,
      senderName: stuName,
      isHost: false,
      timestamp: now + i * 10,
    };
    // Hoca gelen mesajı işler
    (roomService as unknown as { handleIncoming: (m: RoomMessage) => void }).handleIncoming(joinMsg);
  }

  assert.equal(hostState.participants.length, 51);
  assert.equal(Object.keys(hostState.studentStats).length, 50);

  // 2. Öğrenciler 10'ar soru çözer (doğru & yanlış)
  for (let i = 1; i <= 50; i++) {
    const stuId = `student_${i}`;
    const stuName = `Öğrenci ${i}`;
    for (let q = 1; q <= 10; q++) {
      const isCorrect = q % 2 === 0;
      (roomService as unknown as { handleIncoming: (m: RoomMessage) => void }).handleIncoming({
        type: 'STUDENT_ANSWER_LOG',
        roomId: 'SINIF-50',
        senderId: stuId,
        senderName: stuName,
        timestamp: now + 1000 + i * 10 + q,
        payload: { questionId: 100 + q, isCorrect },
      });
    }
  }

  // Her öğrencinin 5 doğru 5 yanlışı olmalı
  for (let i = 1; i <= 50; i++) {
    const s = hostState.studentStats[`student_${i}`];
    assert.equal(s.correctCount, 5, `student_${i} 5 doğruya sahip olmalı`);
    assert.equal(s.incorrectCount, 5, `student_${i} 5 yanlışa sahip olmalı`);
    assert.equal(Object.keys(s.answers || {}).length, 10);
  }

  // 3. Öğrenci 5 ve 10 interneti kopar / odak kaybeder (FOCUS_LOST)
  (roomService as unknown as { handleIncoming: (m: RoomMessage) => void }).handleIncoming({
    type: 'FOCUS_LOST',
    roomId: 'SINIF-50',
    senderId: 'student_5',
    senderName: 'Öğrenci 5',
    timestamp: now + 50000,
  });
  assert.equal(hostState.studentStats['student_5'].isOnline, false);
  assert.equal(hostState.studentStats['student_5'].exitCount, 1);

  // 4. Öğrenci 5, 8 saniye sonra geri döner (FOCUS_RESTORED)
  (roomService as unknown as { handleIncoming: (m: RoomMessage) => void }).handleIncoming({
    type: 'FOCUS_RESTORED',
    roomId: 'SINIF-50',
    senderId: 'student_5',
    senderName: 'Öğrenci 5',
    timestamp: now + 58000,
    payload: { durationMs: 8000 },
  });
  assert.equal(hostState.studentStats['student_5'].isOnline, true);
  assert.equal(hostState.studentStats['student_5'].totalAwayMs, 8000);

  // 5. Öğrenci 12 el kaldırır ve hoca çözer
  (roomService as unknown as { handleIncoming: (m: RoomMessage) => void }).handleIncoming({
    type: 'HELP_CALL',
    roomId: 'SINIF-50',
    senderId: 'student_12',
    senderName: 'Öğrenci 12',
    timestamp: now + 60000,
  });
  const helpItem = hostState.feedItems.find(f => f.type === 'HELP_CALL' && f.studentId === 'student_12');
  assert.ok(helpItem);
  assert.equal(helpItem.resolved, false);

  roomService.resolveTeacherHelp(helpItem.id, 'student_12');
  assert.equal(helpItem.resolved, true);

  roomService.leaveRoom();
});

test('Oturum Zaman Aşımı (Max Age): 12 saatten eski sınıf oturumu buildRestoredSessionPlan tarafından geri yüklenmez', async () => {
  await withStorage(() => {
    const thirteenHoursAgo = Date.now() - (13 * 60 * 60 * 1000);
    saveRoomSession({
      peerId: 'old_peer',
      roomId: 'ESKI-ODA',
      userName: 'Ali',
      isHost: false,
      joinedAt: thirteenHoursAgo,
      timestamp: thirteenHoursAgo,
    });

    const plan = buildRestoredSessionPlan();
    assert.equal(plan, null, '13 saatlik oturum geri yüklenmemeli');
  });
});

test('Bulut Senkronizasyonu (Cloud Sync): Boş yerel liste buluttaki yıldızları ve rövanşları çeker, cevapları birleştirir', async () => {
  await withStorage(async () => {
    setSupabaseConfigOverride({ url: 'https://mock.supabase.co', anonKey: 'anon-mock-key' });
    saveActiveSession({
      accessToken: 'token-test',
      refreshToken: 'refresh-test',
      user: { id: 'user-mock-1', email: 'test@cenks.dev' },
    });

    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (input, init) => {
        if (!init?.method || init.method === 'GET') {
          return new Response(JSON.stringify([{
            user_id: 'user-mock-1',
            choices: { '101': 'A' },
            starred: [201, 202],
            rematch: [301],
          }]), { status: 200 });
        }
        return new Response('', { status: 201 });
      };

      store.setStarredQuestionIds(new Set(), false);
      store.setRematchQuestionIds(new Set(), false);
      store.setUserMarkedChoices({ 102: 'B' });

      await syncCloudProgress();

      // Buluttaki 201, 202 çekilmeli
      assert.ok(state.starredQuestionIds.has(201));
      assert.ok(state.starredQuestionIds.has(202));

      // Buluttaki 301 çekilmeli
      assert.ok(state.rematchQuestionIds.has(301));

      // Cevaplar birleşmeli (101: A, 102: B)
      assert.equal(state.userMarkedChoices[101], 'A');
      assert.equal(state.userMarkedChoices[102], 'B');
    } finally {
      globalThis.fetch = originalFetch;
      setSupabaseConfigOverride(null);
    }
  });
});

test('Hoca Mola (Pause/Resume) Kilitlenmeme: Saat farkı veya arşivli joinedAt olan öğrenciler gelse bile Hoca mola ekranında kilitlenmez', async () => {
  await withStorage(() => {
    roomService.joinOrCreateRoom('MOLA-101', 'Mehmet Hoca', true);
    const sendToHost = (msg: RoomMessage) =>
      (roomService as unknown as { handleIncoming: (m: RoomMessage) => void }).handleIncoming(msg);

    // 1. Cihaz saati hocadan 60 sn geride olan (joinedAt = 1000) 15 öğrenci odaya katılır
    for (let i = 1; i <= 15; i++) {
      sendToHost({
        type: 'PEER_JOIN',
        roomId: 'MOLA-101',
        senderId: `skewed_stu_${i}`,
        senderName: `Öğrenci ${i}`,
        isHost: true, // İlk girişte herkes asHost:true gönderiyor
        timestamp: 1000 + i,
        payload: { joinedAt: 1000 + i },
      });
    }

    assert.equal(roomService.isHost(), true, 'Hoca saat farkı olan PEER_JOIN paketleriyle öğrenciye düşmemeli');

    // 2. Hoca oturumu durdurur (⏸️ Durdur)
    roomService.togglePauseRoom();
    assert.equal(roomService.getState().isPaused, true);
    assert.equal(roomService.isHost(), true);

    // 3. Mola sırasında başka bir cihazdan yanlışlıkla isHost:true içeren ROOM_SYNC veya PEER_JOIN gelse bile Hoca düşmez
    sendToHost({
      type: 'ROOM_SYNC',
      roomId: 'MOLA-101',
      senderId: 'rogue_peer',
      senderName: 'Geç Gelen',
      isHost: true,
      timestamp: 500,
      payload: {
        participants: [{ id: 'rogue_peer', name: 'Geç Gelen', isHost: true, joinedAt: 500 }],
        isPaused: true,
      },
    });

    const hostState = roomService.getState();
    assert.equal(hostState.isHost, true, 'Aktif ve moladaki Hoca asla öğrenciye düşürülemez');
    assert.equal(hostState.isPaused && !hostState.isHost, false, 'Hocanın ekranında #roomPauseOverlay asla açılmamalı');

    // 4. Hoca مola sırasında F5 atar (restoreSessionIfActive): isHost=true ve isPaused=true korunur
    const restored = roomService.restoreSessionIfActive();
    assert.equal(restored, true);
    assert.equal(roomService.isHost(), true, 'F5 sonrasında Hoca yetkisi korunmalı');
    assert.equal(roomService.getState().isPaused, true, 'F5 sonrasında mola durumu korunmalı');

    // 5. Aynı tarayıcıda 2. sekme (öğrenci) açılıp kaydetmeye çalışırsa Hoca oturumunu ezemez
    persistCurrentRoomSession(
      {
        roomId: 'MOLA-101',
        userName: 'Sekme 2 Öğrenci',
        isHost: false,
        isPaused: true,
        participants: [],
        feedItems: [],
        studentStats: {},
        helpRequested: false,
      },
      'second_tab_student_id'
    );
    assert.equal(loadRoomSession()?.isHost, true, '2. sekmedeki öğrenci Hoca oturum kaydını ezemez');

    // 6. Hoca ▶️ Devam Et butonuna basarak oturumu sorunsuz devam ettirir
    roomService.togglePauseRoom();
    assert.equal(roomService.getState().isPaused, false, 'Hoca oturumu geri başlatabilmeli');

    roomService.leaveRoom();
  });
});
