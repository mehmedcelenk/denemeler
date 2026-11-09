import test from 'node:test';
import assert from 'node:assert/strict';
import { state, store, notifyStateChange } from '../src/app/state.ts';
import { initLibrary, updateLibraryBadgeUI } from '../src/features/library/library-model.ts';
import {
  saveActiveSession,
  syncCloudProgress,
  scheduleCloudSync,
} from '../src/features/welcome/cloud-sync.ts';
import {
  renderWelcomePortal,
  updateResumeAction,
} from '../src/features/welcome/welcome-view.ts';
import { renderMathWithXray } from '../src/shared/math-render.ts';
import { studentMessageHandlers } from '../src/features/classroom/message-handlers/student.ts';
import type { MessageContext } from '../src/features/classroom/message-handlers/context.ts';
import { setSupabaseConfigOverride } from '../src/data/supabase-client.ts';
import type { AuthSession } from '../src/data/supabase-auth.ts';

const mockSession: AuthSession = {
  accessToken: 'jwt-token-deep',
  refreshToken: 'refresh-token-deep',
  user: { id: 'user-deep-1', email: 'deep@cenks.dev', displayName: 'Deep Test' },
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

test('Deep 1: syncCloudProgress bekleyen senkronizasyonu önce buluta flush eder, eski bulut verisiyle ezilmez', async () => {
  await withStorage(async () => {
    setSupabaseConfigOverride({ url: 'https://mock.supabase.co', anonKey: 'key-test' });
    saveActiveSession(mockSession);
    const saveCalls: Record<string, unknown>[] = [];
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async (input, init) => {
        const url = String(input);
        if (init?.method === 'POST' && url.includes('/rest/v1/user_progress')) {
          saveCalls.push(JSON.parse(String(init.body)) as Record<string, unknown>);
          return new Response('', { status: 201 });
        }
        if (init?.method === 'GET' || !init?.method) {
          return new Response(JSON.stringify([{
            user_id: 'user-deep-1',
            choices: {},
            starred: [101, 102],
          }]), { status: 200 });
        }
        return new Response('', { status: 200 });
      };

      // Kullanıcı yerelde yıldızları kaldırdı ve 5000ms debounce planlandı
      store.setStarredQuestionIds(new Set(), false);
      scheduleCloudSync(5000);

      // syncCloudProgress hemen çağrıldığında bekleyen yerel boş küme önce Supabase'e flush edilmeli
      await syncCloudProgress();
      assert.ok(saveCalls.length >= 1, 'Bekleyen kayıt önce flush edilmeli');
      assert.deepEqual(saveCalls[0].starred, [], 'Flush edilen veri güncel yerel küme ([]) olmalı');
    } finally {
      globalThis.fetch = originalFetch;
      setSupabaseConfigOverride(null);
    }
  });
});

test('Deep 2: renderWelcomePortal canResume=false ile render edilse dahi buton DOM da bulunur ve updateResumeAction ile görünür olur', () => {
  const elements = new Map<string, HTMLElement>();
  const dummyPortal = {
    innerHTML: '',
    hidden: false,
    setAttribute: () => {},
  } as unknown as HTMLElement;

  const previousDoc = globalThis.document;
  const previousRaf = globalThis.requestAnimationFrame;
  (globalThis as unknown as { requestAnimationFrame: unknown }).requestAnimationFrame = (cb: () => void) => setTimeout(cb, 0);
  (globalThis as unknown as { document: unknown }).document = {
    getElementById: (id: string) => elements.get(id) ?? null,
    querySelectorAll: () => [],
    body: { classList: { add: () => {}, remove: () => {} } },
  };

  elements.set('welcomePortal', dummyPortal);

  try {
    // 1. canResume: false ile render et
    renderWelcomePortal({
      programMode: 'AOIHL',
      canResume: false,
    });

    // Portal HTML içinde btnWelcomeResume mutlaka yer almalı
    assert.ok(dummyPortal.innerHTML.includes('id="btnWelcomeResume"'), 'btnWelcomeResume HTML içinde bulunmalı');
    assert.ok(dummyPortal.innerHTML.includes('style="display: none;"'), 'canResume false iken display: none olmalı');

    // 2. DOM Mock ile updateResumeAction çalıştır
    const resumeBtnMock = { style: { display: 'none' } } as unknown as HTMLElement;
    elements.set('btnWelcomeResume', resumeBtnMock);

    updateResumeAction(true);
    assert.equal(resumeBtnMock.style.display, 'flex', 'updateResumeAction(true) butonu görünür yapmalı');

    updateResumeAction(false);
    assert.equal(resumeBtnMock.style.display, 'none', 'updateResumeAction(false) butonu gizlemeli');
  } finally {
    (globalThis as unknown as { document: unknown }).document = previousDoc;
    (globalThis as unknown as { requestAnimationFrame: unknown }).requestAnimationFrame = previousRaf;
  }
});

