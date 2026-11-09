import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureFreshSession,
  saveCloudProgress,
  syncCloudProgress,
  getActiveSession,
  saveActiveSession,
} from '../src/features/welcome/cloud-sync.ts';
import { setSupabaseConfigOverride } from '../src/data/supabase-client.ts';
import { signInWithEmail } from '../src/data/supabase-auth.ts';
import { store, state } from '../src/app/state.ts';

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

test('auth-hardening: bilinmeyen kullanıcı adı ile girişte "Kullanıcı adı veya şifre hatalı." döner', async () => {
  setSupabaseConfigOverride({
    url: 'https://mock.supabase.co',
    anonKey: 'mock-key',
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('/rest/v1/rpc/find_email_by_identifier')) {
      return new Response(JSON.stringify(null), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    throw new Error(`GoTrue çağrılmamalıydı: ${url}`);
  };

  try {
    const res = await signInWithEmail('bilinmeyen_kullanici', 'sifre123');
    assert.equal(res.data, null);
    assert.equal(res.error, 'Kullanıcı adı veya şifre hatalı.');
  } finally {
    globalThis.fetch = originalFetch;
    setSupabaseConfigOverride(null);
  }
});

test('auth-hardening: eşzamanlı ensureFreshSession çağrıları tekil Promise paylaşır (deduplication)', () => withStorage(async () => {
  setSupabaseConfigOverride({
    url: 'https://mock.supabase.co',
    anonKey: 'mock-key',
  });

  let refreshNetworkCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('grant_type=refresh_token')) {
      refreshNetworkCalls++;
      await new Promise((r) => setTimeout(r, 20));
      return new Response(JSON.stringify({
        access_token: 'new-token',
        refresh_token: 'new-refresh',
        expires_in: 3600,
        user: { id: 'u1', email: 'test@mail.com', user_metadata: { username: 'testuser' } },
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({}), { status: 200 });
  };

  const expiredSession = {
    accessToken: 'old-token',
    refreshToken: 'old-refresh',
    expiresAt: Math.floor(Date.now() / 1000) - 10,
    user: { id: 'u1', email: 'test@mail.com', username: 'testuser' },
  };
  saveActiveSession(expiredSession);

  try {
    const [res1, res2, res3] = await Promise.all([
      ensureFreshSession(),
      ensureFreshSession(),
      ensureFreshSession(),
    ]);

    assert.equal(refreshNetworkCalls, 1, 'Birden fazla çağrı tek bir ağ isteği yapmalıdır');
    assert.equal(res1?.accessToken, 'new-token');
    assert.equal(res2?.accessToken, 'new-token');
    assert.equal(res3?.accessToken, 'new-token');
  } finally {
    globalThis.fetch = originalFetch;
    saveActiveSession(null);
    setSupabaseConfigOverride(null);
  }
}));

test('auth-hardening: eşzamanlı saveCloudProgress çağrıları isSaving ve hasPendingSave ile sıraya girer', () => withStorage(async () => {
  setSupabaseConfigOverride({
    url: 'https://mock.supabase.co',
    anonKey: 'mock-key',
  });

  let savePostCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.includes('/rest/v1/user_progress') && init?.method === 'POST') {
      savePostCalls++;
      await new Promise((r) => setTimeout(r, 25));
      return new Response(JSON.stringify([{}]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({}), { status: 200 });
  };

  const validSession = {
    accessToken: 'valid-token',
    refreshToken: 'valid-refresh',
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    user: { id: 'u1', email: 'test@mail.com', username: 'testuser' },
  };
  saveActiveSession(validSession);

  try {
    const [r1, r2] = await Promise.all([
      saveCloudProgress(),
      saveCloudProgress(),
    ]);

    assert.equal(r1, true);
    assert.equal(r2, false, 'İkinci eşzamanlı çağrı kuyruğa girdiği için anında false dönmelidir');
    await new Promise((r) => setTimeout(r, 60));
    assert.equal(savePostCalls, 2, 'Kuyruktaki istek ilki bitince otomatik tetiklenmelidir');
  } finally {
    globalThis.fetch = originalFetch;
    saveActiveSession(null);
    setSupabaseConfigOverride(null);
  }
}));

test('auth-hardening: syncCloudProgress boş yerel yıldızları buluttaki yıldızlarla doldurur', () => withStorage(async () => {
  setSupabaseConfigOverride({
    url: 'https://mock.supabase.co',
    anonKey: 'mock-key',
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('/rest/v1/user_progress')) {
      return new Response(JSON.stringify([{
        choices: { '101': 'A' },
        starred: [201, 202],
        rematch: [301],
      }]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(JSON.stringify({}), { status: 200 });
  };

  store.setStarredQuestionIds(new Set());
  store.setRematchQuestionIds(new Set());

  const validSession = {
    accessToken: 'valid-token',
    refreshToken: 'valid-refresh',
    expiresAt: Math.floor(Date.now() / 1000) + 3600,
    user: { id: 'u1', email: 'test@mail.com', username: 'testuser' },
  };
  saveActiveSession(validSession);

  try {
    await syncCloudProgress();

    assert.ok(state.starredQuestionIds.has(201), 'Buluttaki 201 çekilmeli');
    assert.ok(state.starredQuestionIds.has(202), 'Buluttaki 202 çekilmeli');
    assert.ok(state.rematchQuestionIds.has(301), 'Buluttaki 301 çekilmeli');
  } finally {
    globalThis.fetch = originalFetch;
    store.setStarredQuestionIds(new Set());
    store.setRematchQuestionIds(new Set());
    saveActiveSession(null);
    setSupabaseConfigOverride(null);
  }
}));

test('auth-hardening: token süresi dolduğunda çözülen sorular asla silinmez, sadece aktif oturum düşer', () => withStorage(async () => {
  setSupabaseConfigOverride({
    url: 'https://mock.supabase.co',
    anonKey: 'mock-key',
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('grant_type=refresh_token')) {
      return new Response(JSON.stringify({ error_description: 'invalid_grant' }), { status: 400 });
    }
    return new Response(JSON.stringify({}), { status: 200 });
  };

  store.setUserMarkedChoices({ 1: 'A', 2: 'B', 3: 'C' });
  const expiredSession = {
    accessToken: 'expired-token',
    refreshToken: 'dead-refresh',
    expiresAt: Math.floor(Date.now() / 1000) - 100,
    user: { id: 'u1', email: 'test@mail.com', username: 'testuser' },
  };
  saveActiveSession(expiredSession);

  try {
    const session = await ensureFreshSession();
    assert.equal(session, null);
    assert.equal(getActiveSession(), null, 'Oturum anahtarı temizlenmeli');
    assert.equal(state.userMarkedChoices[1], 'A', 'Kullanıcının 1. sorusu SİLİNMEMELİ');
    assert.equal(state.userMarkedChoices[2], 'B', 'Kullanıcının 2. sorusu SİLİNMEMELİ');
    assert.equal(state.userMarkedChoices[3], 'C', 'Kullanıcının 3. sorusu SİLİNMEMELİ');
  } finally {
    globalThis.fetch = originalFetch;
    store.setUserMarkedChoices({});
    setSupabaseConfigOverride(null);
  }
}));
