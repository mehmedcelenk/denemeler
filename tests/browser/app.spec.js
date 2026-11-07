import { test, expect } from '@playwright/test';
import { StorageKeys } from '../../src/shared/storage-keys.ts';

async function enterSinglePlayer(page) {
  await page.locator('[data-action="welcome-start-single"]').click();
  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);
  await expect(page.locator('.booklet-question').first()).toBeVisible();
  await page.locator('.btn-close-drawer[data-action="close-subject-drawer"]').click();
}

async function openSinglePlayer(page) {
  await page.goto('/');
  await enterSinglePlayer(page);
}

test('karşılama portalı ilk açılışı sade tutar ve program seçimini derse taşır', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.locator('#welcomePortal')).toBeVisible();
  await expect(page.locator('#welcomePortal h1')).toHaveText('CENK');
  await expect(page.locator('.welcome-kicker')).toHaveCount(0);
  await expect(page.locator('#welcomeUserName')).toHaveCount(0);
  await expect(page.locator('#bookletPagesContainer')).toBeHidden();
  await expect(page.locator('.booklet-question')).toHaveCount(0);
  await expect(page.locator('.top-center-badge-container')).toBeHidden();
  await expect(page.locator('#btnResumeLastSession')).toBeEnabled();
  const actionHeights = await page.locator('.welcome-action-row').evaluateAll(rows =>
    rows.map(row => row.getBoundingClientRect().height)
  );
  expect(new Set(actionHeights).size).toBe(1);

  await page.locator('#welcomePortal [data-program="AOF"]').click();
  await expect(page.locator('#welcomePortal [data-program="AOF"]')).toHaveClass(/active/);
  await page.locator('[data-action="welcome-start-single"]').click();
  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);
  await expect(page.locator('#btnProgramAof')).toHaveCount(0);
  await expect.poll(() => page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null')?.subject, StorageKeys.RESUME_STATE)).toBe('AOF_HADIS');
  await expect(page.locator('.top-center-badge-container')).toBeVisible();

  await page.locator('.btn-close-drawer[data-action="close-subject-drawer"]').click();
  await page.locator('#btnMasterConsole').click();
  await page.locator('[data-action="welcome-home"]').click();
  await expect(page.locator('#welcomePortal')).toBeVisible();
  await expect(page.locator('.top-center-badge-container')).toBeHidden();
});

test('çok oyunculu giriş adı saklar ve odaya öğrenci olarak katılır', async ({ page }) => {
  await page.goto('/');
  await page.locator('#welcomeRoomId').fill('12-a');
  await page.locator('[data-action="welcome-join-room"]').click();
  await expect(page.locator('#welcomeNameDialog')).toBeVisible();
  await page.locator('#welcomeNameInput').fill('Ali');
  await page.locator('[data-action="welcome-confirm-name"]').click();

  await expect(page.locator('#welcomePortal')).toBeHidden();
  await expect(page.locator('#topRoomPill')).toBeVisible();
  await expect(page.locator('#topRoomPill')).toContainText('12-A');
  await expect.poll(() => page.evaluate(
    key => localStorage.getItem(key),
    StorageKeys.USER_NAME
  )).toBe('Ali');

  await page.locator('#btnMasterConsole').click();
  await page.locator('.console-nav-leave-room').click();
  await page.locator('#welcomeRoomId').fill('13-b');
  await page.locator('[data-action="welcome-join-room"]').click();
  await expect(page.locator('#welcomeNameDialog')).toBeHidden();
  await expect(page.locator('#topRoomPill')).toContainText('13-B');
});

