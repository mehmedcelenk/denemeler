import type { RoomFeedItem, RoomMessage, RoomParticipant, StudentStats } from './types.ts';
import { roomChannel } from './room-channel.ts';
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
  notify: () => void;
}

export function handleIncomingRoomMessage(ctx: MessageContext, msg: RoomMessage): void {
  if (msg.roomId !== ctx.roomId || msg.senderId === ctx.peerId) {
    return;
  }

  switch (msg.type) {
    case 'PEER_JOIN': {
      const exists = ctx.participants.some((p) => p.id === msg.senderId);
      if (!exists) {
        ctx.participants.push({
          id: msg.senderId,
          name: msg.senderName,
          isHost: !!msg.isHost,
          joinedAt: msg.timestamp,
        });
      }
      if (!ctx.studentStats[msg.senderId]) {
        ctx.studentStats[msg.senderId] = {
          id: msg.senderId,
          name: msg.senderName,
          correctCount: 0,
          incorrectCount: 0,
          joinedAt: msg.timestamp,
        };
      }
      addFeedItem(ctx.feedItems, {
        id: `${msg.timestamp}_${msg.senderId}_join`,
        type: 'JOIN',
        studentName: msg.senderName,
        timestamp: msg.timestamp,
      });

      roomChannel.send({
        type: 'ROOM_SYNC',
        roomId: ctx.roomId,
        senderId: ctx.peerId,
        senderName: ctx.userName,
        isHost: ctx.isHost,
        timestamp: Date.now(),
        payload: {
          participants: ctx.participants,
          studentStats: ctx.studentStats,
          isPaused: ctx.isPaused,
        },
      });
      ctx.notify();
      break;
    }

    case 'ROOM_SYNC': {
      if (msg.payload && Array.isArray(msg.payload.participants)) {
        for (const inc of msg.payload.participants as RoomParticipant[]) {
          if (!ctx.participants.some((p) => p.id === inc.id)) {
            ctx.participants.push(inc);
          }
        }
      }
      if (msg.payload && msg.payload.studentStats) {
        for (const [id, stats] of Object.entries(msg.payload.studentStats as Record<string, StudentStats>)) {
          if (!ctx.studentStats[id]) {
            ctx.studentStats[id] = stats;
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
      const idx = ctx.participants.findIndex((p) => p.id === msg.senderId);
      if (idx !== -1) ctx.participants.splice(idx, 1);
      addFeedItem(ctx.feedItems, {
        id: `${msg.timestamp}_${msg.senderId}_leave`,
        type: 'LEAVE',
        studentName: msg.senderName,
        timestamp: msg.timestamp,
      });
      ctx.notify();
      break;
    }

    case 'FOCUS_LOST': {
      addFeedItem(ctx.feedItems, {
        id: `${msg.timestamp}_${msg.senderId}_lost`,
        type: 'FOCUS_LOST',
        studentName: msg.senderName,
        timestamp: msg.timestamp,
      });
      ctx.notify();
      break;
    }

    case 'FOCUS_RESTORED': {
      const lastLost = ctx.feedItems.find((f) => f.type === 'FOCUS_LOST' && f.studentName === msg.senderName && !f.returnedAt);
      if (lastLost) {
        lastLost.returnedAt = msg.timestamp;
      }
      ctx.notify();
      break;
    }

    case 'HELP_CALL': {
      addFeedItem(ctx.feedItems, {
        id: `${msg.timestamp}_${msg.senderId}_help`,
        type: 'HELP_CALL',
        studentName: msg.senderName,
        timestamp: msg.timestamp,
        resolved: false,
      });
      ctx.notify();
      break;
    }

    case 'HELP_RESOLVED': {
      if (msg.payload && msg.payload.studentName === ctx.userName) {
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
      const paused = !!msg.payload?.isPaused;
      ctx.setPaused(paused);
      break;
    }

    case 'ROOM_CLOSE': {
      showRoomToast('Oturum Kapatıldı', 'Hoca tarafından oturum sonlandırıldı.', '🛑');
      ctx.leaveRoom();
      break;
    }

    case 'AWARD_STAR': {
      if (msg.payload && msg.payload.studentName === ctx.userName) {
        showRoomToast('Tebrikler!', 'Hocandan yıldız aldın! ⭐', '🌟');
      }
      break;
    }

    case 'BROADCAST_ANNOUNCEMENT': {
      const text = msg.payload?.text || '';
      if (text) {
        showRoomToast(`Duyuru (${msg.senderName})`, text, '📢');
      }
      break;
    }

    case 'STUDENT_ANSWER_LOG': {
      if (!ctx.studentStats[msg.senderId]) {
        ctx.studentStats[msg.senderId] = {
          id: msg.senderId,
          name: msg.senderName,
          correctCount: 0,
          incorrectCount: 0,
          joinedAt: msg.timestamp,
        };
      }
      if (msg.payload && msg.payload.isCorrect) {
        ctx.studentStats[msg.senderId].correctCount++;
      } else {
        ctx.studentStats[msg.senderId].incorrectCount++;
      }
      ctx.notify();
      break;
    }
  }
}

function addFeedItem(feedItems: RoomFeedItem[], item: RoomFeedItem): void {
  if (!feedItems.some((f) => f.id === item.id)) {
    feedItems.unshift(item);
    if (feedItems.length > 50) {
      feedItems.pop();
    }
  }
}
