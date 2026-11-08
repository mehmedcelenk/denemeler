import test from 'node:test';
import assert from 'node:assert/strict';
import { runAction } from '../src/app/actions.ts';
import { initWelcome } from '../src/features/welcome/init.ts';
import { saveActiveSession } from '../src/features/welcome/auth-modal.ts';
import { readString } from '../src/app/storage.ts';
import { StorageKeys } from '../src/shared/storage-keys.ts';
import type { AuthSession } from '../src/data/supabase-auth.ts';

test('joinRoom: aktif oturumdaki session.user.username doğrudan kullanılır, Adını Gir modalı açılmaz', async () => {
  const elements = new Map<string, { value?: string; hidden?: boolean; style?: Record<string, string>; classList: { add(): void; remove(): void; toggle(): void; contains(): boolean }; setAttribute(): void; removeAttribute(): void; focus(): void; addEventListener(): void; innerHTML?: string; textContent?: string }>();

  function getOrCreateEl(id: string) {
    if (!elements.has(id)) {
      elements.set(id, {
        value: '',
        hidden: true,
        style: {},
        classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
        setAttribute() {},
        removeAttribute() {},
        focus() {},
        addEventListener() {},
        querySelectorAll: () => [],
        innerHTML: '',
        textContent: '',
      });
    }
    return elements.get(id)!;
  }

  // Gerekli DOM elemanlarını tanımla
  const portal = getOrCreateEl('welcomePortal');
  portal.hidden = false;
  const roomInput = getOrCreateEl('welcomeRoomId');
  roomInput.value = 'ODA-99';
  const nameDialog = getOrCreateEl('welcomeNameDialog');
  nameDialog.hidden = true;

  const storageMap = new Map<string, string>();
  const prevDoc = globalThis.document;
  const prevStorage = globalThis.localStorage;

  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (k: string) => storageMap.get(k) ?? null,
      setItem: (k: string, v: string) => { storageMap.set(k, v); },
      removeItem: (k: string) => { storageMap.delete(k); },
    },
    configurable: true,
  });

  Object.defineProperty(globalThis, 'document', {
    value: {
      getElementById: (id: string) => getOrCreateEl(id),
      querySelector: () => null,
      querySelectorAll: () => [],
      body: { classList: { add() {}, remove() {} } },
    },
    configurable: true,
  });

  const sessionWithUsername: AuthSession = {
    accessToken: 'valid-token',
    refreshToken: 'valid-refresh',
    user: {
      id: 'usr-123',
      username: 'ogrenci_mehmet',
      displayName: 'Mehmet Alp',
      email: 'mehmet@test.com',
    },
  };

  saveActiveSession(sessionWithUsername);

  let joinedRoomId = '';
  let joinedUserName = '';

  try {
    initWelcome({
      closeSubjectDrawer() {},
      dismissResumeBanner() {},
      getSavedSession: () => null,
      joinRoom: (roomId, userName) => {
        joinedRoomId = roomId;
        joinedUserName = userName;
      },
      loadSubject: async () => true,
      openSubjectDrawer() {},
      setUnifiedMode() {},
    }, { autoShow: false });

    // Odaya Katıl eylemini tetikle
    const btn = { dataset: {} } as unknown as HTMLElement;
    const ev = new Event('click');
    const handled = runAction('welcome-join-room', btn, ev);
    assert.equal(handled, true);

    // Asenkron akışın tamamlanmasını bekle
    await new Promise(resolve => setTimeout(resolve, 50));

    // session.user.username doğrudan oda adı olarak kullanılmalıdır
    assert.equal(joinedRoomId, 'ODA-99');
    assert.equal(joinedUserName, 'ogrenci_mehmet');

    // "Oyundaki adınız nedir?" penceresi açılmamalıdır
    assert.equal(nameDialog.hidden, true);

    // Kullanıcı adı kalıcı belleğe de yazılmış olmalıdır
    assert.equal(readString(StorageKeys.USER_NAME), 'ogrenci_mehmet');
  } finally {
    Object.defineProperty(globalThis, 'document', { value: prevDoc, configurable: true });
    Object.defineProperty(globalThis, 'localStorage', { value: prevStorage, configurable: true });
  }
});
