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
  const { mascotPatches } = await setupSignedInRoutes(context, 'bird');
  await page.setViewportSize({ width: 420, height: 860 });
  await page.goto('/');

  await page.fill('#authEmailInput', 'ali@example.com');
  await page.fill('#authPasswordInput', 'secret123');
  await page.locator('#btnAuthSubmit').click();

  const bird = page.locator('#mascotBird');
  await expect(bird).toBeVisible();
  await expect(bird).toHaveAttribute('data-species', 'bird');

  // Profil ekranından RoboBaykuş seçildiğinde Supabase PATCH gönderilir
  await page.locator('#btnMasterConsole').click();
  await page.locator('#btnOpenProfileScreen').click();
  await expect(page.locator('[data-role="profile-mascot-section"]')).toBeVisible();
  await expect(page.locator('.ps-mascot-card')).toHaveCount(5);
  await page.locator('.ps-mascot-card[data-mascot="owl"]').click();

  await expect(bird).toHaveAttribute('data-species', 'owl');
  await expect(page.locator('.ps-mascot-card[data-mascot="owl"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(() => mascotPatches.at(-1)).toBe('owl');

  // Mobil soru ekranında Robokuş alt çubuğa konar
  await page.locator('#btnCloseProfileScreen').click();
  await page.locator('[data-action="bottom-nav-questions"]').click();
  await expect(bird).toBeVisible();
  await expect(bird).toHaveAttribute('data-state', 'bar');

  const firstQuestion = page.locator('.booklet-question').first();
  await expect(firstQuestion).toBeVisible();
  const firstChoice = firstQuestion.locator('.optical-choice-row').first();
  await firstChoice.click();
  await page.waitForTimeout(350);
  await firstChoice.click();

  // Akıllı Tahtada uçan maskot görünmeye devam eder; ana sayfaya dönünce tahta kapanır
  await firstQuestion.locator('[data-action="toggle-question-features"]').click();
  await firstQuestion.locator('[data-action="open-board-focus"]').click();
  await expect(page.locator('#boardSpaceOverlay')).toBeVisible();
  await expect(bird).toBeVisible();

  await page.locator('[data-action="welcome-home"]').click();
  await expect(page.locator('#boardSpaceOverlay')).toBeHidden();

  // Profilden Drone seçilince rotorlu drone maskotuna geçer
  await page.locator('#btnMasterConsole').click();
  await page.locator('#btnOpenProfileScreen').click();
  await page.locator('.ps-mascot-card[data-mascot="drone"]').click();
  await expect(bird).toHaveAttribute('data-species', 'drone');
  await expect(bird.locator('.mc-svg-drone .rb-rotor')).toHaveCount(2);
  await expect.poll(() => mascotPatches.at(-1)).toBe('drone');

  // Profilden Karga seçilince kargaya geçer
  await page.locator('.ps-mascot-card[data-mascot="raven"]').click();
  await expect(bird).toHaveAttribute('data-species', 'raven');
  await expect.poll(() => mascotPatches.at(-1)).toBe('raven');

  // Profilden Tavuk seçilince tavuğa döner
  await page.locator('.ps-mascot-card[data-mascot="bird"]').click();
  await expect(bird).toHaveAttribute('data-species', 'bird');
  await expect.poll(() => mascotPatches.at(-1)).toBe('bird');

  // Profilden "Gizle" seçilince maskot gizlenir
  await page.locator('.ps-mascot-card[data-mascot="none"]').click();
  await expect(bird).toBeHidden();
  await expect.poll(() => mascotPatches.at(-1)).toBe('none');
});

test('mobil dokunarak kaydırmada maskot alt çubukta sabit kalır', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await setupSignedInRoutes(context, 'bird');
  const page = await context.newPage();
  await page.goto('/');
  await page.fill('#authEmailInput', 'ali@example.com');
  await page.fill('#authPasswordInput', 'secret123');
  await page.locator('#btnAuthSubmit').click();
  await page.locator('[data-action="bottom-nav-questions"]').click();
  const bird = page.locator('#mascotBird');
  await expect(bird).toHaveAttribute('data-state', 'bar');
  await expect(bird).not.toHaveAttribute('data-flying', 'true', { timeout: 10000 });
  const before = await bird.boundingBox();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 700 }] });
  for (const y of [650, 550, 450, 350, 250]) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100);
  await page.waitForTimeout(500);
  const after = await bird.boundingBox();
  expect(Math.abs(after.y - before.y)).toBeLessThan(2);
  await expect(bird).not.toHaveAttribute('data-flying', 'true');
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 200 }] });
  for (const y of [250, 350, 450, 550, 700]) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(400);
  await page.waitForTimeout(500);
  const returned = await bird.boundingBox();
  expect(Math.abs(returned.y - before.y)).toBeLessThan(2);
  await expect(bird).not.toHaveAttribute('data-flying', 'true');
  await context.close();
});
