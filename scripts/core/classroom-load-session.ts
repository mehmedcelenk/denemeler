import type { RoomSnapshot } from '../../src/data/classroom.ts';

export interface LoadParticipant {
  readonly userId: string;
  readonly connectionId: string;
  join(name: string, roomId?: string | null): Promise<RoomSnapshot>;
  rpc(name: string, args: object): Promise<unknown>;
}

/** Space authentication separately from the simultaneous room join; retain 429 counts. */
export async function signInPilotClients<T extends { signIn(): Promise<void> }>(
  clients: T[], wait: (ms: number) => Promise<void>,
): Promise<number> {
  let rateLimited = 0;
  for (let i = 0; i < clients.length; i += 5) {
    let pending = clients.slice(i, i + 5);
    for (let attempt = 0; pending.length; attempt++) {
      if (attempt === 6) throw new Error('Authentication rate limit did not recover.');
      const results = await Promise.allSettled(pending.map(client => client.signIn()));
      const retry: T[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') return;
        if (!(result.reason instanceof Error) || !result.reason.message.includes('HTTP 429')) throw result.reason;
        rateLimited++;
        retry.push(pending[index]);
      });
      pending = retry;
      if (pending.length) await wait(10000);
    }
    if (i + 5 < clients.length) await wait(10000);
  }
  return rateLimited;
}

/** Wait for every join before cleanup: a late create must not outlive an early failure. */
export async function joinPilotRoom<T extends LoadParticipant>(clients: T[], name: string): Promise<{
  joined: RoomSnapshot[]; roomId: string; host: T;
}> {
  const results = await Promise.allSettled(clients.map(client => client.join(name)));
  const joined = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
  const consistent = joined.length === clients.length && joined.length > 0
    && new Set(joined.map(s => s.roomId)).size === 1
    && new Set(joined.map(s => s.hostId)).size === 1;
  const host = clients.find(client => client.userId === joined[0]?.hostId);
  if (consistent && host) return { joined, roomId: joined[0].roomId, host };

  // Even a rejected request can have created a room before its response was lost.
  // Successful responses identify the owner, which can safely resume that exact room.
  const rooms = new Map(joined.map(s => [s.roomId, s.hostId]));
  for (const [roomId, hostId] of rooms) {
    const owner = clients.find(client => client.userId === hostId);
    if (!owner) {
      console.error(`Test room ${roomId}: owner unavailable; close manually.`);
      continue;
    }
    try {
      await owner.join(name, roomId);
      await owner.rpc('close_classroom_room', { p_room_id: roomId, p_connection_id: owner.connectionId });
    } catch {
      console.error(`Test room ${roomId}: cleanup failed; close manually.`);
    }
  }
  if (rooms.size === 0) console.error(`All join replies failed; inspect test room ${name} and close it if created.`);
  throw new Error('Concurrent test joins failed or produced inconsistent room ownership.');
}
