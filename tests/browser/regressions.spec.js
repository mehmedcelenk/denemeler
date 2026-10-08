import { test, expect } from '@playwright/test';

test('bozuk kayıtlı cevaplar açılışı engellemez', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('aol_user_choices', 'null'));
  await page.goto('/');
  await expect(page.locator('.optical-choice-row').first()).toBeVisible();
});

test('arama sonucu seçildiğinde soru vurgulanır', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.optical-choice-row').first()).toBeVisible();
  await page.locator('#topCenterBadge').click();
  await page.locator('#drawerSearchInput').fill('roman');
  const result = page.locator('.drawer-search-result-card').first();
  const id = (await result.getAttribute('onclick')).match(/\d+/)[0];
  await result.click();
  await expect(page.locator(`#bq_${id}`)).toHaveCSS('outline-style', 'solid');
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

test('yavaş genel arama temizlendikten sonra sonuç panelini tekrar açmaz', async ({ page }) => {
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
  await page.locator('#drawerSearchInput').fill('roman');
  await requested;
  await page.locator('#drawerSearchClearBtn').click();
  const response = page.waitForResponse('**/data/subjects/ING.json');
  release();
  await (await response).finished();
  await page.locator('#drawerSearchInput').focus();
  await expect(page.locator('#drawerNormalSelectorContainer')).toBeVisible();
  await expect(page.locator('#drawerSearchResultsContainer')).toBeHidden();
});
