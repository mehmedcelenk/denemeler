import type { RoomState } from './types.ts';
import { persistCurrentRoomSession } from './session-store.ts';

export function demoteHostToStudent(state: RoomState, peerId: string): void {
  if (!state.isHost) return;
  state.isHost = false;
  const myPeer = state.participants.find((p) => p.id === peerId);
  const joinedAt = myPeer?.joinedAt ?? Date.now();
  if (myPeer) myPeer.isHost = false;
  if (!state.studentStats[peerId]) {
    state.studentStats[peerId] = {
      id: peerId,
      name: state.userName,
      correctCount: 0,
      incorrectCount: 0,
      joinedAt,
      exitCount: 0,
      totalAwayMs: 0,
      lastSeenAt: Date.now(),
      isOnline: true,
    };
  }
  persistCurrentRoomSession(state, peerId);
}