test('Deep 3: renderMathWithXray KaTeX HTML i applyCommonMathPatterns bozulmasından korur', () => {
  const xrayHtml = '<span class="vocab-word" data-word="ivme">ivme</span>: $v_0 = 10\\text{ m/s}$ ve $x_2$ formülü';
  const rawText = 'ivme: $v_0 = 10 m/s$ ve x_2 formülü';

  const result = renderMathWithXray(rawText, xrayHtml);
  assert.ok(result.includes('class="vocab-word"'), 'X-Ray etiketi korunmalı');
  assert.ok(result.includes('class="katex"'), 'KaTeX spanleri düzgün üretilmeli');
  assert.ok(!result.includes('___MATH_TOKEN_'), 'Tüm yer tutucular KaTeX HTML ile değiştirilmeli');
});

test('Deep 4: PEER_LEAVE participants içinde leavingPeer bulunmasa bile isSenderHost=true ise mola perdesini kapatır', () => {
  let pausedValue = true;
  const mockCtx: Partial<MessageContext> = {
    peerId: 'student-99',
    isHost: false,
    isPaused: true,
    participants: [], // Host listede bulunmuyor (ör. geçici bağlantı veya yarış durumu)
    studentStats: {},
    feedItems: [],
    setPaused: (val: boolean) => { pausedValue = val; },
    notify: () => {},
  };

  const handler = studentMessageHandlers.PEER_LEAVE;
  assert.ok(handler);

  handler(mockCtx as MessageContext, {
    senderId: 'ghost-host',
    senderName: 'Hoca',
    timestamp: 500,
    msg: { type: 'PEER_LEAVE', senderId: 'ghost-host', senderName: 'Hoca', isHost: true, timestamp: 500 },
    existingPeer: undefined,
    isSenderHost: true,
  });

  assert.equal(pausedValue, false, 'isSenderHost=true olduğunda mola perdesi otomatik kapanmalı');
});

test('Deep 5: initLibrary booklet:refresh olayında rövanş rozetini senkronize eder', () => {
  let badgeDisplay = 'none';
  let badgeText = '0';
  const badgeMock = {
    style: { display: 'none' },
    textContent: '0',
  } as unknown as HTMLElement;

  const previousDoc = globalThis.document;
  (globalThis as unknown as { document: unknown }).document = {
    getElementById: (id: string) => id === 'lblRematchBadge' ? badgeMock : null,
  };

  try {
    initLibrary();

    store.setRematchQuestionIds([401, 402], false);
    notifyStateChange('booklet:refresh');

    assert.equal(badgeMock.textContent, '2', 'Rozet 2 olmalı');
    assert.equal(badgeMock.style.display, 'inline-flex', 'Rozet görünür olmalı');

    store.setRematchQuestionIds([], false);
    notifyStateChange('booklet:refresh');

    assert.equal(badgeMock.textContent, '0', 'Rozet 0 olmalı');
    assert.equal(badgeMock.style.display, 'none', 'Rozet gizlenmeli');
  } finally {
    (globalThis as unknown as { document: unknown }).document = previousDoc;
  }
});
