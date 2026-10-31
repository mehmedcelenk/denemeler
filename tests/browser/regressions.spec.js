import { test, expect } from '@playwright/test';
import { StorageKeys } from '../../src/shared/storage-keys.ts';

test('bozuk kayıtlı cevaplar açılışı engellemez', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, 'null'), StorageKeys.USER_CHOICES);
  await page.goto('/');
  await expect(page.locator('.optical-choice-row').first()).toBeVisible();
});

test('mevcut rövanş, kaldığı yer ve seri kayıtları açılışta korunur', async ({ page }) => {
  const existingValues = {
    [StorageKeys.REMATCH_QUESTIONS]: JSON.stringify([969]),
    [StorageKeys.RESUME_STATE]: JSON.stringify({ subject: 'TDE', questionId: 969, timestamp: 1700000000000 }),
    [StorageKeys.WATER_STREAK]: '7',
    [StorageKeys.LAST_STREAK_DATE]: '2026-10-29',
  };
  await page.addInitScript(values => {
    for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
  }, existingValues);

  await page.goto('/');

  await expect(page.locator('.optical-choice-row').first()).toBeVisible();
  await page.locator('#btnUnifiedRematch').click();
  await expect(page.locator('.booklet-question[data-qid="969"]')).toBeVisible();
  await expect(page.locator('#resumeSessionBanner')).toBeVisible();
  await expect(page.locator('#resumeSessionText')).toContainText('TDE');
  await expect(page.locator('#streakCountDisplay')).toHaveText('7');
  await expect.poll(() => page.evaluate(keys => Object.fromEntries(
    keys.map(key => [key, localStorage.getItem(key)])
  ), Object.keys(existingValues))).toEqual(existingValues);
});


async function selectSubject(page, name) {
  await page.locator('#btnSubjectDropdownTrigger').click();
  await page.locator('.dropdown-menu-item').filter({ hasText: name }).click();
}

test('yavaş ders isteği son seçilen dersi değiştirmez', async ({ page }) => {
  let release;
  const blocked = new Promise(resolve => { release = resolve; });
  let started;
  const requested = new Promise(resolve => { started = resolve; });
  await page.route('**/data/subjects/ING.json', async route => {
    started();
    await blocked;
    await route.continue();
  });
  await page.goto('/');
  await expect(page.locator('.optical-choice-row').first()).toBeVisible();
  await page.locator('#topCenterBadge').click();
  await selectSubject(page, 'İngilizce');
  await requested;
  await selectSubject(page, 'Coğrafya');
  await expect(page.locator('#badgeMainText')).toContainText('COĞ');
  const response = page.waitForResponse('**/data/subjects/ING.json');
  release();
  await response;
  // İstek tamamlandıktan sonraki kullanıcı eylemiyle kalan seçimi kontrol et.
  await page.locator('#btnLoadAllTopics').click();
  await expect(page.locator('#badgeMainText')).toContainText('COĞ');
});

test('ders yükleme hatasında önceki kitapçık korunur ve yeniden denenebilir', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.optical-choice-row').first()).toBeVisible();
  await page.route('**/data/subjects/ING.json', route => route.fulfill({ status: 503, body: 'unavailable' }));
  await page.locator('#topCenterBadge').click();
  await selectSubject(page, 'İngilizce');
  await expect(page.locator('#drawerTopicList')).toContainText('Ders yüklenemedi');
  await expect(page.locator('#badgeMainText')).toContainText('TDE');
  await page.unroute('**/data/subjects/ING.json');
  await selectSubject(page, 'İngilizce');
  await expect(page.locator('#badgeMainText')).toContainText('İNG');
  expect(errors).toEqual([]);
});


