import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, appendFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

test('iki sürümde HTML doğru özetli dosyaları gösterir ve eski dosyalar korunur', { timeout: 120000 }, () => {
  const dir = mkdtempSync(join(tmpdir(), 'cenks-build-'));
  try {
    cpSync('src', join(dir, 'src'), { recursive: true });
    cpSync('index.html', join(dir, 'index.html'));
    cpSync('vite.config.js', join(dir, 'vite.config.js'));
    cpSync('package.json', join(dir, 'package.json'));
    mkdirSync(join(dir, 'scripts'));
    cpSync('scripts/release-assets.ts', join(dir, 'scripts/release-assets.ts'));
    symlinkSync(resolve('node_modules'), join(dir, 'node_modules'), 'dir');
    const build = () => {
      const result = spawnSync(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'build'], { cwd: dir, encoding: 'utf8', timeout: 60000 });
      assert.equal(result.status, 0, result.stderr || result.stdout);
      const html = readFileSync(join(dir, 'dist/index.html'), 'utf8');
      assert.equal(readFileSync(join(dir, 'dist/200.html'), 'utf8'), html);
      const app = html.match(/\.\/(assets\/app-[\w-]+\.js)/)?.[1];
      const css = html.match(/\.\/(assets\/styles-[\w-]+\.css)/)?.[1];
      assert.ok(app && css, 'HTML özetli JS ve CSS dosyalarına işaret etmeli');
      assert.ok(existsSync(join(dir, 'dist', app)) && existsSync(join(dir, 'dist', css)));
      return { app, css };
    };
    const first = build();
    const oldAssets = readdirSync(join(dir, 'dist/assets'));
    appendFileSync(join(dir, 'src/main.js'), '\nconsole.info("build-version-test");\n');
    appendFileSync(join(dir, 'src/styles/index.css'), '\n.version-test { color: #123456; }\n');
    const second = build();
    assert.notEqual(second.app, first.app);
    assert.notEqual(second.css, first.css);
    assert.ok(oldAssets.every(name => existsSync(join(dir, 'dist/assets', name))), 'önceki sürümün tüm varlıkları korunmalı');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
