import type { RoomMessage } from './types.ts';
import type { MessageContext } from './message-handlers/context.ts';
import { hostMessageHandlers } from './message-handlers/host.ts';
import { studentMessageHandlers } from './message-handlers/student.ts';
export type { MessageContext } from './message-handlers/context.ts';
export { addFeedItem } from './message-handlers/feed.ts';

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
  if (existingStats && msg.type !== 'PEER_LEAVE' && msg.type !== 'FOCUS_LOST') {
    existingStats.lastSeenAt = timestamp;
  }

  const knownHost = ctx.participants.find((p) => p.isHost);
  const isSenderHost = existingPeer?.isHost
    || (!!msg.isHost && (!knownHost || knownHost.id === senderId));

  const handler = Object.hasOwn(hostMessageHandlers, msg.type)
    ? hostMessageHandlers[msg.type]
    : Object.hasOwn(studentMessageHandlers, msg.type) ? studentMessageHandlers[msg.type] : undefined;
  handler?.(ctx, { msg, senderId, senderName, timestamp, existingPeer, isSenderHost });
}
