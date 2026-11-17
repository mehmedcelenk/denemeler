export type FeedEventType = 'JOIN' | 'LEAVE' | 'AWAY' | 'RETURN' | 'OFFLINE' | 'ONLINE';

export interface RoomFeedItem {
  id: string;
  type: FeedEventType;
  studentId: string;
  studentName: string;
  timestamp: number;
}

export interface StudentStats {
  id: string;
  name: string;
  correctCount: number;
  incorrectCount: number;
  joinedAt: number;
  lastSeenAt: number;
  isOnline: boolean;
  visible: boolean;
  answers: Record<number, boolean>;
}

export type RoomConnection = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface RoomState {
  roomId: string | null;
  roomName: string;
  userName: string;
  isHost: boolean;
  connection: RoomConnection;
  error: string | null;
  participantCount: number;
  studentStats: Record<string, StudentStats>;
  feedItems: RoomFeedItem[];
  announcement: { id: string; text: string } | null;
}
