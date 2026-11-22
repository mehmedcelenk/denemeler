import { test, expect } from '@playwright/test';
import { createClassroomServer, setPageVisibility } from './fixtures/classroom.js';

const teacher = { id: '00000000-0000-4000-8000-000000000001', name: 'Öğretmen' };
const student = { id: '00000000-0000-4000-8000-000000000002', name: 'Öğrenci' };

async function openTeam(page) {
  await page.locator('#btnMasterConsole').click();
  await page.locator('#btnWelcomeTeamToggle').click();
}

async function openRoomDrawer(page) {
  await page.locator('#btnMasterConsole').click();
  await page.locator('.console-nav-room-panel').click();
}

async function join(page, name = '12-A') {
  await page.goto('/');
  await openTeam(page);
  await page.locator('#welcomeRoomId').fill(name);
  await page.locator('[data-action="welcome-join-room"]').click();
  await expect(page.locator('#welcomePortal')).toBeHidden();
  await expect(page.locator('#btnMasterConsole')).toHaveClass(/is-in-room/);
  await expect(page.locator('#topRoomPill')).toContainText(name);
}

test('kur/katıl sunucu yanıtını bekler; hata halinde giriş ekranı açık kalır', async ({ context, page }) => {
  const server = createClassroomServer();
  await server.install(context, teacher);
  const release = server.holdJoin();
  await page.goto('/');
  await openTeam(page);
  await page.locator('#welcomeRoomId').fill('12-A');
  await page.locator('[data-action="welcome-join-room"]').click();
  await expect.poll(() => server.requests.filter(r => r.rpc === 'join_or_create_room').length).toBe(1);
  await expect(page.locator('#welcomePortal')).toBeVisible();
  server.failJoin(true);
  release();
  await expect(page.locator('#welcomeFormError')).not.toBeEmpty();
  await expect(page.locator('#welcomePortal')).toBeVisible();
  await expect(page.locator('#btnMasterConsole')).not.toHaveClass(/is-in-room/);
  server.failJoin(false);
  await page.locator('[data-action="welcome-join-room"]').click();
  await expect(page.locator('#welcomePortal')).toBeHidden();
});

test('iki hesap aynı odada farklı rolleri alır; duyuru ve yenileme rolü korur', async ({ browser, context, page }) => {
  const server = createClassroomServer();
  const studentContext = await browser.newContext();
  await server.install(context, teacher);
  await server.install(studentContext, student);
  const studentPage = await studentContext.newPage();
  try {
    await join(page);
    await join(studentPage);
    expect(server.rooms.size).toBe(1);
    expect([...server.rooms.values()][0].hostId).toBe(teacher.id);
    await expect(page.locator('#topRoomPill')).toHaveAttribute('data-role', 'host');
    await expect(studentPage.locator('#topRoomPill')).toHaveAttribute('data-role', 'participant');

    await openRoomDrawer(page);
    await expect(page.locator('#teacherDrawerOverlay')).toBeVisible();
    await openRoomDrawer(studentPage);
    await expect(studentPage.locator('#studentDrawerOverlay')).toBeVisible();
    await expect(studentPage.locator('#teacherDrawerOverlay')).toBeHidden();

    await page.locator('#inputBroadcastMsg').fill('Son beş dakika.');
    await page.locator('[data-action="send-broadcast-message"]').click();
    await expect(studentPage.locator('#studentDrawerOverlay')).toContainText('Son beş dakika.', { timeout: 10000 });

    await page.reload();
    await expect(page.locator('#welcomePortal')).toBeHidden();
    await openRoomDrawer(page);
    await expect(page.locator('#teacherDrawerOverlay')).toBeVisible();
    expect([...server.rooms.values()][0].hostId).toBe(teacher.id);

    page.once('dialog', dialog => dialog.accept());
    await page.locator('[data-action="close-room-globally"]').click();
    await expect(studentPage.locator('#btnMasterConsole')).not.toHaveClass(/is-in-room/, { timeout: 10000 });
    expect([...server.rooms.values()][0].closed).toBe(true);
  } finally {
    await studentContext.close();
  }
});

test('aynı anda giren iki hesap sunucunun tek host kararını kullanır', async ({ browser, context, page }) => {
  const server = createClassroomServer();
  const secondContext = await browser.newContext();
  await server.install(context, teacher);
  await server.install(secondContext, student);
  const second = await secondContext.newPage();
  const release = server.holdJoin();
  try {
    await Promise.all([page.goto('/'), second.goto('/')]);
    await Promise.all([openTeam(page), openTeam(second)]);
    await Promise.all([page.locator('#welcomeRoomId').fill('12-A'), second.locator('#welcomeRoomId').fill('12-A')]);
    await Promise.all([page.locator('[data-action="welcome-join-room"]').click(),
      second.locator('[data-action="welcome-join-room"]').click()]);
    await expect.poll(() => server.requests.filter(r => r.rpc === 'join_or_create_room').length).toBe(2);
    release();
    await expect(page.locator('#welcomePortal')).toBeHidden();
    await expect(second.locator('#welcomePortal')).toBeHidden();
    const roles = await Promise.all([page.locator('#topRoomPill').getAttribute('data-role'),
      second.locator('#topRoomPill').getAttribute('data-role')]);
    expect(roles.sort()).toEqual(['host', 'participant']);
    for (const request of server.requests.filter(r => r.rpc === 'join_or_create_room')) {
      expect(request.body).not.toHaveProperty('isHost');
      expect(request.body).not.toHaveProperty('asHost');
    }
  } finally {
    release();
    await secondContext.close();
  }
});

