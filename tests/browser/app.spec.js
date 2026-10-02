import { test, expect } from '@playwright/test';

test('ders, arama, cevaplar, görünüm ve İngilizce araçları çalışır', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.optical-choice-row').first()).toBeVisible();
  const option = page.locator('.optical-choice-row').first();
  const optionId = await option.getAttribute('id');
  await option.click();
  await expect(option).toHaveClass(/marked/);
  await page.reload();
  await expect(page.locator(`[id="${optionId}"]`)).toHaveClass(/marked/);
  await page.evaluate(() => window.clearAllMarks());
  await expect(page.locator('.optical-choice-row.marked')).toHaveCount(0);
  await page.evaluate(() => window.undoClearMarks());
  await expect(page.locator(`[id="${optionId}"]`)).toHaveClass(/marked/);

  await page.locator('#topCenterBadge').click();
  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);
  await page.locator('#drawerSearchInput').fill('roman');
  await expect(page.locator('#drawerSearchResultsList')).not.toBeEmpty();
  await page.evaluate(() => window.loadAllSearchResultsToBooklet());
  await expect(page.locator('#drawerOverlay')).not.toHaveClass(/open/);
  await expect(page.locator('#badgeMainText')).toContainText('roman');

  await page.locator('#topCenterBadge').click();
  await page.locator('#drawerSearchClearBtn').click();
  await page.locator('.drawer-subj-card').filter({ hasText: 'İngilizce' }).click();
  await page.locator('#btnLoadAllTopics').click();
  await expect(page.locator('.btn-tts-icon').first()).toBeVisible();
  const translate = page.locator('[id^="btnTransTR_"]').first();
  await translate.click();
  await expect(page.locator('[data-trans-lang="tr"]').first()).toBeVisible();
  await page.locator('[id^="btnXray_"]').first().click();
  await page.evaluate(() => window.setTTSVoiceGender('female'));
  await expect(page.locator('#btnTTSVoiceFemale')).toHaveClass(/active/);
  await page.evaluate(() => window.setThemeMode('dark'));
  await expect(page.locator('body')).toHaveClass(/dark-mode/);
  await page.evaluate(() => window.setColumnCount(1));
  await page.evaluate(() => window.openPdfDialog());
  await page.evaluate(() => window.toggleMiniCalculator());
  await expect(page.locator('#calcPanelNum')).toBeVisible();
  await expect(page.locator('#calcPanelOps')).toBeVisible();
  await expect(page.locator('#calcPanelOps button[data-op="+"]')).toBeVisible();
  await expect(page.locator('#calcPanelNum button:has-text("7")')).toBeVisible();
  await expect(page.locator('#calcPanelNum .micro-btn-change')).toBeHidden();
  expect(errors).toEqual([]);
});

test('mobil ekranda hesap makinesinde işlemler başlangıçta gizlidir ve geçişle açılır', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(() => window.toggleMiniCalculator());
  await expect(page.locator('#calcPanelNum')).toBeVisible();
  await expect(page.locator('#calcPanelOps')).toBeHidden();
  await page.locator('#calcPanelNum .micro-btn-change').click();
  await expect(page.locator('#calcPanelNum')).toBeHidden();
  await expect(page.locator('#calcPanelOps')).toBeVisible();
});

test('mobil genişlikte kitapçık açılır', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.optical-choice-row').first()).toBeVisible();
  await page.locator('#topCenterBadge').click();
  await expect(page.locator('#drawerSearchInput')).toBeVisible();
});

