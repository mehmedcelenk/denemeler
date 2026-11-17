import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readPilotConfig } from '../scripts/core/classroom-load-client.ts';

test('canlı yük testi açık proje kimliği ve ayrılmış test hesapları gerektirir', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'classroom-config-'));
  const file = join(directory, 'accounts.json');
  const names = ['CLASSROOM_TEST_CONFIRM', 'CLASSROOM_TEST_URL', 'CLASSROOM_TEST_ANON_KEY',
    'CLASSROOM_TEST_ACCOUNTS_FILE', 'CLASSROOM_PRODUCTION_REF'] as const;
  const before = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const accounts = Array.from({ length: 61 }, (_, i) => ({
    email: `pilot-test-${i}@classroom-pilot.invalid`, password: 'test-only',
  }));
  const projectUrl = 'https://testproject.supabase.co';
  try {
    await writeFile(file, JSON.stringify({ projectUrl, accounts }));
    Object.assign(process.env, { CLASSROOM_TEST_URL: projectUrl, CLASSROOM_TEST_ANON_KEY: 'test',
      CLASSROOM_TEST_ACCOUNTS_FILE: file, CLASSROOM_TEST_CONFIRM: 'production-approved',
      CLASSROOM_PRODUCTION_REF: 'wrongproject' });
    await assert.rejects(readPilotConfig(), /CLASSROOM_PRODUCTION_REF/);
    process.env.CLASSROOM_PRODUCTION_REF = 'testproject';
    assert.equal((await readPilotConfig()).accounts.length, 61);
    accounts[0].email = 'real-user@example.com';
    await writeFile(file, JSON.stringify({ projectUrl, accounts }));
    await assert.rejects(readPilotConfig(), /dedicated/);
    process.env.CLASSROOM_TEST_CONFIRM = 'isolated-test';
    assert.equal((await readPilotConfig()).accounts.length, 61);
  } finally {
    for (const name of names) {
      if (before[name] === undefined) delete process.env[name];
      else process.env[name] = before[name];
    }
    await rm(directory, { recursive: true, force: true });
  }
});
