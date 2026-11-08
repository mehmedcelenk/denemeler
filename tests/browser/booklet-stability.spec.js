import { test, expect } from '@playwright/test';
import { StorageKeys } from '../../src/shared/storage-keys.ts';

async function openSinglePlayer(page) {
  await page.goto('/');
  await page.locator('[data-action="welcome-start-single"]').click();
  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);
  await expect(page.locator('.booklet-question').first()).toBeVisible();
  await page.locator('.btn-close-drawer[data-action="close-subject-drawer"]').click();
}

test('sanal sayfalama ilk açılışta 20 soru basar, kaydırınca devamını ekler', async ({ page }) => {
  await openSinglePlayer(page);
  await page.locator('#topCenterBadge').click();
  await page.locator('#btnLoadAllTopics').click();

  await expect(page.locator('#bookletPagesContainer .booklet-question')).toHaveCount(20);
  await expect(page.locator('#bookletLoadSentinel')).toBeVisible();
  await expect(page.locator('#bookletLoadSentinel')).toContainText('20 /');

  await page.locator('#bookletLoadSentinel').scrollIntoViewIfNeeded();
  await expect.poll(
    () => page.locator('#bookletPagesContainer .booklet-question').count(),
  ).toBeGreaterThan(20);
});

test('düzen değişimi fosforlamayı silmez ve meal + çeviri dönüşünde meal korunur', async ({ page }) => {
  await openSinglePlayer(page);

  await page.evaluate(() => {
    const stem = document.querySelector('#bookletPagesContainer .booklet-question .q-stem-text');
    const walker = document.createTreeWalker(stem, NodeFilter.SHOW_TEXT);
    const firstText = walker.nextNode();
    const range = document.createRange();
    range.setStart(firstText, 0);
    range.setEnd(firstText, Math.min(8, firstText.data.length));
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  });

  await expect(page.locator('.selection-action-bubble .btn-hl-yellow')).toBeVisible();
  await page.locator('.selection-action-bubble .btn-hl-yellow').click();

  const initialMark = page.locator('#bookletPagesContainer .booklet-question .user-highlight').first();
  await expect(initialMark).toBeVisible();
  await initialMark.evaluate(el => { el.dataset.sameNodeProbe = 'kept'; });

  await page.locator('#btnMasterConsole').click();
  await page.locator('[data-action="cycle-column-count"]').click();
  await page.locator('[data-action="cycle-zoom-level"]').click();
  await page.locator('#btnMasterConsole').click();

  const survivedAttr = await page
    .locator('#bookletPagesContainer .booklet-question .user-highlight')
    .first()
    .getAttribute('data-same-node-probe');
  expect(survivedAttr).toBe('kept');

  // İngilizce dersine geç: Meal açıkken TR çeviri açıp kapatınca Meal korunmalı
  await page.locator('#topCenterBadge').click();
  await page.locator('#btnSubjectDropdownTrigger').click();
  await page.locator('.dropdown-menu-item').filter({ hasText: 'İngilizce' }).click();
  await page.locator('#btnLoadAllTopics').click();

  const engCard = page.locator('#bookletPagesContainer .booklet-question').first();
  await engCard.locator('[data-action="toggle-question-features"]').click();
  await engCard.locator('[data-action="toggle-question-meal"]').click();
  await expect(engCard).toHaveClass(/has-interlinear/);

  await engCard.locator('[data-action="toggle-question-translation"][data-lang="tr"]').click();
  await expect(engCard.locator('[data-role="stem"]')).toHaveAttribute('data-trans-lang', 'tr');
  await engCard.locator('[data-action="toggle-question-translation"][data-lang="tr"]').click();

  await expect(engCard).toHaveClass(/has-interlinear/);
  await expect(engCard.locator('ruby.interlinear-word').first()).toBeVisible();
});

