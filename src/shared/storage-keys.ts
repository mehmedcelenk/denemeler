/**
 * AÖL Dijital Kitapçık — Merkezi LocalStorage Anahtarları Sözlüğü.
 * Tüm kalıcı kullanıcı tercihleri ve verileri bu sözleşmeye bağlıdır.
 */
export const StorageKeys = {
  THEME: 'aol_theme',
  ACCENT_COLOR: 'aol_accent_color',
  COLUMN_COUNT: 'aol_column_count',
  USER_CHOICES: 'aol_user_choices',
  STARRED_QUESTIONS: 'aol_starred_questions',
  REMATCH_QUESTIONS: 'aol_rematch_questions',
  WATER_STREAK: 'aol_water_streak',
  RESUME_STATE: 'aol_resume_state',
  TTS_GENDER: 'aol_tts_gender',
  TTS_ENGINE: 'aol_tts_engine',
  ELIMINATED_CHOICES: 'aol_eliminated_choices',
  ELIMINATED_WRONG_CHOICES: 'aol_eliminated_wrong_choices',
  AI_EXPLANATIONS: 'aol_ai_explanations',
} as const;

export type StorageKey = typeof StorageKeys[keyof typeof StorageKeys];

