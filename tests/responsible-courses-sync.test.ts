import test from 'node:test';
import assert from 'node:assert/strict';
import { parseProgressRow } from '../src/data/progress-validation.ts';
import {
  resetResponsibleColumnFallbackForTest,
  saveUserProgressToSupabase,
} from '../src/data/supabase-auth.ts';
import { setSupabaseConfigOverride } from '../src/data/supabase-client.ts';

test('parseProgressRow validates responsible_courses shape and rejects invalid payloads', () => {
  const valid = parseProgressRow({
    choices: { '1': 'A' },
    starred: [1],
    rematch: [],
    eliminated_choices: {},
    responsible_courses: { AOIHL: ['TÜRK DİLİ VE EDEBİYATI – 3', 'MATEMATİK – 2'] },
  });
  assert.deepEqual(valid?.responsibleCourses, { AOIHL: ['TÜRK DİLİ VE EDEBİYATI – 3', 'MATEMATİK – 2'] });

  const missingField = parseProgressRow({ choices: {}, starred: [], rematch: [], eliminated_choices: {} });
  assert.deepEqual(missingField?.responsibleCourses, {});

  assert.equal(parseProgressRow({ responsible_courses: ['not-an-object'] }), null);
  assert.equal(parseProgressRow({ responsible_courses: { AOIHL: [123] } }), null);
});

test('saveUserProgressToSupabase retries without responsible_courses on PGRST204 column-missing error', async () => {
  resetResponsibleColumnFallbackForTest();
  setSupabaseConfigOverride({ url: 'https://mock.supabase.co', anonKey: 'mock-key' });
  const bodies: Record<string, unknown>[] = [];
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (_input, init) => {
    const parsed = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>;
    bodies.push(parsed);
    if ('responsible_courses' in parsed) {
      return new Response(
        JSON.stringify({ code: 'PGRST204', message: "Could not find the 'responsible_courses' column" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }
    return new Response(null, { status: 201 });
  };

  try {
    const ok = await saveUserProgressToSupabase(
      { accessToken: 'tok', refreshToken: 'ref', user: { id: 'u1' } },
      { choices: { '1': 'A' }, responsibleCourses: { AOIHL: ['MATEMATİK – 2'] } },
    );
    assert.equal(ok, true);
    assert.equal(bodies.length, 2);
    assert.ok('responsible_courses' in bodies[0]);
    assert.ok(!('responsible_courses' in bodies[1]));
  } finally {
    globalThis.fetch = originalFetch;
    setSupabaseConfigOverride(null);
    resetResponsibleColumnFallbackForTest();
  }
});
