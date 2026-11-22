export interface UserProgressData {
  choices?: Record<string, string>;
  starred?: number[];
  rematch?: number[];
  eliminatedChoices?: Record<string, string[]>;
  responsibleCourses?: Record<string, string[]>;
  stars?: number;
  lastSession?: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isResponsibleCoursesMap(value: unknown): value is Record<string, string[]> {
  if (!isRecord(value)) return false;
  return Object.values(value).every(
    list => Array.isArray(list) && list.every(item => typeof item === 'string' && item.trim().length > 0),
  );
}

/** Reject invalid container shapes before any part of a remote row is applied. */
export function parseProgressRow(value: unknown): UserProgressData | null {
  if (!isRecord(value)) return null;
  const choices = value.choices ?? {};
  const starred = value.starred ?? [];
  const rematch = value.rematch ?? [];
  const eliminated = value.eliminated_choices ?? {};
  const responsibleCourses = value.responsible_courses ?? {};
  const rawStars = value.stars ?? 0;
  const lastSession = value.last_session ?? undefined;
  if (!isRecord(choices) || !Object.values(choices).every(v => typeof v === 'string')
    || !Array.isArray(starred) || !starred.every(Number.isSafeInteger)
    || !Array.isArray(rematch) || !rematch.every(Number.isSafeInteger)
    || !isRecord(eliminated) || !Object.values(eliminated).every(v => Array.isArray(v) && v.every(item => typeof item === 'string'))
    || !isResponsibleCoursesMap(responsibleCourses)
    || typeof rawStars !== 'number' || !Number.isSafeInteger(rawStars) || rawStars < 0
    || (lastSession !== undefined && !isRecord(lastSession))) return null;
  return {
    choices: choices as Record<string, string>,
    starred: starred as number[],
    rematch: rematch as number[],
    eliminatedChoices: eliminated as Record<string, string[]>,
    responsibleCourses,
    stars: rawStars,
    lastSession,
  };
}
