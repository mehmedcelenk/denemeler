export type FeedEventType = 'JOIN' | 'LEAVE' | 'FOCUS_LOST' | 'HELP_CALL';

export interface RoomFeedItem {
  id: string;
  type: FeedEventType;
  studentId: string;
  studentName: string;
  timestamp: number;
  returnedAt?: number;
  resolved?: boolean;
}

export interface StudentStats {
  id: string;
  name: string;
  correctCount: number;
  incorrectCount: number;
  joinedAt: number;
}

export interface RoomParticipant {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: number;
}

export type RoomMessageType =
  | 'PEER_JOIN'
  | 'PEER_LEAVE'
  | 'FOCUS_LOST'
  | 'FOCUS_RESTORED'
  | 'HELP_CALL'
  | 'HELP_RESOLVED'
  | 'ROOM_SYNC'
  | 'STUDENT_ANSWER_LOG'
  | 'ROOM_PAUSE'
  | 'ROOM_CLOSE'
  | 'AWARD_STAR'
  | 'BROADCAST_ANNOUNCEMENT';

export interface RoomMessagePayload {
  participants?: RoomParticipant[];
  studentStats?: Record<string, StudentStats>;
  isPaused?: boolean;
  isCorrect?: boolean;
  questionId?: number;
  correctCount?: number;
  incorrectCount?: number;
  feedId?: string;
  studentId?: string;
  studentName?: string;
  text?: string;
}

export interface RoomMessage {
  type: RoomMessageType;
  roomId: string;
  senderId: string;
  senderName: string;
  isHost?: boolean;
  timestamp: number;
  payload?: RoomMessagePayload;
}

export interface RoomState {
  roomId: string | null;
  userName: string;
  isHost: boolean;
  isPaused: boolean;
  participants: RoomParticipant[];
  feedItems: RoomFeedItem[];
  studentStats: Record<string, StudentStats>;
  helpRequested: boolean;
}
