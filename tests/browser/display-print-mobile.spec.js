import { test, expect } from '@playwright/test';
import { isolateRemoteData } from './fixtures/network.js';
import { StorageKeys } from '../../src/shared/storage-keys.ts';

test.beforeEach(async ({ page }) => {
  await isolateRemoteData(page);
  await page.addInitScript(key => localStorage.setItem(key, JSON.stringify({
    accessToken: 'token', refreshToken: 'refresh', expiresAt: Math.floor(Date.now() / 1000) + 86400,
    user: { id: 'user-1', username: 'ali', displayName: 'Ali' },
  })), StorageKeys.AUTH_SESSION);
});

test('kitapçık ve yazdırma akışı cevap anahtarı sunmaz', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btnBottomQuestions').click();
  await expect(page.locator('.booklet-question').first()).toBeVisible();
  await expect(page.locator('.page-bottom-answer-strip, .btn-page-key-toggle')).toHaveCount(0);
  await page.evaluate(() => { window.print = () => { document.body.dataset.printCalled = 'yes'; }; });
  await page.locator('#btnMasterConsole').click();
  await page.locator('[data-action="open-pdf-dialog"]').click();
  await expect(page.locator('input[name="pdfKeyLocation"]')).toHaveCount(0);
  await page.locator('[data-action="execute-pdf-print"]').click();
  await expect(page.locator('body')).toHaveAttribute('data-print-called', 'yes');
  await expect(page.locator('#separateAnswerPage, .page-bottom-answer-strip')).toHaveCount(0);
});

test('dar ekranda oda rozeti alt çubuğu taşırmaz', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/');
  await page.locator('#btnBottomQuestions').click();
  await expect(page.locator('.booklet-question').first()).toBeVisible();
  await page.evaluate(() => {
    const pill = document.getElementById('topRoomPill');
    pill.style.display = 'inline-flex';
    pill.querySelector('.room-pill-text').textContent = 'ÇOK UZUN SINIF OTURUMU ADI';
  });
  const boxes = await page.locator('.bottom-navigation > :visible').evaluateAll(els => els.map(el => {
    const box = el.getBoundingClientRect();
    return { left: box.left, right: box.right };
  }));
  expect(boxes.every(box => box.left >= 0 && box.right <= 320)).toBe(true);
  await page.locator('#btnUnifiedTrigger').click();
  await expect(page.locator('#btnUnifiedRematch')).toBeVisible();
});

test('görünen ad düzenleyicisi hesapta açılır', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btnMasterConsole').click();
  await page.locator('#btnOpenProfileScreen').click();
  await page.locator('#btnProfileEditMode').click();
  await page.locator('[data-action="welcome-edit-name"]').click();
  await expect(page.locator('#displayNameInput')).toHaveValue('Ali');
  await page.locator('#displayNameInput').fill('');
  await page.locator('[data-action="welcome-save-name"]').click();
  await expect(page.locator('#displayNameError')).toContainText('1 ile 80');
});

test('dar pencerede sütunlar okunabilir kalırken tercih ve yazdırma korunur', async ({ page }) => {
  await page.setViewportSize({ width: 842, height: 943 });
  await page.goto('/');
  await page.locator('#btnBottomQuestions').click();
  await expect(page.locator('.booklet-question').first()).toBeVisible();
  await page.locator('#btnMasterConsole').click();
  const cycle = page.locator('#btnConsoleColumnCycle');
  await cycle.click();
  await cycle.click();
  await expect(cycle).toHaveAttribute('data-columns', '4');
  const grid = page.locator('.page-columns-body').first();
  await expect(grid).toHaveClass(/cols-4/);
  await expect.poll(() => cycle.locator('span').evaluate(element =>
    getComputedStyle(element, '::after').content
  )).toContain('2 görünür');

  for (const [width, expected] of [[842, 2], [1000, 3], [1200, 4], [390, 1]]) {
    await page.setViewportSize({ width, height: 943 });
    await expect.poll(() => grid.evaluate(element =>
      getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length
    )).toBe(expected);
    await expect(cycle).toHaveAttribute('data-columns', '4');
    await expect(grid).toHaveClass(/cols-4/);
  }

  await page.setViewportSize({ width: 842, height: 943 });
  await page.emulateMedia({ media: 'print' });
  await expect.poll(() => grid.evaluate(element =>
    getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length
  )).toBe(4);
});
