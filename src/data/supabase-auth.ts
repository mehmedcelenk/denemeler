import { getSupabaseConfig } from './supabase-client.ts';

export interface AuthUser {
  id: string;
  email?: string;
  username?: string;
  displayName?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  expiresAt?: number;
}

export interface UserProgressData {
  choices?: Record<string, string>;
  starred?: number[];
  rematch?: number[];
  eliminatedChoices?: Record<string, string[]>;
  lastSession?: Record<string, unknown>;
}

export interface AuthResponse<T> {
  data: T | null;
  error: string | null;
}

function parseUserFromGoTrue(raw: Record<string, unknown>): AuthUser {
  const meta = (typeof raw.user_metadata === 'object' && raw.user_metadata !== null)
    ? (raw.user_metadata as Record<string, unknown>)
    : {};
  return {
    id: String(raw.id || ''),
    email: typeof raw.email === 'string' ? raw.email : undefined,
    username: typeof meta.username === 'string' ? meta.username : undefined,
    displayName: typeof meta.display_name === 'string' ? meta.display_name : undefined,
  };
}

function parseSessionFromGoTrue(raw: Record<string, unknown>): AuthSession | null {
  if (typeof raw.access_token !== 'string' || !raw.user || typeof raw.user !== 'object') {
    return null;
  }
  return {
    accessToken: raw.access_token,
    refreshToken: typeof raw.refresh_token === 'string' ? raw.refresh_token : '',
    user: parseUserFromGoTrue(raw.user as Record<string, unknown>),
    expiresAt: typeof raw.expires_at === 'number' ? raw.expires_at : undefined,
  };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  username?: string,
  displayName?: string,
  timeoutMs = 6000
): Promise<AuthResponse<AuthSession>> {
  const config = getSupabaseConfig();
  if (!config) return { data: null, error: 'Supabase yapılandırılmamış.' };

  const endpoint = `${config.url}/auth/v1/signup`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        data: {
          username: username || '',
          display_name: displayName || username || '',
        },
      }),
      signal: controller.signal,
    });

    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const msg = typeof json.msg === 'string' ? json.msg : (typeof json.error_description === 'string' ? json.error_description : 'Kayıt başarısız.');
      return { data: null, error: msg };
    }
    const session = parseSessionFromGoTrue(json);
    return { data: session, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Ağ hatası.' };
  } finally {
    clearTimeout(timer);
  }
}

export async function signInWithEmail(
  identifier: string,
  password: string,
  timeoutMs = 6000
): Promise<AuthResponse<AuthSession>> {
  const config = getSupabaseConfig();
  if (!config) return { data: null, error: 'Supabase yapılandırılmamış.' };

  let targetEmail = identifier.trim();
  if (!targetEmail.includes('@')) {
    try {
      const rpcRes = await fetch(`${config.url}/rest/v1/rpc/find_email_by_identifier`, {
        method: 'POST',
        headers: {
          apikey: config.anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: targetEmail }),
      });
      if (rpcRes.ok) {
        const found = await rpcRes.json();
        if (typeof found === 'string' && found.includes('@')) {
          targetEmail = found;
        }
      }
    } catch {}
  }

  const endpoint = `${config.url}/auth/v1/token?grant_type=password`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: targetEmail, password }),
      signal: controller.signal,
    });

    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      const msg = typeof json.error_description === 'string' ? json.error_description : (typeof json.msg === 'string' ? json.msg : 'Giriş başarısız.');
      return { data: null, error: msg };
    }
    const session = parseSessionFromGoTrue(json);
    return { data: session, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Ağ hatası.' };
  } finally {
    clearTimeout(timer);
  }
}

export async function signOutFromSupabase(
  accessToken: string,
  timeoutMs = 4000
): Promise<void> {
  const config = getSupabaseConfig();
  if (!config || !accessToken) return;

  const endpoint = `${config.url}/auth/v1/logout`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      signal: controller.signal,
    });
  } catch {} finally {
    clearTimeout(timer);
  }
}

export async function saveUserProgressToSupabase(
  session: AuthSession,
  progress: UserProgressData,
  timeoutMs = 5000
): Promise<boolean> {
  const config = getSupabaseConfig();
  if (!config || !session?.accessToken || !session?.user?.id) return false;

  const endpoint = `${config.url}/rest/v1/user_progress`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const row = {
      user_id: session.user.id,
      choices: progress.choices ?? {},
      starred: progress.starred ?? [],
      rematch: progress.rematch ?? [],
      eliminated_choices: progress.eliminatedChoices ?? {},
      last_session: progress.lastSession ?? null,
      updated_at: new Date().toISOString(),
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(row),
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchUserProgressFromSupabase(
  session: AuthSession,
  timeoutMs = 5000
): Promise<UserProgressData | null> {
  const config = getSupabaseConfig();
  if (!config || !session?.accessToken || !session?.user?.id) return null;

  const endpoint = `${config.url}/rest/v1/user_progress?user_id=eq.${encodeURIComponent(session.user.id)}&limit=1`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${session.accessToken}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    if (Array.isArray(json) && json.length > 0 && typeof json[0] === 'object' && json[0] !== null) {
      const row = json[0] as Record<string, unknown>;
      return {
        choices: (row.choices as Record<string, string>) ?? {},
        starred: (row.starred as number[]) ?? [],
        rematch: (row.rematch as number[]) ?? [],
        eliminatedChoices: (row.eliminated_choices as Record<string, string[]>) ?? {},
        lastSession: (row.last_session as Record<string, unknown>) ?? undefined,
      };
    }
    return null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
