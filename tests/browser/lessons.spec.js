import { test, expect } from '@playwright/test';
import { isolateRemoteData } from './fixtures/network.js';
import { StorageKeys } from '../../src/shared/storage-keys.ts';

const TEST_AUTH_SESSION = JSON.stringify({
  accessToken: 'e2e-lesson-token',
  refreshToken: 'e2e-lesson-refresh',
  expiresAt: Math.floor(Date.now() / 1000) + 86400,
  user: { id: 'e2e-lesson-user', email: 'hoca@cenks.test', username: 'hoca', displayName: 'HocaTest' },
});

function buildMockLesson(questionId, subject = 'TDE') {
  return {
    questionId,
    subject,
    title: 'Tanzimat İlklerini Tek Bakışta Yakala',
    explanation: '1860’ta İstanbul’da gazete ve tiyatro sahneye çıkınca Tanzimat Edebiyatı başladı; klasik şiirin yanına Batılı tür örnekleri yerleşti.\n\nSoru kökündeki ilk roman, tiyatro ve gazete vurgusu doğrudan bu yenileşme dönemini işaret eder; klasik divan geleneğine kaymak sorudaki asıl tuzaktır.',
    ezber: {
      rhyme: 'Kalem sokağa indi, açıldı yeni kapı,\nİlk roman, ilk gazete kurdu Tanzimat yapı.',
    },
    concepts: [
      {
        term: 'Tanzimat Edebiyatı',
        definition: 'Edebiyatımızın Batı’daki yeni türlerle tanışıp topluma seslenmeye başladığı yenileşme dönemidir.',
        example: 'Şinasi’nin Şair Evlenmesi bu dönemin ilk tiyatro örneğidir.',
        emoji: '🎭',
      },
      {
        term: 'Batılı tür',
        definition: 'Klasik divan nazmı dışında Avrupa edebiyatından uyarlanan roman, hikâye ve tiyatro gibi yazı biçimleridir.',
        emoji: '📘',
      },
    ],
    model: 'deepseek-v4.1-flash',
    version: 3,
  };
}

test.beforeEach(async ({ page }) => {
  await isolateRemoteData(page);
  await page.addInitScript(({ authKey, sessionJson }) => {
    if (!localStorage.getItem(authKey)) localStorage.setItem(authKey, sessionJson);
  }, { authKey: StorageKeys.AUTH_SESSION, sessionJson: TEST_AUTH_SESSION });
});

async function openTdeBooklet(page) {
  await page.goto('/');
  await page.locator('#btnBottomQuestions').click();
  await expect(page.locator('.booklet-question').first()).toBeVisible();
}

async function answer(card, correct = true) {
  const right = await card.getAttribute('data-correct');
  const row = correct
    ? card.locator(`[data-action="select-optical-choice"][data-letter="${right}"]`)
    : card.locator(`[data-action="select-optical-choice"]:not([data-letter="${right}"])`).first();
  await row.click();
  await card.page().waitForTimeout(350);
  await row.click();
}

