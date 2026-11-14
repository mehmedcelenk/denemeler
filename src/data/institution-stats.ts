import type { Choice } from './question.ts';
import { getSupabaseConfig } from './supabase-client.ts';

export interface InstitutionQuestionStat {
  readonly totalCount: number;
  readonly choiceCounts: Readonly<Partial<Record<Choice, number>>>;
}

interface RawRpcQuestionStat {
  readonly question_id: number;
  readonly total_count: number;
  readonly choice_counts: Record<string, number>;
}

export async function fetchInstitutionQuestionStats(
  timeoutMs = 5000
): Promise<Record<number, InstitutionQuestionStat> | null> {
  const config = getSupabaseConfig();
  if (!config) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${config.url}/rest/v1/rpc/get_institution_question_stats`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
      signal: controller.signal,
    });

    if (!res.ok) return null;
    const json = (await res.json()) as unknown;
    if (!Array.isArray(json)) return null;

    const result: Record<number, InstitutionQuestionStat> = {};
    for (const item of json) {
      if (
        typeof item === 'object' &&
        item !== null &&
        typeof (item as RawRpcQuestionStat).question_id === 'number'
      ) {
        const raw = item as RawRpcQuestionStat;
        const choiceCounts: Partial<Record<Choice, number>> = {};
        if (raw.choice_counts && typeof raw.choice_counts === 'object') {
          for (const [ch, cnt] of Object.entries(raw.choice_counts)) {
            if (['A', 'B', 'C', 'D', 'E'].includes(ch) && typeof cnt === 'number') {
              choiceCounts[ch as Choice] = cnt;
            }
          }
        }
        result[raw.question_id] = {
          totalCount: Number(raw.total_count) || 0,
          choiceCounts,
        };
      }
    }
    return result;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
