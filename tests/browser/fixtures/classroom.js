import { StorageKeys } from '../../../src/shared/storage-keys.ts';
import { isolateRemoteData } from './network.js';

// Deterministic HTTP contract fixture, not a substitute for PostgreSQL/RLS tests.
export function createClassroomServer() {
  const rooms = new Map();
  const offline = new Set();
  const requests = [];
  let nextRoom = 0;
  let nextEvent = 0;
  let joinGate = Promise.resolve();
  let joinError = false;

  function addEvent(room, member, type) {
    room.events.push({
      id: String(++nextEvent), type, userId: member.userId,
      name: member.name, at: Date.now(),
    });
  }

  function snapshot(room, userId, after = null) {
    const own = room.members.get(userId);
    const isHost = room.hostId === userId;
    return {
      roomId: room.id, roomName: room.name, hostId: room.hostId,
      closed: room.closed, participantCount: [...room.members.values()].filter(m => !m.left).length,
      sequence: own.sequence, announcement: room.announcement,
      members: [...room.members.values()].filter(m => isHost || m.userId === userId)
        .map(member => ({
          userId: member.userId, name: member.name, visible: member.visible,
          online: member.online, joinedAt: member.joinedAt,
          lastSeenAt: member.lastSeenAt, answers: member.answers,
        })),
      events: isHost ? (after === null ? room.events.slice(-100)
        : room.events.filter(event => BigInt(event.id) > BigInt(after)).slice(0, 100)) : [],
    };
  }

  async function install(context, user) {
    await isolateRemoteData(context);
    await context.addInitScript(({ key, session }) => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(session));
    }, {
      key: StorageKeys.AUTH_SESSION,
      session: {
        accessToken: `token-${user.id}`, refreshToken: `refresh-${user.id}`,
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
        user: { id: user.id, username: user.name, displayName: user.name },
      },
    });
    await context.route('**/rest/v1/rpc/**', async route => {
      const rpc = new URL(route.request().url()).pathname.split('/').at(-1);
      const allowed = ['join_or_create_room', 'update_room_member', 'get_room_snapshot',
        'leave_room', 'publish_room_announcement', 'close_classroom_room'];
      if (!allowed.includes(rpc)) return route.fallback();
      if (offline.has(user.id)) return route.abort('internetdisconnected');
      const body = route.request().postDataJSON();
      requests.push({ userId: user.id, rpc, body });
      const reply = (status, value) => route.fulfill({
        status, contentType: 'application/json', body: JSON.stringify(value),
      });
      if (rpc === 'join_or_create_room') {
        await joinGate;
        if (joinError) return reply(503, { message: 'Odaya bağlanılamadı.' });
        const name = body.p_name.trim().toLocaleUpperCase('tr-TR');
        let room = body.p_room_id ? rooms.get(body.p_room_id)
          : [...rooms.values()].find(r => r.name === name && !r.closed);
        if (body.p_room_id && (!room || room.closed)) return reply(400, { message: 'ROOM_CLOSED' });
        if (!room) {
          const id = `10000000-0000-4000-8000-${String(++nextRoom).padStart(12, '0')}`;
          room = { id, name, hostId: user.id, closed: false, members: new Map(), events: [], announcement: null };
          rooms.set(id, room);
        }
        let member = room.members.get(user.id);
        if (member && !member.left && member.connectionId !== body.p_connection_id &&
          Date.now() - member.lastSeenAt < 15000) {
          return reply(400, { message: 'CONNECTION_ACTIVE' });
        }
        if (!member) {
          member = { userId: user.id, name: user.name, joinedAt: Date.now(), answers: {}, sequence: 0 };
          room.members.set(user.id, member);
          addEvent(room, member, 'JOIN');
        }
        if (member.connectionId !== body.p_connection_id) member.sequence = 0;
        Object.assign(member, { connectionId: body.p_connection_id, visible: body.p_visible,
          online: true, lastSeenAt: Date.now(), left: false });
        return reply(200, snapshot(room, user.id));
      }
      const room = rooms.get(body.p_room_id);
      const member = room?.members.get(user.id);
      if (!room || !member || member.connectionId !== body.p_connection_id) {
        return reply(403, { message: 'CONNECTION_REPLACED' });
      }
      if (rpc === 'update_room_member' && !room.closed && body.p_sequence > member.sequence) {
        if (member.visible !== body.p_visible) addEvent(room, member, body.p_visible ? 'RETURN' : 'AWAY');
        member.visible = body.p_visible;
        member.lastSeenAt = Date.now();
        member.online = true;
        member.sequence = body.p_sequence;
        for (const [qid, value] of Object.entries(body.p_answers || {})) {
          if (value === null) delete member.answers[qid];
          else member.answers[qid] = value;
        }
      }
      if (rpc === 'publish_room_announcement' || rpc === 'close_classroom_room') {
        if (room.hostId !== user.id) return reply(403, { message: 'HOST_REQUIRED' });
        if (rpc === 'publish_room_announcement') {
          room.announcement = { id: String(++nextEvent), text: body.p_text };
        } else room.closed = true;
        return reply(200, null);
      }
      if (rpc === 'leave_room') {
        member.left = true;
        member.online = false;
        addEvent(room, member, 'LEAVE');
        return reply(200, null);
      }
      return reply(200, snapshot(room, user.id, rpc === 'update_room_member' ? body.p_after_event : null));
    });
  }

  return {
    install, rooms, requests, offline,
    failJoin(value) { joinError = value; },
    holdJoin() {
      let release;
      joinGate = new Promise(resolve => { release = resolve; });
      return () => release();
    },
  };
}

export async function setPageVisibility(page, visible) {
  await page.evaluate(isVisible => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true, get: () => isVisible ? 'visible' : 'hidden',
    });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => !isVisible });
    document.dispatchEvent(new Event('visibilitychange'));
  }, visible);
}
