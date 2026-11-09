import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getActiveSession,
  saveActiveSession,
  isAuthenticated,
  requireAuth,
  handleSignOut,
  syncCloudProgress,
  ensureFreshSession,
  scheduleCloudSync,
} from '../src/features/welcome/auth-modal.ts';
import { setSupabaseConfigOverride } from '../src/data/supabase-client.ts';
import { store, state } from '../src/app/state.ts';
import { readString, writeJson, writeString } from '../src/app/storage.ts';
import { StorageKeys } from '../src/shared/storage-keys.ts';
import type { AuthSession } from '../src/data/supabase-auth.ts';

const mockSession: AuthSession = {
  accessToken: 'jwt-token-abc-123',
  refreshToken: 'refresh-token-xyz',
  user: {
    id: 'user-uuid-1',
    email: 'ogrenci@cenks.meb.gov.tr',
    displayName: 'Öğrenci Ali',
  },
};

function withStorage(run: () => void | Promise<void>): Promise<void> | void {
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
    return (res && typeof (res as Promise<void>).then === 'function') ? (res as Promise<void>).finally(cleanup) : cleanup();
  } catch (err) {
    cleanup();
    throw err;
  }
}

test('auth-modal: oturum yokken isAuthenticated false döner', () => {
  withStorage(() => {
    saveActiveSession(null);
    assert.equal(isAuthenticated(), false);
    assert.equal(getActiveSession(), null);
  });
});

test('auth-modal: oturum kaydedildiğinde ve okunduğunda doğrulanır', () => {
  withStorage(() => {
    saveActiveSession(mockSession);
    assert.equal(isAuthenticated(), true);
    const loaded = getActiveSession();
    assert.equal(loaded?.accessToken, 'jwt-token-abc-123');
    assert.equal(loaded?.user.id, 'user-uuid-1');
    assert.equal(loaded?.user.displayName, 'Öğrenci Ali');

    saveActiveSession(null);
    assert.equal(isAuthenticated(), false);
  });
});

test('requireAuth: oturum açıkken doğrudan eylemi çalıştırır, kapalıyken engeller', () => {
  withStorage(() => {
    saveActiveSession(mockSession);
    let called = false;
    requireAuth(() => { called = true; });
    assert.equal(called, true);

    saveActiveSession(null);
    let calledAfterSignOut = false;
    requireAuth(() => { calledAfterSignOut = true; });
    assert.equal(calledAfterSignOut, false);
  });
});

test('auth-modal: checkUsernameAvailable kısa veya geçersiz kullanıcı adını doğrudan reddeder', async () => {
  const { checkUsernameAvailable } = await import('../src/data/supabase-auth.ts');
  assert.equal(await checkUsernameAvailable('ab'), false);
  assert.equal(await checkUsernameAvailable('   '), false);
});

test('syncCloudProgress: cloud.choices yerel cevaplarla birleştirilir ve veri kaybı önlenir', async () => {
  await withStorage(async () => {
    setSupabaseConfigOverride({ url: 'https://mock.supabase.co', anonKey: 'key-123' });
    saveActiveSession(mockSession);
    store.setUserMarkedChoices({ 102: 'C', 103: 'D' });
    store.setStarredQuestionIds(new Set([103]));
    store.setRematchQuestionIds(new Set());

    let savedPayload: Record<string, unknown> | null = null;
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (input, init) => {
        const url = String(input);
        if (init?.method === 'GET' || !init?.method) {
          assert.ok(url.includes('/rest/v1/user_progress'));
          return new Response(JSON.stringify([{
            user_id: 'user-uuid-1',
            choices: { '101': 'A', '102': 'B' },
            starred: [101],
            rematch: [105],
          }]), { status: 200 });
        }
        if (init?.method === 'POST') {
          savedPayload = JSON.parse(String(init.body)) as Record<string, unknown>;
          return new Response('', { status: 201 });
        }
        return new Response('', { status: 404 });
      };

      await syncCloudProgress();
      assert.equal(state.userMarkedChoices[101], 'A');
      assert.equal(state.userMarkedChoices[102], 'C');
      assert.equal(state.userMarkedChoices[103], 'D');
      assert.equal(state.starredQuestionIds.has(101), false);
      assert.ok(state.starredQuestionIds.has(103));
      assert.ok(state.rematchQuestionIds.has(105));

      assert.notEqual(savedPayload, null);
      const savedChoices = (savedPayload as Record<string, unknown>).choices as Record<string, string>;
      assert.equal(savedChoices['101'], 'A');
      assert.equal(savedChoices['102'], 'C');
      assert.equal(savedChoices['103'], 'D');
    } finally {
      globalThis.fetch = originalFetch;
      setSupabaseConfigOverride(null);
    }
  });
});

test('syncCloudProgress: ağ/sunucu hatasında buluttaki veriyi ezmez ve save çağırmaz', async () => {
  await withStorage(async () => {
    setSupabaseConfigOverride({ url: 'https://mock.supabase.co', anonKey: 'key-123' });
    saveActiveSession(mockSession);
    store.setUserMarkedChoices({ 301: 'A' });

    let saveCalled = false;
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (_input, init) => {
        if (init?.method === 'POST') saveCalled = true;
        return new Response('Server Error', { status: 500 });
      };

      await syncCloudProgress();
      assert.equal(saveCalled, false);
      assert.equal(state.userMarkedChoices[301], 'A');
    } finally {
      globalThis.fetch = originalFetch;
      setSupabaseConfigOverride(null);
    }
  });
});

