import type { SubjectId } from './question.ts';
import { parseLessonVisual, type LessonVisual } from './lesson-visual.ts';

export type {
  BarStep,
  CompareStep,
  DeckStep,
  EliminateStep,
  EyeMood,
  FlowStep,
  HighlightStep,
  LessonDeckVisual,
  LessonVisual,
  MirrorStep,
  ResultStep,
  ToggleStep,
  TrackStep,
  VisualTone,
} from './lesson-visual.ts';

export interface LessonConcept {
  term: string;
  definition: string;
  example?: string;
  emoji?: string;
}

export interface LessonEzber {
  rhyme: string;
}

export interface QuestionLesson {
  questionId: number;
  subject: SubjectId;
  title: string;
  explanation: string;
  ezber?: LessonEzber;
  concepts: LessonConcept[];
  visual?: LessonVisual;
  model?: string;
  version?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseOptionalString(value: unknown, label: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new Error(`${label} metin olmalı.`);
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseConcept(value: unknown, label: string): LessonConcept {
  if (!isRecord(value) || !isNonEmptyString(value.term) || !isNonEmptyString(value.definition)) {
    throw new Error(`${label}: term ve definition zorunlu metin olmalı.`);
  }
  return {
    term: value.term.trim(),
    definition: value.definition.trim(),
    example: parseOptionalString(value.example, `${label}.example`),
    emoji: parseOptionalString(value.emoji, `${label}.emoji`),
  };
}

function parseOptionalEzber(value: unknown, label: string): LessonEzber | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value) || !isNonEmptyString(value.rhyme)) {
    throw new Error(`${label}: ezber.rhyme zorunlu metin olmalı.`);
  }
  const lines = value.rhyme.trim().split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length !== 2) {
    throw new Error(`${label}: ezber.rhyme tam 2 dize (ikilik) olmalı.`);
  }
  return { rhyme: lines.join('\n') };
}

/** Tek bir ön-üretilmiş öğretmen ders anlatımını doğrular. */
export function parseQuestionLesson(value: unknown): QuestionLesson {
  if (!isRecord(value)) throw new Error('Ders anlatımı nesne olmalı.');
  if (typeof value.questionId !== 'number' || !Number.isSafeInteger(value.questionId) || value.questionId <= 0) {
    throw new Error('Ders anlatımı questionId pozitif tam sayı olmalı.');
  }
  const qid = value.questionId;
  if (!isNonEmptyString(value.subject)) throw new Error(`${qid}: subject zorunlu.`);
  if (!isNonEmptyString(value.title)) throw new Error(`${qid}: title zorunlu.`);
  if (!isNonEmptyString(value.explanation)) throw new Error(`${qid}: explanation zorunlu.`);
  if (!Array.isArray(value.concepts) || value.concepts.length === 0) {
    throw new Error(`${qid}: concepts en az bir özgün kavram tanımı içermeli.`);
  }
  if (value.version !== undefined && value.version !== null) {
    if (typeof value.version !== 'number' || !Number.isInteger(value.version) || value.version < 1) {
      throw new Error(`${qid}: version pozitif tam sayı olmalı.`);
    }
  }

  return {
    questionId: qid,
    subject: value.subject.trim() as SubjectId,
    title: value.title.trim(),
    explanation: value.explanation.trim(),
    ezber: parseOptionalEzber(value.ezber, `${qid}.ezber`),
    concepts: value.concepts.map((concept, idx) => parseConcept(concept, `${qid}.concepts[${idx}]`)),
    visual: parseLessonVisual(value.visual, `${qid}.visual`),
    model: parseOptionalString(value.model, `${qid}.model`),
    version: typeof value.version === 'number' ? value.version : 5,
  };
}

/** Bir derse ait ön-üretilmiş ders anlatımları dizisini doğrular. */
export function parseQuestionLessons(value: unknown): QuestionLesson[] {
  if (!Array.isArray(value)) throw new Error('Ders anlatımı verisi bir dizi olmalı.');
  const seen = new Set<number>();
  const parsed: QuestionLesson[] = [];
  for (const item of value) {
    const lesson = parseQuestionLesson(item);
    if (seen.has(lesson.questionId)) {
      throw new Error(`Tekrarlanan ders anlatımı soru kimliği: ${lesson.questionId}`);
    }
    seen.add(lesson.questionId);
    parsed.push(lesson);
  }
  return parsed;
}

const lessonByQuestionId = new Map<number, QuestionLesson>();
const loadedLessonSubjects = new Set<string>();
const pendingLessonLoads = new Map<string, Promise<QuestionLesson[]>>();

function resolveBaseUrl(baseUrl?: string): string {
  const envBase = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL;
  const base = baseUrl ?? (envBase || './');
  return base.endsWith('/') ? base : `${base}/`;
}

export async function fetchLocalSubjectLessons(
  subject: SubjectId | string,
  baseUrl?: string,
): Promise<QuestionLesson[]> {
  const url = `${resolveBaseUrl(baseUrl)}data/lessons/${encodeURIComponent(subject)}.json`;
  const response = await fetch(url, { cache: 'no-cache' });
  if (response.status === 404) return [];
  if (!response.ok) return [];
  const text = await response.text();
  if (!text.trim() || text.trim().startsWith('<')) return [];
  return parseQuestionLessons(JSON.parse(text));
}

export function loadSubjectLessons(
  subject: SubjectId | string,
  options?: { baseUrl?: string },
): Promise<QuestionLesson[]> {
  const key = String(subject);
  if (loadedLessonSubjects.has(key)) {
    return Promise.resolve(
      Array.from(lessonByQuestionId.values()).filter(item => item.subject === key),
    );
  }
  const existing = pendingLessonLoads.get(key);
  if (existing) return existing;

  const request = fetchLocalSubjectLessons(key, options?.baseUrl)
    .then(lessons => {
      for (const lesson of lessons) lessonByQuestionId.set(lesson.questionId, lesson);
      loadedLessonSubjects.add(key);
      return lessons;
    })
    .catch(err => {
      console.warn(`[Lessons] ${key} anlatımları yüklenemedi:`, err);
      return [];
    })
    .finally(() => {
      pendingLessonLoads.delete(key);
    });

  pendingLessonLoads.set(key, request);
  return request;
}

export function getCachedLesson(questionId: number): QuestionLesson | null {
  return lessonByQuestionId.get(questionId) ?? null;
}

export function hasCachedLesson(questionId: number): boolean {
  return lessonByQuestionId.has(questionId);
}

export function isSubjectLessonsLoaded(subject: SubjectId | string): boolean {
  return loadedLessonSubjects.has(String(subject));
}

export function primeLessonCache(subject: SubjectId | string, lessons: readonly QuestionLesson[]): void {
  for (const lesson of lessons) lessonByQuestionId.set(lesson.questionId, lesson);
  loadedLessonSubjects.add(String(subject));
}

export function cacheSingleLesson(lesson: QuestionLesson): void {
  lessonByQuestionId.set(lesson.questionId, lesson);
}

export function clearLessonCache(): void {
  lessonByQuestionId.clear();
  loadedLessonSubjects.clear();
  pendingLessonLoads.clear();
}
