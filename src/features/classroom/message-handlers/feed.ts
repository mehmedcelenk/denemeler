import type { RoomFeedItem } from '../types.ts';

export function addFeedItem(feedItems: RoomFeedItem[], item: RoomFeedItem): void {
  if (!feedItems.some((f) => f.id === item.id)) {
    feedItems.unshift(item);
    if (feedItems.length > 100) {
      feedItems.pop();
    }
  }
}
