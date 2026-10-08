import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

test('Python veri üretimi arayüz dosyalarını değiştirmez', () => {
  const root = mkdtempSync(path.join(tmpdir(), 'aol-pipeline-'));
  try {
    cpSync('scripts', path.join(root, 'scripts'), { recursive: true });
    mkdirSync(path.join(root, 'scripts/ciktilar/analiz'), { recursive: true });
    cpSync('scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json', path.join(root, 'scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json'));
    writeFileSync(path.join(root, 'index.html'), '<!-- kullanıcı arayüzü -->');
    mkdirSync(path.join(root, 'src'), { recursive: true });
    writeFileSync(path.join(root, 'src/main.js'), '// kullanıcı kodu');
    const result = spawnSync('python3', [path.join(root, 'scripts/core/build_webapp.py')], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.equal(readFileSync(path.join(root, 'index.html'), 'utf8'), '<!-- kullanıcı arayüzü -->');
    assert.equal(readFileSync(path.join(root, 'src/main.js'), 'utf8'), '// kullanıcı kodu');
    const manifest = JSON.parse(readFileSync(path.join(root, 'src/data/generated/subjectManifest.json'), 'utf8'));
    assert.ok(manifest.TDE.questionCount > 0);
    assert.ok(manifest.ING.questionCount > 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
