import type { RoomState } from './types.ts';
import { addFeedItem } from './message-handlers/feed.ts';
import { showRoomToast } from './toast.ts';

export function checkOfflineStudents(state: RoomState, now: number): boolean {
  let changed = false;
  for (const [id, stats] of Object.entries(state.studentStats)) {
    const lastSeen = stats.lastSeenAt || stats.joinedAt;
    const isCurrentlyOnline = (now - lastSeen) < 18000;
    if (stats.isOnline !== isCurrentlyOnline) {
      stats.isOnline = isCurrentlyOnline;
      changed = true;
      if (!isCurrentlyOnline) {
        addFeedItem(state.feedItems, {
          id: `${now}_${id}_offline`,
          type: 'LEAVE',
          studentId: id,
          studentName: stats.name,
          timestamp: now,
        });
        showRoomToast('Öğrenci Ayrıldı', `${stats.name} oturumdan ayrıldı.`, '⚪');
      }
    }
  }
  return changed;
}
