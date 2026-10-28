import type { FocusLossReason, RoomMessage, RoomMessagePayload, RoomMessageType, RoomState } from './types.ts';
import { roomChannel } from './room-channel.ts';
import { addFeedItem, handleIncomingRoomMessage } from './message-handler.ts';
import { clearRoomSession, loadRoomSession, saveRoomSession } from './session-store.ts';
import { releaseScreenWakeLock, requestScreenWakeLock } from './wake-lock.ts';

type Listener = (state: RoomState) => void;
type ResumeCallback = () => void;

const INITIAL_ROOM_STATE: RoomState = {
  roomId: null,
  userName: '',
  isHost: false,
  isPaused: false,
  participants: [],
  feedItems: [],
  studentStats: {},
  helpRequested: false,
};

class RoomService {
  private peerId: string = Math.random().toString(36).substring(2, 9);
  private state: RoomState = { ...INITIAL_ROOM_STATE };
  private listeners: Set<Listener> = new Set();
  private resumeListeners: Set<ResumeCallback> = new Set();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private answeredQuestions: Map<number, boolean> = new Map();

  constructor() {
    this.resetState();
  }

  getPeerId(): string {
    return this.peerId;
  }

  getState(): RoomState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  onResume(callback: ResumeCallback): () => void {
    this.resumeListeners.add(callback);
    return () => this.resumeListeners.delete(callback);
  }

  joinOrCreateRoom(roomId: string, userName: string, asHost: boolean, savedPeerId?: string): void {
    const cleanRoom = roomId.trim().toUpperCase();
    const cleanName = userName.trim();
    if (!cleanRoom || !cleanName) return;

    this.leaveRoom();
    if (savedPeerId) this.peerId = savedPeerId;

    const now = Date.now();
    this.state = {
      roomId: cleanRoom,
      userName: cleanName,
      isHost: asHost,
      isPaused: false,
      participants: [{ id: this.peerId, name: cleanName, isHost: asHost, joinedAt: now, lastSeenAt: now }],
      feedItems: [{ id: `${now}_${this.peerId}`, type: 'JOIN', studentId: this.peerId, studentName: cleanName, timestamp: now }],
      studentStats: asHost ? {} : { [this.peerId]: { id: this.peerId, name: cleanName, correctCount: 0, incorrectCount: 0, joinedAt: now, exitCount: 0, totalAwayMs: 0, lastSeenAt: now, isOnline: true } },
      helpRequested: false,
    };

    saveRoomSession({ peerId: this.peerId, roomId: cleanRoom, userName: cleanName, isHost: asHost, timestamp: now });
    roomChannel.connect(cleanRoom, (msg) => this.handleIncoming(msg));
    requestScreenWakeLock().catch(() => {});
    this.emit('PEER_JOIN', undefined, now);
    this.notify();
    this.startHeartbeat();
  }

  restoreSessionIfActive(): boolean {
    const data = loadRoomSession();
    if (data && data.roomId && data.userName && data.peerId) {
      this.joinOrCreateRoom(data.roomId, data.userName, !!data.isHost, data.peerId);
      return true;
    }
    return false;
  }

  leaveRoom(): void {
    if (!this.state.roomId) return;
    releaseScreenWakeLock().catch(() => {});
    this.emit('PEER_LEAVE');
    this.stopHeartbeat();
    this.clearSyncDebounce();
    clearRoomSession();
    roomChannel.disconnect();
    this.resetState();
    this.notify();
  }

  togglePauseRoom(): void {
    if (!this.state.roomId || !this.state.isHost) return;
    this.state.isPaused = !this.state.isPaused;
    this.notify();
    this.emit('ROOM_PAUSE', { isPaused: this.state.isPaused });
  }

  closeRoomGlobally(): void {
    if (!this.state.roomId || !this.state.isHost) return;
    this.emit('ROOM_CLOSE');
    this.leaveRoom();
  }

