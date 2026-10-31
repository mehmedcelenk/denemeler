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
  await page.locator('#btnMasterConsole').click();
  await page.locator('[data-action="clear-all-marks"]').click();
  await page.locator('#btnMasterConsole').click();
  await expect(page.locator('.optical-choice-row.marked')).toHaveCount(0);

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
  await expect(page.locator('#badgeMainText')).toContainText('Konu');
  await expect(page.locator('.booklet-question').first()).toBeVisible();
});

test('AI Soru Asistanı: özellik çubuğundan soru sorulur, bildirim noktası F5 sonrası korunur ve kaydırılabilir balon açılır', async ({ page }) => {
  await page.goto('/');
  const firstCard = page.locator('.booklet-question:not(.is-passive-question)').first();
  await expect(firstCard).toBeVisible();
  const qid = await firstCard.getAttribute('data-qid');

  // 1. Özellik çubuğunu aç ve AI butonuna tıkla
  await firstCard.locator('[data-action="toggle-question-features"]').click();
  const aiBtn = firstCard.locator(`#btnAiAsk_${qid}`);
  await expect(aiBtn).toBeVisible();
  await aiBtn.click();

  // 2. Soru kutusuna metin yaz ve gönder
  const askBox = firstCard.locator(`#aiAskBox_${qid}`);
  await expect(askBox).toBeVisible();
  const input = firstCard.locator(`#aiAskInput_${qid}`);
  await input.fill('Tanzimat ne demek?');
  await firstCard.locator(`[data-action="submit-ai-ask"]`).click();

  // 3. Bildirim noktası (.has-ai-reply) ve soru altı chat yanıt kartı görünür olmalı
  const qNum = firstCard.locator(`#qnum_${qid}`);
  await expect(qNum).toHaveClass(/has-ai-reply/, { timeout: 15000 });
  const chatCard = firstCard.locator(`#aiChatReply_${qid}`);
  await expect(chatCard).toBeVisible();
  await expect(chatCard.locator('.ai-bubble-user')).toContainText('Tanzimat ne demek?');

  // 4. Sayfayı yenileyince (F5) bildirim noktası korunmalı ve soru numarasına tıklayınca soru altındaki AI sohbet alanı açılmalı
  await page.reload();
  const reloadedQNum = page.locator(`#qnum_${qid}`);
  await expect(reloadedQNum).toHaveClass(/has-ai-reply/);
  await reloadedQNum.click();
  const reloadedChatCard = page.locator(`#aiChatReply_${qid}`);
  await expect(reloadedChatCard).toBeVisible();
  await expect(reloadedChatCard.locator('.ai-bubble-user')).toContainText('Tanzimat ne demek?');
});

test('feature bar sayfa açılışında kapalıdır ve tek tıkla açılıp tek tıkla kapanır', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.booklet-question').first()).toBeVisible();

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




