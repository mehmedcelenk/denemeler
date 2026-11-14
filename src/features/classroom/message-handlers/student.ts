import type { RoomMessageType } from '../types.ts';
import type { RoomMessageHandler } from './context.ts';
import { showRoomToast } from '../toast.ts';
import { addFeedItem } from './feed.ts';
import {
  isOlderPeer,
  mergeOfflineStudentBySameName,
  mergePayloadStats,
  reconcileStudentReturn,
} from './helpers.ts';

export const studentMessageHandlers: Partial<Record<RoomMessageType, RoomMessageHandler>> = {
  PEER_JOIN: (ctx, incoming) => {
    const { msg, senderId, senderName, timestamp, existingPeer } = incoming;
    const theirJoinedAt = Number.isFinite(msg.payload?.joinedAt) && (msg.payload?.joinedAt ?? 0) > 0
      ? (msg.payload?.joinedAt ?? timestamp)
      : (existingPeer?.joinedAt ?? timestamp);

    let allowedAsHost = false;
    if (msg.isHost) {
      if (ctx.isHost) {
        // Odada zaten aktif bir Hoca varken sonradan gelen PEER_JOIN (saat farkı / arşivli joinedAt olsa dahi) hocayı düşüremez
        allowedAsHost = false;
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

    const wasAlreadyKnownStudent = Boolean(ctx.studentStats[senderId])
      || (!allowedAsHost && mergeOfflineStudentBySameName(ctx, senderId, senderName, timestamp));

    if (!existingPeer) {
      ctx.participants.push({
        id: senderId,
        name: senderName,
        isHost: allowedAsHost,
        joinedAt: theirJoinedAt,
        lastSeenAt: timestamp,
      });
    } else {
      existingPeer.name = senderName;
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

      if (wasAlreadyKnownStudent) {
        reconcileStudentReturn(ctx, senderId, senderName, timestamp, msg.payload);
      } else {
        addFeedItem(ctx.feedItems, {
          id: `${timestamp}_${senderId}_join`,
          type: 'JOIN',
          studentId: senderId,
          studentName: senderName,
          timestamp,
        });
        if (ctx.isHost) {
          showRoomToast('Katılım', `${senderName} katıldı.`, '🟢');
        }
        if ((msg.payload?.awayDurationMs ?? 0) > 0) {
          reconcileStudentReturn(ctx, senderId, senderName, timestamp, msg.payload);
        }
      }
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

    let changed = false;
    if (!existingPeer) {
      ctx.participants.push({
        id: senderId,
        name: senderName,
        isHost: false,
        joinedAt: theirJoinedAt,
        lastSeenAt: timestamp,
      });
      changed = true;
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
        changed = true;
      }
      if (mergePayloadStats(ctx.studentStats[senderId], msg.payload)) {
        changed = true;
      }
      if (reconcileStudentReturn(ctx, senderId, senderName, timestamp, msg.payload)) {
        changed = true;
      }
    }
    if (changed) {
      ctx.notify();
    }
  },

  PEER_LEAVE: (ctx, incoming) => {
    const { senderId, senderName, timestamp } = incoming;
    const leavingPeer = ctx.participants.find((p) => p.id === senderId);
    const wasHost = (leavingPeer?.isHost ?? false) || Boolean(incoming.isSenderHost) || Boolean(incoming.existingPeer?.isHost);

    const idx = ctx.participants.findIndex((p) => p.id === senderId);
    if (idx !== -1) ctx.participants.splice(idx, 1);
    const stats = ctx.studentStats[senderId];
    if (stats) {
      stats.isOnline = false;
      stats.exitCount = (stats.exitCount || 0) + 1;
    }
    if (wasHost && !ctx.isHost) {
      ctx.setPaused(false);
    }
    if (ctx.isHost) {
      const openExit = ctx.feedItems.find(
        (f) => (f.type === 'FOCUS_LOST' || f.type === 'LEAVE') && f.studentId === senderId && !f.returnedAt
      );
      if (!openExit) {
        addFeedItem(ctx.feedItems, {
          id: `${timestamp}_${senderId}_leave`,
          type: 'LEAVE',
          studentId: senderId,
          studentName: senderName,
          timestamp,
        });
        showRoomToast('Ayrıldı', `${senderName} ayrıldı.`, '⚪');
      }
    }
    ctx.notify();
  },

  FOCUS_LOST: (ctx, incoming) => {
    if (!ctx.isHost) return;
    const { senderId, senderName, timestamp } = incoming;
    const openLost = ctx.feedItems.find(
      (f) => f.type === 'FOCUS_LOST' && f.studentId === senderId && !f.returnedAt
    );

    const stats = ctx.studentStats[senderId];
    if (stats) {
      stats.isOnline = false;
      if (!openLost) {
        stats.exitCount = (stats.exitCount || 0) + 1;
      }
    }

    if (!openLost) {
      addFeedItem(ctx.feedItems, {
        id: `${timestamp}_${senderId}_lost`,
        type: 'FOCUS_LOST',
        studentId: senderId,
        studentName: senderName,
        timestamp,
      });
      showRoomToast('Ayrıldı', `${senderName} uygulamadan ayrıldı.`, '⚪');
      ctx.notify();
    }
  },

  FOCUS_RESTORED: (ctx, incoming) => {
    if (!ctx.isHost) return;
    const { msg, senderId, senderName, timestamp } = incoming;
    const stats = ctx.studentStats[senderId];
    if (stats) {
      mergePayloadStats(stats, msg.payload);
    }
    if (reconcileStudentReturn(ctx, senderId, senderName, timestamp, msg.payload)) {
      ctx.notify();
    }
  },

  HELP_CALL: (ctx, incoming) => {
    if (!ctx.isHost) return;
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
      showRoomToast('Yardım Çağrısı', `${senderName} el kaldırdı! ✋`, '✋');
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
    reconcileStudentReturn(ctx, senderId, senderName, timestamp, msg.payload);

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
        answers: msg.payload.answers,
        questionId: msg.payload.questionId,
        isCorrect: msg.payload.isCorrect,
      });
    } else if (msg.payload && typeof msg.payload.isCorrect === 'boolean') {
      if (msg.payload.isCorrect) currentStats.correctCount++;
      else currentStats.incorrectCount++;
      mergePayloadStats(currentStats, { questionId: msg.payload.questionId, isCorrect: msg.payload.isCorrect, answers: msg.payload.answers });
    }
    ctx.notify();
  },
};
