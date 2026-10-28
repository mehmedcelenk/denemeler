import type { RoomFeedItem, RoomMessage, RoomParticipant, StudentStats } from './types.ts';
import { showRoomToast } from './toast.ts';

export interface MessageContext {
  peerId: string;
  roomId: string | null;
  userName: string;
  isHost: boolean;
  isPaused: boolean;
  participants: RoomParticipant[];
  feedItems: RoomFeedItem[];
  studentStats: Record<string, StudentStats>;
  helpRequested: boolean;
  setHelpRequested: (val: boolean) => void;
  setPaused: (val: boolean) => void;
  leaveRoom: () => void;
  scheduleSyncBroadcast: () => void;
  notify: () => void;
}

export function handleIncomingRoomMessage(ctx: MessageContext, msg: RoomMessage): void {
  if (!msg || typeof msg !== 'object' || msg.roomId !== ctx.roomId || msg.senderId === ctx.peerId) {
    return;
  }

  const senderId = typeof msg.senderId === 'string' ? msg.senderId.trim().slice(0, 50) : '';
  const senderName = typeof msg.senderName === 'string' ? msg.senderName.trim().slice(0, 60) : 'Anonim';
  if (!senderId) return;

  const timestamp = Number.isFinite(msg.timestamp) && msg.timestamp > 0 ? msg.timestamp : Date.now();
  const existingPeer = ctx.participants.find((p) => p.id === senderId);
  if (existingPeer) {
    existingPeer.lastSeenAt = timestamp;
  }
  const existingStats = ctx.studentStats[senderId];
  if (existingStats) {
    existingStats.lastSeenAt = timestamp;
    existingStats.isOnline = true;
  }

  // Doğrulanmış Hoca Kontrolü: Katılımcı listesinde kayıtlı ve isHost: true ise veya odada henüz hiç kimse yoksa
  const isSenderHost = existingPeer ? existingPeer.isHost : (!ctx.participants.some((p) => p.isHost) && !!msg.isHost);

  switch (msg.type) {
    case 'PEER_JOIN': {
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

      const hasAnyHost = ctx.participants.some((p) => p.isHost);
      const isOldestPeer = ctx.participants[0]?.id === ctx.peerId;
      if (ctx.isHost || (!hasAnyHost && isOldestPeer)) {
        ctx.scheduleSyncBroadcast();
      }
      ctx.notify();
      break;
    }

    case 'STUDENT_HEARTBEAT': {
      // Kalp atışı alındı, son görülme ve çevrimiçi durumu yukarıda tazelendi
      ctx.notify();
      break;
    }

    case 'ROOM_SYNC': {
      // Yalnızca hoca veya lider düğümün ROOM_SYNC paketleri kabul edilir
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
      break;
    }

    case 'PEER_LEAVE': {
      const idx = ctx.participants.findIndex((p) => p.id === senderId);
      if (idx !== -1) ctx.participants.splice(idx, 1);
      addFeedItem(ctx.feedItems, {
        id: `${timestamp}_${senderId}_leave`,
        type: 'LEAVE',
        studentId: senderId,
        studentName: senderName,
        timestamp,
      });
      ctx.notify();
      break;
    }

    case 'FOCUS_LOST': {
      const openLost = ctx.feedItems.find(
        (f) => f.type === 'FOCUS_LOST' && f.studentId === senderId && !f.returnedAt
      );
      const reason = msg.payload?.reason === 'SCREEN_LOCK' ? 'SCREEN_LOCK' : 'APP_SWITCH';

      // İhlal sayacını artır
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
          reason,
        });
        ctx.notify();
      }
      break;
    }

    case 'FOCUS_RESTORED': {
      const lastLost = ctx.feedItems.find(
        (f) => f.type === 'FOCUS_LOST' && f.studentId === senderId && !f.returnedAt
      );
      const durationMs = Number.isFinite(msg.payload?.durationMs) && (msg.payload?.durationMs ?? 0) > 0
        ? (msg.payload?.durationMs ?? 0)
        : (lastLost ? Math.max(0, timestamp - lastLost.timestamp) : 0);

      const stats = ctx.studentStats[senderId];
      if (stats && durationMs > 0) {
        stats.totalAwayMs = (stats.totalAwayMs || 0) + durationMs;
      }

      if (lastLost) {
        lastLost.returnedAt = timestamp;
        ctx.notify();
      }
      break;
    }

    case 'SUSPICIOUS_ACT': {
      // Şüpheli işlem bildirimi (örn. soru metni kopyalama)
      const details = typeof msg.payload?.details === 'string' ? msg.payload.details.slice(0, 80) : '';
      addFeedItem(ctx.feedItems, {
        id: `${timestamp}_${senderId}_suspicious`,
        type: 'SUSPICIOUS_COPY',
        studentId: senderId,
        studentName: senderName,
        timestamp,
        details,
      });
      ctx.notify();
      break;
    }

    case 'HELP_CALL': {
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
        ctx.notify();
      }
      break;
    }

    case 'HELP_RESOLVED': {
      if (!isSenderHost && ctx.participants.some((p) => p.isHost)) return;

      const isTargetStudent = msg.payload?.studentId
        ? msg.payload.studentId === ctx.peerId
        : msg.payload?.studentName === ctx.userName;

      if (isTargetStudent) {
        ctx.setHelpRequested(false);
      }
      const helpItem = ctx.feedItems.find((f) => f.id === msg.payload?.feedId);
      if (helpItem) {
        helpItem.resolved = true;
      }
      ctx.notify();
      break;
    }

    case 'ROOM_PAUSE': {
      if (!isSenderHost) return;
      const paused = !!msg.payload?.isPaused;
      ctx.setPaused(paused);
      break;
    }

    case 'ROOM_CLOSE': {
      if (!isSenderHost) return;
      showRoomToast('Oturum Kapatıldı', 'Hoca tarafından oturum sonlandırıldı.', '🛑');
      ctx.leaveRoom();
      break;
    }

    case 'AWARD_STAR': {
      if (!isSenderHost) return;
      const isTarget = msg.payload?.studentId
        ? msg.payload.studentId === ctx.peerId
        : msg.payload?.studentName === ctx.userName;

      if (isTarget) {
        showRoomToast('Tebrikler!', 'Hocandan yıldız aldın! ⭐', '🌟');
      }
      break;
    }

    case 'BROADCAST_ANNOUNCEMENT': {
      if (!isSenderHost) return;
      const text = typeof msg.payload?.text === 'string' ? msg.payload.text.trim().slice(0, 280) : '';
      if (text) {
        showRoomToast(`Duyuru (${senderName})`, text, '📢');
      }
      break;
    }

    case 'STUDENT_ANSWER_LOG': {
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
      break;
    }
  }
}

export function addFeedItem(feedItems: RoomFeedItem[], item: RoomFeedItem): void {
  if (!feedItems.some((f) => f.id === item.id)) {
    feedItems.unshift(item);
    if (feedItems.length > 100) {
      feedItems.pop();
    }
  }
}
