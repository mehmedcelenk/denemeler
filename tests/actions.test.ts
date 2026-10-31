import test from 'node:test';
import assert from 'node:assert/strict';
import { registerActions, runAction } from '../src/app/actions.ts';

test('kayıtlı eylem hedefi ve olayı alır; bilinmeyen eylem false döner', () => {
  const element = { dataset: { qid: '42' } } as unknown as HTMLElement;
  const event = new Event('click');
  let calls = 0;
  registerActions({
    'test-dispatch': (el, ev) => {
      assert.equal(el, element);
      assert.equal(ev, event);
      calls++;
    },
  });
  assert.equal(runAction('test-unknown', element, event), false);
  assert.equal(runAction('test-dispatch', element, event), true);
  assert.equal(calls, 1);
});

test('tekrarlanan kayıt hata bildirir ve ilk işleyiciyi korur', t => {
  const errors = t.mock.method(console, 'error', () => {});
  const element = {} as HTMLElement;
  const event = new Event('click');
  let result = '';
  registerActions({ 'test-duplicate': () => { result = 'first'; } });
  registerActions({ 'test-duplicate': () => { result = 'second'; } });
  assert.equal(errors.mock.callCount(), 1);
  runAction('test-duplicate', element, event);
  assert.equal(result, 'first');
});

test('senkron ve asenkron hata yakalanır, sonraki eylemler çalışır', async t => {
  const errors = t.mock.method(console, 'error', () => {});
  const element = {} as HTMLElement;
  const event = new Event('click');
  let completed = false;
  registerActions({
    'test-throws': () => { throw new Error('sync'); },
    'test-rejects': async () => { throw new Error('async'); },
    'test-resolves': async () => { completed = true; },
  });
  assert.equal(runAction('test-throws', element, event), true);
  assert.equal(runAction('test-rejects', element, event), true);
  assert.equal(runAction('test-resolves', element, event), true);
  await Promise.resolve();
  assert.equal(errors.mock.callCount(), 2);
  assert.equal(completed, true);
});
