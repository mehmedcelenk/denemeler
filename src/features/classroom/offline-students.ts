import type { RoomState } from './types.ts';
import { addFeedItem } from './message-handlers/feed.ts';
import { showRoomToast } from './toast.ts';

const OFFLINE_TIMEOUT_MS = 10000;

export function checkOfflineStudents(state: RoomState, now: number): boolean {
  let changed = false;
  for (const [id, stats] of Object.entries(state.studentStats)) {
    const lastSeen = stats.lastSeenAt || stats.joinedAt;
    const isCurrentlyOnline = (now - lastSeen) < OFFLINE_TIMEOUT_MS;
    if (stats.isOnline !== isCurrentlyOnline) {
      stats.isOnline = isCurrentlyOnline;
      changed = true;
      if (!isCurrentlyOnline) {
        const hasOpenLost = state.feedItems.some(
          (f) => f.type === 'FOCUS_LOST' && f.studentId === id && !f.returnedAt
        );
        if (!hasOpenLost) {
          stats.exitCount = (stats.exitCount || 0) + 1;
          addFeedItem(state.feedItems, {
            id: `${now}_${id}_offline`,
            type: 'FOCUS_LOST',
            studentId: id,
            studentName: stats.name,
            timestamp: lastSeen > 0 ? lastSeen : now,
          });
          if (state.isHost) {
            showRoomToast('Ayrıldı', `${stats.name} oturumdan ayrıldı.`, '⚪');
          }
        }
      }
    }
  }
  return changed;
}
