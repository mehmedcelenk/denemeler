import { test, expect } from '@playwright/test';
import { StorageKeys, progressStorageKey } from '../../src/shared/storage-keys.ts';
import { isolateRemoteData } from './fixtures/network.js';

async function server(context) {
  await isolateRemoteData(context);
  const rows = new Map();
  const writes = [];
  const authRequests = [];
  let readGate = null;
  let authGate = null;
  await context.route('**/auth/v1/**', async route => {
    authRequests.push(route.request().url());
    if (route.request().url().includes('/logout')) return route.fulfill({ status: 204 });
    const { email } = route.request().postDataJSON();
    const id = email.split('@')[0];
    if (authGate) {
      const gate = authGate;
      authGate = null;
      gate.started();
      await gate.wait;
    }
    return route.fulfill({ json: {
      access_token: `token-${id}`, refresh_token: `refresh-${id}`, expires_in: 86400,
      user: { id, email, user_metadata: { username: id } },
    } });
  });
  await context.route('**/rest/v1/user_progress**', async route => {
    if (route.request().method() === 'POST') {
      const row = route.request().postDataJSON();
      writes.push(row);
      rows.set(row.user_id, row);
      return route.fulfill({ status: 201, body: '' });
    }
    const id = new URL(route.request().url()).searchParams.get('user_id').slice(3);
    const snapshot = rows.get(id);
    if (readGate) {
      const gate = readGate;
      readGate = null;
      gate.started();
      await gate.wait;
    }
    await route.fulfill({ json: snapshot ? [snapshot] : [] }).catch(() => {});
  });
  context.on('request', request => {
    if (request.method() !== 'GET' && request.url().includes('/rest/v1/rpc/')
      && !request.url().endsWith('/get_institution_question_stats')) {
      writes.push({ rpc: request.url(), body: request.postDataJSON() });
    }
  });
  return {
    rows, writes, authRequests,
    holdAuth() {
      let release;
      let started;
      const requested = new Promise(resolve => { started = resolve; });
      authGate = { started, wait: new Promise(resolve => { release = resolve; }) };
      return { requested, release: () => release() };
    },
    holdRead() {
      let release;
      let started;
      const requested = new Promise(resolve => { started = resolve; });
      readGate = { started, wait: new Promise(resolve => { release = resolve; }) };
      return { requested, release: () => release() };
    },
  };
}

async function startStudy(page) {
  await page.locator('#btnBottomQuestions').click();
  await expect(page.locator('.optical-choice-row').first()).toBeVisible();
}
async function home(page) {
  await page.locator('.bottom-navigation [data-action="welcome-home"]').click();
  await expect(page.locator('#welcomePortal')).toBeVisible();
}
async function resume(page) {
  await page.locator('#btnMasterConsole').click();
  await page.locator('#btnResumeLastSession').click();
}
async function signIn(page, id) {
  await page.locator('#authEmailInput').fill(`${id}@example.test`);
  await page.locator('#authPasswordInput').fill('password123');
  await page.locator('[data-action="welcome-submit-auth"]').click();
  await expect(page.locator('#authUserNameDisplay')).toHaveText(id);
}
async function answerFirst(page) {
  const option = page.locator('.optical-choice-row').first();
  const qid = await option.getAttribute('data-qid');
  const choice = await option.getAttribute('data-letter');
  await option.click();
  await page.waitForTimeout(350);
  await option.click();
  await expect(option).toHaveClass(/marked-(correct|incorrect)/);
  return { qid, choice };
}
const row = (page, qid, choice) => page.locator(`.booklet-question[data-qid="${qid}"] .optical-choice-row[data-letter="${choice}"]`);
const saved = (page, owner) => page.evaluate(key => JSON.parse(localStorage.getItem(key) || '{}'),
  progressStorageKey(StorageKeys.USER_CHOICES, owner));