test('akıllı tahta çakışan ID üretmez, fosforu ve işaretlemeyi kitapçıkla eşitler', async ({ page }) => {
  await openSinglePlayer(page);
  await page.evaluate(key => localStorage.removeItem(key), StorageKeys.ANSWER_LOCK_UNTIL);

  const firstCard = page.locator('#bookletPagesContainer .booklet-question').first();
  const firstQid = await firstCard.getAttribute('data-qid');

  // Kitapçıktaki ilk kartta fosforla
  await page.evaluate(() => {
    const stem = document.querySelector('#bookletPagesContainer .booklet-question .q-stem-text');
    const walker = document.createTreeWalker(stem, NodeFilter.SHOW_TEXT);
    const textNode = walker.nextNode();
    const range = document.createRange();
    range.setStart(textNode, 0);
    range.setEnd(textNode, Math.min(7, textNode.data.length));
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  });
  await page.locator('.selection-action-bubble .btn-hl-yellow').click();
  await expect(firstCard.locator('.user-highlight')).toHaveCount(1);

  // Akıllı Tahtayı aç
  await firstCard.locator('[data-action="toggle-question-features"]').click();
  await firstCard.locator('[data-action="open-board-focus"]').click();
  await expect(page.locator('#boardSpaceOverlay')).toBeVisible();

  const boardCard = page.locator(`#boardQuestionStage .booklet-question[data-qid="${firstQid}"]`);
  await expect(boardCard).toBeVisible();
  await expect(boardCard.locator('.user-highlight')).toHaveCount(1);

  // Sayfada hiçbir ID yinelenmemeli
  const duplicateIds = await page.evaluate(() => {
    const counts = new Map();
    document.querySelectorAll('[id]').forEach(el => {
      if (!el.id) return;
      counts.set(el.id, (counts.get(el.id) || 0) + 1);
    });
    return Array.from(counts.entries()).filter(([, c]) => c > 1);
  });
  expect(duplicateIds).toEqual([]);

  // Minimum okuma süresini bekleyip Akıllı Tahtada şık işaretle
  await page.waitForTimeout(1150);
  const boardOption = boardCard.locator('.optical-choice-row').first();
  const optLetter = await boardOption.getAttribute('data-letter');
  await boardOption.click();
  await expect(boardOption).toHaveClass(/marked/);
  await boardOption.click();

  await expect(page.locator('#activeExplanationBubble')).toBeVisible();
  const zCheck = await page.evaluate(() => {
    const bubble = document.getElementById('activeExplanationBubble');
    const overlay = document.getElementById('boardSpaceOverlay');
    return {
      bubbleZ: Number(getComputedStyle(bubble).zIndex),
      overlayZ: Number(getComputedStyle(overlay).zIndex),
    };
  });
  expect(zCheck.bubbleZ).toBeGreaterThan(zCheck.overlayZ);

  // Arka plandaki kitapçık kartı da işaretli olmalı
  await expect(
    firstCard.locator(`.optical-choice-row[data-letter="${optLetter}"]`),
  ).toHaveClass(/marked/);

  // İleri ok ile sayfa parçası ötesine (22. soruya) geç ve kapatınca kitapçıkta render edildiğini doğrula
  await page.locator('#boardSpaceOverlay').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#activeExplanationBubble')).toHaveCount(0);
  for (let i = 0; i < 20; i += 1) {
    await page.keyboard.press('ArrowRight');
  }
  const boardQidAfter20 = await page
    .locator('#boardQuestionStage .booklet-question')
    .getAttribute('data-qid');
  await page.keyboard.press('Escape');
  await expect(page.locator('#boardSpaceOverlay')).toBeHidden();
  await expect(
    page.locator(`#bookletPagesContainer .booklet-question[data-qid="${boardQidAfter20}"]`),
  ).toBeAttached();
});

test('yazdırma öncesi kalan tüm sorular DOM içine tamamlanır', async ({ page }) => {
  await openSinglePlayer(page);
  await page.locator('#topCenterBadge').click();
  await page.locator('#btnLoadAllTopics').click();

  await expect(page.locator('#bookletPagesContainer .booklet-question')).toHaveCount(20);
  await page.evaluate(() => { window.print = () => {}; });
  await page.locator('#btnMasterConsole').click();
  await page.locator('[data-action="open-pdf-dialog"]').click();
  await page.locator('[data-action="execute-pdf-print"]').click();

  await expect.poll(
    () => page.locator('#bookletPagesContainer .booklet-question').count(),
  ).toBeGreaterThan(20);
});