test('ikinci sekme mevcut sınıf bağlantısını sessizce devralamaz', async ({ context, page }) => {
  const server = createClassroomServer();
  await server.install(context, teacher);
  await join(page);
  const second = await context.newPage();
  await second.goto('/');
  await openTeam(second);
  await second.locator('#welcomeRoomId').fill('12-A');
  await second.locator('[data-action="welcome-join-room"]').click();
  await expect(second.locator('#welcomeFormError')).toContainText('başka bir sekmede');
  await expect(second.locator('#welcomePortal')).toBeVisible();
  await expect(page.locator('#topRoomPill')).toHaveAttribute('data-role', 'host');
});

test('bağlantı hatası görünür ve bağlantı dönünce otomatik toparlanır', async ({ context, page }) => {
  const server = createClassroomServer();
  await server.install(context, teacher);
  await join(page);
  server.offline.add(teacher.id);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.locator('#topRoomPill')).toHaveAttribute('data-connection', 'reconnecting');
  await openRoomDrawer(page);
  await expect(page.locator('#teacherDrawerOverlay [data-role="room-error"]')).not.toBeEmpty();
  server.offline.delete(teacher.id);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.locator('#topRoomPill')).toHaveAttribute('data-connection', 'connected');
});

test('öğrencinin onaylı cevabı değişmez ve öğretmen özeti bir kez sayar', async ({ browser, context, page }) => {
  const server = createClassroomServer();
  const studentContext = await browser.newContext();
  await server.install(context, teacher);
  await server.install(studentContext, student);
  const studentPage = await studentContext.newPage();
  try {
    await join(page);
    await join(studentPage);
    const room = [...server.rooms.values()][0];
    const card = studentPage.locator('#bookletPagesContainer .booklet-question:not(.is-passive-question)').first();
    const qid = await card.getAttribute('data-qid');
    const correct = await card.getAttribute('data-correct');
    const choice = card.locator(`.optical-choice-row[data-letter="${correct}"]`);
    await studentPage.waitForTimeout(1150);
    await choice.click();
    await studentPage.waitForTimeout(400);
    await choice.click();
    await expect.poll(() => room.members.get(student.id).answers[qid]).toBe(true);
    await openRoomDrawer(page);
    await expect(page.locator(`[data-student-id="${student.id}"] .stat-correct`)).toHaveText('1 doğru');
    await studentPage.waitForTimeout(400);
    await choice.click();
    await studentPage.waitForTimeout(400);
    const other = card.locator(`.optical-choice-row:not([data-letter="${correct}"])`).first();
    await other.click();
    await studentPage.waitForTimeout(400);
    await other.click();
    await expect(card).toHaveAttribute('data-user-mark', correct);
    await expect(card).toHaveAttribute('data-user-status', 'correct');
    expect(room.members.get(student.id).answers[qid]).toBe(true);
    await expect(page.locator(`[data-student-id="${student.id}"] .stat-correct`)).toHaveText('1 doğru');
    await expect(page.locator(`[data-student-id="${student.id}"] .stat-incorrect`)).toHaveText('0 yanlış');
  } finally {
    await studentContext.close();
  }
});

test('arka plandaki heartbeat dönüş sayılmaz; görünürlük yalnız bir geçiş üretir', async ({ browser, context, page }) => {
  const server = createClassroomServer();
  const studentContext = await browser.newContext();
  await server.install(context, teacher);
  await server.install(studentContext, student);
  const studentPage = await studentContext.newPage();
  try {
    await join(page);
    await join(studentPage);
    const room = [...server.rooms.values()][0];
    await setPageVisibility(studentPage, false);
    await expect.poll(() => room.members.get(student.id).visible).toBe(false);
    const before = server.requests.filter(r => r.userId === student.id && r.rpc === 'update_room_member').length;
    await expect.poll(() => server.requests.filter(r => r.userId === student.id && r.rpc === 'update_room_member').length,
      { timeout: 10000 }).toBeGreaterThan(before);
    expect(room.events.filter(e => e.userId === student.id && e.type === 'RETURN')).toHaveLength(0);
    expect(room.events.filter(e => e.userId === student.id && e.type === 'AWAY')).toHaveLength(1);

    await setPageVisibility(studentPage, true);
    await expect.poll(() => room.events.filter(e => e.userId === student.id && e.type === 'RETURN').length).toBe(1);
    await setPageVisibility(studentPage, true);
    await expect.poll(() => room.members.get(student.id).visible).toBe(true);
    expect(room.events.filter(e => e.userId === student.id && e.type === 'RETURN')).toHaveLength(1);
  } finally {
    await studentContext.close();
  }
});

test('öğretmen yüzden fazla yeni olayı otomatik sayfalayıp son yüzünü listeler', async ({ context, page }) => {
  const server = createClassroomServer();
  await server.install(context, teacher);
  await join(page);
  const room = [...server.rooms.values()][0];
  for (let i = 2; i <= 121; i++) {
    room.events.push({ id: String(i), type: 'AWAY', userId: `student-${i}`, name: `Öğrenci ${i}`, at: Date.now() });
  }
  await openRoomDrawer(page);
  await expect.poll(() => server.requests.filter(r => r.rpc === 'update_room_member').length,
    { timeout: 7000 }).toBeGreaterThanOrEqual(2);
  const updates = server.requests.filter(r => r.rpc === 'update_room_member');
  expect(updates[0].body.p_after_event).toBe('1');
  expect(updates[1].body.p_after_event).toBe('101');
  const rows = page.locator('#teacherExitLogsList [data-event-id]');
  await expect(rows).toHaveCount(100);
  await expect(rows.first()).toHaveAttribute('data-event-id', '121');
  await expect(rows.last()).toHaveAttribute('data-event-id', '22');
});
