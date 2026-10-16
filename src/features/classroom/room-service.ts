import type { RoomFeedItem, RoomMessage, RoomParticipant, RoomState, StudentStats } from './types.ts';
import { roomChannel } from './room-channel.ts';
import { handleIncomingRoomMessage } from './message-handler.ts';

type Listener = (state: RoomState) => void;

class RoomService {
  private peerId: string = Math.random().toString(36).substring(2, 9);
  private state: RoomState = {
    roomId: null,
    userName: '',
    isHost: false,
    isPaused: false,
    participants: [],
    feedItems: [],
    studentStats: {},
    helpRequested: false,
  };
  private listeners: Set<Listener> = new Set();
  private heartbeatTimer: any = null;

  getState(): RoomState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  joinOrCreateRoom(roomId: string, userName: string, asHost: boolean): void {
    const cleanRoom = roomId.trim().toUpperCase();
    const cleanName = userName.trim();
    if (!cleanRoom || !cleanName) return;

    this.leaveRoom();

    const now = Date.now();
    this.state = {
      roomId: cleanRoom,
      userName: cleanName,
      isHost: asHost,
      isPaused: false,
      participants: [{ id: this.peerId, name: cleanName, isHost: asHost, joinedAt: now }],
      feedItems: [{ id: `${now}_${this.peerId}`, type: 'JOIN', studentName: cleanName, timestamp: now }],
      studentStats: {
        [this.peerId]: { id: this.peerId, name: cleanName, correctCount: 0, incorrectCount: 0, joinedAt: now },
      },
      helpRequested: false,
    };

    roomChannel.connect(cleanRoom, (msg) => this.handleIncoming(msg));
    roomChannel.send({
      type: 'PEER_JOIN',
      roomId: cleanRoom,
      senderId: this.peerId,
      senderName: cleanName,
      isHost: asHost,
      timestamp: now,
    });

    this.notify();
    this.startHeartbeat();
  }

  leaveRoom(): void {
    if (!this.state.roomId) return;

    roomChannel.send({
      type: 'PEER_LEAVE',
      roomId: this.state.roomId,
      senderId: this.peerId,
      senderName: this.state.userName,
      timestamp: Date.now(),
    });

    this.stopHeartbeat();
    roomChannel.disconnect();

    this.state = {
      roomId: null,
      userName: '',
      isHost: false,
      isPaused: false,
      participants: [],
      feedItems: [],
      studentStats: {},
      helpRequested: false,
    };

    this.notify();
  }

  // 1. Odayı Duraklatma / Devam Ettirme (Tüm sınıfta Pause perdesi açar/kapatır)
  togglePauseRoom(): void {
    if (!this.state.roomId || !this.state.isHost) return;
    this.state.isPaused = !this.state.isPaused;
    this.notify();

    roomChannel.send({
      type: 'ROOM_PAUSE',
      roomId: this.state.roomId,
      senderId: this.peerId,
      senderName: this.state.userName,
      isHost: true,
      timestamp: Date.now(),
      payload: { isPaused: this.state.isPaused },
    });
  }

  // 2. Odayı Tamamen Sonlandırma (Herkesin ekranında oturumu kapatır)
  closeRoomGlobally(): void {
    if (!this.state.roomId || !this.state.isHost) return;

    roomChannel.send({
      type: 'ROOM_CLOSE',
      roomId: this.state.roomId,
      senderId: this.peerId,
      senderName: this.state.userName,
      isHost: true,
      timestamp: Date.now(),
    });

    this.leaveRoom();
  }

  // 3. Öğrenciye Yıldız Verme
  awardStarToStudent(studentName: string): void {
    if (!this.state.roomId || !this.state.isHost) return;

    roomChannel.send({
      type: 'AWARD_STAR',
      roomId: this.state.roomId,
      senderId: this.peerId,
      senderName: this.state.userName,
      isHost: true,
      timestamp: Date.now(),
      payload: { studentName },
    });
  }

  // 4. Tüm Sınıfa Toplu Anons Gönderme
  broadcastAnnouncement(text: string): void {
    const cleanText = text.trim();
    if (!this.state.roomId || !cleanText) return;

    roomChannel.send({
      type: 'BROADCAST_ANNOUNCEMENT',
      roomId: this.state.roomId,
      senderId: this.peerId,
      senderName: this.state.userName,
      isHost: this.state.isHost,
      timestamp: Date.now(),
      payload: { text: cleanText },
    });
  }

