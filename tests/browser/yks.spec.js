import { test, expect } from '@playwright/test';
import { StorageKeys } from '../../src/shared/storage-keys.ts';

const TEST_AUTH_SESSION = JSON.stringify({
  accessToken: 'e2e-test-token',
  refreshToken: 'e2e-test-refresh',
  expiresAt: Math.floor(Date.now() / 1000) + 86400,
  user: { id: 'e2e-user-1', email: 'ali@cenks.test', username: 'Ali', displayName: 'Ali' },
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ authKey, sessionJson }) => {
    if (!localStorage.getItem(authKey)) localStorage.setItem(authKey, sessionJson);
  }, { authKey: StorageKeys.AUTH_SESSION, sessionJson: TEST_AUTH_SESSION });
});

test('Welcome portal 5 program butonunu içerir ve TYT/AYT/YDT akışını doğru başlatır', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 860 });
  await page.goto('/');

  await expect(page.locator('#welcomePortal')).toBeVisible();

  // 8 program seçeneğinin varlığını doğrula (Sınavlar: 6, Tematik: 2)
  const programs = page.locator('#welcomePortal [data-action="welcome-set-program"]');
  await expect(programs).toHaveCount(8);
  await expect(page.locator('#welcomePortal [data-program="AOIHL"]')).toHaveText('AOİHL');
  await expect(page.locator('#welcomePortal [data-program="AOO"]')).toHaveText('AÖO');
  await expect(page.locator('#welcomePortal [data-program="AOF"]')).toHaveText('AÖF');
  await expect(page.locator('#welcomePortal [data-program="TYT"]')).toHaveText('TYT');
  await expect(page.locator('#welcomePortal [data-program="AYT"]')).toHaveText('AYT');
  await expect(page.locator('#welcomePortal [data-program="YDT"]')).toHaveText('YDT');
  await expect(page.locator('#welcomePortal [data-program="ILMIHAL"]')).toHaveText('İlmihal');
  await expect(page.locator('#welcomePortal [data-program="GIRISIMCILIK"]')).toHaveText('Girişimcilik');

  // TYT Seçimi
  await page.locator('#welcomePortal [data-program="TYT"]').click();
  await expect(page.locator('#welcomePortal [data-program="TYT"]')).toHaveClass(/active/);
  await page.locator('[data-action="welcome-start-single"]').click();

  // Çekmece açılır, TYT için dönem çipleri ve / çizgisi gizlenir
  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);
  await expect(page.locator('.drawer-subject-row .row-slash')).toHaveCount(0);
  await expect(page.locator('.drawer-subject-row .row-level-chips')).toHaveCount(0);

  // Soruların yüklendiğini doğrula
  await expect(page.locator('.booklet-question').first()).toBeVisible();

  // Çekmeceyi kapat ve ana ekrana dön
  await page.locator('.btn-close-drawer[data-action="close-subject-drawer"]').click();
  await expect(page.locator('#drawerOverlay')).not.toHaveClass(/open/);

  // AYT Seçimi Testi
  await page.locator('#btnMasterConsole').click();
  await page.locator('[data-action="welcome-home"]').click();
  await expect(page.locator('#welcomePortal')).toBeVisible();

  await page.locator('#welcomePortal [data-program="AYT"]').click();
  await expect(page.locator('#welcomePortal [data-program="AYT"]')).toHaveClass(/active/);
  await page.locator('[data-action="welcome-start-single"]').click();

  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);
  await expect(page.locator('.drawer-subject-row .row-slash')).toHaveCount(0);
  await expect(page.locator('.drawer-subject-row .row-level-chips')).toHaveCount(0);
  await expect(page.locator('.booklet-question').first()).toBeVisible();
});

