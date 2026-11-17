import { getSupabaseConfig } from './supabase-client.ts';
import type { AuthSession } from './supabase-auth.ts';

export interface RoomMember {
  userId: string;
  name: string;
  visible: boolean;
  online: boolean;
  joinedAt: number;
  lastSeenAt: number;
  answers: Record<string, boolean>;
}

export type RoomEventType = 'JOIN' | 'LEAVE' | 'AWAY' | 'RETURN' | 'OFFLINE' | 'ONLINE';
export interface RoomEvent {
  id: string;
  type: RoomEventType;
  userId: string;
  name: string;
  at: number;
}

export interface RoomSnapshot {
  roomId: string;
  roomName: string;
  hostId: string;
  closed: boolean;
  participantCount: number;
  sequence: number;
  announcement: { id: string; text: string } | null;
  members: RoomMember[];
  events: RoomEvent[];
}

export type SnapshotRpc = 'join_or_create_room' | 'update_room_member' | 'get_room_snapshot';
export type ClassroomRpc = SnapshotRpc | 'leave_room' | 'publish_room_announcement' | 'close_classroom_room';
export interface ClassroomRequestOptions { signal?: AbortSignal; keepalive?: boolean }

export class ClassroomError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'ClassroomError';
  }
}

const messages: Record<string, string> = {
  AUTH_REQUIRED: 'Odaya girmek için yeniden giriş yapın.',
  ROOM_CLOSED: 'Bu oda sonlandırılmış. Yeni bir odaya giriş yapabilirsiniz.',
  CONNECTION_ACTIVE: 'Bu hesap başka bir sekmede veya cihazda odada. Önce oradan ayrılın.',
  CONNECTION_REPLACED: 'Sınıf bağlantınız başka bir oturumla değiştirilmiş. Yeniden katılın.',
  FORBIDDEN: 'Bu sınıf işlemi için yetkiniz yok.',
  INVALID_INPUT: 'Oda bilgilerini kontrol edip yeniden deneyin.',
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validTime(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function validMember(value: unknown): value is RoomMember {
  return record(value) && typeof value.userId === 'string' && typeof value.name === 'string'
    && typeof value.visible === 'boolean' && typeof value.online === 'boolean'
    && validTime(value.joinedAt) && validTime(value.lastSeenAt) && record(value.answers)
    && Object.entries(value.answers).every(([qid, answer]) => /^\d+$/.test(qid)
      && Number.isSafeInteger(Number(qid)) && Number(qid) > 0 && typeof answer === 'boolean');
}

const eventTypes: readonly string[] = ['JOIN', 'LEAVE', 'AWAY', 'RETURN', 'OFFLINE', 'ONLINE'];
function validEvent(value: unknown): value is RoomEvent {
  return record(value) && typeof value.id === 'string' && /^\d+$/.test(value.id)
    && typeof value.type === 'string' && eventTypes.includes(value.type)
    && typeof value.userId === 'string' && typeof value.name === 'string' && validTime(value.at);
}

export function parseRoomSnapshot(value: unknown): RoomSnapshot {
  if (record(value) && typeof value.roomId === 'string' && typeof value.roomName === 'string'
    && typeof value.hostId === 'string' && typeof value.closed === 'boolean'
    && typeof value.participantCount === 'number' && Number.isSafeInteger(value.participantCount)
    && value.participantCount >= 0 && typeof value.sequence === 'number'
    && Number.isSafeInteger(value.sequence) && value.sequence >= 0
    && Array.isArray(value.members) && value.members.every(validMember)
    && Array.isArray(value.events) && value.events.every(validEvent)
    && (value.announcement === null || (record(value.announcement)
      && typeof value.announcement.id === 'string' && typeof value.announcement.text === 'string'))) {
    return value as unknown as RoomSnapshot;
  }
  throw new ClassroomError('INVALID_RESPONSE', 'Sınıf sunucusundan geçersiz yanıt alındı.');
}

export async function classroomRpc(
  session: AuthSession,
  name: ClassroomRpc,
  args: Readonly<Record<string, unknown>>,
  options: ClassroomRequestOptions = {},
): Promise<unknown> {
  const config = getSupabaseConfig();
  if (!config) throw new ClassroomError('NOT_CONFIGURED', 'Sınıf sunucusu yapılandırılmamış.');
  if (!session.accessToken || !session.user.id) throw new ClassroomError('AUTH_REQUIRED', messages.AUTH_REQUIRED);
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (options.signal?.aborted) abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 10000);
  try {
    const response = await fetch(`${config.url}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
      signal: controller.signal,
      keepalive: options.keepalive,
    });
    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const message = record(body) && typeof body.message === 'string' ? body.message : '';
      const code = Object.keys(messages).find(candidate => message === candidate)
        ?? (response.status === 401 ? 'AUTH_REQUIRED' : response.status === 403 ? 'FORBIDDEN' : 'SERVER_ERROR');
      throw new ClassroomError(code, messages[code] ?? 'Sınıfa bağlanılamadı. Yeniden deneyin.');
    }
    return response.status === 204 ? null : await response.json();
  } catch (error) {
    if (error instanceof ClassroomError) throw error;
    throw new ClassroomError(controller.signal.aborted ? 'TIMEOUT' : 'NETWORK_ERROR',
      'Sınıf bağlantısı kurulamadı. Bağlantınızı kontrol edip yeniden deneyin.');
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
  }
}

export async function fetchRoomSnapshot(
  session: AuthSession,
  name: SnapshotRpc,
  args: Readonly<Record<string, unknown>>,
  options: ClassroomRequestOptions = {},
): Promise<RoomSnapshot> {
  return parseRoomSnapshot(await classroomRpc(session, name, args, options));
}
