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

test('sorular A4 sayfalara sığar ve sayfa numaraları tutarlıdır', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.booklet-page').first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);

  const pagination = await page.locator('.booklet-page').evaluateAll(pages => ({
    pageCount: pages.length,
    questionCount: pages.reduce((total, page) => total + page.querySelectorAll('.booklet-question').length, 0),
    pages: pages.map((page, index) => {
      const bounds = page.getBoundingClientRect();
      const body = page.querySelector('.page-columns-body');
      const bodyBounds = body.getBoundingClientRect();
      const cardsFit = [...body.querySelectorAll('.booklet-question')].every(card => {
        const cardBounds = card.getBoundingClientRect();
        return cardBounds.bottom <= bodyBounds.bottom + 1 && cardBounds.right <= bodyBounds.right + 1;
      });
      return {
        width: bounds.width,
        height: bounds.height,
        cardsFit,
        pageLabel: page.querySelector('.page-num-pill').textContent.trim(),
        expectedPageLabel: `— SAYFA ${index + 1} / ${pages.length} —`,
      };
    }),
  }));

  expect(pagination.pageCount).toBeGreaterThan(1);
  expect(pagination.questionCount).toBeGreaterThan(pagination.pageCount);
  for (const pageDetails of pagination.pages) {
    expect(pageDetails.width).toBeCloseTo(793.7, 0);
    expect(pageDetails.height).toBeCloseTo(1122.5, 0);
    expect(pageDetails.cardsFit).toBe(true);
    expect(pageDetails.pageLabel).toBe(pageDetails.expectedPageLabel);
  }

  await page.evaluate(() => {
    const container = document.getElementById('bookletPagesContainer');
    window.__bookletRenderCount = 0;
    const observer = new MutationObserver(records => {
      for (const record of records) {
        if (record.target === container && [...record.addedNodes].some(node =>
          node instanceof HTMLElement
          && node.classList.contains('booklet-page')
          && !node.classList.contains('booklet-page-measuring'))) {
          window.__bookletRenderCount++;
        }
      }
    });
    observer.observe(container, { childList: true });
    document.dispatchEvent(new Event('booklet:layoutchange'));
  });
  await page.waitForTimeout(100);
  expect(await page.evaluate(() => window.__bookletRenderCount)).toBe(1);
});

test('3 ve 4 sütun seçimi tüm ekran genişliklerinde uygulanır', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.booklet-page').first()).toBeVisible();

  for (const columns of [3, 4]) {
    await page.evaluate(columns => window.setColumnCount(columns), columns);
    await expect(page.locator('.page-columns-body').first()).toHaveClass(new RegExp(`cols-${columns}`));
    await expect.poll(() => page.locator('.page-columns-body').first().evaluate(element =>
      getComputedStyle(element).columnCount
    )).toBe(String(columns));
  }
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
