import { test, expect } from '@playwright/test';
import { isolateRemoteData } from './fixtures/network.js';

test('sorumlu ders seçimi Profil ekranından yapılır; anasayfada Düzenle butonu yoktur', async ({ page }) => {
  await isolateRemoteData(page);
  await page.setViewportSize({ width: 420, height: 860 });
  await page.goto('/');
  await page.locator('[data-action="welcome-enter-guest"]').click();

  await expect(page.locator('#btnOpenResponsiblePicker')).toBeVisible();
  await expect(page.locator('#btnEditResponsibleCourses')).toHaveCount(0);
  await expect(page.locator('.arena-total-pct')).toHaveText('%0');

  // Ana sayfadaki 7 Sema Katmanı şeridi açılır ve 7 katmanlı SVG içerir
  await expect(page.locator('#btnHomeSkyRank .sky-rank-svg .sky-arc')).toHaveCount(7);
  await page.locator('#btnHomeSkyRank').click();
  await expect(page.locator('#skyRankPopover')).toBeVisible();
  await expect(page.locator('#skyRankPopover .sky-ladder-item')).toHaveCount(8);
  await page.keyboard.press('Escape');
  await expect(page.locator('#skyRankPopover')).toBeHidden();

  // Ayarlar menüsünde program seçici yok, Profil butonu var ve salt-okunur açılır
  await page.locator('#btnMasterConsole').click();
  await expect(page.locator('#consoleMenuPopup #profileProgramSelector')).toHaveCount(0);
  await page.locator('#btnOpenProfileScreen').click();
  await expect(page.locator('#profileScreen')).toBeVisible();
  await expect(page.locator('#btnProfileEditMode')).toBeVisible();
  await expect(page.locator('#profileProgramSelector')).toHaveCount(0);
  await expect(page.locator('#btnSaveResponsibleCourses')).toHaveCount(0);

  // Düzenle'ye tıklayınca düzenleme modu açılır; "Sonra" ile kapatılabilir
  await page.locator('#btnProfileEditMode').click();
  await expect(page.locator('#profileProgramSelector')).toBeVisible();
  await page.locator('.rp-clear-btn[data-action="close-profile-screen"]').click();
  await expect(page.locator('#profileScreen')).toBeHidden();

  await page.locator('#btnOpenResponsiblePicker').click();
  await expect(page.locator('#profileScreen')).toBeVisible();

  // Profil ekranında AÖO programına geçip ders seçilebilir
  await page.locator('.rp-program-btn[data-program="AOO"]').click();
  await expect(page.locator('.rp-chip[data-ders="AÖO TÜRKÇE – 6"]')).toBeVisible();
  await page.locator('.rp-chip[data-ders="AÖO TÜRKÇE – 6"]').click();
  await expect(page.locator('#rpSelectionSummary')).toContainText('1 ders');

  // AOİHL'ye geri dönüp sorumlu dersleri seçip kaydet
  await page.locator('.rp-program-btn[data-program="AOIHL"]').click();
  await page.locator('.rp-chip[data-ders="TÜRK DİLİ VE EDEBİYATI – 4"]').click();
  await page.locator('.rp-chip[data-ders="MATEMATİK – 2"]').click();
  await expect(page.locator('#rpSelectionSummary')).toContainText('2 ders');
  await expect(page.locator('#rpSelectionSummary')).toContainText('11 kredi');

  await page.locator('#btnSaveResponsibleCourses').click();
  await expect(page.locator('#profileScreen')).toBeHidden();
  await expect(page.locator('#btnEditResponsibleCourses')).toHaveCount(0);
  await expect(page.locator('.arena-section-label').first()).toContainText('2 DERS');
  await expect(page.locator('.arena-total-sub')).toContainText('0/2 ders başlandı');
  await expect(page.locator('.arena-total-sub')).toContainText('11 kredi');

  // Sayfa yenilendiğinde sorumlu dersler korunur
  await page.reload();
  await expect(page.locator('.arena-section-label').first()).toContainText('2 DERS');

  // Sorumlu ders satırına tıklayınca doğrudan ilgili dönem açılır
  await page.locator('.arena-subject-row[data-ders="TÜRK DİLİ VE EDEBİYATI – 4"]').click();
  await expect(page.locator('.booklet-question').first()).toBeVisible();
  await expect(page.locator('.booklet-question .q-source-tag').first()).toContainText('TDE-4');
});
