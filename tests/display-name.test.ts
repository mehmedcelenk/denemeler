import test from 'node:test';
import assert from 'node:assert/strict';
import { updateDisplayName } from '../src/data/display-name.ts';
import { setSupabaseConfigOverride } from '../src/data/supabase-client.ts';
import type { AuthSession } from '../src/data/supabase-auth.ts';
import { saveDisplayName } from '../src/features/welcome/display-name.ts';
import { saveActiveSession } from '../src/features/welcome/study-session.ts';
import { state, store } from '../src/app/state.ts';
import { StorageKeys } from '../src/shared/storage-keys.ts';

const session: AuthSession = { accessToken: 'token', refreshToken: 'refresh', user: { id: 'user-1', username: 'ali' } };

test('görünen ad yalnızca etkin hesabın metadata alanında güncellenir', async () => {
  const previous = globalThis.fetch;
  setSupabaseConfigOverride({ url: 'https://unit.test', anonKey: 'public' });
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), 'https://unit.test/auth/v1/user');
      assert.equal(options?.method, 'PUT');
      assert.deepEqual(JSON.parse(String(options?.body)), { data: { display_name: 'Ali Veli' } });
      return Response.json({ id: 'user-1', user_metadata: { display_name: 'Ali Veli' } });
    };
    assert.equal(await updateDisplayName(session, 'Ali Veli'), true);
    globalThis.fetch = async () => Response.json({ id: 'other', user_metadata: { display_name: 'Ali Veli' } });
    assert.equal(await updateDisplayName(session, 'Ali Veli'), false);
    globalThis.fetch = async () => new Response('', { status: 503 });
    assert.equal(await updateDisplayName(session, 'Ali Veli'), false);
  } finally {
    globalThis.fetch = previous;
    setSupabaseConfigOverride(null);
  }
});

test('ad kaydı doğrulanan yanıtı oturuma ve ekrana yazar', async () => {
  const previous = { fetch: globalThis.fetch, localStorage: globalThis.localStorage, document: globalThis.document };
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  } });
  const input = { value: '  Ayşe Yılmaz  ' };
  const error = { textContent: '' };
  const button = { disabled: false };
  const display = { textContent: '' };
  const editor = { hidden: false };
  const elements: Record<string, object> = {
    displayNameInput: input, displayNameError: error, displayNameSave: button,
    authUserNameDisplay: display, displayNameEditor: editor,
  };
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { getElementById: (id: string) => elements[id] ?? null } });
  setSupabaseConfigOverride({ url: 'https://unit.test', anonKey: 'public' });
  store.setProgressOwner('legacy');
  try {
    saveActiveSession(session);
    globalThis.fetch = async () => Response.json({ id: 'user-1', user_metadata: { display_name: 'Ayşe Yılmaz' } });
    await saveDisplayName();
    assert.equal(display.textContent, 'Ayşe Yılmaz');
    assert.equal(editor.hidden, true);
    assert.equal(JSON.parse(values.get(StorageKeys.AUTH_SESSION) || '{}').user.displayName, 'Ayşe Yılmaz');
    assert.equal(state.progressOwner, 'account:user-1');
  } finally {
    setSupabaseConfigOverride(null);
    store.setProgressOwner('legacy');
    for (const [key, value] of Object.entries(previous)) Object.defineProperty(globalThis, key, { configurable: true, value });
  }
});
