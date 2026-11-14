import type { RoomMessagePayload, StudentStats } from '../types.ts';
import type { MessageContext } from './context.ts';
import { addFeedItem } from './feed.ts';
import { showRoomToast } from '../toast.ts';

export function isOlderPeer(aJoinedAt: number, aId: string, bJoinedAt: number, bId: string): boolean {
  if (aJoinedAt !== bJoinedAt) return aJoinedAt < bJoinedAt;
  return aId.localeCompare(bId) < 0;
}

export function mergePayloadStats(target: StudentStats, payload?: RoomMessagePayload): boolean {
  if (!payload) return false;
  let changed = false;

  if (typeof payload.correctCount === 'number' && Number.isFinite(payload.correctCount) && payload.correctCount >= 0) {
    const next = Math.max(target.correctCount, payload.correctCount);
    if (next !== target.correctCount) {
      target.correctCount = next;
      changed = true;
    }
  }
  if (typeof payload.incorrectCount === 'number' && Number.isFinite(payload.incorrectCount) && payload.incorrectCount >= 0) {
    const next = Math.max(target.incorrectCount, payload.incorrectCount);
    if (next !== target.incorrectCount) {
      target.incorrectCount = next;
      changed = true;
    }
  }
  if (typeof payload.exitCount === 'number' && Number.isFinite(payload.exitCount) && payload.exitCount >= 0) {
    const next = Math.max(target.exitCount, payload.exitCount);
    if (next !== target.exitCount) {
      target.exitCount = next;
      changed = true;
    }
  }
  if (typeof payload.totalAwayMs === 'number' && Number.isFinite(payload.totalAwayMs) && payload.totalAwayMs >= 0) {
    const next = Math.max(target.totalAwayMs, payload.totalAwayMs);
    if (next !== target.totalAwayMs) {
      target.totalAwayMs = next;
      changed = true;
    }
  }
  if (payload.answers && typeof payload.answers === 'object') {
    target.answers = { ...(target.answers || {}), ...payload.answers };
    changed = true;
  } else if (typeof payload.questionId === 'number') {
    target.answers = target.answers || {};
    if (typeof payload.isCorrect === 'boolean') {
      target.answers[payload.questionId] = payload.isCorrect;
      changed = true;
    } else {
      delete target.answers[payload.questionId];
      changed = true;
    }
  }
  return changed;
}

export function mergeOfflineStudentBySameName(
  ctx: MessageContext,
  newSenderId: string,
  senderName: string,
  timestamp: number
): boolean {
  if (ctx.studentStats[newSenderId]) return false;
  const normalizedTarget = senderName.trim().toLowerCase();
  if (!normalizedTarget) return false;

  const offlineMatch = Object.values(ctx.studentStats).find(
    (s) => s.id !== newSenderId && s.isOnline === false && s.name.trim().toLowerCase() === normalizedTarget
  );
  if (!offlineMatch) return false;

  const oldId = offlineMatch.id;
  ctx.studentStats[newSenderId] = {
    ...offlineMatch,
    id: newSenderId,
    name: senderName,
    lastSeenAt: timestamp,
    isOnline: false,
  };
  delete ctx.studentStats[oldId];

  const oldPeerIdx = ctx.participants.findIndex((p) => p.id === oldId);
  if (oldPeerIdx !== -1) {
    ctx.participants.splice(oldPeerIdx, 1);
  }

  for (const item of ctx.feedItems) {
    if (item.studentId === oldId) {
      item.studentId = newSenderId;
    }
  }
  return true;
}

export function reconcileStudentReturn(
  ctx: MessageContext,
  senderId: string,
  senderName: string,
  timestamp: number,
  payload?: RoomMessagePayload
): boolean {
  const openExit = ctx.feedItems.find(
    (f) => (f.type === 'FOCUS_LOST' || f.type === 'LEAVE') && f.studentId === senderId && !f.returnedAt
  );
  const stats = ctx.studentStats[senderId];
  const wasOffline = stats ? stats.isOnline === false : false;
  const rawExplicitMs = payload?.durationMs ?? payload?.awayDurationMs;
  const explicitMs = typeof rawExplicitMs === 'number' && Number.isFinite(rawExplicitMs) && rawExplicitMs > 0
    ? rawExplicitMs
    : 0;

  if (!openExit && !wasOffline && explicitMs === 0) {
    if (stats && stats.isOnline !== true) {
      stats.isOnline = true;
      return true;
    }
    return false;
  }

  const durationMs = explicitMs > 0
    ? explicitMs
    : (openExit ? Math.max(0, timestamp - openExit.timestamp) : 0);

  if (stats) {
    stats.isOnline = true;
    if (durationMs > 0 && payload?.totalAwayMs === undefined) {
      stats.totalAwayMs = (stats.totalAwayMs || 0) + durationMs;
    }
  }

  if (openExit) {
    openExit.returnedAt = timestamp;
  } else if (explicitMs > 0 && ctx.isHost) {
    const lostAt = Math.max(1, timestamp - explicitMs);
    addFeedItem(ctx.feedItems, {
      id: `${lostAt}_${senderId}_lost`,
      type: 'FOCUS_LOST',
      studentId: senderId,
      studentName: senderName,
      timestamp: lostAt,
      returnedAt: timestamp,
    });
  }

  if (ctx.isHost && (openExit || wasOffline || explicitMs > 0)) {
    const sec = Math.round(durationMs / 1000);
    showRoomToast('Yeniden Katıldı', `${senderName} geri döndü (${sec} sn).`, '🟢');
  }

  return true;
}
