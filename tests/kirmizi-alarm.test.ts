import test from 'node:test';
import assert from 'node:assert/strict';
import { state, store } from '../src/app/state.ts';
import { toggleStarQuestion, addToRematch, saveStarred, saveRematch } from '../src/features/library/library-model.ts';
import { toggleEliminateChoice } from '../src/features/annotations/eliminate-choice.ts';
import {
  saveActiveSession,
  handleSignOut,
  syncCloudProgress,
  scheduleCloudSync,
} from '../src/features/welcome/cloud-sync.ts';
import { canMarkAnswer } from '../src/features/answers/rate-limit.ts';
import { renderMathText } from '../src/shared/math-render.ts';
import { renderCardStem, renderCardOptions } from '../src/features/booklet/question-card.ts';
import { getFilterCounts } from '../src/features/booklet/filter.ts';
import { studentMessageHandlers } from '../src/features/classroom/message-handlers/student.ts';
import type { MessageContext } from '../src/features/classroom/message-handlers/context.ts';
import { setSupabaseConfigOverride } from '../src/data/supabase-client.ts';
import type { AuthSession } from '../src/data/supabase-auth.ts';
import type { Question } from '../src/data/question.ts';

const mockSession: AuthSession = {
  accessToken: 'jwt-token-kirmizi',
  refreshToken: 'refresh-token-kirmizi',
  user: { id: 'user-kirmizi-1', email: 'test@cenks.dev', displayName: 'Test User' },
};

function withStorage(run: () => Promise<void>): Promise<void> {
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
    return run().finally(cleanup);
  } catch (err) {
    cleanup();
    throw err;
  }
}

test('Kırmızı Alarm 1: Yıldız, Rövanş ve Şık Eleme eylemleri bulut senkronizasyonu tetikler', async () => {
  await withStorage(async () => {
    setSupabaseConfigOverride({ url: 'https://mock.supabase.co', anonKey: 'key-test' });
    saveActiveSession(mockSession);
    let savedPayload: Record<string, unknown> | null = null;
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (input, init) => {
        if (init?.method === 'POST' && String(input).includes('/rest/v1/user_progress')) {
          savedPayload = JSON.parse(String(init.body)) as Record<string, unknown>;
          return new Response('', { status: 201 });
        }
        return new Response('[]', { status: 200 });
      };

      // 1. Yıldız ekleme -> scheduleCloudSync tetiklenir
      toggleStarQuestion(501);
      await new Promise(r => setTimeout(r, 1300));
      assert.notEqual(savedPayload, null);
      assert.deepEqual((savedPayload as Record<string, unknown>).starred, [501]);

      // 2. Rövanş sepeti
      savedPayload = null;
      addToRematch(601);
      await new Promise(r => setTimeout(r, 1300));
      assert.notEqual(savedPayload, null);
      assert.deepEqual((savedPayload as Record<string, unknown>).rematch, [601]);

      // 3. Şık eleme
      savedPayload = null;
      toggleEliminateChoice(501, 'C');
      await new Promise(r => setTimeout(r, 1300));
      assert.notEqual(savedPayload, null);
      assert.ok(Array.isArray(((savedPayload as Record<string, unknown>).eliminated_choices as Record<string, string[]>)['501']));

      // 4. Doğrudan saveStarred ve saveRematch fonksiyonları da tetikler
      savedPayload = null;
      saveStarred();
      await new Promise(r => setTimeout(r, 1300));
      assert.notEqual(savedPayload, null);

      savedPayload = null;
      saveRematch();
      await new Promise(r => setTimeout(r, 1300));
      assert.notEqual(savedPayload, null);
    } finally {
      globalThis.fetch = originalFetch;
      setSupabaseConfigOverride(null);
    }
  });
});