  callTeacherHelp(): void {
    if (!this.state.roomId) return;
    this.state.helpRequested = true;
    const now = Date.now();

    this.state.feedItems.unshift({
      id: `${now}_${this.peerId}_help`,
      type: 'HELP_CALL',
      studentName: this.state.userName,
      timestamp: now,
    });
    this.notify();

    roomChannel.send({
      type: 'HELP_CALL',
      roomId: this.state.roomId,
      senderId: this.peerId,
      senderName: this.state.userName,
      isHost: this.state.isHost,
      timestamp: now,
    });
  }

  resolveTeacherHelp(feedId: string, studentName: string): void {
    if (!this.state.roomId) return;
    const item = this.state.feedItems.find((f) => f.id === feedId);
    if (item) {
      item.resolved = true;
      this.notify();
    }
    if (studentName === this.state.userName) {
      this.state.helpRequested = false;
      this.notify();
    }

    roomChannel.send({
      type: 'HELP_RESOLVED',
      roomId: this.state.roomId,
      senderId: this.peerId,
      senderName: this.state.userName,
      isHost: this.state.isHost,
      timestamp: Date.now(),
      payload: { feedId, studentName },
    });
  }

  notifyFocusLost(): void {
    if (!this.state.roomId || this.state.isPaused) return;
    const now = Date.now();

    this.state.feedItems.unshift({
      id: `${now}_${this.peerId}_lost`,
      type: 'FOCUS_LOST',
      studentName: this.state.userName,
      timestamp: now,
    });
    this.notify();

    roomChannel.send({
      type: 'FOCUS_LOST',
      roomId: this.state.roomId,
      senderId: this.peerId,
      senderName: this.state.userName,
      isHost: this.state.isHost,
      timestamp: now,
    });
  }

  notifyFocusRestored(): void {
    if (!this.state.roomId || this.state.isPaused) return;
    const now = Date.now();

    const lastLost = this.state.feedItems.find(
      (f) => f.type === 'FOCUS_LOST' && f.studentName === this.state.userName && !f.returnedAt
    );
    if (lastLost) {
      lastLost.returnedAt = now;
      this.notify();
    }

    roomChannel.send({
      type: 'FOCUS_RESTORED',
      roomId: this.state.roomId,
      senderId: this.peerId,
      senderName: this.state.userName,
      isHost: this.state.isHost,
      timestamp: now,
    });
  }

  logStudentAnswer(isCorrect: boolean): void {
    if (!this.state.roomId) return;

    if (this.state.studentStats[this.peerId]) {
      if (isCorrect) {
        this.state.studentStats[this.peerId].correctCount++;
      } else {
        this.state.studentStats[this.peerId].incorrectCount++;
      }
      this.notify();
    }

    roomChannel.send({
      type: 'STUDENT_ANSWER_LOG',
      roomId: this.state.roomId,
      senderId: this.peerId,
      senderName: this.state.userName,
      timestamp: Date.now(),
      payload: { isCorrect },
    });
  }

  private handleIncoming(msg: RoomMessage): void {
    handleIncomingRoomMessage(
      {
        peerId: this.peerId,
        roomId: this.state.roomId,
        userName: this.state.userName,
        isHost: this.state.isHost,
        isPaused: this.state.isPaused,
        participants: this.state.participants,
        feedItems: this.state.feedItems,
        studentStats: this.state.studentStats,
        helpRequested: this.state.helpRequested,
        setHelpRequested: (val: boolean) => {
          this.state.helpRequested = val;
          this.notify();
        },
        setPaused: (val: boolean) => {
          this.state.isPaused = val;
          this.notify();
        },
        leaveRoom: () => this.leaveRoom(),
        notify: () => this.notify(),
      },
      msg
    );
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.state.roomId) {
        roomChannel.send({
          type: 'ROOM_SYNC',
          roomId: this.state.roomId,
          senderId: this.peerId,
          senderName: this.state.userName,
          isHost: this.state.isHost,
          timestamp: Date.now(),
          payload: {
            participants: this.state.participants,
            studentStats: this.state.studentStats,
            isPaused: this.state.isPaused,
          },
        });
      }
    }, 15000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const roomService = new RoomService();
