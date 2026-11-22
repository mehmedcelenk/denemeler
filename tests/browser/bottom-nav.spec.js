import { test, expect } from '@playwright/test';
import { isolateRemoteData } from './fixtures/network.js';
import { createClassroomServer } from './fixtures/classroom.js';

async function openGuestBooklet(page) {
  await isolateRemoteData(page);
  await page.goto('/');
  await page.locator('[data-action="welcome-enter-guest"]').click();
  await page.locator('#btnBottomQuestions').click();
  await expect(page.locator('.booklet-question').first()).toBeVisible();
  await page.locator('#topCenterBadge').click();
  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);
  await page.locator('.btn-close-drawer[data-action="close-subject-drawer"]').click();
}

async function expectNavFits(page) {
  const boxes = await page.locator('.bottom-navigation > :visible').evaluateAll(elements =>
    elements.map(element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, right: rect.right, width: rect.width };
    }),
  );
  const width = page.viewportSize().width;
  expect(boxes.every(box => box.left >= 0 && box.right <= width && box.width >= 44)).toBe(true);
  for (let index = 1; index < boxes.length; index++) {
    expect(boxes[index].left).toBeGreaterThanOrEqual(boxes[index - 1].right);
  }
}

test('alt çubuk dar ekranda mevcut ders, filtre ve menü akışlarını sunar', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await openGuestBooklet(page);

  const nav = page.locator('.bottom-navigation');
  await expect(nav.locator('[data-action="welcome-home"]')).toBeVisible();
  await expect(nav.locator('#btnBottomQuestions')).toBeVisible();
  await expect(page.locator('.top-center-badge-container #topCenterBadge')).toBeVisible();
  await expect(nav.locator('#btnUnifiedTrigger')).toBeVisible();
  await expect(nav.locator('#btnMasterConsole')).toBeVisible();
  await expect(nav.locator('#topRoomPill')).toBeHidden();
  await expect(page.locator('.top-center-badge-container #streakCountDisplay')).toBeVisible();
  await expectNavFits(page);

  await nav.locator('#btnBottomQuestions').click();
  await expect(page.locator('.booklet-question').first()).toBeVisible();

  await page.locator('#topCenterBadge').click();
  await expect(page.locator('#drawerOverlay')).toHaveClass(/open/);
  await page.locator('.btn-close-drawer[data-action="close-subject-drawer"]').click();

  const trigger = page.locator('#btnUnifiedTrigger');
  await trigger.click();
  await expect(page.locator('#unifiedDropdownMenu')).toHaveClass(/is-open/);
  await expect(page.locator('#studyModeChipsBar')).toBeHidden();
  await page.locator('#btnUnifiedRematch').click();
  await expect(trigger).toHaveAttribute('data-mode', 'rematch');
  await trigger.click();
  await expect(page.locator('#btnUnifiedRematch')).toHaveClass(/is-selected/);
  await page.locator('#btnUnifiedInstitution').click();
  await expect(trigger).toHaveAttribute('data-mode', 'institution');

  const menu = page.locator('#btnMasterConsole');
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('[data-action="open-pdf-dialog"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveAttribute('aria-expanded', 'false');
  await page.emulateMedia({ media: 'print' });
  await expect(nav).toBeHidden();
});

test('tahtadan ana sayfaya geçiş tahtayı kapatır', async ({ page }) => {
  await openGuestBooklet(page);
  const card = page.locator('#bookletPagesContainer .booklet-question').first();
  await card.locator('[data-action="toggle-question-features"]').click();
  await card.locator('[data-action="open-board-focus"]').click();
  await expect(page.locator('#boardSpaceOverlay')).toBeVisible();
  await page.locator('.bottom-navigation [data-action="welcome-home"]').click();
  await expect(page.locator('#welcomePortal')).toBeVisible();
  await expect(page.locator('#boardSpaceOverlay')).toBeHidden();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
});

async function openTeam(page) {
  await page.locator('#btnMasterConsole').click();
  await page.locator('#btnWelcomeTeamToggle').click();
}

async function openRoomDrawer(page) {
  await page.locator('#btnMasterConsole').click();
  await page.locator('.console-nav-room-panel').click();
}

