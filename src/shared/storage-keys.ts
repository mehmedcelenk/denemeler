/**
 * AÖL Dijital Kitapçık — Merkezi LocalStorage Anahtarları Sözlüğü.
 * Tüm kalıcı kullanıcı tercihleri ve verileri bu sözleşmeye bağlıdır.
 */
export const StorageKeys = {
  THEME: 'aol_theme',
  ACCENT_COLOR: 'aol_accent_color',
  COLUMN_COUNT: 'aol_column_count',
  SAVED_CHOICES: 'aol_saved_choices',
  STARRED_QUESTIONS: 'aol_starred_questions',
  REMATCH_QUESTIONS: 'aol_rematch_questions',
  WATER_STREAK: 'aol_water_streak',
  RESUME_STATE: 'aol_resume_state',
  TTS_GENDER: 'aol_tts_gender',
} as const;

export type StorageKey = typeof StorageKeys[keyof typeof StorageKeys];
