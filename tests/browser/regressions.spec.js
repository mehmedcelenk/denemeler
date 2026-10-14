import { test, expect } from '@playwright/test';

test('bozuk kayıtlı cevaplar açılışı engellemez', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('aol_user_choices', 'null'));
  await page.goto('/');
  await expect(page.locator('.optical-choice-row').first()).toBeVisible();
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


