import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSavedChoices } from '../src/shared/saved-choices.ts';
import { getTopicKey } from '../src/shared/topic.ts';

test('bozuk localStorage cevapları temizlenir, geçerli cevaplar korunur', () => {
  for (const raw of [null, 'null', '[]', '3', 'false', '{bozuk']) {
    assert.deepEqual(parseSavedChoices(raw), {});
  }
  assert.deepEqual(parseSavedChoices('{"12":"A","13":"X","14":null,"x":"B","15":"D"}'), { 12: 'A', 15: 'D' });
});

test('Genel alt konu ana konuyu kaybettirmez', () => {
  assert.equal(getTopicKey({ ana_konu: 'Roman', alt_konu: 'Genel' }), 'Roman');
  assert.equal(getTopicKey({ ana_konu: 'Roman' }), 'Roman');
  assert.equal(getTopicKey({ alt_konu: 'Roman' }), 'Roman');
  assert.equal(getTopicKey({ ana_konu: 'Edebiyat', alt_konu: 'Roman' }), 'Edebiyat / Roman');
  assert.equal(getTopicKey({}), 'Genel');
});

test('resetBoardPan fonksiyonu güvenle çalışır', async () => {
  const { resetBoardPan } = await import('../src/features/board/board-mode.ts');
  assert.doesNotThrow(() => {
    resetBoardPan();
  });
});
