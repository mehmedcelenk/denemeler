import { test, expect } from '@playwright/test';
import { isolateRemoteData } from './fixtures/network.js';

async function setupSignedInRoutes(context, initialMascot = 'cat') {
  await isolateRemoteData(context);
  let remoteMascot = initialMascot;
  const mascotPatches = [];

  await context.route('**/auth/v1/**', async route => {
    if (route.request().url().includes('/logout')) return route.fulfill({ status: 204 });
    return route.fulfill({
      json: {
        access_token: 'token-ali',
        refresh_token: 'refresh-ali',
        expires_in: 86400,
        user: { id: 'ali', email: 'ali@example.com', user_metadata: { username: 'ali', display_name: 'Ali' } },
      },
    });
  });

  await context.route('**/rest/v1/user_progress**', async route => {
    if (route.request().method() === 'POST') return route.fulfill({ status: 201, body: '' });
    return route.fulfill({ json: [] });
  });

  await context.route('**/rest/v1/user_profiles**', async route => {
    if (route.request().method() === 'PATCH') {
      const payload = route.request().postDataJSON();
      if (payload?.mascot_id) {
        remoteMascot = payload.mascot_id;
        mascotPatches.push(payload.mascot_id);
      }
      return route.fulfill({ status: 204, body: '' });
    }
    return route.fulfill({ json: [{ mascot_id: remoteMascot }] });
  });

  return { mascotPatches };
}

test('misafir modunda maskot rozeti ve profildeki maskot seçici görünmez', async ({ page }) => {
  await isolateRemoteData(page);
  await page.setViewportSize({ width: 420, height: 860 });
  await page.goto('/');
  await page.locator('[data-action="welcome-enter-guest"]').click();

  await expect(page.locator('#mascotCompanion')).toBeHidden();
  await page.locator('#btnMasterConsole').click();
  await page.locator('#btnOpenProfileScreen').click();
  await expect(page.locator('#profileScreen')).toBeVisible();
  await expect(page.locator('[data-role="profile-mascot-section"]')).toHaveCount(0);
});

test('giriş yapmış kullanıcı profilde maskot seçer, soru ekranında üst yuvarlak rozette tepki alır ve gizleyebilir', async ({ context, page }) => {
  const { mascotPatches } = await setupSignedInRoutes(context, 'cat');
  await page.setViewportSize({ width: 420, height: 860 });
  await page.goto('/');

  await page.fill('#authEmailInput', 'ali@example.com');
  await page.fill('#authPasswordInput', 'secret123');
  await page.locator('#btnAuthSubmit').click();

  const companion = page.locator('.top-center-badge-container #mascotCompanion');
  await expect(companion).toHaveAttribute('data-mascot', 'cat');

  // Profil ekranından Köpek seçildiğinde Supabase PATCH gönderilir
  await page.locator('#btnMasterConsole').click();
  await page.locator('#btnOpenProfileScreen').click();
  await expect(page.locator('[data-role="profile-mascot-section"]')).toBeVisible();
  await expect(page.locator('.ps-mascot-card')).toHaveCount(7);
  await page.locator('.ps-mascot-card[data-mascot="dog"]').click();

  await expect(companion).toHaveAttribute('data-mascot', 'dog');
  await expect(page.locator('.ps-mascot-card[data-mascot="dog"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => mascotPatches.at(-1)).toBe('dog');

  // Soru ekranında üst yuvarlak rozet görünür, tıklanınca ve cevapta tepki verir
  await page.locator('#btnCloseProfileScreen').click();
  await page.locator('[data-action="bottom-nav-questions"]').click();
  await expect(companion).toBeVisible();

  await companion.locator('.mascot-handle').click();
  await expect(companion).toHaveAttribute('data-mood', 'welcome');

  const firstQuestion = page.locator('.booklet-question').first();
  await expect(firstQuestion).toBeVisible();
  const firstChoice = firstQuestion.locator('.optical-choice-row').first();
  await firstChoice.click();
  await page.waitForTimeout(350);
  await firstChoice.click();
  await expect(companion).toHaveAttribute('data-mood', /^(correct|wrong)$/);

  // Akıllı Tahtada üst HUD rozeti görünmeye devam eder; ana sayfaya dönünce tahta kapanır
  await firstQuestion.locator('[data-action="toggle-question-features"]').click();
  await firstQuestion.locator('[data-action="open-board-focus"]').click();
  await expect(page.locator('#boardSpaceOverlay')).toBeVisible();
  await expect(companion).toBeVisible();

  await page.locator('[data-action="welcome-home"]').click();
  await expect(page.locator('#boardSpaceOverlay')).toBeHidden();

  // Profilden Hamsi seçilince yuvarlak lumboz rozetine geçer
  await page.locator('#btnMasterConsole').click();
  await page.locator('#btnOpenProfileScreen').click();
  await page.locator('.ps-mascot-card[data-mascot="fish"]').click();
  await expect(companion).toHaveAttribute('data-mascot', 'fish');
  await expect.poll(() => mascotPatches.at(-1)).toBe('fish');

  // Profilden Robokuş seçilince ana sayfada görünür; soru ekranında alt bara uçar, soruya tıklanınca soru numarasına konar
  await page.locator('.ps-mascot-card[data-mascot="bird"]').click();
  await expect.poll(() => mascotPatches.at(-1)).toBe('bird');
  await page.locator('#btnCloseProfileScreen').click();

  const bird = page.locator('#mascotBird');
  await expect(bird).toBeVisible();
  await expect(bird).toHaveAttribute('data-state', 'welcome');
  await expect(bird.locator('canvas.mascot-bird-canvas')).toBeVisible();

  await page.locator('[data-action="bottom-nav-questions"]').click();
  await expect(bird).toBeVisible();
  await expect(bird).toHaveAttribute('data-state', 'question');

  const qCard = page.locator('.booklet-question').first();
  await qCard.locator('.question-stem, .optical-choice-row').first().click();
  await expect(bird).toHaveAttribute('data-state', 'question');

  // Profilden RoboBaykuş seçilince 3D kuş türü güncellenir
  await page.locator('#btnMasterConsole').click();
  await page.locator('#btnOpenProfileScreen').click();
  await page.locator('.ps-mascot-card[data-mascot="owl"]').click();
  await expect(bird).toHaveAttribute('data-species', 'owl');
  await expect.poll(() => mascotPatches.at(-1)).toBe('owl');

  // Profilden "Gizle" seçilince hem üst rozet hem Robokuş gizlenir
  await page.locator('.ps-mascot-card[data-mascot="none"]').click();
  await expect(companion).toBeHidden();
  await expect(bird).toBeHidden();
  await expect.poll(() => mascotPatches.at(-1)).toBe('none');
});