test('ders, arama, cevaplar, görünüm ve İngilizce araçları çalışır', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openSinglePlayer(page);
  const option = page.locator('.optical-choice-row').first();
  const optionId = await option.getAttribute('id');
  await page.locator('.booklet-question').first().evaluate(card => { card.dataset.openedAt = String(Date.now()); });
  await option.click();
  await expect(page.locator('#answerRateWarning')).toContainText('Yakalandın.');
  await expect(option).not.toHaveClass(/marked/);
  await page.waitForTimeout(3600);
  await expect(page.locator('#answerRateWarning')).toContainText(/Yakalandın\. 0:5[0-9]/);
  await page.evaluate(key => localStorage.removeItem(key), StorageKeys.ANSWER_LOCK_UNTIL);
  await option.click();
  await expect(option).toHaveClass(/marked/);
  // Çift tıklama: Aynı şıkka ikinci tıklamada yapay gecikme olmadan nihai seçim onaylanır
  await option.click();
  expect(await page.locator('.btn-why-correct').count()).toBe(0);
  await expect(page.locator('#activeExplanationBubble')).toBeVisible();
  await page.reload();
  await enterSinglePlayer(page);
  await expect(page.locator(`[id="${optionId}"]`)).toHaveClass(/marked/);
  await page.locator('#btnMasterConsole').click();
  await expect(page.locator('[data-action="open-pdf-dialog"]')).toContainText('PDF / Yazdır');
  await page.locator('#btnMasterConsole').click();

  await page.locator('#topCenterBadge').click();
  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);
  await expect(page.locator('#drawerTopicList')).toBeVisible();
  await page.locator('#btnSubjectDropdownTrigger').click();
  await page.locator('.dropdown-menu-item').filter({ hasText: 'İngilizce' }).click();
  await expect(page.locator('[id^="btnMeal_"]').first()).toBeAttached();
  await page.locator('#btnLoadAllTopics').click();
  await expect(page.locator('.booklet-question').first()).toBeVisible();
  await page.locator('[data-action="toggle-question-features"]').first().click();
  await expect(page.locator('[id^="btnMeal_"]').first()).toBeVisible();
  const mealBtn = page.locator('[id^="btnMeal_"]').first();
  await mealBtn.click();
  await expect(page.locator('.booklet-question.has-interlinear').first()).toBeVisible();
  await expect(page.locator('ruby.interlinear-word').first()).toBeVisible();
  await mealBtn.click();
  await expect(page.locator('.booklet-question.has-interlinear')).toHaveCount(0);

  // Ses butonu geçici olarak devre dışı bırakıldı, TR çeviri butonu kontrol ediliyor
  await expect(page.locator('[id^="btnTransTR_"]').first()).toBeVisible();
  const translate = page.locator('[id^="btnTransTR_"]').first();

  await translate.click();
  await page.locator('#topCenterBadge').click();
  await page.locator('#btnSubjectDropdownTrigger').click();
  await page.locator('.dropdown-menu-item').filter({ hasText: 'Türk Dili' }).click();
  await expect(page.locator('[id^="btnMeal_"]')).toHaveCount(0);
  await page.locator('#btnLoadAllTopics').click();
  await expect(page.locator('.booklet-question').first()).toBeVisible();
  await page.locator('[data-action="toggle-question-features"]').first().click();
  await page.locator('[id^="btnEliminateWrong_"]').first().click();
  await expect(page.locator('.optical-choice-row.marked-incorrect').first()).toBeVisible();
  await page.locator('#btnMasterConsole').click();
  await page.locator('[data-action="cycle-theme-mode"]').click();
  await expect(page.locator('body')).toHaveClass(/dark-mode/);
  for (let i = 0; i < 3; i++) {
    await page.locator('[data-action="cycle-column-count"]').click();
  }
  await expect(page.locator('.page-columns-body').first()).toHaveClass(/cols-1/);
  await page.locator('[data-action="open-pdf-dialog"]').click();
  await expect(page.locator('#pdfDialogOverlay')).toHaveClass(/open/);
  // İçeriğe tıklama arka planın kapatma eylemini tetiklememeli.
  await page.locator('#pdfDialogOverlay .pdf-dialog-title').click();
  await expect(page.locator('#pdfDialogOverlay')).toHaveClass(/open/);
  await page.locator('button[data-action="close-pdf-dialog"]').click();
  await expect(page.locator('#pdfDialogOverlay')).not.toHaveClass(/open/);
  expect(errors).toEqual([]);
});

test('mobil genişlikte kitapçık açılır', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openSinglePlayer(page);
  await page.locator('#topCenterBadge').click();
  await expect(page.locator('#drawerTopicList')).toBeVisible();
});

test('sorular dikey akışta (stream) sorunsuz listelenir ve layout güncellemeleri çalışır', async ({ page }) => {
  await openSinglePlayer(page);
  await expect(page.locator('.booklet-page').first()).toBeVisible();

  const questionCount = await page.locator('.booklet-question').count();
  expect(questionCount).toBeGreaterThan(1);

  // Kartların dikey akışta görünür ve pozitif yüksekliğe sahip olduğunu doğrula
  const allCardsRendered = await page.evaluate(() => {
    const cards = document.querySelectorAll('.booklet-question');
    return cards.length > 0 && Array.from(cards).every(c => c.getBoundingClientRect().height > 40);
  });
  expect(allCardsRendered).toBe(true);

  // Toplam soru sayısı hapı mevcut olmalı
  await expect(page.locator('.page-num-pill')).toContainText('TOPLAM');

  // Layout değişiklik olayı akışı günceller
  await page.evaluate(() => {
    document.dispatchEvent(new Event('booklet:layoutchange'));
  });
  await expect(page.locator('.booklet-question').first()).toBeVisible();
});

test('3 ve 4 sütun seçimi masaüstünde uygulanır, mobilde her zaman 1 sütun kalır', async ({ page }) => {
  // Masaüstünde sütun seçimi uygulanmalı
  await page.setViewportSize({ width: 1200, height: 800 });
  await openSinglePlayer(page);
  await expect(page.locator('.booklet-page').first()).toBeVisible();

  await page.locator('#btnMasterConsole').click();
  for (const columns of [3, 4]) {
    await page.locator('[data-action="cycle-column-count"]').click();
    await expect(page.locator('.page-columns-body').first()).toHaveClass(new RegExp(`cols-${columns}`));
    await expect.poll(() => page.locator('.page-columns-body').first().evaluate(element => {
      const cols = getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/);
      return cols.length;
    })).toBe(columns);
  }
  await page.locator('#btnMasterConsole').click();

  // Mobilde ise seçilen ayar ne olursa olsun her zaman 1 sütun olmalı
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.locator('.page-columns-body').first().evaluate(element => {
    const cols = getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/);
    return cols.length;
  })).toBe(1);
});

