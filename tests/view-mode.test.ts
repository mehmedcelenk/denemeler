import test from 'node:test';
import assert from 'node:assert/strict';
import { state } from '../src/app/state.ts';
import { setContentViewMode } from '../src/features/booklet/view-mode.ts';

test('setContentViewMode: Sorular ve Notlar görünümleri arasında geçiş yapar', () => {
  state.contentViewMode = 'questions';
  assert.equal(state.contentViewMode, 'questions', 'Varsayılan görünüm sorular olmalı');

  setContentViewMode('notes');
  assert.equal(state.contentViewMode, 'notes', 'Görünüm notlar durumuna geçmeli');

  setContentViewMode('questions');
  assert.equal(state.contentViewMode, 'questions', 'Görünüm tekrar sorular durumuna dönmeli');
});
