import { getSupabaseConfig } from './supabase-client.ts';
import type { AuthSession } from './supabase-auth.ts';
import { isMascotId, type MascotId } from '../shared/mascot-types.ts';

let remoteMascotColumnMissing = false;

export function resetMascotColumnFallbackForTest(): void {
  remoteMascotColumnMissing = false;
}

/**
 * Giriş yapmış kullanıcının `user_profiles.mascot_id` tercihini Supabase'den okur.
 * Kolon uzak veritabanında henüz yoksa sessizce yerel önbelleğe düşer.
 */
export async function fetchUserMascotFromSupabase(
  session: AuthSession,
  timeoutMs = 5000,
  signal?: AbortSignal,
): Promise<MascotId | null> {
  const config = getSupabaseConfig();
  if (!config || !session?.accessToken || !session?.user?.id || remoteMascotColumnMissing) {
    return null;
  }

  const endpoint = `${config.url}/rest/v1/user_profiles?id=eq.${encodeURIComponent(session.user.id)}&select=mascot_id&limit=1`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const reqSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${session.accessToken}`,
        Accept: 'application/json',
      },
      signal: reqSignal,
    });
    if (!res.ok) {
      if (res.status === 400) {
        const errText = await res.text().catch(() => '');
        if (errText.includes('mascot_id')) remoteMascotColumnMissing = true;
      }
      return null;
    }
    const rows: unknown = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const first = rows[0] as Record<string, unknown> | null;
    return isMascotId(first?.mascot_id) ? first.mascot_id : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Giriş yapmış kullanıcının maskot tercihini `user_profiles.mascot_id` kolonuna yazar.
 */
export async function saveUserMascotToSupabase(
  session: AuthSession,
  mascotId: MascotId,
  timeoutMs = 5000,
  signal?: AbortSignal,
): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config || !session?.accessToken || !session?.user?.id || remoteMascotColumnMissing) {
    return false;
  }

  const endpoint = `${config.url}/rest/v1/user_profiles?id=eq.${encodeURIComponent(session.user.id)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const reqSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;

  try {
    const res = await fetch(endpoint, {
      method: 'PATCH',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ mascot_id: mascotId }),
      signal: reqSignal,
    });
    if (res.ok) return true;
    if (res.status === 400) {
      const errText = await res.text().catch(() => '');
      if (errText.includes('mascot_id')) remoteMascotColumnMissing = true;
    }
    return false;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
