import { test, expect } from '@playwright/test';
import { isolateRemoteData } from './fixtures/network.js';
import { StorageKeys } from '../../src/shared/storage-keys.ts';

test('yeni ad görünür, ilk açılış koyudur ve açık tema seçimi korunur', async ({ page }) => {
  await isolateRemoteData(page);
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('/');
  await expect(page).toHaveTitle(/ANLATAN SORULAR/);
  await expect(page.locator('#welcomePortal h1')).toHaveText('anlatansorular.com');
  const heading = await page.locator('#welcomePortal h1').boundingBox();
  expect(heading.x).toBeGreaterThanOrEqual(0);
  expect(heading.x + heading.width).toBeLessThanOrEqual(320);
  await expect(page.locator('body')).toHaveClass(/dark-mode/);
  expect(await page.evaluate(key => localStorage.getItem(key), StorageKeys.THEME)).toBe('dark');
  await page.evaluate(key => localStorage.setItem(key, 'light'), StorageKeys.THEME);
  await page.reload();
  await expect(page.locator('body')).not.toHaveClass(/dark-mode/);
  expect(await page.evaluate(key => localStorage.getItem(key), StorageKeys.THEME)).toBe('light');
});
