import type { RoomMessageType } from '../types.ts';
import type { RoomMessageHandler } from './context.ts';
import { showRoomToast } from '../toast.ts';
import { isOlderPeer } from './helpers.ts';

export const hostMessageHandlers: Partial<Record<RoomMessageType, RoomMessageHandler>> = {
  ROOM_SYNC: (ctx, incoming) => {
    const { msg, senderId, senderName, timestamp, isSenderHost } = incoming;
    const incomingList = Array.isArray(msg.payload?.participants) ? msg.payload.participants : [];
    const incomingHost = incomingList.find((p) => p && p.isHost) || (msg.isHost
      ? { id: senderId, name: senderName, isHost: true, joinedAt: msg.payload?.joinedAt ?? timestamp }
      : undefined);

    if (ctx.isHost) {
      if (incomingHost && incomingHost.id !== ctx.peerId) {
        const myPeer = ctx.participants.find((p) => p.id === ctx.peerId);
        const myJoinedAt = myPeer?.joinedAt ?? timestamp;
        const theirJoinedAt = Number.isFinite(incomingHost.joinedAt) ? incomingHost.joinedAt : timestamp;

        if (isOlderPeer(theirJoinedAt, incomingHost.id, myJoinedAt, ctx.peerId)) {
          ctx.demoteToStudent();
          for (const p of ctx.participants) {
            p.isHost = p.id === incomingHost.id;
          }
          delete ctx.studentStats[incomingHost.id];
        } else {
          const existing = ctx.participants.find((p) => p.id === senderId);
          if (existing) {
            existing.isHost = false;
          } else {
            ctx.participants.push({
              id: senderId,
              name: senderName,
              isHost: false,
              joinedAt: theirJoinedAt,
              lastSeenAt: timestamp,
            });
          }
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
          ctx.scheduleSyncBroadcast();
          ctx.notify();
          return;
        }
      } else {
        return;
      }
    }

    if (!isSenderHost && !incomingHost && ctx.participants.some((p) => p.isHost)) return;

    if (msg.payload && Array.isArray(msg.payload.participants)) {
      const winnerHostId = incomingHost?.id;
      const incomingIds = new Set<string>();
      for (const inc of msg.payload.participants) {
        if (!inc || typeof inc.id !== 'string') continue;
        const cleanId = inc.id.slice(0, 50);
        incomingIds.add(cleanId);
        const existing = ctx.participants.find((p) => p.id === cleanId);
        const peerIsHost = winnerHostId ? cleanId === winnerHostId : !!inc.isHost;
        if (!existing) {
          ctx.participants.push({
            id: cleanId,
            name: (inc.name || 'Öğrenci').slice(0, 60),
            isHost: peerIsHost,
            joinedAt: Number.isFinite(inc.joinedAt) ? inc.joinedAt : Date.now(),
            lastSeenAt: Number.isFinite(inc.lastSeenAt) ? inc.lastSeenAt : Date.now(),
          });
        } else {
          existing.name = (inc.name || existing.name).slice(0, 60);
          existing.isHost = peerIsHost;
        }
        if (peerIsHost) {
          delete ctx.studentStats[cleanId];
        }
      }
      for (let i = ctx.participants.length - 1; i >= 0; i--) {
        const p = ctx.participants[i];
        if (p.id !== ctx.peerId && !incomingIds.has(p.id)) {
          ctx.participants.splice(i, 1);
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
            isOnline: stats?.isOnline ?? true,
            answers: stats?.answers && typeof stats.answers === 'object' ? { ...stats.answers } : undefined,
          };
        } else {
          existing.name = (stats?.name || existing.name).slice(0, 60);
          existing.exitCount = Math.max(existing.exitCount, incomingExits);
          existing.totalAwayMs = Math.max(existing.totalAwayMs, incomingAwayMs);
          if (stats?.answers && typeof stats.answers === 'object') {
            existing.answers = { ...(existing.answers || {}), ...stats.answers };
          }
          if (id !== ctx.peerId) {
            existing.correctCount = Math.max(existing.correctCount, incomingCorrect);
            existing.incorrectCount = Math.max(existing.incorrectCount, incomingIncorrect);
            existing.isOnline = stats?.isOnline ?? existing.isOnline;
          }
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
