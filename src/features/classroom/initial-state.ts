import type { RoomState } from './types.ts';

export const INITIAL_ROOM_STATE: RoomState = {
  roomId: null,
  userName: '',
  isHost: false,
  isPaused: false,
  participants: [],
  feedItems: [],
  studentStats: {},
  helpRequested: false,
};
