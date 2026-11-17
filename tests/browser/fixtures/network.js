// Browser regressions use checked-in lesson JSON, never a developer's live database.
// Classroom contract tests install their narrower RPC handler after this route.
export async function isolateRemoteData(target) {
  await target.route('**/rest/v1/**', route => route.fulfill({
    status: 404,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'E2E uses local question fixtures.' }),
  }));
  await target.route('**/auth/v1/**', route => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'Auth is explicitly mocked by each browser test.' }),
  }));
}