test('sınav kaynağı etiketi soru kartı araç satırını daraltmaz', async ({ page }) => {
  await openSinglePlayer(page);
  const card = page.locator('.booklet-question').first();
  const sourceTag = card.locator('.q-source-tag');
  await expect(sourceTag).toBeVisible();
  await expect(card.locator('.q-top-row .q-source-tag')).toHaveCount(0);
  expect(await sourceTag.evaluate(tag =>
    tag.previousElementSibling?.classList.contains('q-optical-options')
  )).toBe(true);
});

test('çoklu branş, çoklu kademe ve çoklu konu seçimi kitapçığı günceller', async ({ page }) => {
  await openSinglePlayer(page);

  // Çekmeceyi aç
  await page.locator('#topCenterBadge').click();
  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);

  await expect(page.locator('.drawer-header-brand')).toHaveText('CENK');
  await expect(page.locator('.drawer-header #programToggleGroup')).toHaveCount(0);

  // TDE'de varsayılan olarak Dönemler sekmesinin ve çıkmış sınavların açıldığını doğrula
  await expect(page.locator('[data-tab="periods"]')).toHaveClass(/active/);
  await expect(page.locator('.drawer-exam-period-item').first()).toBeVisible();

  // "+" butonu ile yeni ders satırı ekle
  await page.locator('#btnAddSubjectRow').click();
  await expect(page.locator('.drawer-subject-row')).toHaveCount(2);

  // Konular sekmesine geç ve konu klasörlerinin döküldüğünü doğrula
  await page.locator('[data-tab="topics"]').click();
  await expect(page.locator('.drawer-subject-folder')).toHaveCount(2);

  // Change delegasyonu kontrolün sabit ID'sine bağımlı olmamalı.
  const intersection = page.locator('input[data-action="toggle-intersection"]');
  await intersection.evaluate(input => {
    input.id = 'intersection-registry-test';
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#lblDrawerTopicHeader')).toContainText('Ortak ∩');
  await intersection.evaluate(input => {
    input.checked = false;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.id = 'chkIntersectionSwitch';
  });
  await expect(page.locator('#lblDrawerTopicHeader')).not.toContainText('Ortak ∩');

  // İlk konuyu seç (grup akordiyonunu aç ve alt konuyu tıkla)
  await page.locator('.drawer-topic-group-header').first().click();
  const topicItem = page.locator('.drawer-topic-item').first();
  await expect(topicItem).toBeVisible();
  await topicItem.click();
  await expect(topicItem).toHaveClass(/selected/);

  // İkinci konuyu da seç
  const secondTopic = page.locator('.drawer-topic-item').nth(1);
  if (await secondTopic.count() > 0) {
    await secondTopic.click();
    await expect(secondTopic).toHaveClass(/selected/);
  }

  // Aksiyon butonu metninin "Tümünü Aç" ve seçilen konu sayısını yansıttığını doğrula
  await expect(page.locator('#btnLoadAllTopics')).toContainText('Tümünü Aç');

  // Kitapçığa yükle
  await page.locator('#btnLoadAllTopics').click();
  await expect(page.locator('#drawerOverlay')).not.toHaveClass(/open/);

  // Üst rozetin seçimi özetlediğini doğrula
  await expect(page.locator('#topCenterBadge')).toHaveAttribute('title', /Konu/);
  await expect(page.locator('.booklet-question').first()).toBeVisible();
});

test('feature bar sayfa açılışında kapalıdır ve tek tıkla açılıp tek tıkla kapanır', async ({ page }) => {
  await openSinglePlayer(page);

  // 1. Sayfa ilk açıldığında hiçbir soru çekmecesi açık gelmemeli (0 adet is-expanded)
  const openDrawers = await page.locator('.q-features-drawer.is-expanded').count();
  expect(openDrawers).toBe(0);

  // 2. İlk kartın özellik butonu
  const toggleBtn = page.locator('.btn-features-toggle').first();
  const firstDrawer = page.locator('.q-features-drawer').first();

  // 3. Tek tıkla açılmalı
  await toggleBtn.click();
  await expect(firstDrawer).toHaveClass(/is-expanded/);
  await expect(toggleBtn.locator('.features-toggle-icon')).toHaveText('‹');

  // 4. Tek tıkla geri kapanmalı
  await toggleBtn.click();
  await expect(firstDrawer).not.toHaveClass(/is-expanded/);
  await expect(toggleBtn.locator('.features-toggle-icon')).toHaveText('›');
});




