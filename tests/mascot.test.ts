import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_MASCOT_ID,
  MASCOT_OPTIONS,
  isActiveMascotId,
  isMascotId,
  normalizeMascotId,
  type ActiveMascotId,
} from '../src/shared/mascot-types.ts';
import { renderActiveMascotSvg, renderMascotOptionSvg } from '../src/shared/mascot-svgs.ts';
import { pickMascotQuip } from '../src/shared/mascot-lines.ts';
import {
  fetchUserMascotFromSupabase,
  resetMascotColumnFallbackForTest,
  saveUserMascotToSupabase,
} from '../src/data/mascot-profile.ts';
import { setSupabaseConfigOverride } from '../src/data/supabase-client.ts';

test('mascot-types: tüm maskot ve 3D kuş seçeneklerini doğrular, eski değeri kediye çevirir', () => {
  assert.deepEqual(
    MASCOT_OPTIONS.map(o => o.id),
    ['cat', 'dog', 'fish', 'owl', 'raven', 'bird', 'none'],
  );
  assert.equal(DEFAULT_MASCOT_ID, 'cat');
  for (const id of ['cat', 'dog', 'fish', 'owl', 'raven', 'bird', 'none'] as const) {
    assert.equal(isMascotId(id), true);
  }
  assert.equal(isMascotId('eyes'), false);
  assert.equal(isActiveMascotId('owl'), true);
  assert.equal(isActiveMascotId('none'), false);
  assert.equal(normalizeMascotId('owl'), 'owl');
  assert.equal(normalizeMascotId('eyes'), 'cat');
});

test('mascot-svgs: tüm aktif maskotların beklenen SVG sınıflarını içerir', () => {
  const activeIds: ActiveMascotId[] = ['cat', 'dog', 'fish', 'bird', 'owl', 'raven'];
  for (const id of activeIds) {
    const svg = renderActiveMascotSvg(id);
    assert.ok(svg.includes('<svg'), `${id}: svg etiketi olmalı`);
    assert.ok(svg.includes(`mc-svg-${id}`), `${id}: maskot sınıfı olmalı`);
    assert.ok(svg.includes('mc-root'), `${id}: mc-root olmalı`);
    assert.ok(svg.includes('class="mc-eye"'), `${id}: mc-eye olmalı`);
    assert.ok(svg.includes('class="mc-happy"'), `${id}: mc-happy olmalı`);
    assert.ok(svg.includes('class="mc-wrong"'), `${id}: mc-wrong olmalı`);
    assert.ok(!svg.includes('<script'), `${id}: güvensiz script olmamalı`);
  }

  assert.ok(renderActiveMascotSvg('cat').includes('mc-cat-head'));
  assert.ok(renderActiveMascotSvg('dog').includes('mc-dog-collar'));
  assert.ok(renderActiveMascotSvg('fish').includes('mc-fish-visor'));
  assert.ok(renderActiveMascotSvg('bird').includes('rb-wing-front'));
  assert.ok(renderActiveMascotSvg('owl').includes('mc-svg-owl'));
  assert.ok(renderActiveMascotSvg('raven').includes('mc-svg-raven'));
  assert.ok(renderMascotOptionSvg('none').includes('mc-svg-none'));
});

test('mascot-lines: bazen konuşur bazen sessiz kalır', () => {
  for (const id of ['cat', 'dog', 'fish', 'bird', 'owl', 'raven'] as const) {
    const line = pickMascotQuip(id, 'correct', 0.05, 0.2);
    assert.ok(typeof line === 'string' && line.length > 0);
    assert.equal(pickMascotQuip(id, 'correct', 0.99, 0.2), null);
  }
});

test('mascot-profile: Supabase user_profiles.mascot_id okuma ve yazma isteklerini yürütür', async () => {
  resetMascotColumnFallbackForTest();
  setSupabaseConfigOverride({ url: 'https://mock.supabase.co', anonKey: 'mock-key' });
  const originalFetch = globalThis.fetch;
  const requests: { url: string; method: string; body?: string }[] = [];

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method || 'GET';
    requests.push({ url, method, body: init?.body ? String(init.body) : undefined });
    if (method === 'GET') {
      return new Response(JSON.stringify([{ mascot_id: 'dog' }]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(null, { status: 204 });
  };

  try {
    const session = { accessToken: 'tok', refreshToken: 'ref', user: { id: 'u-123' } };
    const fetched = await fetchUserMascotFromSupabase(session);
    assert.equal(fetched, 'dog');
    assert.ok(requests[0].url.includes('/rest/v1/user_profiles?id=eq.u-123&select=mascot_id&limit=1'));

    const saved = await saveUserMascotToSupabase(session, 'cat');
    assert.equal(saved, true);
    assert.equal(requests[1].method, 'PATCH');
    assert.deepEqual(JSON.parse(requests[1].body || '{}'), { mascot_id: 'cat' });
  } finally {
    globalThis.fetch = originalFetch;
    setSupabaseConfigOverride(null);
    resetMascotColumnFallbackForTest();
  }
});

test('mascot-profile: uzak tabloda mascot_id kolonu yoksa sessizce fallback moduna geçer', async () => {
  resetMascotColumnFallbackForTest();
  setSupabaseConfigOverride({ url: 'https://mock.supabase.co', anonKey: 'mock-key' });
  const originalFetch = globalThis.fetch;
  let calls = 0;

  globalThis.fetch = async () => {
    calls++;
    return new Response(
      JSON.stringify({ code: 'PGRST204', message: "Could not find the 'mascot_id' column of 'user_profiles'" }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  };

  try {
    const session = { accessToken: 'tok', refreshToken: 'ref', user: { id: 'u-123' } };
    assert.equal(await fetchUserMascotFromSupabase(session), null);
    assert.equal(await saveUserMascotToSupabase(session, 'dog'), false);
    assert.equal(calls, 1, 'kolon eksikliği algılandıktan sonra ikinci istek atılmamalı');
  } finally {
    globalThis.fetch = originalFetch;
    setSupabaseConfigOverride(null);
    resetMascotColumnFallbackForTest();
  }
});