test('handleSignOut: oturum kapatıldığında cevaplar, yıldızlar, oturum ve kullanıcı adı tamamen temizlenir', async () => {
  await withStorage(async () => {
    setSupabaseConfigOverride({ url: 'https://mock.supabase.co', anonKey: 'key-123' });
    saveActiveSession(mockSession);
    store.setUserMarkedChoices({ 201: 'B', 202: 'A' });
    store.setStarredQuestionIds(new Set([201]));
    store.setRematchQuestionIds(new Set([202]));
    store.setEliminatedChoices({ 201: ['C', 'D'] });
    store.setEliminatedWrongChoices({ 201: 'C' });
    store.setWaterStreak(10);
    store.setAiExplanations({ 201: { query: 'soru', reply: 'yanit', updatedAt: 123 } });
    writeJson(StorageKeys.RESUME_STATE, { subject: 'TDE' });
    writeString(StorageKeys.CLASSROOM_SESSION, 'room-session-1');

    const originalFetch = globalThis.fetch;
    let logoutCalled = false;
    try {
      globalThis.fetch = async (input) => {
        if (String(input).includes('/auth/v1/logout')) logoutCalled = true;
        return new Response('', { status: 204 });
      };

      await handleSignOut();

      assert.equal(logoutCalled, true);
      assert.equal(getActiveSession(), null);
      assert.equal(isAuthenticated(), false);
      assert.deepEqual(state.userMarkedChoices, {});
      assert.equal(state.starredQuestionIds.size, 0);
      assert.equal(state.rematchQuestionIds.size, 0);
      assert.deepEqual(state.eliminatedChoices, {});
      assert.deepEqual(state.eliminatedWrongChoices, {});
      assert.equal(readString(StorageKeys.USER_NAME), '');
      assert.equal(readString(StorageKeys.RESUME_STATE), '');
      assert.equal(readString(StorageKeys.CLASSROOM_SESSION), '');
      assert.equal(state.waterStreak, 0);
      assert.deepEqual(state.aiExplanations, {});
    } finally {
      globalThis.fetch = originalFetch;
      setSupabaseConfigOverride(null);
    }
  });
});

test('ensureFreshSession: süresi dolmak üzere olan oturumu otomatik yeniler', async () => {
  await withStorage(async () => {
    setSupabaseConfigOverride({ url: 'https://mock.supabase.co', anonKey: 'key-123' });
    const expiringSession: AuthSession = {
      accessToken: 'expiring-token',
      refreshToken: 'valid-refresh-token',
      user: { id: 'u-1', email: 'exp@test.com' },
      expiresAt: Math.floor(Date.now() / 1000) + 10,
    };
    saveActiveSession(expiringSession);

    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (input) => {
        assert.ok(String(input).includes('/auth/v1/token?grant_type=refresh_token'));
        return new Response(JSON.stringify({
          access_token: 'fresh-token-xyz',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
          user: { id: 'u-1', email: 'exp@test.com' },
        }), { status: 200 });
      };

      const fresh = await ensureFreshSession();
      assert.notEqual(fresh, null);
      assert.equal(fresh?.accessToken, 'fresh-token-xyz');
      assert.equal(getActiveSession()?.accessToken, 'fresh-token-xyz');
    } finally {
      globalThis.fetch = originalFetch;
      setSupabaseConfigOverride(null);
    }
  });
});

test('ensureFreshSession: süresi dolmuş oturumda refresh başarısız olursa null döner', async () => {
  await withStorage(async () => {
    setSupabaseConfigOverride({ url: 'https://mock.supabase.co', anonKey: 'key-123' });
    saveActiveSession({
      accessToken: 'dead-token',
      refreshToken: 'bad-refresh',
      user: { id: 'u-dead' },
      expiresAt: Math.floor(Date.now() / 1000) - 100,
    });
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 });
      const fresh = await ensureFreshSession();
      assert.equal(fresh, null);
    } finally {
      globalThis.fetch = originalFetch;
      setSupabaseConfigOverride(null);
    }
  });
});

test('scheduleCloudSync: soru işaretlendiğinde debounced bir şekilde Supabase user_progress tablosuna kaydeder', async () => {
  await withStorage(async () => {
    setSupabaseConfigOverride({ url: 'https://mock.supabase.co', anonKey: 'key-123' });
    saveActiveSession(mockSession);
    store.setUserMarkedChoices({ 401: 'B' });

    let saved = false;
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (input, init) => {
        if (init?.method === 'POST' && String(input).includes('/rest/v1/user_progress')) {
          saved = true;
          return new Response('', { status: 201 });
        }
        return new Response('', { status: 200 });
      };

      scheduleCloudSync(40);
      assert.equal(saved, false);

      await new Promise(resolve => setTimeout(resolve, 80));
      assert.equal(saved, true);
    } finally {
      globalThis.fetch = originalFetch;
      setSupabaseConfigOverride(null);
    }
  });
});

