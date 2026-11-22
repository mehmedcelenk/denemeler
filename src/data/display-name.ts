import { getSupabaseConfig } from './supabase-client.ts';
import type { AuthSession } from './supabase-auth.ts';

/** Update only the signed-in user's display metadata; login username is unchanged. */
export async function updateDisplayName(session: AuthSession, name: string): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config) return false;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const response = await fetch(`${config.url}/auth/v1/user`, {
      method: 'PUT',
      headers: { apikey: config.anonKey, Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: { display_name: name } }),
      signal: controller.signal,
    });
    if (!response.ok) return false;
    const user: unknown = await response.json();
    if (!user || typeof user !== 'object' || !('id' in user) || user.id !== session.user.id
      || !('user_metadata' in user) || !user.user_metadata || typeof user.user_metadata !== 'object'
      || !('display_name' in user.user_metadata)) return false;
    return user.user_metadata.display_name === name;
  } catch { return false; }
  finally { clearTimeout(timer); }
}
