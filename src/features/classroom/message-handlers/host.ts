import type { RoomMessageType } from '../types.ts';
import type { RoomMessageHandler } from './context.ts';
import { showRoomToast } from '../toast.ts';

export const hostMessageHandlers: Partial<Record<RoomMessageType, RoomMessageHandler>> = {
  ROOM_SYNC: (ctx, incoming) => {
    const { msg, isSenderHost } = incoming;
    if (!isSenderHost && ctx.participants.some((p) => p.isHost)) return;

    if (msg.payload && Array.isArray(msg.payload.participants)) {
      for (const inc of msg.payload.participants) {
        if (inc && typeof inc.id === 'string' && !ctx.participants.some((p) => p.id === inc.id)) {
          ctx.participants.push({
            id: inc.id.slice(0, 50),
            name: (inc.name || 'Öğrenci').slice(0, 60),
            isHost: !!inc.isHost,
            joinedAt: Number.isFinite(inc.joinedAt) ? inc.joinedAt : Date.now(),
            lastSeenAt: Number.isFinite(inc.lastSeenAt) ? inc.lastSeenAt : Date.now(),
          });
        }
      }
    }
    if (msg.payload && msg.payload.studentStats && typeof msg.payload.studentStats === 'object') {
      for (const [id, stats] of Object.entries(msg.payload.studentStats)) {
        const targetPeer = ctx.participants.find((p) => p.id === id);
        if (targetPeer && targetPeer.isHost) continue;

        const existing = ctx.studentStats[id];
        const incomingCorrect = Number.isFinite(stats?.correctCount) && stats.correctCount >= 0 ? stats.correctCount : 0;
        const incomingIncorrect = Number.isFinite(stats?.incorrectCount) && stats.incorrectCount >= 0 ? stats.incorrectCount : 0;
        const incomingExits = Number.isFinite(stats?.exitCount) && stats.exitCount >= 0 ? stats.exitCount : 0;
        const incomingAwayMs = Number.isFinite(stats?.totalAwayMs) && stats.totalAwayMs >= 0 ? stats.totalAwayMs : 0;

        if (!existing) {
          ctx.studentStats[id] = {
            id,
            name: (stats?.name || 'Öğrenci').slice(0, 60),
            correctCount: incomingCorrect,
            incorrectCount: incomingIncorrect,
            joinedAt: Number.isFinite(stats?.joinedAt) ? stats.joinedAt : Date.now(),
            exitCount: incomingExits,
            totalAwayMs: incomingAwayMs,
            lastSeenAt: Number.isFinite(stats?.lastSeenAt) ? stats.lastSeenAt : Date.now(),
            isOnline: true,
          };
        } else if (id !== ctx.peerId) {
          existing.correctCount = Math.max(existing.correctCount, incomingCorrect);
          existing.incorrectCount = Math.max(existing.incorrectCount, incomingIncorrect);
          existing.exitCount = Math.max(existing.exitCount, incomingExits);
          existing.totalAwayMs = Math.max(existing.totalAwayMs, incomingAwayMs);
        }
      }
    }
    if (msg.payload && typeof msg.payload.isPaused === 'boolean') {
      ctx.setPaused(msg.payload.isPaused);
    }
    ctx.notify();
  },

  HELP_RESOLVED: (ctx, incoming) => {
    const { msg, isSenderHost } = incoming;
    if (!isSenderHost && ctx.participants.some((p) => p.isHost)) return;

    const isTargetStudent = msg.payload?.studentId
      ? msg.payload.studentId === ctx.peerId
      : msg.payload?.studentName?.trim().toLowerCase() === ctx.userName.trim().toLowerCase();

    if (isTargetStudent) {
      ctx.setHelpRequested(false);
    }
    const helpItem = ctx.feedItems.find((f) => f.id === msg.payload?.feedId);
    if (helpItem) {
      helpItem.resolved = true;
    }
    ctx.notify();
  },

  ROOM_PAUSE: (ctx, incoming) => {
    const { msg, isSenderHost } = incoming;
    if (!isSenderHost) return;
    const paused = !!msg.payload?.isPaused;
    ctx.setPaused(paused);
  },

  ROOM_CLOSE: (ctx, incoming) => {
    const { isSenderHost } = incoming;
    if (!isSenderHost) return;
    showRoomToast('Oturum Kapatıldı', 'Hoca tarafından oturum sonlandırıldı.', '🛑');
    ctx.leaveRoom();
  },

  AWARD_STAR: (ctx, incoming) => {
    const { msg, isSenderHost } = incoming;
    if (!isSenderHost) return;
    const myId = ctx.peerId.trim();
    const myName = ctx.userName.trim().toLowerCase();
    const targetId = (msg.payload?.studentId || '').trim();
    const targetName = (msg.payload?.studentName || '').trim().toLowerCase();

    const isTarget = (targetId && targetId === myId) || (targetName && targetName === myName);

    if (isTarget) {
      showRoomToast('Tebrikler!', 'Hocandan yıldız aldın! ⭐', '🌟');
    }
  },

  BROADCAST_ANNOUNCEMENT: (ctx, incoming) => {
    const { msg, senderName, isSenderHost } = incoming;
    if (!isSenderHost) return;
    const text = typeof msg.payload?.text === 'string' ? msg.payload.text.trim().slice(0, 280) : '';
    if (text) {
      showRoomToast(`Duyuru (${senderName})`, text, '📢');
    }
  },
};