test('misafir soru çözer; yenileme ve yeni sekmede ilerleme korunur, bulut/oda yazılmaz', async ({ context, page }) => {
  const remote = await server(context);
  await page.goto('/');
  await expect(page.locator('[data-action="welcome-enter-guest"]')).toBeVisible();
  await page.locator('[data-action="welcome-enter-guest"]').click();
  await expect(page.locator('#authUserNameDisplay')).toHaveText('Misafir');
  await startStudy(page);
  await expect(page.locator('[data-study-status]')).toHaveText('Misafir');
  const { qid, choice } = await answerFirst(page);
  await expect.poll(() => saved(page, 'guest')).toEqual({ [qid]: choice });
  await page.reload();
  await expect(page.locator('#authUserNameDisplay')).toHaveText('Misafir');
  await resume(page);
  await expect(row(page, qid, choice)).toHaveClass(/marked-(correct|incorrect)/);
  await home(page);
  await page.locator('#btnMasterConsole').click();
  await page.locator('#btnWelcomeTeamToggle').click();
  await page.locator('#welcomeRoomId').fill('misafir-oda');
  await page.locator('[data-action="welcome-join-room"]').click();
  await expect(page.locator('#authNoticeText')).toContainText('gerçek hesabınla giriş yap');
  await expect(page.locator('#welcomeAuthSection')).toBeVisible();
  const reopened = await context.newPage();
  await page.close();
  await reopened.goto('/');
  await expect(reopened.locator('#authUserNameDisplay')).toHaveText('Misafir');
  await resume(reopened);
  await expect(row(reopened, qid, choice)).toHaveClass(/marked-(correct|incorrect)/);
  await reopened.waitForTimeout(1400);
  expect(remote.writes).toEqual([]);
  expect(remote.authRequests).toEqual([]);
});

test('misafir → hesap → misafir geçişleri cevapları ayırır; öğrenci bulut akışı sürer', async ({ context, page }) => {
  const remote = await server(context);
  await page.goto('/');
  await page.locator('[data-action="welcome-enter-guest"]').click();
  await startStudy(page);
  const { qid, choice } = await answerFirst(page);
  const accountChoice = choice === 'D' ? 'B' : 'D';
  remote.rows.set('student', { choices: { [qid]: accountChoice }, starred: [], rematch: [] });
  await home(page);
  await page.locator('#btnMasterConsole').click();
  await page.locator('[data-action="welcome-open-auth"]').click();
  await signIn(page, 'student');
  await expect.poll(() => saved(page, 'account:student')).toEqual({ [qid]: accountChoice });
  await startStudy(page);
  await expect(row(page, qid, accountChoice)).toHaveClass(/marked-(correct|incorrect)/);
  await expect.poll(() => remote.writes.length).toBeGreaterThan(0);
  expect(remote.writes.every(write => write.user_id === 'student' && write.choices[qid] === accountChoice)).toBe(true);
  await home(page);
  await page.locator('#btnMasterConsole').click();
  await page.locator('[data-action="welcome-signout"]').click();
  await expect(page.locator('#welcomeAuthSection')).toBeVisible();
  await page.locator('[data-action="welcome-enter-guest"]').click();
  await resume(page);
  await expect(row(page, qid, choice)).toHaveClass(/marked-(correct|incorrect)/);
  expect(await saved(page, 'account:student')).toEqual({ [qid]: accountChoice });
  expect(await saved(page, 'guest')).toEqual({ [qid]: choice });
  const before = remote.writes.length;
  await page.waitForTimeout(1400);
  expect(remote.writes).toHaveLength(before);
});

test('başka sekmede giriş misafir cevaplarını hesaba taşımaz; misafir sekmesi yenilenebilir', async ({ context, page }) => {
  const remote = await server(context);
  await page.goto('/');
  await page.locator('[data-action="welcome-enter-guest"]').click();
  await startStudy(page);
  const { qid, choice } = await answerFirst(page);
  const accountPage = await context.newPage();
  await accountPage.goto('/');
  await accountPage.locator('#btnMasterConsole').click();
  await accountPage.locator('[data-action="welcome-open-auth"]').click();
  await signIn(accountPage, 'student');
  await expect.poll(() => remote.writes.length).toBeGreaterThan(0);
  await page.bringToFront();
  await expect(page.locator('[data-study-status]')).toBeVisible();
  await page.reload();
  await expect(page.locator('#authUserNameDisplay')).toHaveText('Misafir');
  await resume(page);
  await expect(row(page, qid, choice)).toHaveClass(/marked-(correct|incorrect)/);
  await page.waitForTimeout(1400);
  expect(remote.writes.every(write => write.user_id === 'student' && Object.keys(write.choices).length === 0)).toBe(true);
  expect(await saved(page, 'guest')).toEqual({ [qid]: choice });
});

