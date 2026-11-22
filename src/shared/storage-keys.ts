/**
 * AÖL Dijital Kitapçık — Merkezi LocalStorage Anahtarları Sözlüğü.
 * Tüm kalıcı kullanıcı tercihleri ve verileri bu sözleşmeye bağlıdır.
 */
export const StorageKeys = {
  THEME: 'aol_theme',
  ACCENT_COLOR: 'aol_accent_color',
  COLUMN_COUNT: 'aol_column_count',
  USER_CHOICES: 'aol_user_choices',
  ANSWER_LOCK_UNTIL: 'aol_answer_lock_until',
  STARRED_QUESTIONS: 'aol_starred_questions',
  REMATCH_QUESTIONS: 'aol_rematch_queue',
  WATER_STREAK: 'aol_water_streak',
  LAST_STREAK_DATE: 'aol_last_streak_date',
  RESUME_STATE: 'aol_last_session',
  USER_NAME: 'aol_user_name',
  CLASSROOM_SESSION: 'aol_classroom_session',
  CLASSROOM_CHANNEL_PREFIX: 'aol_room_',
  CLASSROOM_TAB: 'aol_classroom_tab_v2',
  CLASSROOM_PENDING_PREFIX: 'aol_classroom_pending_v2:',
  TTS_GENDER: 'aol_tts_gender',
  TTS_ENGINE: 'aol_tts_engine',
  ELIMINATED_CHOICES: 'aol_eliminated_choices',
  ELIMINATED_WRONG_CHOICES: 'aol_eliminated_wrong_choices',
  AUTH_SESSION: 'aol_auth_session',
  RESPONSIBLE_COURSES: 'aol_responsible_courses_v1',
  MASCOT_ID: 'aol_mascot_id_v1',
  MASCOT_POS: 'aol_mascot_pos_v1',
  STUDY_MODE: 'aol_study_mode_v1',
  PROGRESS_PREFIX: 'aol_progress_v1:',
  LEGACY_PROGRESS_OWNER: 'aol_legacy_progress_owner_v1',
  LEGACY_PROGRESS_COMPLETE: 'aol_legacy_progress_complete_v1',
} as const;

type FixedStorageKey = typeof StorageKeys[keyof typeof StorageKeys];
export type ClassroomSyncStorageKey = `sync_${typeof StorageKeys.CLASSROOM_CHANNEL_PREFIX}${string}`;
export type ClassroomPendingKey = `${typeof StorageKeys.CLASSROOM_PENDING_PREFIX}${string}`;
export type StorageKey = FixedStorageKey | ClassroomSyncStorageKey | ClassroomPendingKey;


export type ProgressOwner = 'legacy' | 'locked' | 'guest' | `account:${string}`;

export const progressKeys: ReadonlySet<StorageKey> = new Set([
  StorageKeys.USER_CHOICES, StorageKeys.ANSWER_LOCK_UNTIL,
  StorageKeys.STARRED_QUESTIONS, StorageKeys.REMATCH_QUESTIONS,
  StorageKeys.WATER_STREAK, StorageKeys.LAST_STREAK_DATE, StorageKeys.RESUME_STATE,
  StorageKeys.ELIMINATED_CHOICES, StorageKeys.ELIMINATED_WRONG_CHOICES,
  StorageKeys.RESPONSIBLE_COURSES, StorageKeys.MASCOT_ID,
]);

export function progressStorageKey(key: StorageKey, owner: ProgressOwner): string {
  return owner === 'legacy' || !progressKeys.has(key)
    ? key : `${StorageKeys.PROGRESS_PREFIX}${encodeURIComponent(owner)}:${key}`;
}
