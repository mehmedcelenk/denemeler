import test from 'node:test';
import assert from 'node:assert/strict';
import { setSupabaseConfigOverride } from '../src/data/supabase-client.ts';
import {
  signUpWithEmail,
  signInWithEmail,
  signOutFromSupabase,
  saveUserProgressToSupabase,
  fetchUserProgressFromSupabase,
  type AuthSession,
} from '../src/data/supabase-auth.ts';

const mockSession: AuthSession = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: {
    id: 'user-12345',
    email: 'test@example.com',
    displayName: 'Öğrenci Ali',
  },
};

test('supabase-auth: Supabase yapılandırılmamışsa güvenle hata döner', async () => {
  setSupabaseConfigOverride(null);
  const up = await signUpWithEmail('ali@test.com', '123456');
  assert.equal(up.data, null);
  assert.ok(up.error?.includes('yapılandırılmamış'));

  const inRes = await signInWithEmail('ali@test.com', '123456');
  assert.equal(inRes.data, null);
  assert.ok(inRes.error?.includes('yapılandırılmamış'));

  const saveRes = await saveUserProgressToSupabase(mockSession, {});
  assert.equal(saveRes, false);

  const fetchRes = await fetchUserProgressFromSupabase(mockSession);
  assert.equal(fetchRes, null);
});

test('signUpWithEmail: başarılı yanıtta kullanıcı ve oturum döner', async () => {
  setSupabaseConfigOverride({ url: 'https://mock.supabase.co', anonKey: 'key-123' });
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async (input, init) => {
      assert.ok(String(input).includes('/auth/v1/signup'));
      assert.equal(init?.method, 'POST');
      return new Response(JSON.stringify({
        access_token: 'tok-abc',
        refresh_token: 'ref-xyz',
        user: { id: 'usr-99', email: 'yeni@test.com', user_metadata: { display_name: 'Yeni Öğrenci' } },
      }), { status: 200 });
    };

    const res = await signUpWithEmail('yeni@test.com', 'Secret123', 'Yeni Öğrenci');
    assert.equal(res.error, null);
    assert.equal(res.data?.user.id, 'usr-99');
    assert.equal(res.data?.user.displayName, 'Yeni Öğrenci');
    assert.equal(res.data?.accessToken, 'tok-abc');
  } finally {
    globalThis.fetch = originalFetch;
    setSupabaseConfigOverride(null);
  }
});

test('signInWithEmail: hatalı girişte hata metni döner', async () => {
  setSupabaseConfigOverride({ url: 'https://mock.supabase.co', anonKey: 'key-123' });
  const originalFetch = globalThis.fetch;

  try {
    globalThis.fetch = async () => {
      return new Response(JSON.stringify({
        error_description: 'Geçersiz e-posta veya şifre.',
      }), { status: 400 });
    };

    const res = await signInWithEmail('hatali@test.com', 'yanlis');
    assert.equal(res.data, null);
    assert.equal(res.error, 'Geçersiz e-posta veya şifre.');
  } finally {
    globalThis.fetch = originalFetch;
    setSupabaseConfigOverride(null);
  }
});

test('saveUserProgressToSupabase ve fetchUserProgressFromSupabase: ilerlemeyi REST üzerinden kaydeder ve okur', async () => {
  setSupabaseConfigOverride({ url: 'https://mock.supabase.co', anonKey: 'key-123' });
  const originalFetch = globalThis.fetch;

  try {
    let savedBody: string | null = null;
    globalThis.fetch = async (input, init) => {
      const url = String(input);
      if (init?.method === 'POST') {
        assert.ok(url.includes('/rest/v1/user_progress'));
        assert.ok(init?.headers && (init.headers as Record<string, string>).Authorization.includes('mock-access-token'));
        savedBody = String(init.body);
        return new Response('', { status: 201 });
      }
      if (init?.method === 'GET' || !init?.method) {
        assert.ok(url.includes('/rest/v1/user_progress'));
        return new Response(JSON.stringify([{
          user_id: 'user-12345',
          choices: { '474': 'A', '475': 'B' },
          starred: [474],
          rematch: [475],
          eliminated_choices: { '474': ['C', 'D'] },
        }]), { status: 200 });
      }
      return new Response('', { status: 404 });
    };

    const ok = await saveUserProgressToSupabase(mockSession, {
      choices: { '474': 'A', '475': 'B' },
      starred: [474],
      rematch: [475],
    });
    assert.equal(ok, true);
    assert.ok(savedBody?.includes('"user_id":"user-12345"'));

    const progress = await fetchUserProgressFromSupabase(mockSession);
    assert.notEqual(progress, null);
    assert.equal(progress?.choices?.['474'], 'A');
    assert.deepEqual(progress?.starred, [474]);
    assert.deepEqual(progress?.eliminatedChoices?.['474'], ['C', 'D']);
  } finally {
    globalThis.fetch = originalFetch;
    setSupabaseConfigOverride(null);
  }
});

test('signOutFromSupabase: oturum sonlandırma isteğini gönderir', async () => {
  setSupabaseConfigOverride({ url: 'https://mock.supabase.co', anonKey: 'key-123' });
  const originalFetch = globalThis.fetch;
  let loggedOut = false;

  try {
    globalThis.fetch = async (input, init) => {
      if (String(input).includes('/auth/v1/logout') && init?.method === 'POST') {
        loggedOut = true;
        return new Response('', { status: 204 });
      }
      return new Response('', { status: 200 });
    };

    await signOutFromSupabase('test-token');
    assert.equal(loggedOut, true);
  } finally {
    globalThis.fetch = originalFetch;
    setSupabaseConfigOverride(null);
  }
});
