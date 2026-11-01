import { INITIAL_ROOM_STATE } from './initial-state.ts';
import type { RoomMessage, RoomMessagePayload, RoomMessageType, RoomState, StudentStats } from './types.ts';
import { roomChannel } from './room-channel.ts';
import { addFeedItem, handleIncomingRoomMessage } from './message-handler.ts';
import { clearRoomSession, loadRoomSession, persistCurrentRoomSession, saveRoomSession } from './session-store.ts';
import { releaseScreenWakeLock, requestScreenWakeLock } from './wake-lock.ts';
import { checkOfflineStudents } from './offline-students.ts';
import { demoteHostToStudent } from './demote.ts';
import { applyRevokeStudentAnswer, applyStudentAnswer, buildMyStatsPayload, createInitialStudentStats } from './student-progress.ts';

type Listener = (state: RoomState) => void;
type ResumeCallback = () => void;

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

  getPeerId(): string { return this.peerId; }
  getState(): RoomState { return this.state; }
  isHost(): boolean { return this.state.isHost; }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  onResume(callback: ResumeCallback): () => void {
    this.resumeListeners.add(callback);
    return () => this.resumeListeners.delete(callback);
  }

  joinOrCreateRoom(
    roomId: string,
    userName: string,
    asHost: boolean,
    savedPeerId?: string,
    savedJoinedAt?: number,
    savedStats?: StudentStats
  ): void {
    const cleanRoom = roomId.trim().toUpperCase();
    const cleanName = userName.trim();
    if (!cleanRoom || !cleanName) return;

    this.leaveRoom();
    if (savedPeerId) this.peerId = savedPeerId;

    const now = Date.now();
    const joinedAt = Number.isFinite(savedJoinedAt) && (savedJoinedAt ?? 0) > 0 ? (savedJoinedAt as number) : now;
    const myStudentStats = createInitialStudentStats(this.peerId, cleanName, joinedAt, now, savedStats);

    this.state = {
      roomId: cleanRoom,
      userName: cleanName,
      isHost: asHost,
      isPaused: false,
      participants: [{ id: this.peerId, name: cleanName, isHost: asHost, joinedAt, lastSeenAt: now }],
      feedItems: [{ id: `${now}_${this.peerId}`, type: 'JOIN', studentId: this.peerId, studentName: cleanName, timestamp: now }],
      studentStats: asHost ? {} : { [this.peerId]: myStudentStats },
      helpRequested: false,
    };

    saveRoomSession({ peerId: this.peerId, roomId: cleanRoom, userName: cleanName, isHost: asHost, joinedAt, timestamp: now, myStats: this.state.studentStats[this.peerId] });
    roomChannel.connect(cleanRoom, (msg) => this.handleIncoming(msg));
    requestScreenWakeLock().catch(() => {});
    this.emit('PEER_JOIN', buildMyStatsPayload(this.state, this.peerId, joinedAt), now);
    this.notify();
    this.startHeartbeat();
  }

  restoreSessionIfActive(): boolean {
    const data = loadRoomSession();
    if (data && data.roomId && data.userName && data.peerId) {
      const joinedAt = Number.isFinite(data.joinedAt) && data.joinedAt > 0 ? data.joinedAt : data.timestamp;
      this.joinOrCreateRoom(data.roomId, data.userName, !!data.isHost, data.peerId, joinedAt, data.myStats);
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

  awardStarToStudent(studentId: string, studentName: string): void {
    if (!this.state.roomId || !this.state.isHost) return;
    this.emit('AWARD_STAR', { studentId: studentId.trim(), studentName: studentName.trim() });
  }

  broadcastAnnouncement(text: string): void {
    const cleanText = text.trim();
    if (!this.state.roomId || !this.state.isHost || !cleanText) return;
    this.emit('BROADCAST_ANNOUNCEMENT', { text: cleanText });
  }

  demoteToStudent(): void {
    if (!this.state.isHost) return;
    demoteHostToStudent(this.state, this.peerId);
    const myPeer = this.state.participants.find((p) => p.id === this.peerId);
    const joinedAt = myPeer?.joinedAt ?? Date.now();
    this.emit('PEER_JOIN', buildMyStatsPayload(this.state, this.peerId, joinedAt));
    const stats = this.state.studentStats[this.peerId];
    if (stats) {
      this.emit('STUDENT_ANSWER_LOG', {
        correctCount: stats.correctCount,
        incorrectCount: stats.incorrectCount,
        exitCount: stats.exitCount,
        totalAwayMs: stats.totalAwayMs,
      });
    }
    this.notify();
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
    if (item) { item.resolved = true; this.notify(); }
    if (studentIdOrName === this.peerId || studentIdOrName === this.state.userName) {
      this.state.helpRequested = false;
      this.notify();
    }
    this.emit('HELP_RESOLVED', { feedId, studentId: studentIdOrName, studentName: studentIdOrName });
  }

  notifyFocusLost(timestamp = Date.now()): void {
    if (!this.state.roomId || this.state.isPaused) return;
    const openLost = this.state.feedItems.find((f) => f.type === 'FOCUS_LOST' && f.studentId === this.peerId && !f.returnedAt);
    if (openLost) return;

    const stats = this.state.studentStats[this.peerId];
    if (stats) {
      stats.exitCount = (stats.exitCount || 0) + 1;
      persistCurrentRoomSession(this.state, this.peerId);
    }

    addFeedItem(this.state.feedItems, { id: `${timestamp}_${this.peerId}_lost`, type: 'FOCUS_LOST', studentId: this.peerId, studentName: this.state.userName, timestamp });
    this.notify();
    this.emit('FOCUS_LOST', undefined, timestamp);
  }

  notifyFocusRestored(durationMs: number = 0, timestamp = Date.now()): void {
    if (!this.state.roomId || this.state.isPaused) return;
    const lastLost = this.state.feedItems.find((f) => f.type === 'FOCUS_LOST' && f.studentId === this.peerId && !f.returnedAt);
    if (lastLost) lastLost.returnedAt = timestamp;

    const stats = this.state.studentStats[this.peerId];
    if (stats && durationMs > 0) {
      stats.totalAwayMs = (stats.totalAwayMs || 0) + durationMs;
      persistCurrentRoomSession(this.state, this.peerId);
    }
    this.notify();
    this.emit('FOCUS_RESTORED', { durationMs }, timestamp);
  }

  logStudentAnswer(questionId: number, isCorrect: boolean): void {
    const payload = applyStudentAnswer(this.state, this.peerId, this.answeredQuestions, questionId, isCorrect);
    if (!payload) return;
    this.notify();
    this.emit('STUDENT_ANSWER_LOG', payload);
  }

  revokeStudentAnswer(questionId: number): void {
    const payload = applyRevokeStudentAnswer(this.state, this.peerId, this.answeredQuestions, questionId);
    if (!payload) return;
    this.notify();
    this.emit('STUDENT_ANSWER_LOG', payload);
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
        demoteToStudent: () => this.demoteToStudent(),
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
        if (checkOfflineStudents(this.state, now)) this.notify();
        this.broadcastRoomSync();
      } else {
        const myPeer = this.state.participants.find((p) => p.id === this.peerId);
        this.emit('STUDENT_HEARTBEAT', buildMyStatsPayload(this.state, this.peerId, myPeer?.joinedAt ?? now), now);
      }
    }, 8000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) { clearInterval(this.heartbeatTimer); this.heartbeatTimer = null; }
  }

  private clearSyncDebounce(): void {
    if (this.syncDebounceTimer) { clearTimeout(this.syncDebounceTimer); this.syncDebounceTimer = null; }
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
