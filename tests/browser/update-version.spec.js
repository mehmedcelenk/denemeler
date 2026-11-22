import { test, expect } from '@playwright/test';
import { createServer } from 'node:http';
import { cpSync, mkdtempSync, readFileSync, rmSync, symlinkSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { StorageKeys } from '../../src/shared/storage-keys.ts';
import { createClassroomServer, setPageVisibility } from './fixtures/classroom.js';

test.use({ serviceWorkers: 'allow' });

test('iki gerçek derleme arasında oda kapanmaz, normal yenileme güncel sürümü açar', async ({ page, context }) => {
  test.setTimeout(90000);
  const dir = mkdtempSync(join(tmpdir(), 'cenks-browser-release-'));
  const originalDist = resolve('dist');
  let server;
  try {
    cpSync('src', join(dir, 'src'), { recursive: true });
    for (const file of ['index.html', 'vite.config.js', 'package.json', 'sw.js']) cpSync(file, join(dir, file));
    mkdirSync(join(dir, 'scripts'));
    cpSync('scripts/release-assets.ts', join(dir, 'scripts/release-assets.ts'));
    symlinkSync(resolve('node_modules'), join(dir, 'node_modules'), 'dir');
    const build = () => execFileSync(process.execPath, [resolve('node_modules/vite/bin/vite.js'), 'build'], { cwd: dir, stdio: 'pipe', env: { ...process.env, VITE_SUPABASE_URL: 'https://mock.supabase.co', VITE_SUPABASE_ANON_KEY: 'test-key' } });
    build();
    const dist = join(dir, 'dist');
    const oldHtml = readFileSync(join(dist, 'index.html'));
    const oldApp = oldHtml.toString().match(/assets\/app-[\w-]+\.js/)[0];
    const oldCss = oldHtml.toString().match(/assets\/styles-[\w-]+\.css/)[0];
    appendFileSync(join(dir, 'src/main.js'), '\nconsole.info("release-test-v2");\n');
    appendFileSync(join(dir, 'src/styles/index.css'), '\n.release-test-v2 { color: #123456; }\n');
    build();
    const newHtml = readFileSync(join(dist, 'index.html'));
    const newApp = newHtml.toString().match(/assets\/app-[\w-]+\.js/)[0];
    const newCss = newHtml.toString().match(/assets\/styles-[\w-]+\.css/)[0];
    expect(newApp).not.toBe(oldApp);
    expect(newCss).not.toBe(oldCss);
    let version = 1;
    const requests = [];
    server = createServer((req, res) => {
      const path = new URL(req.url, 'http://localhost').pathname;
      requests.push(path);
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
      let bytes;
      if (path === '/' || path === '/index.html') {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        bytes = version === 1 ? oldHtml : newHtml;
      } else {
        const root = path.startsWith('/data/') ? originalDist : dist;
        const file = resolve(root, `.${path}`);
        if (!file.startsWith(`${root}/`) || !existsSync(file)) { res.statusCode = 404; return res.end(); }
        if (file.endsWith('.js')) res.setHeader('Content-Type', 'application/javascript');
        if (file.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
        if (file.endsWith('.json')) res.setHeader('Content-Type', 'application/json');
        bytes = readFileSync(file);
      }
      const etag = `"${createHash('sha256').update(bytes).digest('hex')}"`;
      res.setHeader('ETag', etag);
      if (req.headers['if-none-match'] === etag) { res.statusCode = 304; return res.end(); }
      return res.end(bytes);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const classroom = createClassroomServer();
    await classroom.install(context, { id: '00000000-0000-4000-8000-000000000001', name: 'Öğretmen' });
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.locator('#btnMasterConsole').click();
    await page.locator('#btnWelcomeTeamToggle').click();
    await page.locator('#welcomeRoomId').fill('12-A');
    await page.locator('[data-action="welcome-join-room"]').click();
    await expect(page.locator('#topRoomPill')).toHaveAttribute('data-role', 'host');
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toContain('/sw.js');
    await page.evaluate(key => { localStorage.setItem(key, JSON.stringify({ 969: 'A' })); window.__documentToken = 'same-document'; }, StorageKeys.USER_CHOICES);
    version = 2;
    const previousUpdates = classroom.requests.filter(r => r.rpc === 'update_room_member').length;
    await setPageVisibility(page, false);
    await setPageVisibility(page, true);
    await expect.poll(() => classroom.requests.filter(r => r.rpc === 'update_room_member').length).toBeGreaterThan(previousUpdates);
    expect(await page.evaluate(() => window.__documentToken)).toBe('same-document');
    await expect(page.locator('#topRoomPill')).toHaveAttribute('data-role', 'host');
    await page.reload();
    await expect(page.locator('#topRoomPill')).toHaveAttribute('data-role', 'host');
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), StorageKeys.USER_CHOICES)).toEqual({ 969: 'A' });
    expect(requests).toContain(`/${oldApp}`);
    expect(requests).toContain(`/${oldCss}`);
    expect(requests).toContain(`/${newApp}`);
    expect(requests).toContain(`/${newCss}`);
    expect(await page.evaluate(() => navigator.serviceWorker.controller?.scriptURL)).toContain('/sw.js');
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  }
});
