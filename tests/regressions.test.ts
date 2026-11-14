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

test('resetBoardPan ve computeBoardFocalZoom fonksiyonları odak noktasını koruyarak çalışır', async () => {
  const { resetBoardPan } = await import('../src/features/board/board-mode.ts');
  const { computeBoardFocalZoom } = await import('../src/features/board/board-view.ts');
  assert.doesNotThrow(() => {
    resetBoardPan();
  });

  const zoomed = computeBoardFocalZoom(0, 0, 1, 2, 100, 50);
  assert.equal(zoomed.scale, 2);
  assert.equal(zoomed.panX, -100);
  assert.equal(zoomed.panY, -50);
});

test('focus-tracker: aynı odak kaybı içinde blur + visibilitychange arka arkaya gelirse 1 sn reload toleransını bozmaz', async () => {
  const { roomService } = await import('../src/features/classroom/room-service.ts');
  const {
    triggerPotentialFocusLoss,
    triggerPotentialFocusRestored,
    resetFocusTrackerForTest,
  } = await import('../src/features/classroom/focus-tracker.ts');

  resetFocusTrackerForTest();
  roomService.joinOrCreateRoom('FOCUS-TEST', 'Öğrenci', false);
  try {
    // t=1000ms: window.blur tetiklenir
    triggerPotentialFocusLoss(false, 1000);
    // t=1005ms (5ms sonra): document.visibilitychange tetiklenir -> isRapidSpam sanılıp anında FOCUS_LOST olmamalı!
    triggerPotentialFocusLoss(false, 1005);

    const stateDuringGrace = roomService.getState();
    assert.equal(
      stateDuringGrace.feedItems.some(f => f.type === 'FOCUS_LOST'),
      false,
      '1 sn grace period dolmadan FOCUS_LOST bildirilmemeli'
    );

    // 200ms sonra (reload / anlık kırpma bitti) odak geri gelir
    triggerPotentialFocusRestored(1200);
    const stateAfterRestore = roomService.getState();
    assert.equal(
      stateAfterRestore.feedItems.some(f => f.type === 'FOCUS_LOST'),
      false,
      '1 sn içinde geri dönüldüğünde FOCUS_LOST kaydı oluşmamalı'
    );
  } finally {
    resetFocusTrackerForTest();
    roomService.leaveRoom();
  }
});
