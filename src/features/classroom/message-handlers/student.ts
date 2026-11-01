import type { RoomMessagePayload, RoomMessageType, StudentStats } from '../types.ts';
import type { RoomMessageHandler } from './context.ts';
import { showRoomToast } from '../toast.ts';
import { addFeedItem } from './feed.ts';

function isOlderPeer(aJoinedAt: number, aId: string, bJoinedAt: number, bId: string): boolean {
  if (aJoinedAt !== bJoinedAt) return aJoinedAt < bJoinedAt;
  return aId.localeCompare(bId) < 0;
}

function mergePayloadStats(target: StudentStats, payload?: RoomMessagePayload): void {
  if (!payload) return;
  if (typeof payload.correctCount === 'number' && Number.isFinite(payload.correctCount) && payload.correctCount >= 0) {
    target.correctCount = Math.max(target.correctCount, payload.correctCount);
  }
  if (typeof payload.incorrectCount === 'number' && Number.isFinite(payload.incorrectCount) && payload.incorrectCount >= 0) {
    target.incorrectCount = Math.max(target.incorrectCount, payload.incorrectCount);
  }
  if (typeof payload.exitCount === 'number' && Number.isFinite(payload.exitCount) && payload.exitCount >= 0) {
    target.exitCount = Math.max(target.exitCount, payload.exitCount);
  }
  if (typeof payload.totalAwayMs === 'number' && Number.isFinite(payload.totalAwayMs) && payload.totalAwayMs >= 0) {
    target.totalAwayMs = Math.max(target.totalAwayMs, payload.totalAwayMs);
  }
}

