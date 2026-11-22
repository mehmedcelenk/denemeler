import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { checkPreviousAssets, createAssetManifest, writeAssetManifest } from '../scripts/release-assets.ts';

test('yayın kontrolü eski dosyalar eksik veya değişmişse yayını durdurur', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cenks-release-'));
  const previous = join(dir, 'previous');
  const next = join(dir, 'next');
  const originalFetch = globalThis.fetch;
  try {
    mkdirSync(join(previous, 'assets'), { recursive: true });
    mkdirSync(join(next, 'assets'), { recursive: true });
    writeFileSync(join(previous, 'assets/app-old.js'), 'old');
    writeFileSync(join(previous, 'assets/vendor-old.js'), 'vendor');
    writeFileSync(join(previous, 'index.html'), '<html>old</html>');
    const manifest = createAssetManifest(previous);
    globalThis.fetch = async () => new Response(JSON.stringify(manifest), { status: 200 });
    writeFileSync(join(next, 'assets/app-old.js'), 'old');
    await assert.rejects(checkPreviousAssets(next, 'https://example.test/'), /vendor-old/);
    writeFileSync(join(next, 'assets/vendor-old.js'), 'wrong');
    await assert.rejects(checkPreviousAssets(next, 'https://example.test/'), /vendor-old/);
    writeFileSync(join(next, 'assets/vendor-old.js'), 'vendor');
    writeFileSync(join(next, 'assets/app-new.js'), 'new');
    await checkPreviousAssets(next, 'https://example.test/');
    writeAssetManifest(next);
    assert.ok(createAssetManifest(next).assets['app-new.js']);
    globalThis.fetch = async input => String(input).endsWith('release-assets.json')
      ? new Response('<!doctype html>fallback', { status: 200 }) : new Response('<html>old</html>', { status: 200 });
    await assert.rejects(checkPreviousAssets(next, 'https://example.test/'), /CENKS_PREVIOUS_DIST/);
    await checkPreviousAssets(next, 'https://example.test/', previous);
    writeFileSync(join(previous, 'index.html'), 'different');
    await assert.rejects(checkPreviousAssets(next, 'https://example.test/', previous), /eşleşmiyor/);
    globalThis.fetch = async () => new Response('unavailable', { status: 503 });
    await assert.rejects(checkPreviousAssets(next, 'https://example.test/'), /HTTP 503/);
  } finally { globalThis.fetch = originalFetch; rmSync(dir, { recursive: true, force: true }); }
});

test('ilk yayın desteği yalnızca canlı alan 404 ve CENKS_INITIAL_DEPLOY açıksa izin verir', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'cenks-release-init-'));
  const next = join(dir, 'next');
  const originalFetch = globalThis.fetch;
  try {
    mkdirSync(join(next, 'assets'), { recursive: true });
    writeFileSync(join(next, 'assets/app-new.js'), 'new');
    globalThis.fetch = async () => new Response('not found', { status: 404 });
    await assert.rejects(checkPreviousAssets(next, 'https://example.test/'), /CENKS_INITIAL_DEPLOY/);
    await checkPreviousAssets(next, 'https://example.test/', undefined, true);
    globalThis.fetch = async input => String(input).endsWith('release-assets.json')
      ? new Response('not found', { status: 404 }) : new Response('<html>live</html>', { status: 200 });
    await assert.rejects(checkPreviousAssets(next, 'https://example.test/', undefined, true), /CENKS_PREVIOUS_DIST/);
  } finally { globalThis.fetch = originalFetch; rmSync(dir, { recursive: true, force: true }); }
});
