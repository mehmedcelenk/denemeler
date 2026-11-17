import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { parseRoomSnapshot, type RoomSnapshot } from '../../src/data/classroom.ts';

export interface PilotAccount { email: string; password: string }
export interface PilotConfig { url: string; key: string; accounts: PilotAccount[] }

export async function readPilotConfig(): Promise<PilotConfig> {
  const mode = process.env.CLASSROOM_TEST_CONFIRM;
  if (mode !== 'isolated-test' && mode !== 'production-approved') {
    throw new Error('Explicit isolated-test or production-approved confirmation is required.');
  }
  const url = process.env.CLASSROOM_TEST_URL?.replace(/\/$/, '');
  const key = process.env.CLASSROOM_TEST_ANON_KEY;
  const file = process.env.CLASSROOM_TEST_ACCOUNTS_FILE;
  if (!url || !key || !file || !/^https?:\/\//.test(url)) {
    throw new Error('Set explicit CLASSROOM_TEST_URL, CLASSROOM_TEST_ANON_KEY and CLASSROOM_TEST_ACCOUNTS_FILE.');
  }
  if (mode === 'production-approved') {
    const ref = process.env.CLASSROOM_PRODUCTION_REF;
    if (!ref || !/^[a-z0-9]+$/.test(ref) || url !== `https://${ref}.supabase.co`) {
      throw new Error('Production project URL must match the explicit CLASSROOM_PRODUCTION_REF.');
    }
  }
  const parsed: unknown = JSON.parse(await readFile(file, 'utf8'));
  if (!parsed || typeof parsed !== 'object' || !('projectUrl' in parsed)
    || parsed.projectUrl !== url || !('accounts' in parsed) || !Array.isArray(parsed.accounts)) {
    throw new Error('Fixture project URL must exactly match the explicit test project URL.');
  }
  const accounts: PilotAccount[] = [];
  for (const item of parsed.accounts) {
    if (!item || typeof item.email !== 'string' || typeof item.password !== 'string') {
      throw new Error('Invalid fixture account shape.');
    }
    accounts.push({ email: item.email, password: item.password });
  }
  if (accounts.length !== 61 || new Set(accounts.map(a => a.email.toLowerCase())).size !== 61) {
    throw new Error('Exactly 61 distinct test accounts are required.');
  }
  if (mode === 'production-approved' && accounts.some(a => !/^pilot-[a-z0-9-]+@[^@\s]+\.[^@\s]+$/.test(a.email))) {
    throw new Error('Production runs require dedicated pilot-prefixed test accounts.');
  }
  return { url, key, accounts };
}

export class PilotClient {
  readonly connectionId = randomUUID();
  userId = '';
  private accessToken = '';
  private refreshToken = '';
  private expiresAt = 0;
  sequence = 0;
  readonly requestDurations: number[] = [];

  constructor(private config: PilotConfig, private account: PilotAccount) {}

  async signIn(): Promise<void> {
    await this.auth('password', { email: this.account.email, password: this.account.password });
  }

  private async auth(grant: string, body: object): Promise<void> {
    const response = await fetch(`${this.config.url}/auth/v1/token?grant_type=${grant}`, {
      method: 'POST', headers: { apikey: this.config.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body), signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`Test authentication failed (HTTP ${response.status}).`);
    const result = await response.json();
    if (typeof result.access_token !== 'string' || typeof result.refresh_token !== 'string'
      || typeof result.user?.id !== 'string') throw new Error('Invalid test authentication response.');
    this.accessToken = result.access_token;
    this.refreshToken = result.refresh_token;
    this.userId = result.user.id;
    this.expiresAt = Date.now() + Number(result.expires_in ?? 3600) * 1000;
  }

  async rpc(name: string, args: object): Promise<unknown> {
    if (this.expiresAt - Date.now() < 60000) await this.auth('refresh_token', { refresh_token: this.refreshToken });
    const started = performance.now();
    try {
      const response = await fetch(`${this.config.url}/rest/v1/rpc/${name}`, {
        method: 'POST',
        headers: { apikey: this.config.key, Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(args), signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) {
        const error: unknown = await response.json().catch(() => null);
        const code = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
          && /^[A-Z_]+$/.test(error.message) ? error.message : `HTTP_${response.status}`;
        throw new Error(code);
      }
      return response.status === 204 ? null : await response.json();
    } finally {
      this.requestDurations.push(performance.now() - started);
    }
  }

  async join(name: string, roomId: string | null = null, connectionId = this.connectionId): Promise<RoomSnapshot> {
    const snapshot = parseRoomSnapshot(await this.rpc('join_or_create_room', {
      p_name: name, p_room_id: roomId, p_connection_id: connectionId, p_visible: true,
    }));
    this.sequence = snapshot.sequence;
    return snapshot;
  }

  async update(roomId: string, visible: boolean, answers: Record<string, boolean | null> = {}, afterEvent?: string): Promise<RoomSnapshot> {
    return parseRoomSnapshot(await this.rpc('update_room_member', {
      p_room_id: roomId, p_connection_id: this.connectionId,
      p_visible: visible, p_answers: answers, p_sequence: ++this.sequence,
      p_after_event: afterEvent ?? null,
    }));
  }

  async snapshot(roomId: string): Promise<RoomSnapshot> {
    return parseRoomSnapshot(await this.rpc('get_room_snapshot', {
      p_room_id: roomId, p_connection_id: this.connectionId,
    }));
  }
}

export const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a,b) => a-b);
  return Math.round(sorted[Math.min(sorted.length-1, Math.floor(sorted.length*p))]);
}