test('mobil görünümde Hoca Anlatımı soru altında sade inline açılır, metin içi kavram balonu çalışır', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  let mockLessonId = null;
  await page.route('**/data/lessons/TDE.json', async route => {
    const body = mockLessonId ? [buildMockLesson(mockLessonId, 'TDE')] : [];
    await route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: JSON.stringify(body),
    });
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await openTdeBooklet(page);

  const firstCard = page.locator('.booklet-question:not(.is-passive-question)').first();
  const secondCard = page.locator('.booklet-question:not(.is-passive-question)').nth(1);
  const firstQid = Number(await firstCard.getAttribute('data-qid'));
  expect(firstQid).toBeGreaterThan(0);

  mockLessonId = firstQid;
  await page.reload();
  await page.locator('#btnBottomQuestions').click();
  await expect(page.locator('.booklet-question').first()).toBeVisible();

  const targetCard = page.locator(`.booklet-question[data-qid="${firstQid}"]`);
  await targetCard.locator('[data-action="toggle-question-features"]').click();

  const lessonBtn = targetCard.locator('[data-action="open-question-lesson"]');
  await expect(lessonBtn).toHaveCount(0);
  await answer(targetCard);
  await expect(lessonBtn).toBeVisible();
  await expect(lessonBtn).toContainText('İHÖ');
  await expect(targetCard.locator('[data-role="lesson-inline-panel"]')).toHaveCount(0);
  await expect(lessonBtn).toHaveClass(/is-ready/);
  await lessonBtn.click();

  // Ayrı modal açılmamalı, sade panel doğrudan soru kartının altında yer almalı
  await expect(page.locator('#questionLessonDialog')).toHaveCount(0);
  const panel = targetCard.locator('[data-role="lesson-inline-panel"]');
  await expect(panel).toBeVisible();
  await expect(panel.locator('.lesson-inline-title')).toContainText('Tanzimat İlklerini');
  await expect(panel.locator('.lesson-trick-card')).toContainText('Öğrenmenin Küçük Bir Hilesi');
  await expect(panel.locator('.lesson-ezber-box')).toHaveCount(0);
  await expect(panel.locator('[data-role="lesson-visual"]')).toHaveCount(0);
  await expect(panel.locator('.lesson-minigame-card')).toHaveCount(0);
  await expect(panel.locator('.lesson-notebook-card')).toHaveCount(0);

  // Mobilde yatay taşma olmamalı
  const overflowX = await panel.evaluate(el => el.scrollWidth - el.clientWidth);
  expect(overflowX).toBeLessThanOrEqual(2);

  // Metin içi kavram kelimesine tıklayınca tanım baloncuğu açılmalı ve ekrandan taşmamalı
  const conceptBtn = panel.locator('.lesson-concept-word').first();
  await expect(conceptBtn).toBeVisible();
  await conceptBtn.click();
  const bubble = page.locator('.lesson-concept-bubble');
  await expect(bubble).toBeVisible();
  const bubbleRect = await bubble.evaluate(el => {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, vw: window.innerWidth };
  });
  expect(bubbleRect.left).toBeGreaterThanOrEqual(0);
  expect(bubbleRect.right).toBeLessThanOrEqual(bubbleRect.vw + 1);

  // Balon açıkken dahi kapatma butonu engellenmeden tıklanabilmeli
  await panel.locator('[data-lesson-close]').click();
  await expect(panel).toHaveCount(0);
  await expect(bubble).toHaveCount(0);

  // Anlatımı henüz olmayan ikinci soruda zarif inline boş durum açılmalı
  await secondCard.locator('[data-action="toggle-question-features"]').click();
  await page.waitForTimeout(1250);
  await answer(secondCard);
  await secondCard.locator('[data-action="open-question-lesson"]').click();
  const emptyPanel = secondCard.locator('[data-role="lesson-inline-panel"]');
  await expect(emptyPanel).toBeVisible();
  await expect(emptyPanel).toContainText('anlatım hazırlanıyor');
  await secondCard.locator('[data-action="open-question-lesson"]').click();
  await expect(emptyPanel).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('gerçek MAT ve TDE EVREN pilot anlatımları masaüstü ve mobilde soru altında KaTeX hatasız çalışır', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.setViewportSize({ width: 1280, height: 800 });
  await openTdeBooklet(page);

  const firstTdeCard = page.locator('.booklet-question:not(.is-passive-question)').first();
  await firstTdeCard.locator('[data-action="toggle-question-features"]').click();
  await answer(firstTdeCard);
  const tdeLessonBtn = firstTdeCard.locator('[data-action="open-question-lesson"]');
  await expect(tdeLessonBtn).toHaveClass(/is-ready/, { timeout: 10000 });
  await tdeLessonBtn.click();

  const tdePanel = firstTdeCard.locator('[data-role="lesson-inline-panel"]');
  await expect(tdePanel).toBeVisible();
  await expect(tdePanel.locator('.lesson-trick-card')).toBeVisible();
  await expect(tdePanel.locator('[data-role="lesson-visual"]')).toHaveCount(0);
  await expect(tdePanel.locator('.lesson-concept-word').first()).toBeVisible();
  await tdePanel.locator('[data-lesson-close]').click();
  await expect(tdePanel).toHaveCount(0);

  // Mobilde MAT dersine geçip gerçek KaTeX'li EVREN v5 Pareto anlatımını aç
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#topCenterBadge').click();
  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);
  await page.locator('#btnSubjectDropdownTrigger').click();
  await page.locator('.dropdown-menu-item').filter({ hasText: 'Matematik' }).first().click();
  await page.locator('#btnLoadAllTopics').click();

  const firstMatCard = page.locator('.booklet-question[data-qid="1046"]');
  await expect(firstMatCard).toBeVisible({ timeout: 10000 });
  await firstMatCard.locator('[data-action="toggle-question-features"]').click();
  await page.waitForTimeout(1250);
  await answer(firstMatCard);
  const matLessonBtn = firstMatCard.locator('[data-action="open-question-lesson"]');
  await expect(matLessonBtn).toHaveClass(/is-ready/, { timeout: 10000 });
  await matLessonBtn.click();

  const matPanel = firstMatCard.locator('[data-role="lesson-inline-panel"]');
  await expect(matPanel).toBeVisible();
  await expect(matPanel.locator('.lesson-explanation-block')).toBeVisible();
  await expect(matPanel.locator('.katex-error')).toHaveCount(0);
  await expect(matPanel.locator('.lesson-trick-card')).toContainText('ağırlığı basmaya devam et');
  await expect(matPanel.locator('[data-role="lesson-visual"]')).toHaveCount(0);
  await expect(matPanel.locator('.lesson-ezber-box')).toHaveCount(0);

  const mobileOverflow = await matPanel.evaluate(el => el.scrollWidth - el.clientWidth);
  expect(mobileOverflow).toBeLessThanOrEqual(2);

  await matPanel.locator('.lesson-concept-word').first().click();
  await expect(page.locator('.lesson-concept-bubble')).toBeVisible();
  await matPanel.locator('[data-lesson-close]').click();
  await expect(matPanel).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('İHÖ yanlış cevapta açılır, yenilemede kapalı kalır ve cevaplar temizlenince gizlenir', async ({ page }) => {
  await openTdeBooklet(page);
  const card = page.locator('.booklet-question:not(.is-passive-question)').first();
  const qid = await card.getAttribute('data-qid');
  await card.locator('[data-action="toggle-question-features"]').click();
  const button = card.locator('[data-action="open-question-lesson"]');
  await expect(button).toHaveCount(0);
  const correct = await card.getAttribute('data-correct');
  const wrong = card.locator(`[data-action="select-optical-choice"]:not([data-letter="${correct}"])`).first();
  await wrong.click();
  await expect(button).toHaveCount(0);
  await page.waitForTimeout(350);
  await wrong.click();
  await expect(button).toBeVisible();
  await expect(card.locator('[data-role="lesson-inline-panel"]')).toBeVisible();
  await page.reload();
  await page.locator('#btnBottomQuestions').click();
  const restored = page.locator(`.booklet-question[data-qid="${qid}"]`);
  await restored.locator('[data-action="toggle-question-features"]').click();
  await expect(restored.locator('[data-action="open-question-lesson"]')).toBeVisible();
  await expect(restored.locator('[data-role="lesson-inline-panel"]')).toHaveCount(0);
  await restored.locator('[data-action="open-question-lesson"]').click();
  await expect(restored.locator('[data-role="lesson-inline-panel"]')).toBeVisible();
  await page.evaluate(() => {
    const trigger = document.createElement('button');
    trigger.dataset.action = 'clear-all-marks';
    document.body.append(trigger);
    trigger.click();
    trigger.remove();
  });
  await expect(restored.locator('[data-action="open-question-lesson"]')).toHaveCount(0);
  await expect(restored.locator('[data-role="lesson-inline-panel"]')).toHaveCount(0);
});
