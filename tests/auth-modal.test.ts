import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getActiveSession,
  saveActiveSession,
  isAuthenticated,
  requireAuth,
} from '../src/features/welcome/auth-modal.ts';
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

function withStorage(run: () => void): void {
  const values = new Map<string, string>();
  const previous = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', {
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => { values.set(key, value); },
      removeItem: (key: string) => { values.delete(key); },
    },
    configurable: true,
  });
  try {
    run();
  } finally {
    Object.defineProperty(globalThis, 'localStorage', { value: previous, configurable: true });
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

    // Çıkış yapıldığında oturum temizlenir
    saveActiveSession(null);
    assert.equal(isAuthenticated(), false);
  });
});

test('requireAuth: oturum açıkken doğrudan eylemi çalıştırır, kapalıyken engeller', () => {
  withStorage(() => {
    saveActiveSession(mockSession);
    let called = false;
    requireAuth(() => {
      called = true;
    });
    assert.equal(called, true);

    saveActiveSession(null);
    let calledAfterSignOut = false;
    requireAuth(() => {
      calledAfterSignOut = true;
    });
    assert.equal(calledAfterSignOut, false);
  });
});
