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

test('Welcome portal 5 program butonunu içerir ve TYT/AYT/YDT akışını doğru başlatır', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 860 });
  await page.goto('/');

  await expect(page.locator('#welcomePortal')).toBeVisible();

  // Profil menüsünü aç ve 8 program seçeneğinin varlığını doğrula
  await page.locator('#btnMasterConsole').click();
  await page.locator('#btnOpenProfileScreen').click();
  await page.locator('#btnProfileEditMode').click();
  const programs = page.locator('#profileProgramSelector [data-action="select-profile-program"]');
  await expect(programs).toHaveCount(8);
  await expect(page.locator('#profileProgramSelector [data-program="AOIHL"]')).toHaveText('AOİHL');
  await expect(page.locator('#profileProgramSelector [data-program="AOO"]')).toHaveText('AÖO');
  await expect(page.locator('#profileProgramSelector [data-program="AOF"]')).toHaveText('AÖF');
  await expect(page.locator('#profileProgramSelector [data-program="TYT"]')).toHaveText('TYT');
  await expect(page.locator('#profileProgramSelector [data-program="AYT"]')).toHaveText('AYT');
  await expect(page.locator('#profileProgramSelector [data-program="YDT"]')).toHaveText('YDT');
  await expect(page.locator('#profileProgramSelector [data-program="ILMIHAL"]')).toHaveText('İlmihal');
  await expect(page.locator('#profileProgramSelector [data-program="GIRISIMCILIK"]')).toHaveText('Girişimcilik');

  // TYT Seçimi
  await page.locator('#profileProgramSelector [data-program="TYT"]').click();
  await expect(page.locator('#profileProgramSelector [data-program="TYT"]')).toHaveClass(/active/);
  await page.locator('#btnBottomQuestions').click();
  await page.locator('#topCenterBadge').click();
  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);

  // TYT için dönem çipleri ve / çizgisi gizlenir
  await expect(page.locator('.drawer-subject-row .row-slash')).toHaveCount(0);
  await expect(page.locator('.drawer-subject-row .row-level-chips')).toHaveCount(0);

  // Soruların yüklendiğini doğrula
  await expect(page.locator('.booklet-question').first()).toBeVisible();

  // Çekmeceyi kapat ve ana ekrana dön
  await page.locator('.btn-close-drawer[data-action="close-subject-drawer"]').click();
  await expect(page.locator('#drawerOverlay')).not.toHaveClass(/open/);

  // AYT Seçimi Testi
  await page.locator('[data-action="welcome-home"]').click();
  await expect(page.locator('#welcomePortal')).toBeVisible();

  await page.locator('#btnMasterConsole').click();
  await page.locator('#btnOpenProfileScreen').click();
  await page.locator('#btnProfileEditMode').click();
  await page.locator('#profileProgramSelector [data-program="AYT"]').click();
  await expect(page.locator('#profileProgramSelector [data-program="AYT"]')).toHaveClass(/active/);
  await page.locator('#btnBottomQuestions').click();
  await page.locator('#topCenterBadge').click();
  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);

  await expect(page.locator('.drawer-subject-row .row-slash')).toHaveCount(0);
  await expect(page.locator('.drawer-subject-row .row-level-chips')).toHaveCount(0);
  await expect(page.locator('.booklet-question').first()).toBeVisible();
});

