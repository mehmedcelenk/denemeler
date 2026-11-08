import { test, expect } from '@playwright/test';

test('Welcome portal İlmihal program seçimini doğru yükler ve konuları listeler', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 860 });
  await page.goto('/');

  await expect(page.locator('#welcomePortal')).toBeVisible();

  // İlmihal Programını Seç
  const ilmihalBtn = page.locator('#welcomePortal [data-program="ILMIHAL"]');
  await expect(ilmihalBtn).toHaveText('İlmihal');
  await ilmihalBtn.click();
  await expect(ilmihalBtn).toHaveClass(/active/);

  // Soru Çöz butonuna tıkla
  await page.locator('[data-action="welcome-start-single"]').click();

  // Çekmecenin açıldığını ve Temizlik konusunun yüklendiğini doğrula
  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);
  await expect(page.locator('.booklet-question').first()).toBeVisible();

  // İlk sorunun Temizlik sorusu olduğunu ve şıklarının A-D içerdiğini doğrula
  const firstCard = page.locator('.booklet-question').first();
  await expect(firstCard.locator('.q-source-tag')).toContainText('TEMİZLİK');
  await expect(firstCard.locator('.optical-choice-row')).toHaveCount(4);
});

test('Welcome portal Girişimcilik seçimini doğru yükler', async ({ page }) => {
  await page.setViewportSize({ width: 420, height: 860 });
  await page.goto('/');

  await expect(page.locator('#welcomePortal')).toBeVisible();

  const girBtn = page.locator('#welcomePortal [data-program="GIRISIMCILIK"]');
  await expect(girBtn).toHaveText('Girişimcilik');
  await girBtn.click();
  await expect(girBtn).toHaveClass(/active/);

  await page.locator('[data-action="welcome-start-single"]').click();
  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);
  await expect(page.locator('.booklet-question').first()).toBeVisible();
});
