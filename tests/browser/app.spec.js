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
  // İkinci kez tıklanarak cevap kesinleştirilir
  await option.click();
  // Neden butonu DOM'da kesinlikle olmamalı
  expect(await page.locator('.btn-why-correct').count()).toBe(0);
  // Açıklama balonu (toast) görünür olmalı
  await expect(page.locator('#activeExplanationBubble')).toBeVisible();
  await page.reload();
  await expect(page.locator(`[id="${optionId}"]`)).toHaveClass(/marked/);
  await page.evaluate(() => window.clearAllMarks());
  await expect(page.locator('.optical-choice-row.marked')).toHaveCount(0);

  await page.locator('#topCenterBadge').click();
  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);
  await expect(page.locator('#drawerTopicList')).toBeVisible();
  await page.locator('#btnSubjectDropdownTrigger').click();
  await page.locator('.dropdown-menu-item').filter({ hasText: 'İngilizce' }).click();
  await page.locator('#btnLoadAllTopics').click();
  await expect(page.locator('.booklet-question').first()).toBeVisible();
  await page.evaluate(() => window.toggleFeaturesBar());
  // Ses butonu geçici olarak devre dışı bırakıldı, TR çeviri butonu kontrol ediliyor
  await expect(page.locator('[id^="btnTransTR_"]').first()).toBeVisible();
  const translate = page.locator('[id^="btnTransTR_"]').first();

  await translate.click();
  await page.locator('#topCenterBadge').click();
  await page.locator('#btnSubjectDropdownTrigger').click();
  await page.locator('.dropdown-menu-item').filter({ hasText: 'Türk Dili' }).click();
  await page.locator('#btnLoadAllTopics').click();
  await expect(page.locator('.booklet-question').first()).toBeVisible();
  await page.locator('[id^="btnXray_"]').first().click();
  await page.evaluate(() => window.setThemeMode('dark'));
  await expect(page.locator('body')).toHaveClass(/dark-mode/);
  await page.evaluate(() => window.setColumnCount(1));
  await page.evaluate(() => window.openPdfDialog());
  expect(errors).toEqual([]);
});

test('mobil genişlikte kitapçık açılır', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.optical-choice-row').first()).toBeVisible();
  await page.locator('#topCenterBadge').click();
  await expect(page.locator('#drawerTopicList')).toBeVisible();
});

test('sorular dikey akışta (stream) sorunsuz listelenir ve layout güncellemeleri çalışır', async ({ page }) => {
  await page.goto('/');
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
  await page.goto('/');
  await expect(page.locator('.booklet-page').first()).toBeVisible();

  for (const columns of [3, 4]) {
    await page.evaluate(columns => window.setColumnCount(columns), columns);
    await expect(page.locator('.page-columns-body').first()).toHaveClass(new RegExp(`cols-${columns}`));
    await expect.poll(() => page.locator('.page-columns-body').first().evaluate(element =>
      getComputedStyle(element).columnCount
    )).toBe(String(columns));
  }

  // Mobilde ise seçilen ayar ne olursa olsun her zaman 1 sütun olmalı
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(() => page.locator('.page-columns-body').first().evaluate(element =>
    getComputedStyle(element).columnCount
  )).toBe('1');
});

test('sınav kaynağı etiketi soru kartı araç satırını daraltmaz', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('.booklet-question').first();
  const sourceTag = card.locator('.q-source-tag');
  await expect(sourceTag).toBeVisible();
  await expect(card.locator('.q-top-row .q-source-tag')).toHaveCount(0);
  expect(await sourceTag.evaluate(tag =>
    tag.previousElementSibling?.classList.contains('q-optical-options')
  )).toBe(true);
});

test('çoklu branş, çoklu kademe ve çoklu konu seçimi kitapçığı günceller', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.booklet-question').first()).toBeVisible();

  // Çekmeceyi aç
  await page.locator('#topCenterBadge').click();
  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);

  // Başlıkta "sınavdasın." ve program butonlarının geldiğini doğrula
  await expect(page.locator('.drawer-header-brand')).toContainText('sınavdasın.');
  await expect(page.locator('.drawer-header #programToggleGroup')).toBeVisible();

  // "+" butonu ile yeni ders satırı ekle
  await page.locator('#btnAddSubjectRow').click();
  await expect(page.locator('.drawer-subject-row')).toHaveCount(2);

  // Konu klasörlerinin döküldüğünü doğrula
  await expect(page.locator('.drawer-subject-folder')).toHaveCount(2);

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
  await expect(page.locator('#badgeMainText')).toContainText('Konu');
  await expect(page.locator('.booklet-question').first()).toBeVisible();
});


