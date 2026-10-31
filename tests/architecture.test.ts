import test from 'node:test';
import assert from 'node:assert/strict';
import { closeSync, mkdtempSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const checker = fileURLToPath(new URL('../scripts/check-architecture.js', import.meta.url));

async function checkFixture(files: Readonly<Record<string, string>>) {
  const root = mkdtempSync(path.join(tmpdir(), 'aol-architecture-'));
  const log = path.join(root, 'checker.log');
  const logFd = openSync(log, 'w');
  try {
    mkdirSync(path.join(root, 'src'), { recursive: true });
    mkdirSync(path.join(root, 'functions'), { recursive: true });
    writeFileSync(path.join(root, 'index.html'), '<html></html>');
    for (const [name, content] of Object.entries(files)) {
      const file = path.join(root, name);
      mkdirSync(path.dirname(file), { recursive: true });
      writeFileSync(file, content);
    }
    const status = await new Promise<number | null>((resolve, reject) => {
      const child = spawn(process.execPath, [checker], {
        cwd: root,
        timeout: 10000,
        stdio: ['ignore', logFd, logFd],
      });
      child.on('error', reject);
      child.on('close', resolve);
    });
    return { status, output: readFileSync(log, 'utf8') };
  } finally {
    closeSync(logFd);
    rmSync(root, { recursive: true, force: true });
  }
}

for (const file of ['src/example.ts', 'src/styles/example.css', 'functions/api/example.ts', 'edge/example.ts', 'scripts/example.ts', 'tests/example.ts', 'example.config.js']) {
  test(`${file}: 300 satır kabul edilir, 301 satır kontrolü durdurur`, async () => {
    const allowed = await checkFixture({ [file]: '/* line */\n'.repeat(300) });
    assert.equal(allowed.status, 0, allowed.output);

    const rejected = await checkFixture({ [file]: '/* line */\n'.repeat(301) });
    assert.equal(rejected.status, 1, rejected.output);
    assert.ok(rejected.output.includes(`[Dosya Boyutu] ${file}: 301 satır`), rejected.output);
    assert.match(rejected.output, /HATALAR \(ERROR - 1\)/);
  });
}

test('functions içindeki eksik import kontrolü durdurur', async () => {
  const result = await checkFixture({
    'functions/api/example.ts': "import { value } from './missing.ts';\n",
  });
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /\[Eksik Import\] functions\/api\/example.ts -> \.\/missing.ts/);
});

test('functions importları çözülür ve kaynak modülleriyle birlikte taranır', async () => {
  const result = await checkFixture({
    'src/example.ts': 'export const value = 1;\n',
    'functions/api/example.ts': "import { value } from '../../src/example.ts';\nexport { value };\n",
  });
  assert.equal(result.status, 0, result.output);
  assert.match(result.output, /2 modül incelendi/);
});

test("'aol_' literali yalnızca merkezi depolama sözlüğünde tanımlanabilir", async () => {
  const rejected = await checkFixture({
    'src/example.ts': "export const key = 'aol_duplicate';\n",
  });
  assert.equal(rejected.status, 1, rejected.output);
  assert.match(rejected.output, /\[Depolama Anahtarı\] src\/example.ts/);

  const allowed = await checkFixture({
    'src/shared/storage-keys.ts': "export const key = 'aol_central';\n",
  });
  assert.equal(allowed.status, 0, allowed.output);
});

test('localStorage erişimi yalnızca merkezi kalıcılık kapısında kullanılabilir', async () => {
  const rejected = await checkFixture({
    'src/example.ts': "export const value = localStorage.getItem('key');\n",
  });
  assert.equal(rejected.status, 1, rejected.output);
  assert.match(rejected.output, /\[Kalıcılık Kapısı\] src\/example.ts/);

  const allowed = await checkFixture({
    'src/app/storage.ts': "export const value = localStorage.getItem('key');\n",
  });
  assert.equal(allowed.status, 0, allowed.output);
});

test('çekirdek özellikler eklenti modüllerini doğrudan import edemez', async () => {
  const rejected = await checkFixture({
    'src/features/answers/example.ts': "import { plugin } from '../classroom/plugin.ts';\nexport { plugin };\n",
    'src/features/classroom/plugin.ts': 'export const plugin = true;\n',
  });
  assert.equal(rejected.status, 1, rejected.output);
  assert.match(rejected.output, /\[Jenga İzolasyonu\].*answers.*classroom/);

  const allowed = await checkFixture({
    'src/features/classroom/example.ts': "import { plugin } from './plugin.ts';\nexport { plugin };\n",
    'src/features/classroom/plugin.ts': 'export const plugin = true;\n',
  });
  assert.equal(allowed.status, 0, allowed.output);
});

test('app eklenti importları yalnızca bootstrap içinde kabul edilir', async () => {
  const plugin = 'export const search = true;\n';
  const source = "import { search } from '../features/search/init.ts';\nexport { search };\n";
  const rejected = await checkFixture({
    'src/app/events.js': source,
    'src/features/search/init.ts': plugin,
  });
  assert.equal(rejected.status, 1, rejected.output);
  assert.match(rejected.output, /\[Uygulama İzolasyonu\].*events\.js.*search/);

  const allowed = await checkFixture({
    'src/app/bootstrap.js': source,
    'src/features/search/init.ts': plugin,
  });
  assert.equal(allowed.status, 0, allowed.output);
});

test('data katmanı app katmanını import edemez', async () => {
  const result = await checkFixture({
    'src/data/questions.js': "import { store } from '../app/state.ts';\nexport { store };\n",
    'src/app/state.ts': 'export const store = {};\n',
  });
  assert.equal(result.status, 1, result.output);
  assert.match(result.output, /data katmanı app katmanına bağımlı olamaz/);
});
