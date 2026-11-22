import { test, expect } from '@playwright/test';
import { isolateRemoteData } from './fixtures/network.js';
import { StorageKeys } from '../../src/shared/storage-keys.ts';

const TEST_AUTH_SESSION = JSON.stringify({
  accessToken: 'e2e-test-token',
  refreshToken: 'e2e-test-refresh',
  expiresAt: Math.floor(Date.now() / 1000) + 86400,
  user: { id: 'e2e-user-1', email: 'ali@cenks.test', username: 'Ali', displayName: 'Ali' },
});

test.beforeEach(async ({ page }) => {
  await isolateRemoteData(page);
  await page.addInitScript(({ authKey, sessionJson }) => {
    if (!localStorage.getItem(authKey)) localStorage.setItem(authKey, sessionJson);
  }, { authKey: StorageKeys.AUTH_SESSION, sessionJson: TEST_AUTH_SESSION });
});

test('Welcome portal İlmihal program seçimini doğru yükler ve konuları listeler', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 860 });
  await page.goto('/');

  await expect(page.locator('#welcomePortal')).toBeVisible();

  // Ayarlar -> Profil üzerinden İlmihal programını seç ve Ders/Konu çekmecesini aç
  await page.locator('#btnMasterConsole').click();
  await page.locator('#btnOpenProfileScreen').click();
  await page.locator('#btnProfileEditMode').click();
  const ilmihalBtn = page.locator('#profileProgramSelector [data-program="ILMIHAL"]');
  await expect(ilmihalBtn).toHaveText('İlmihal');
  await ilmihalBtn.click();
  await expect(ilmihalBtn).toHaveClass(/active/);
  await page.locator('#btnBottomQuestions').click();
  await page.locator('#topCenterBadge').click();
  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);

  // Temizlik konusunun yüklendiğini doğrula
  await expect(page.locator('.booklet-question').first()).toBeVisible();

  // İlk sorunun Temizlik sorusu olduğunu ve şıklarının A-D içerdiğini doğrula
  const firstCard = page.locator('.booklet-question').first();
  await expect(firstCard.locator('.q-source-tag')).toContainText('TEMİZLİK');
  await expect(firstCard.locator('.optical-choice-row')).toHaveCount(4);
});

test('Welcome portal Girişimcilik seçimini doğru yükler', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 860 });
  await page.goto('/');

  await expect(page.locator('#welcomePortal')).toBeVisible();

  await page.locator('#btnMasterConsole').click();
  await page.locator('#btnOpenProfileScreen').click();
  await page.locator('#btnProfileEditMode').click();
  const girBtn = page.locator('#profileProgramSelector [data-program="GIRISIMCILIK"]');
  await expect(girBtn).toHaveText('Girişimcilik');
  await girBtn.click();
  await expect(girBtn).toHaveClass(/active/);
  await page.locator('#btnBottomQuestions').click();
  await page.locator('#topCenterBadge').click();
  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);
  await expect(page.locator('.booklet-question').first()).toBeVisible();
});