test('ana sayfa açık odayı korur ve yeniden katılmadan odaya döner', async ({ context, page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  const teacher = { id: '00000000-0000-4000-8000-000000000001', name: 'Öğretmen' };
  const server = createClassroomServer();
  await server.install(context, teacher);
  await page.goto('/');
  await openTeam(page);
  await page.locator('#welcomeRoomId').fill('12-A');
  await page.locator('[data-action="welcome-join-room"]').click();
  const roomButton = page.locator('#topRoomPill');
  await expect(page.locator('#btnMasterConsole')).toHaveClass(/is-in-room/);
  await expect(roomButton).toHaveAttribute('data-role', 'host');
  await expectNavFits(page);

  await page.locator('.bottom-navigation [data-action="welcome-home"]').click();
  await expect(page.locator('#welcomePortal')).toBeVisible();
  await expect(page.locator('#btnMasterConsole')).toHaveClass(/is-in-room/);
  await page.locator('#btnBottomQuestions').click();
  await expect(page.locator('#welcomePortal')).toBeHidden();
  await expect(roomButton).toHaveAttribute('data-role', 'host');
  expect(server.requests.filter(request => request.rpc === 'join_or_create_room')).toHaveLength(1);
  expect(server.requests.filter(request => request.rpc === 'leave_room')).toHaveLength(0);
  expect([...server.rooms.values()][0].members.get(teacher.id).left).toBe(false);

  await openRoomDrawer(page);
  await expect(page.locator('#teacherDrawerOverlay')).toBeVisible();
  await page.locator('[data-action="close-teacher-drawer"]').click();
  await page.locator('#btnUnifiedTrigger').click();
  await page.locator('#btnUnifiedRoom').click();
  await expect(page.locator('#btnUnifiedTrigger')).toHaveAttribute('data-mode', 'room');
});

test('katılımcı ana sayfadan odasına döndüğünde bağlantısı korunur', async ({ browser, context, page }) => {
  const teacher = { id: '00000000-0000-4000-8000-000000000001', name: 'Öğretmen' };
  const student = { id: '00000000-0000-4000-8000-000000000002', name: 'Öğrenci' };
  const server = createClassroomServer();
  const studentContext = await browser.newContext();
  await server.install(context, teacher);
  await server.install(studentContext, student);
  const studentPage = await studentContext.newPage();
  try {
    for (const currentPage of [page, studentPage]) {
      await currentPage.goto('/');
      await openTeam(currentPage);
      await currentPage.locator('#welcomeRoomId').fill('12-A');
      await currentPage.locator('[data-action="welcome-join-room"]').click();
      await expect(currentPage.locator('#btnMasterConsole')).toHaveClass(/is-in-room/);
    }
    await expect(studentPage.locator('#topRoomPill')).toHaveAttribute('data-role', 'participant');
    await studentPage.locator('.bottom-navigation [data-action="welcome-home"]').click();
    await expect(studentPage.locator('#btnMasterConsole')).toHaveClass(/is-in-room/);
    await studentPage.locator('#btnBottomQuestions').click();
    await expect(studentPage.locator('#welcomePortal')).toBeHidden();
    await expect(studentPage.locator('#topRoomPill')).toHaveAttribute('data-role', 'participant');
    expect(server.requests.filter(request => request.userId === student.id && request.rpc === 'leave_room')).toHaveLength(0);
    expect(server.requests.filter(request => request.userId === student.id && request.rpc === 'join_or_create_room')).toHaveLength(1);
    await openRoomDrawer(studentPage);
    await expect(studentPage.locator('#studentDrawerOverlay')).toBeVisible();
  } finally {
    await studentContext.close();
  }
});

test('başarısız oda girişinden sonra oturum düğmesi görünmez', async ({ context, page }) => {
  const server = createClassroomServer();
  await server.install(context, { id: '00000000-0000-4000-8000-000000000001', name: 'Öğretmen' });
  server.failJoin(true);
  await page.goto('/');
  await openTeam(page);
  await page.locator('#welcomeRoomId').fill('12-A');
  await page.locator('[data-action="welcome-join-room"]').click();
  await expect(page.locator('#welcomeFormError')).not.toBeEmpty();
  await page.locator('#welcomeRoomId').press('Escape');
  await expect(page.locator('#teamQuickModal')).toBeHidden();
  await page.locator('#btnBottomQuestions').click();
  await expect(page.locator('.booklet-question').first()).toBeVisible();
  await expect(page.locator('#btnMasterConsole')).not.toHaveClass(/is-in-room/);
});

test('sonlandırılan bağlantının hatası gösterilir ve oturum düğmesi kaldırılır', async ({ context, page }) => {
  const teacher = { id: '00000000-0000-4000-8000-000000000001', name: 'Öğretmen' };
  const server = createClassroomServer();
  await server.install(context, teacher);
  await page.goto('/');
  await openTeam(page);
  await page.locator('#welcomeRoomId').fill('12-A');
  await page.locator('[data-action="welcome-join-room"]').click();
  await expect(page.locator('#btnMasterConsole')).toHaveClass(/is-in-room/);

  const room = [...server.rooms.values()][0];
  room.members.get(teacher.id).connectionId = 'replaced-connection';
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.locator('#btnMasterConsole')).not.toHaveClass(/is-in-room/, { timeout: 10000 });
  await expect(page.locator('.room-toast-card')).toContainText('Sınıf bağlantınız başka bir oturumla değiştirilmiş');
});