export const studentMessageHandlers: Partial<Record<RoomMessageType, RoomMessageHandler>> = {
  PEER_JOIN: (ctx, incoming) => {
    const { msg, senderId, senderName, timestamp, existingPeer } = incoming;
    const theirJoinedAt = Number.isFinite(msg.payload?.joinedAt) && (msg.payload?.joinedAt ?? 0) > 0
      ? (msg.payload?.joinedAt ?? timestamp)
      : (existingPeer?.joinedAt ?? timestamp);

    let allowedAsHost = false;
    if (msg.isHost) {
      if (ctx.isHost) {
        const myPeer = ctx.participants.find((p) => p.id === ctx.peerId);
        const myJoinedAt = myPeer?.joinedAt ?? timestamp;
        if (isOlderPeer(theirJoinedAt, senderId, myJoinedAt, ctx.peerId)) {
          // Karşıdaki Host benden daha eski -> kendimi öğrenciye düşür, onu tek Host yap
          ctx.demoteToStudent();
          for (const p of ctx.participants) p.isHost = false;
          allowedAsHost = true;
        } else {
          // Ben daha eski Host'um -> yeni geleni öğrenci yap
          allowedAsHost = false;
        }
      } else {
        const currentHost = ctx.participants.find((p) => p.isHost);
        if (!currentHost) {
          allowedAsHost = true;
        } else if (isOlderPeer(theirJoinedAt, senderId, currentHost.joinedAt, currentHost.id)) {
          currentHost.isHost = false;
          allowedAsHost = true;
        }
      }
    }

    if (!existingPeer) {
      ctx.participants.push({
        id: senderId,
        name: senderName,
        isHost: allowedAsHost,
        joinedAt: theirJoinedAt,
        lastSeenAt: timestamp,
      });
    } else {
      existingPeer.isHost = allowedAsHost;
      existingPeer.joinedAt = Math.min(existingPeer.joinedAt, theirJoinedAt);
      existingPeer.lastSeenAt = timestamp;
    }

    if (allowedAsHost) {
      delete ctx.studentStats[senderId];
    } else {
      if (!ctx.studentStats[senderId]) {
        ctx.studentStats[senderId] = {
          id: senderId,
          name: senderName,
          correctCount: 0,
          incorrectCount: 0,
          joinedAt: theirJoinedAt,
          exitCount: 0,
          totalAwayMs: 0,
          lastSeenAt: timestamp,
          isOnline: true,
        };
      }
      mergePayloadStats(ctx.studentStats[senderId], msg.payload);
    }

    addFeedItem(ctx.feedItems, {
      id: `${timestamp}_${senderId}_join`,
      type: 'JOIN',
      studentId: senderId,
      studentName: senderName,
      timestamp,
    });

    if (ctx.isHost && !allowedAsHost) {
      showRoomToast('Katılım', `${senderName} katıldı.`, '🟢');
    }

    const hasAnyHost = ctx.participants.some((p) => p.isHost);
    const isOldestPeer = ctx.participants[0]?.id === ctx.peerId;
    if (ctx.isHost || (!hasAnyHost && isOldestPeer)) {
      ctx.scheduleSyncBroadcast();
    }
    ctx.notify();
  },

  STUDENT_HEARTBEAT: (ctx, incoming) => {
    const { msg, senderId, senderName, timestamp, existingPeer } = incoming;
    const theirJoinedAt = Number.isFinite(msg.payload?.joinedAt) && (msg.payload?.joinedAt ?? 0) > 0
      ? (msg.payload?.joinedAt ?? timestamp)
      : (existingPeer?.joinedAt ?? timestamp);

    if (!existingPeer) {
      ctx.participants.push({
        id: senderId,
        name: senderName,
        isHost: false,
        joinedAt: theirJoinedAt,
        lastSeenAt: timestamp,
      });
    }
    const targetPeer = ctx.participants.find((p) => p.id === senderId);
    if (!targetPeer?.isHost) {
      if (!ctx.studentStats[senderId]) {
        ctx.studentStats[senderId] = {
          id: senderId,
          name: senderName,
          correctCount: 0,
          incorrectCount: 0,
          joinedAt: theirJoinedAt,
          exitCount: 0,
          totalAwayMs: 0,
          lastSeenAt: timestamp,
          isOnline: true,
        };
      }
      mergePayloadStats(ctx.studentStats[senderId], msg.payload);
    }
    ctx.notify();
  },

  PEER_LEAVE: (ctx, incoming) => {
    const { senderId, senderName, timestamp } = incoming;
    const idx = ctx.participants.findIndex((p) => p.id === senderId);
    if (idx !== -1) ctx.participants.splice(idx, 1);
    const stats = ctx.studentStats[senderId];
    if (stats) {
      stats.isOnline = false;
      stats.exitCount = (stats.exitCount || 0) + 1;
    }
    addFeedItem(ctx.feedItems, { id: `${timestamp}_${senderId}_leave`, type: 'LEAVE', studentId: senderId, studentName: senderName, timestamp });
    if (ctx.isHost) {
      showRoomToast('Ayrıldı', `${senderName} ayrıldı.`, '⚪');
    }
    ctx.notify();
  },

  FOCUS_LOST: (ctx, incoming) => {
    const { senderId, senderName, timestamp } = incoming;
    const openLost = ctx.feedItems.find(
      (f) => f.type === 'FOCUS_LOST' && f.studentId === senderId && !f.returnedAt
    );

    const stats = ctx.studentStats[senderId];
    if (stats) {
      stats.isOnline = false;
      stats.exitCount = (stats.exitCount || 0) + 1;
    }

    if (!openLost) {
      addFeedItem(ctx.feedItems, {
        id: `${timestamp}_${senderId}_lost`,
        type: 'FOCUS_LOST',
        studentId: senderId,
        studentName: senderName,
        timestamp,
      });
      if (ctx.isHost) {
        showRoomToast('Ayrıldı', `${senderName} uygulamadan ayrıldı.`, '⚪');
      }
      ctx.notify();
    }
  },

  FOCUS_RESTORED: (ctx, incoming) => {
    const { msg, senderId, senderName, timestamp } = incoming;
    const lastLost = ctx.feedItems.find(
      (f) => f.type === 'FOCUS_LOST' && f.studentId === senderId && !f.returnedAt
    );
    const durationMs = Number.isFinite(msg.payload?.durationMs) && (msg.payload?.durationMs ?? 0) > 0
      ? (msg.payload?.durationMs ?? 0)
      : (lastLost ? Math.max(0, timestamp - lastLost.timestamp) : 0);

    const stats = ctx.studentStats[senderId];
    if (stats) {
      stats.isOnline = true;
      if (durationMs > 0) {
        stats.totalAwayMs = (stats.totalAwayMs || 0) + durationMs;
      }
    }

    if (lastLost) {
      lastLost.returnedAt = timestamp;
      if (ctx.isHost) {
        const sec = Math.round(durationMs / 1000);
        showRoomToast('Yeniden Katıldı', `${senderName} geri döndü (${sec} sn).`, '🟢');
      }
      ctx.notify();
    }
  },

  HELP_CALL: (ctx, incoming) => {
    const { senderId, senderName, timestamp } = incoming;
    const openHelp = ctx.feedItems.find(
      (f) => f.type === 'HELP_CALL' && f.studentId === senderId && !f.resolved
    );
    if (!openHelp) {
      addFeedItem(ctx.feedItems, {
        id: `${timestamp}_${senderId}_help`,
        type: 'HELP_CALL',
        studentId: senderId,
        studentName: senderName,
        timestamp,
        resolved: false,
      });
      if (ctx.isHost) {
        showRoomToast('Yardım Çağrısı', `${senderName} el kaldırdı! ✋`, '✋');
      }
      ctx.notify();
    }
  },

  STUDENT_ANSWER_LOG: (ctx, incoming) => {
    const { msg, senderId, senderName, timestamp } = incoming;
    if (!ctx.studentStats[senderId]) {
      ctx.studentStats[senderId] = {
        id: senderId,
        name: senderName,
        correctCount: 0,
        incorrectCount: 0,
        joinedAt: timestamp,
        exitCount: 0,
        totalAwayMs: 0,
        lastSeenAt: timestamp,
        isOnline: true,
      };
    }

    const currentStats = ctx.studentStats[senderId];

    if (
      msg.payload &&
      typeof msg.payload.correctCount === 'number' &&
      typeof msg.payload.incorrectCount === 'number' &&
      Number.isFinite(msg.payload.correctCount) &&
      Number.isFinite(msg.payload.incorrectCount)
    ) {
      const rawCorrect = Math.max(0, msg.payload.correctCount);
      const rawIncorrect = Math.max(0, msg.payload.incorrectCount);

      if (msg.payload.questionId === undefined && rawCorrect <= 500 && rawIncorrect <= 500) {
        currentStats.correctCount = Math.max(currentStats.correctCount, rawCorrect);
        currentStats.incorrectCount = Math.max(currentStats.incorrectCount, rawIncorrect);
      } else {
        currentStats.correctCount = Math.min(currentStats.correctCount + 1, rawCorrect);
        currentStats.incorrectCount = Math.min(currentStats.incorrectCount + 1, rawIncorrect);
      }
      mergePayloadStats(currentStats, {
        exitCount: msg.payload.exitCount,
        totalAwayMs: msg.payload.totalAwayMs,
      });
    } else if (msg.payload && typeof msg.payload.isCorrect === 'boolean') {
      if (msg.payload.isCorrect) {
        currentStats.correctCount++;
      } else {
        currentStats.incorrectCount++;
      }
    }
    ctx.notify();
  },
};
