import { test, expect } from '@playwright/test';
import { isolateRemoteData } from './fixtures/network.js';
import { StorageKeys } from '../../src/shared/storage-keys.ts';

test('menüdeki karekod açılır, site bağlantısını gösterir ve kapatılır', async ({ page }) => {
  await isolateRemoteData(page);
  await page.addInitScript(key => localStorage.setItem(key, JSON.stringify({
    accessToken: 'token', refreshToken: 'refresh', expiresAt: Math.floor(Date.now() / 1000) + 86400,
    user: { id: 'qr-test', username: 'test' },
  })), StorageKeys.AUTH_SESSION);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#btnBottomQuestions').click();
  await expect(page.locator('.booklet-question').first()).toBeVisible();
  await page.locator('#btnMasterConsole').click();
  await page.getByRole('button', { name: 'Karekod Göster' }).click();
  const dialog = page.getByRole('dialog', { name: 'Karekod ile aç' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link')).toHaveAttribute('href', 'https://anlatansorular.surge.sh/');
  const image = dialog.getByRole('img', { name: /karekod/i });
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await page.locator('#btnMasterConsole').click();
  await page.getByRole('button', { name: 'Karekod Göster' }).click();
  await dialog.getByRole('button', { name: 'Karekodu kapat' }).click();
  await expect(dialog).not.toBeVisible();
});
