import test from 'node:test';
import assert from 'node:assert/strict';
import { StorageKeys } from '../src/shared/storage-keys.ts';

test('StorageKeys tarayıcıda kullanılan tam anahtar değerlerini korur', () => {
  assert.deepEqual(StorageKeys, {
    THEME: 'aol_theme',
    ACCENT_COLOR: 'aol_accent_color',
    COLUMN_COUNT: 'aol_column_count',
    USER_CHOICES: 'aol_user_choices',
    STARRED_QUESTIONS: 'aol_starred_questions',
    REMATCH_QUESTIONS: 'aol_rematch_queue',
    WATER_STREAK: 'aol_water_streak',
    LAST_STREAK_DATE: 'aol_last_streak_date',
    RESUME_STATE: 'aol_last_session',
    CLASSROOM_SESSION: 'aol_classroom_session',
    CLASSROOM_CHANNEL_PREFIX: 'aol_room_',
    TTS_GENDER: 'aol_tts_gender',
    TTS_ENGINE: 'aol_tts_engine',
    ELIMINATED_CHOICES: 'aol_eliminated_choices',
    ELIMINATED_WRONG_CHOICES: 'aol_eliminated_wrong_choices',
    AI_EXPLANATIONS: 'aol_ai_explanations',
  });
});
