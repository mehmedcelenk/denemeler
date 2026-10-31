import type { RoomFeedItem, RoomMessage, RoomParticipant, StudentStats } from '../types.ts';

export interface MessageContext {
  peerId: string;
  roomId: string | null;
  userName: string;
  isHost: boolean;
  isPaused: boolean;
  participants: RoomParticipant[];
  feedItems: RoomFeedItem[];
  studentStats: Record<string, StudentStats>;
  helpRequested: boolean;
  setHelpRequested: (val: boolean) => void;
  setPaused: (val: boolean) => void;
  leaveRoom: () => void;
  scheduleSyncBroadcast: () => void;
  notify: () => void;
}

export interface IncomingMessage {
  msg: RoomMessage;
  senderId: string;
  senderName: string;
  timestamp: number;
  existingPeer: RoomParticipant | undefined;
  isSenderHost: boolean;
}

export type RoomMessageHandler = (ctx: MessageContext, incoming: IncomingMessage) => void;