  awardStarToStudent(studentIdOrName: string): void {
    if (!this.state.roomId || !this.state.isHost) return;
    const target = this.state.participants.find((p) => p.id === studentIdOrName || p.name === studentIdOrName);
    this.emit('AWARD_STAR', {
      studentId: target?.id ?? studentIdOrName,
      studentName: target?.name ?? studentIdOrName,
    });
  }

  broadcastAnnouncement(text: string): void {
    const cleanText = text.trim();
    if (!this.state.roomId || !cleanText) return;
    this.emit('BROADCAST_ANNOUNCEMENT', { text: cleanText });
  }

  callTeacherHelp(): void {
    if (!this.state.roomId || this.state.helpRequested) return;
    this.state.helpRequested = true;
    const now = Date.now();
    addFeedItem(this.state.feedItems, { id: `${now}_${this.peerId}_help`, type: 'HELP_CALL', studentId: this.peerId, studentName: this.state.userName, timestamp: now });
    this.notify();
    this.emit('HELP_CALL', undefined, now);
  }

  resolveTeacherHelp(feedId: string, studentIdOrName: string): void {
    if (!this.state.roomId) return;
    const item = this.state.feedItems.find((f) => f.id === feedId);
    if (item) {
      item.resolved = true;
      this.notify();
    }
    if (studentIdOrName === this.peerId || studentIdOrName === this.state.userName) {
      this.state.helpRequested = false;
      this.notify();
    }
    this.emit('HELP_RESOLVED', { feedId, studentId: studentIdOrName, studentName: studentIdOrName });
  }

  notifyFocusLost(reason: FocusLossReason = 'APP_SWITCH', timestamp = Date.now()): void {
    if (!this.state.roomId || this.state.isPaused) return;
    const openLost = this.state.feedItems.find((f) => f.type === 'FOCUS_LOST' && f.studentId === this.peerId && !f.returnedAt);
    if (openLost) return;

    const stats = this.state.studentStats[this.peerId];
    if (stats) {
      stats.exitCount = (stats.exitCount || 0) + 1;
    }

    addFeedItem(this.state.feedItems, { id: `${timestamp}_${this.peerId}_lost`, type: 'FOCUS_LOST', studentId: this.peerId, studentName: this.state.userName, timestamp, reason });
    this.notify();
    this.emit('FOCUS_LOST', { reason }, timestamp);
  }

  notifyFocusRestored(durationMs: number = 0, timestamp = Date.now()): void {
    if (!this.state.roomId || this.state.isPaused) return;
    const lastLost = this.state.feedItems.find((f) => f.type === 'FOCUS_LOST' && f.studentId === this.peerId && !f.returnedAt);
    if (lastLost) {
      lastLost.returnedAt = timestamp;
    }
    const stats = this.state.studentStats[this.peerId];
    if (stats && durationMs > 0) {
      stats.totalAwayMs = (stats.totalAwayMs || 0) + durationMs;
    }
    this.notify();
    this.emit('FOCUS_RESTORED', { durationMs }, timestamp);
  }

  notifySuspiciousAct(actType: 'COPY_TEXT', details: string): void {
    if (!this.state.roomId || this.state.isHost) return;
    const now = Date.now();
    addFeedItem(this.state.feedItems, {
      id: `${now}_${this.peerId}_suspicious`,
      type: 'SUSPICIOUS_COPY',
      studentId: this.peerId,
      studentName: this.state.userName,
      timestamp: now,
      details,
    });
    this.notify();
    this.emit('SUSPICIOUS_ACT', { actType, details }, now);
  }

  logStudentAnswer(questionId: number, isCorrect: boolean): void {
    if (!this.state.roomId || this.state.isHost) return;
    const prev = this.answeredQuestions.get(questionId);
    if (prev === isCorrect) return;

    const stats = this.state.studentStats[this.peerId];
    if (stats) {
      if (prev === undefined) {
        if (isCorrect) stats.correctCount++; else stats.incorrectCount++;
      } else if (prev === false && isCorrect) {
        stats.incorrectCount = Math.max(0, stats.incorrectCount - 1);
        stats.correctCount++;
      } else if (prev === true && !isCorrect) {
        stats.correctCount = Math.max(0, stats.correctCount - 1);
        stats.incorrectCount++;
      }
      this.notify();
    }

    this.answeredQuestions.set(questionId, isCorrect);
    this.emit('STUDENT_ANSWER_LOG', { questionId, isCorrect, correctCount: stats?.correctCount ?? 0, incorrectCount: stats?.incorrectCount ?? 0 });
  }

