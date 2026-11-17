import type { RoomSnapshot } from '../../data/classroom.ts';
import type { RoomState } from './types.ts';
import type { PendingAnswers } from './session-store.ts';

export function emptyRoomState(): RoomState {
  return { roomId: null, roomName: '', userName: '', isHost: false, connection: 'idle',
    error: null, participantCount: 0, studentStats: {}, feedItems: [], announcement: null };
}

export function snapshotToState(snapshot: RoomSnapshot, userId: string): RoomState {
  const state = emptyRoomState();
  state.roomId = snapshot.roomId;
  state.roomName = snapshot.roomName;
  state.isHost = snapshot.hostId === userId;
  state.connection = 'connected';
  state.participantCount = snapshot.participantCount;
  state.announcement = snapshot.announcement;
  for (const member of snapshot.members) {
    if (member.userId === userId) state.userName = member.name;
    if (member.userId === snapshot.hostId) continue;
    const answers = member.answers;
    state.studentStats[member.userId] = { id: member.userId, name: member.name,
      joinedAt: member.joinedAt, lastSeenAt: member.lastSeenAt, isOnline: member.online,
      visible: member.visible, answers,
      correctCount: Object.values(answers).filter(Boolean).length,
      incorrectCount: Object.values(answers).filter(v => !v).length };
  }
  state.feedItems = snapshot.events.map(event => ({ id: event.id, type: event.type,
    studentId: event.userId, studentName: event.name, timestamp: event.at }));
  return state;
}

/** Only acknowledge the revisions sent: a new click during an HTTP request stays pending. */
export function acknowledgeAnswers(current: PendingAnswers, sent: PendingAnswers): PendingAnswers {
  return Object.fromEntries(Object.entries(current).filter(([id, change]) =>
    change.revision !== sent[id]?.revision));
}

export const roomEventLabels = {
  JOIN: 'Katıldı', LEAVE: 'Odadan ayrıldı', AWAY: 'Sayfadan ayrıldı',
  RETURN: 'Sayfaya döndü', OFFLINE: 'Bağlantısı kesildi', ONLINE: 'Yeniden bağlandı',
} as const;