test('Kırmızı Alarm 1: Boş yerel liste buluttaki yıldızları çeker; dolu yerel liste zombi yıldızları reddeder', async () => {
  await withStorage(async () => {
    setSupabaseConfigOverride({ url: 'https://mock.supabase.co', anonKey: 'key-test' });
    saveActiveSession(mockSession);
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (input, init) => {
        if (init?.method === 'GET' || !init?.method) {
          return new Response(JSON.stringify([{
            user_id: 'user-kirmizi-1',
            starred: [701, 702],
            rematch: [801],
          }]), { status: 200 });
        }
        return new Response('', { status: 201 });
      };

      // Durum A: Yerel liste boşken buluttan çekilmeli
      store.setStarredQuestionIds(new Set(), false);
      store.setRematchQuestionIds(new Set(), false);
      await syncCloudProgress();
      assert.ok(state.starredQuestionIds.has(701), 'Boş yerelde 701 çekilmeli');
      assert.ok(state.starredQuestionIds.has(702), 'Boş yerelde 702 çekilmeli');
      assert.ok(state.rematchQuestionIds.has(801), 'Boş yerelde 801 çekilmeli');

      // Durum B: Kullanıcı 701 yıldızını kaldırdı, yerelde yalnızca [999] var
      store.setStarredQuestionIds(new Set([999]), false);
      await syncCloudProgress();
      assert.equal(state.starredQuestionIds.has(701), false, 'Kaldırılan 701 zombi olarak geri gelmemeli');
      assert.equal(state.starredQuestionIds.has(702), false, 'Buluttaki 702 yereldeki listeyi ezmemeli');
      assert.ok(state.starredQuestionIds.has(999), 'Yereldeki 999 korunmalı');
    } finally {
      globalThis.fetch = originalFetch;
      setSupabaseConfigOverride(null);
    }
  });
});

test('Kırmızı Alarm 1: handleSignOut bekleyen senkronizasyonu Supabase e kaydeder', async () => {
  await withStorage(async () => {
    setSupabaseConfigOverride({ url: 'https://mock.supabase.co', anonKey: 'key-test' });
    saveActiveSession(mockSession);
    store.setUserMarkedChoices({ 901: 'A' });

    let saveCalledBeforeSignout = false;
    let signoutCalled = false;
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (input, init) => {
        const url = String(input);
        if (init?.method === 'POST' && url.includes('/rest/v1/user_progress')) {
          saveCalledBeforeSignout = !signoutCalled;
          return new Response('', { status: 201 });
        }
        if (url.includes('/auth/v1/logout')) {
          signoutCalled = true;
          return new Response('', { status: 204 });
        }
        return new Response('', { status: 200 });
      };

      // 1. Senkronizasyon planla (beklemede)
      scheduleCloudSync(5000);

      // 2. 5 saniye beklemeden hemen çıkış yap
      await handleSignOut();

      assert.equal(saveCalledBeforeSignout, true, 'Bekleyen kayıt oturum kapatılmadan önce kaydedilmeli');
      assert.equal(signoutCalled, true, 'Supabase logout çağrılmalı');
      assert.deepEqual(state.userMarkedChoices, {}, 'Yerel state temizlenmeli');
    } finally {
      globalThis.fetch = originalFetch;
      setSupabaseConfigOverride(null);
    }
  });
});

test('Kırmızı Alarm 2: 1 dakikalık false-positive ban kalktı, sadece 300ms debounce korundu', async () => {
  const previousDoc = globalThis.document;
  (globalThis as unknown as { document: unknown }).document = {};
  try {
    // 1. İlk tıklama serbest
    const first = canMarkAnswer(101);
    assert.equal(first, true);

    // 2. 100ms sonra (hızlı çift tık) engellenir
    const rapid = canMarkAnswer(101);
    assert.equal(rapid, false, '300ms içi hızlı çift tık debounce edilmeli');

    // 3. Ban uygulanmadığını doğrula (eskiden 60 sn kilitliyordu)
    // 350ms bekleyince hemen serbest olmalı
    await new Promise(r => setTimeout(r, 350));
    const allowed = canMarkAnswer(101);
    assert.equal(allowed, true, '300ms sonra tıklama serbest olmalı, 1 dk ban uygulanmamalı');
  } finally {
    (globalThis as unknown as { document: unknown }).document = previousDoc;
  }
});

