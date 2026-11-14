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

async function openSinglePlayer(page) {
  await page.goto('/');
  await page.locator('[data-action="welcome-start-single"]').click();
  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);
  await page.locator('.btn-close-drawer[data-action="close-subject-drawer"]').click();
  await expect(page.locator('.optical-choice-row').first()).toBeVisible();
}

test('bozuk kayıtlı cevaplar açılışı engellemez', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, 'null'), StorageKeys.USER_CHOICES);
  await openSinglePlayer(page);
});

test('soru kaydetme yer imi ve kaydetme diliyle çalışır', async ({ page }) => {
  await openSinglePlayer(page);
  await page.locator('[data-action="toggle-question-features"]').first().click();

  const saveButton = page.locator('[data-action="toggle-star-question"]').first();
  const questionId = Number(await saveButton.getAttribute('data-qid'));
  await expect(saveButton).toHaveAttribute('title', 'Soruyu Kaydet');
  await expect(saveButton).toHaveAttribute('aria-label', 'Soruyu Kaydet');
  await expect(saveButton.locator('svg path')).toHaveCount(1);
  await expect(saveButton.locator('svg polygon')).toHaveCount(0);

  await saveButton.click();
  await expect(saveButton).toHaveClass(/is-starred/);
  await expect(saveButton).toHaveAttribute('title', 'Kaydı Kaldır');
  await expect.poll(() => page.evaluate(
    ({ key, id }) => JSON.parse(localStorage.getItem(key) || '[]').includes(id),
    { key: StorageKeys.STARRED_QUESTIONS, id: questionId }
  )).toBe(true);

  await page.locator('#btnUnifiedTrigger').click();
  await expect(page.locator('#btnUnifiedStarred .top-unified-label')).toHaveText('Kayıtlı');
  await page.locator('#btnUnifiedStarred').click();
  await expect(page.locator('#btnUnifiedTrigger .top-unified-label')).toHaveText('Kayıtlı');
  await expect(page.locator(`.booklet-question[data-qid="${questionId}"]`)).toBeVisible();
});

test('hamburger menüsü sade, etiketli ve welcome durumuna duyarlıdır', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.welcome-bismillah')).toHaveText('بسم الله');
  await page.locator('#btnMasterConsole').click();
  await expect(page.locator('[data-action="welcome-home"]')).toBeHidden();
  await expect(page.locator('[data-action="cycle-column-count"]')).toBeHidden();
  await expect(page.locator('[data-action="cycle-zoom-level"]')).toBeHidden();
  await expect(page.locator('#topPrayerPill .prayer-icon')).toHaveCount(0);
  await expect(page.locator('#topPrayerPill')).toHaveCSS('border-top-style', 'none');
  for (const action of ['cycle-tts-gender', 'cycle-tts-engine', 'clear-all-marks', 'undo-clear-marks', 'toggle-fullscreen', 'open-room-modal']) {
    await expect(page.locator(`[data-action="${action}"]`)).toHaveCount(0);
  }
  await page.locator('#btnResumeLastSession').click();
  await expect(page.locator('#drawerOverlay')).not.toHaveClass(/open/);
  await expect(page.locator('.booklet-question').first()).toBeVisible();
  await page.locator('#btnMasterConsole').click();
  await expect(page.locator('[data-action="welcome-home"]')).toBeVisible();
  await expect(page.locator('[data-action="welcome-home"] svg')).toHaveCount(1);
  await expect(page.locator('#btnResumeLastSession svg')).toHaveCount(1);
  await page.locator('[data-action="cycle-column-count"]').click();
  await page.locator('[data-action="cycle-zoom-level"]').click();
  await page.locator('[data-action="cycle-theme-mode"]').click();
  await page.locator('[data-action="cycle-accent-color"]').click();
  await expect(page.locator('#btnConsoleColorCycle svg')).toHaveCSS('color', 'rgb(5, 150, 105)');
  const labels = ['Ana Sayfa', 'Kaldığın Yerden Devam Et', 'Sütun Düzeni: 3', 'Yazı Boyutu: 15px', 'Tema: Koyu', 'Vurgu Rengi', 'PDF / Yazdır'];
  await expect(page.locator('.console-nav-action:visible')).toHaveText(labels);
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

  await page.locator('#btnMasterConsole').click();
  await expect(page.locator('#btnResumeLastSession')).toBeEnabled();
  await page.locator('#btnResumeLastSession').click();
  await expect(page.locator('.booklet-question[data-qid="969"]')).toBeVisible();
  await page.locator('#btnMasterConsole').click();
  await page.locator('[data-action="welcome-home"]').click();
  await page.locator('[data-action="welcome-start-single"]').click();
  await page.locator('.btn-close-drawer[data-action="close-subject-drawer"]').click();
  await page.locator('#btnUnifiedTrigger').click();
  await page.locator('#btnUnifiedRematch').click();
  await expect(page.locator('.booklet-question[data-qid="969"]')).toBeVisible();
  await expect(page.locator('#streakCountDisplay')).toHaveText('7');
  const stableKeys = [StorageKeys.REMATCH_QUESTIONS, StorageKeys.WATER_STREAK, StorageKeys.LAST_STREAK_DATE];
  await expect.poll(() => page.evaluate(keys => Object.fromEntries(
    keys.map(key => [key, localStorage.getItem(key)])
  ), stableKeys)).toEqual(Object.fromEntries(stableKeys.map(key => [key, existingValues[key]])));
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
  await openSinglePlayer(page);
  await page.locator('#topCenterBadge').click();
  await selectSubject(page, 'İngilizce');
  await requested;
  await selectSubject(page, 'Coğrafya');
  await expect(page.locator('#badgeMainText')).toContainText('Coğrafya');
  const response = page.waitForResponse('**/data/subjects/ING.json');
  release();
  await response;
  // İstek tamamlandıktan sonraki kullanıcı eylemiyle kalan seçimi kontrol et.
  await page.locator('#btnLoadAllTopics').click();
  await expect(page.locator('#badgeMainText')).toContainText('Coğrafya');
});

test('ders yükleme hatasında önceki kitapçık korunur ve yeniden denenebilir', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openSinglePlayer(page);
  await page.route('**/data/subjects/ING.json', route => route.fulfill({ status: 503, body: 'unavailable' }));
  await page.locator('#topCenterBadge').click();
  await selectSubject(page, 'İngilizce');
  await expect(page.locator('#drawerTopicList')).toContainText('Ders yüklenemedi');
  await expect(page.locator('#badgeMainText')).toContainText('Türk Dili');
  await page.unroute('**/data/subjects/ING.json');
  await selectSubject(page, 'İngilizce');
  await expect(page.locator('#badgeMainText')).toContainText('İngilizce');
  expect(errors).toEqual([]);
});

test('feature bar sayfa açılışında kapalıdır ve tek tıkla açılıp tek tıkla kapanır', async ({ page }) => {
  await openSinglePlayer(page);

  const openDrawers = await page.locator('.q-features-drawer.is-expanded').count();
  expect(openDrawers).toBe(0);

  const toggleBtn = page.locator('.btn-features-toggle').first();
  const firstDrawer = page.locator('.q-features-drawer').first();

  await toggleBtn.click();
  await expect(firstDrawer).toHaveClass(/is-expanded/);
  await expect(toggleBtn.locator('.features-toggle-icon')).toHaveText('‹');

  await toggleBtn.click();
  await expect(firstDrawer).not.toHaveClass(/is-expanded/);
  await expect(toggleBtn.locator('.features-toggle-icon')).toHaveText('›');
});