test('geciken hesap senkronizasyonu misafire dönüşte ilerlemeyi ezmez', async ({ context, page }) => {
  const remote = await server(context);
  await page.goto('/');
  await page.locator('[data-action="welcome-enter-guest"]').click();
  await startStudy(page);
  const { qid, choice } = await answerFirst(page);
  remote.rows.set('student', { choices: { [qid]: 'D' }, starred: [999] });
  const gate = remote.holdRead();
  await home(page);
  await page.locator('#btnMasterConsole').click();
  await page.locator('[data-action="welcome-open-auth"]').click();
  await signIn(page, 'student');
  await gate.requested;
  await page.locator('#btnMasterConsole').click();
  await page.locator('[data-action="welcome-signout"]').click();
  await expect(page.locator('#welcomeAuthSection')).toBeVisible();
  await page.locator('[data-action="welcome-enter-guest"]').click();
  gate.release();
  await resume(page);
  await expect(row(page, qid, choice)).toHaveClass(/marked-(correct|incorrect)/);
  await page.waitForTimeout(1400);
  expect(remote.writes).toEqual([]);
  expect(await saved(page, 'guest')).toEqual({ [qid]: choice });
});

test('misafire geri dönülünce geciken giriş yanıtı hesap oturumu açamaz', async ({ context, page }) => {
  const remote = await server(context);
  await page.goto('/');
  await page.locator('[data-action="welcome-enter-guest"]').click();
  await startStudy(page);
  const { qid, choice } = await answerFirst(page);
  await home(page);
  await page.locator('#btnMasterConsole').click();
  await page.locator('[data-action="welcome-open-auth"]').click();
  const gate = remote.holdAuth();
  await page.locator('#authEmailInput').fill('student@example.test');
  await page.locator('#authPasswordInput').fill('password123');
  await page.locator('[data-action="welcome-submit-auth"]').click();
  await gate.requested;
  await page.locator('[data-action="welcome-enter-guest"]').click();
  gate.release();
  await resume(page);
  await expect(row(page, qid, choice)).toHaveClass(/marked-(correct|incorrect)/);
  await page.waitForTimeout(1400);
  expect(remote.writes).toEqual([]);
  expect(await page.evaluate(key => localStorage.getItem(key), StorageKeys.AUTH_SESSION)).toBeNull();
});

test('başka sekmede hesap değişimi bekleyen cevap zamanlayıcısını iptal eder', async ({ context, page }) => {
  const remote = await server(context);
  await page.goto('/');
  await signIn(page, 'student');
  await expect.poll(() => remote.writes.length).toBeGreaterThan(0);
  const other = await context.newPage();
  await other.goto('/');
  await expect(other.locator('#authUserNameDisplay')).toHaveText('student');
  await startStudy(page);
  const clockStart = Date.now();
  await page.clock.install({ time: clockStart });
  await page.clock.pauseAt(clockStart + 10000);
  const option = page.locator('.optical-choice-row').first();
  const qid = await option.getAttribute('data-qid');
  const choice = await option.getAttribute('data-letter');
  await option.click();
  await page.clock.runFor(350);
  await option.click();
  await expect.poll(() => saved(page, 'account:student')).toEqual({ [qid]: choice });
  await other.locator('#btnMasterConsole').click();
  await other.locator('[data-action="welcome-signout"]').click();
  await expect(other.locator('#welcomeAuthSection')).toBeVisible();
  await signIn(other, 'other');
  await expect(page.locator('#authUserNameDisplay')).toHaveText('other');
  await page.clock.runFor(2000);
  await expect.poll(() => remote.writes.filter(write => write.user_id === 'other').length).toBeGreaterThan(0);
  expect(remote.writes.filter(write => write.user_id === 'other').every(write => Object.keys(write.choices).length === 0)).toBe(true);
  expect(await saved(page, 'account:student')).toEqual({ [qid]: choice });
  expect(await saved(page, 'account:other')).toEqual({});
});
