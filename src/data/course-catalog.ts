import rawCourseCatalog from './generated/courseCatalog.json';
import type { SubjectId } from './question.ts';

export interface CourseCatalogEntry {
  readonly subjectId: SubjectId;
  readonly ders: string;
  readonly shortName: string;
  readonly termOrder: number | null;
  readonly kredi: number;
  readonly questionCount: number;
}

const catalog: readonly CourseCatalogEntry[] = (rawCourseCatalog as CourseCatalogEntry[]).map(entry => ({
  subjectId: entry.subjectId,
  ders: entry.ders,
  shortName: entry.shortName,
  termOrder: typeof entry.termOrder === 'number' ? entry.termOrder : null,
  kredi: Number.isFinite(entry.kredi) && entry.kredi > 0 ? entry.kredi : 1,
  questionCount: Number.isFinite(entry.questionCount) && entry.questionCount > 0 ? entry.questionCount : 0,
}));

const byDers = new Map<string, CourseCatalogEntry>();
const bySubject = new Map<string, CourseCatalogEntry[]>();

for (const entry of catalog) {
  byDers.set(entry.ders, entry);
  let list = bySubject.get(entry.subjectId);
  if (!list) {
    list = [];
    bySubject.set(entry.subjectId, list);
  }
  list.push(entry);
}

export function getAllCourseCatalog(): readonly CourseCatalogEntry[] {
  return catalog;
}

export function getCourseEntry(ders: string): CourseCatalogEntry | undefined {
  return byDers.get(ders);
}

export function getCourseCatalogBySubject(subjectId: string): readonly CourseCatalogEntry[] {
  return bySubject.get(subjectId) ?? [];
}

export function resolveSelectedCourseEntries(
  selectedDersList: readonly string[],
  allowedSubjectIds?: ReadonlySet<string>,
): readonly CourseCatalogEntry[] {
  const seen = new Set<string>();
  const entries: CourseCatalogEntry[] = [];
  for (const ders of selectedDersList) {
    if (seen.has(ders)) continue;
    const entry = byDers.get(ders);
    if (!entry) continue;
    if (allowedSubjectIds && !allowedSubjectIds.has(entry.subjectId)) continue;
    seen.add(ders);
    entries.push(entry);
  }
  return entries;
}