test('Kırmızı Alarm 3: Hoca ayrıldığında (PEER_LEAVE) öğrenci mola perdesi otomatik açılır', () => {
  let pausedValue = true;
  const mockCtx: Partial<MessageContext> = {
    peerId: 'student-1',
    isHost: false,
    isPaused: true,
    participants: [
      { id: 'teacher-host', name: 'Hoca', isHost: true, joinedAt: 100, lastSeenAt: 200 },
      { id: 'student-1', name: 'Öğrenci', isHost: false, joinedAt: 150, lastSeenAt: 200 },
    ],
    studentStats: {},
    feedItems: [],
    setPaused: (val: boolean) => { pausedValue = val; },
    notify: () => {},
  };

  const handler = studentMessageHandlers.PEER_LEAVE;
  assert.ok(handler);

  // Hoca ayrılıyor
  handler(mockCtx as MessageContext, {
    senderId: 'teacher-host',
    senderName: 'Hoca',
    timestamp: 300,
    msg: { type: 'PEER_LEAVE', senderId: 'teacher-host', senderName: 'Hoca', isHost: true, timestamp: 300 },
    existingPeer: mockCtx.participants![0],
    isSenderHost: true,
  });

  assert.equal(pausedValue, false, 'Hoca ayrılınca setPaused(false) çağrılmalı');
});

test('Kırmızı Alarm 5: KaTeX XSS koruması, satır sonları (\n -> <br>) ve Fizik/Kimya formülleri', () => {
  // 1. XSS ve satır sonu testi
  const maliciousInput = '<script>alert("xss")</script>\n$v_0 = 10\\text{ m/s}$\nİkinci satır.';
  const renderedMath = renderMathText(maliciousInput);
  assert.ok(!renderedMath.includes('<script>'), 'Ham script tagi engellenmeli');
  assert.ok(renderedMath.includes('&lt;script&gt;'), 'HTML etiketleri escape edilmeli');
  assert.ok(renderedMath.includes('<br>'), 'Satır sonları <br> ye dönüştürülmeli');
  assert.ok(renderedMath.includes('class="katex"'), 'KaTeX formülü render edilmeli');

  // 2. AYT Fizik / Kimya formüllü soru KaTeX ile render edilir
  const physicsQ: Question = {
    id: 77701,
    ders: 'FİZİK – 1',
    soru: 'İlk hızı $v_0 = 20\\text{ m/s}$ olan cisim $\\Delta x$ kadar yol alıyor.',
    secenekler: { A: '$v_0$', B: '20', C: '30', D: '40' },
    dogru_cevap: 'A',
  };
  const stem = renderCardStem(physicsQ);
  assert.ok(stem.includes('class="katex"'), 'Fizik soru kökündeki $ formülü KaTeX ile render edilmeli');

  const options = renderCardOptions(physicsQ, false);
  assert.ok(options.includes('class="katex"'), 'Fizik şıkkındaki $v_0$ KaTeX ile render edilmeli');

  // 3. Röntgeni olmayan İngilizce soruda escapeHtml güvenliği
  const engQ: Question = {
    id: 77702,
    ders: 'İNGİLİZCE – 1',
    soru: 'Which one is true? <img src=x onerror=alert(1)>',
    secenekler: { A: '<b>Apple</b>', B: 'Banana', C: 'Cat', D: 'Dog' },
    dogru_cevap: 'A',
  };
  const engStem = renderCardStem(engQ);
  assert.ok(!engStem.includes('<img src=x'), 'İngilizce soruda HTML enjeksiyonu engellenmeli');
  assert.ok(engStem.includes('&lt;img'), 'İngilizce soruda etiketler escapeHtml den geçmeli');

  const engOpt = renderCardOptions(engQ, false);
  assert.ok(!engOpt.includes('<b>Apple</b>'), 'İngilizce şıklarda HTML enjeksiyonu engellenmeli');
  assert.ok(engOpt.includes('&lt;b&gt;Apple&lt;/b&gt;'), 'İngilizce şık escape edilmeli');
});

test('Rozet Sayacı: selectedCourses henüz boşken getFilterCounts sıfırlanmaz', () => {
  store.setCurrentSubject('MAT');
  store.setSelectedCourses(new Set());
  state.allData = [
    { id: 1001, ders: 'MATEMATİK – 1', soru: 'S1', secenekler: { A: '1', B: '2', C: '3', D: '4' }, dogru_cevap: 'A' },
    { id: 1002, ders: 'MATEMATİK – 1', soru: 'S2', secenekler: { A: '1', B: '2', C: '3', D: '4' }, dogru_cevap: 'B' },
  ];
  store.setStarredQuestionIds([1001, 1002], false);
  store.setRematchQuestionIds([1001], false);

  const counts = getFilterCounts();
  assert.equal(counts.starred, 2, 'selectedCourses boşken dersin tüm yıldızlı soruları sayılmalı');
  assert.equal(counts.rematch, 1, 'selectedCourses boşken dersin tüm rövanş soruları sayılmalı');
});
