import type { Question, SubjectId } from './question.ts';
import { parseQuestions } from './question.ts';
import type { ScopedConceptEntry } from './textbook.ts';
import { parseScopedConcepts } from './textbook.ts';

interface ImportMetaEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  BASE_URL?: string;
}

interface CustomImportMeta {
  env?: ImportMetaEnv;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface AiExplanationRecord {
  question_id: number;
  query: string;
  reply: string;
  model: string;
}

let activeConfigOverride: SupabaseConfig | null = null;

export function setSupabaseConfigOverride(config: SupabaseConfig | null): void {
  activeConfigOverride = config;
}

function getEnv(): ImportMetaEnv {
  if (typeof import.meta !== 'undefined') {
    const meta = import.meta as unknown as CustomImportMeta;
    return meta.env ?? {};
  }
  return {};
}

export function getSupabaseConfig(): SupabaseConfig | null {
  if (activeConfigOverride) {
    return activeConfigOverride;
  }
  const env = getEnv();
  const url = env.VITE_SUPABASE_URL?.trim();
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim();

  if (url && anonKey && url.startsWith('http') && !url.includes('your-project')) {
    return { url: url.replace(/\/+$/, ''), anonKey };
  }
  return null;
}

export function isSupabaseAvailable(): boolean {
  return getSupabaseConfig() !== null;
}

export async function fetchQuestionsFromSupabase(
  subject: SubjectId | string,
  timeoutMs = 5000
): Promise<Question[]> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error('Supabase URL ve Anon Key yapılandırılmamış.');
  }

  const endpoint = `${config.url}/rest/v1/questions?subject=eq.${encodeURIComponent(subject)}&order=id.asc`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Supabase HTTP ${response.status}: ${response.statusText}`);
    }

    const data: unknown = await response.json();
    return parseQuestions(data);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchConceptsFromSupabase(
  subject: SubjectId | string,
  timeoutMs = 5000
): Promise<ScopedConceptEntry[]> {
  const config = getSupabaseConfig();
  if (!config) {
    throw new Error('Supabase URL ve Anon Key yapılandırılmamış.');
  }

  const endpoint = `${config.url}/rest/v1/concepts?subject=eq.${encodeURIComponent(subject)}&order=donem.asc,sayfa.asc`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Supabase HTTP ${response.status}: ${response.statusText}`);
    }

    const data: unknown = await response.json();
    return parseScopedConcepts(data);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchAiExplanationFromSupabase(
  questionId: number,
  timeoutMs = 5000
): Promise<AiExplanationRecord | null> {
  const config = getSupabaseConfig();
  if (!config) return null;

  const endpoint = `${config.url}/rest/v1/ai_explanations?question_id=eq.${questionId}&select=question_id,query,reply,model&limit=1`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) return null;
    const data: unknown = await response.json();
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) {
      return data[0] as AiExplanationRecord;
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchLocalSubjectJson(
  subject: SubjectId | string,
  baseUrl?: string
): Promise<Question[]> {
  const base = baseUrl ?? (getEnv().BASE_URL || './');
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const dataUrl = `${cleanBase}data/subjects/${subject}.json`;

  const response = await fetch(dataUrl, { cache: 'no-cache' });
  if (!response.ok) {
    throw new Error(`${subject} verisi yüklenemedi (${response.status})`);
  }

  const text = await response.text();
  if (text.trim().startsWith('<')) {
    throw new Error(`${subject} verisi JSON yerine HTML olarak döndü (${dataUrl})`);
  }

  const json: unknown = JSON.parse(text);
  return parseQuestions(json);
}

export async function fetchQuestionsWithFallback(
  subject: SubjectId | string,
  options?: { baseUrl?: string; timeoutMs?: number }
): Promise<Question[]> {
  const timeoutMs = options?.timeoutMs ?? 5000;

  if (isSupabaseAvailable()) {
    try {
      const questions = await fetchQuestionsFromSupabase(subject, timeoutMs);
      if (Array.isArray(questions) && questions.length > 0) {
        return questions;
      }
    } catch (error) {
      console.warn(`[Supabase] ${subject} soruları veritabanından çekilemedi, yerel JSON yedeğine geçiliyor:`, error);
    }
  }

  return fetchLocalSubjectJson(subject, options?.baseUrl);
}
