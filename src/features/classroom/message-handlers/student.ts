import type { RoomMessageType } from '../types.ts';
import type { RoomMessageHandler } from './context.ts';
import { showRoomToast } from '../toast.ts';
import { addFeedItem } from './feed.ts';

export const studentMessageHandlers: Partial<Record<RoomMessageType, RoomMessageHandler>> = {
  PEER_JOIN: (ctx, incoming) => {
    const { msg, senderId, senderName, timestamp, existingPeer } = incoming;
    const alreadyHasHost = ctx.participants.some((p) => p.isHost);
    // Korsan öğrencinin odaya sonradan girip kendisini sahte hoca ilan etmesini engelle (Host Takeover Kalkanı)
    const allowedAsHost = alreadyHasHost ? false : !!msg.isHost;

    if (!existingPeer) {
      ctx.participants.push({
        id: senderId,
        name: senderName,
        isHost: allowedAsHost,
        joinedAt: timestamp,
        lastSeenAt: timestamp,
      });
    }
    // Hoca hiçbir zaman studentStats tablosuna eklenmez
    if (!allowedAsHost && !ctx.studentStats[senderId]) {
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

    const hasAnyHost = ctx.participants.some((p) => p.isHost);
    const isOldestPeer = ctx.participants[0]?.id === ctx.peerId;
    if (ctx.isHost || (!hasAnyHost && isOldestPeer)) {
      ctx.scheduleSyncBroadcast();
    }
    ctx.notify();
  },

  STUDENT_HEARTBEAT: (ctx) => {
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
        showRoomToast('Geri Döndü', `${senderName} geri döndü (${sec} sn).`, '🟢');
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

      currentStats.correctCount = Math.min(currentStats.correctCount + 1, rawCorrect);
      currentStats.incorrectCount = Math.min(currentStats.incorrectCount + 1, rawIncorrect);
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
