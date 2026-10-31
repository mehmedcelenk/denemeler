import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const SCRIPT_PATH = path.resolve('scripts/core/sync_to_supabase.py');

test('sync_to_supabase.py --dry-run: KLM dersi sorularını hatasız doğrular ve simüle eder', () => {
  const result = spawnSync('python3', [SCRIPT_PATH, '--dry-run', '--subjects', 'KLM', '--table', 'questions'], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(result.stdout.includes('164 kayıt hazırlandı'));
  assert.ok(result.stdout.includes('Paket 1/1 (164 kayıt) doğrulandı'));
});

test('sync_to_supabase.py --dry-run: kavramları doğrular', () => {
  const result = spawnSync('python3', [SCRIPT_PATH, '--dry-run', '--table', 'concepts'], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.ok(result.stdout.includes('Kavramlar: 959 kayıt hazırlandı'));
  assert.ok(result.stdout.includes('Paket 1/5'));
});

test('sync_to_supabase.py: kimlik bilgisi olmadan canlı modda çalıştırıldığında güvenle reddeder', () => {
  const result = spawnSync('python3', [SCRIPT_PATH, '--table', 'questions'], {
    encoding: 'utf8',
    env: { ...process.env, SUPABASE_URL: '', VITE_SUPABASE_URL: '', SUPABASE_SERVICE_ROLE_KEY: '', SUPABASE_ANON_KEY: '', VITE_SUPABASE_ANON_KEY: '' },
  });
  assert.equal(result.status, 1);
  assert.ok(result.stdout.includes('HATA: Supabase URL ve Key bilgisi bulunamadı'));
});