  revokeStudentAnswer(questionId: number): void {
    if (!this.state.roomId || this.state.isHost) return;
    const prev = this.answeredQuestions.get(questionId);
    if (prev === undefined) return;

    const stats = this.state.studentStats[this.peerId];
    if (stats) {
      if (prev === true) stats.correctCount = Math.max(0, stats.correctCount - 1);
      else stats.incorrectCount = Math.max(0, stats.incorrectCount - 1);
      this.notify();
    }

    this.answeredQuestions.delete(questionId);
    this.emit('STUDENT_ANSWER_LOG', { questionId, correctCount: stats?.correctCount ?? 0, incorrectCount: stats?.incorrectCount ?? 0 });
  }

  private emit(type: RoomMessageType, payload?: RoomMessagePayload, timestamp = Date.now()): void {
    if (!this.state.roomId) return;
    roomChannel.send({ type, roomId: this.state.roomId, senderId: this.peerId, senderName: this.state.userName, isHost: this.state.isHost, timestamp, payload });
  }

  private scheduleSyncBroadcast(): void {
    if (this.syncDebounceTimer) return;
    this.syncDebounceTimer = setTimeout(() => {
      this.syncDebounceTimer = null;
      this.broadcastRoomSync();
    }, 150);
  }

  private broadcastRoomSync(): void {
    this.emit('ROOM_SYNC', { participants: this.state.participants, studentStats: this.state.studentStats, isPaused: this.state.isPaused });
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
        setHelpRequested: (val: boolean) => { this.state.helpRequested = val; this.notify(); },
        setPaused: (val: boolean) => {
          const wasPaused = this.state.isPaused;
          this.state.isPaused = val;
          this.notify();
          if (wasPaused && !val) { for (const cb of this.resumeListeners) cb(); }
        },
        leaveRoom: () => this.leaveRoom(),
        scheduleSyncBroadcast: () => this.scheduleSyncBroadcast(),
        notify: () => this.notify(),
      },
      msg
    );
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (!this.state.roomId) return;
      const now = Date.now();

      if (this.state.isHost) {
        // Hoca: Odayı senkronize et ve 22 sn'dir sinyal vermeyen öğrencileri kontrol et (Watchdog)
        this.checkOfflineStudents(now);
        this.broadcastRoomSync();
      } else {
        // Öğrenci: Hocaya hafif kalp atışı sinyali gönder
        this.emit('STUDENT_HEARTBEAT', undefined, now);
      }
    }, 10000);
  }

  private checkOfflineStudents(now: number): void {
    let changed = false;
    for (const [id, stats] of Object.entries(this.state.studentStats)) {
      const lastSeen = stats.lastSeenAt || stats.joinedAt;
      const isCurrentlyOnline = (now - lastSeen) < 22000;
      if (stats.isOnline !== isCurrentlyOnline) {
        stats.isOnline = isCurrentlyOnline;
        changed = true;
        if (!isCurrentlyOnline) {
          addFeedItem(this.state.feedItems, {
            id: `${now}_${id}_disconnect`,
            type: 'DISCONNECTED',
            studentId: id,
            studentName: stats.name,
            timestamp: now,
          });
        }
      }
    }
    if (changed) {
      this.notify();
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private clearSyncDebounce(): void {
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
      this.syncDebounceTimer = null;
    }
  }

  private resetState(): void {
    this.answeredQuestions.clear();
    this.state = { ...INITIAL_ROOM_STATE, participants: [], feedItems: [], studentStats: {} };
  }

  private notify(): void {
    for (const listener of this.listeners) listener(this.state);
  }
}

export const roomService = new RoomService();
