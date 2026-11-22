import { test, expect } from '@playwright/test';
import { createServer } from 'vite';
import { resolve } from 'node:path';
import { isolateRemoteData } from './fixtures/network.js';

test('geliştirme sunucusu eski dist yerine güncel kaynakları ve misafir girişini sunar', async ({ page }) => {
  const server = await createServer({
    configFile: resolve('vite.config.js'),
    server: { host: '127.0.0.1', port: 0, strictPort: false, open: false, watch: null },
  });
  const scripts = [];
  page.on('request', request => {
    if (request.resourceType() === 'script') scripts.push(new URL(request.url()).pathname);
  });
  await isolateRemoteData(page);
  try {
    await server.listen();
    const address = server.httpServer.address();
    if (!address || typeof address === 'string') throw new Error('Geliştirme portu bulunamadı.');
    await page.goto(`http://127.0.0.1:${address.port}/`);
    await expect(page.getByRole('button', { name: 'Misafir Olarak Devam Et', exact: true })).toBeVisible();
    expect(scripts).toContain('/src/main.js');
    expect(scripts.some(path => path.startsWith('/dist/assets/'))).toBe(false);
    await expect(page.locator('link[href="./src/styles/index.css"]')).toHaveCount(1);
    await page.getByRole('button', { name: 'Misafir Olarak Devam Et', exact: true }).click();
    await expect(page.locator('#authUserNameDisplay')).toHaveText('Misafir');
  } finally {
    await server.close();
  }
});
