import test from 'node:test';
import assert from 'node:assert/strict';
import { runAction } from '../src/app/actions.ts';
import { initWelcome } from '../src/features/welcome/init.ts';
import { saveActiveSession } from '../src/features/welcome/auth-modal.ts';
import { readString } from '../src/app/storage.ts';
import { StorageKeys } from '../src/shared/storage-keys.ts';
import { roomService } from '../src/features/classroom/room-service.ts';
import { getActiveSession } from '../src/features/welcome/auth-modal.ts';

class ElementStub {
  value = '';
  hidden = false;
  style: Record<string, string> = {};
  innerHTML = '';
  textContent = '';
  classList = { add() {}, remove() {}, toggle() {}, contains: () => false };
  setAttribute(): void {}
  removeAttribute(): void {}
  focus(): void {}
  addEventListener(): void {}
  querySelectorAll(): HTMLElement[] { return []; }
}

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

// Bir uygulama başlangıcında üç ardışık giriş: bekleme, sunucu reddi, ders hatası.
test('welcome: oda onayını bekler; reddedilen girişte portal açık kalır', async () => {
  const elements = new Map<string, ElementStub>();
  const element = (id: string): ElementStub => {
    if (!elements.has(id)) elements.set(id, new ElementStub());
    return elements.get(id)!;
  };
  const storage = new Map<string, string>();
  const original = {
    document: globalThis.document,
    window: globalThis.window,
    localStorage: globalThis.localStorage,
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => { storage.set(key, value); },
      removeItem: (key: string) => { storage.delete(key); },
    }, configurable: true,
  });
  Object.defineProperty(globalThis, 'document', {
    value: {
      getElementById: element,
      querySelector: () => null,
      querySelectorAll: () => [],
      body: { classList: { add() {}, remove() {} } },
    }, configurable: true,
  });
  Object.defineProperty(globalThis, 'window', {
    value: { scrollTo() {} }, configurable: true,
  });
  saveActiveSession({
    accessToken: 'valid-token', refreshToken: 'valid-refresh',
    user: { id: 'usr-123', username: 'ogrenci_mehmet', displayName: 'Mehmet Alp' },
  });

  let acceptJoin: () => void = () => {};
  const waiting = new Promise<void>(resolve => { acceptJoin = resolve; });
  let rejectJoin = false;
  let loadSucceeds = true;
  const calls: Array<[string, string]> = [];
  const clickJoin = () => runAction('welcome-join-room', {} as HTMLElement, new Event('click'));
  try {
    initWelcome({
      closeSubjectDrawer() {}, dismissResumeBanner() {}, getSavedSession: () => null,
      joinRoom: async (roomId, userName) => {
        calls.push([roomId, userName]);
        if (rejectJoin) throw new Error('Oda başka sekmede açık.');
        await waiting;
      },
      loadSubject: async () => loadSucceeds,
      openSubjectDrawer() {}, setUnifiedMode() {},
    });
    const portal = element('welcomePortal');
    const roomInput = element('welcomeRoomId');
    roomInput.value = '  Oda-99  ';
    assert.equal(portal.innerHTML.includes('welcomeNameDialog'), false);
    assert.equal(clickJoin(), true);
    await settle();
    assert.equal(portal.hidden, false, 'Sunucudan yanıt gelmeden giriş ekranı kapanmamalı');
    clickJoin();
    await settle();
    assert.equal(calls.length, 1, 'Bekleyen giriş sırasında ikinci Enter yinelenen istek oluşturmamalı');
    acceptJoin();
    await settle();
    assert.equal(portal.hidden, true);
    assert.deepEqual(calls[0], ['Oda-99', 'ogrenci_mehmet']);
    assert.equal(readString(StorageKeys.USER_NAME), 'ogrenci_mehmet');

    portal.hidden = false;
    rejectJoin = true;
    clickJoin();
    await settle();
    assert.equal(portal.hidden, false);
    assert.equal(element('welcomeFormError').textContent, 'Oda başka sekmede açık.');

    loadSucceeds = false;
    clickJoin();
    await settle();
    assert.equal(calls.length, 2, 'Ders yüklenmediyse oda kurulmamalı');
    assert.equal(portal.hidden, false);
    assert.match(element('welcomeFormError').textContent, /Ders yüklenemedi/);

    const originalLeave = roomService.leaveRoom;
    try {
      roomService.leaveRoom = async () => { throw new Error('Cevaplar kaydedilemedi.'); };
      runAction('welcome-signout', {} as HTMLElement, new Event('click'));
      await settle();
      assert.equal(getActiveSession()?.user.id, 'usr-123', 'Gönderilemeyen cevaplarla hesap kapatılmamalı');
      assert.equal(element('welcomeFormError').textContent, 'Cevaplar kaydedilemedi.');
    } finally {
      roomService.leaveRoom = originalLeave;
    }
  } finally {
    for (const [key, value] of Object.entries(original)) {
      Object.defineProperty(globalThis, key, { value, configurable: true });
    }
  }
});
