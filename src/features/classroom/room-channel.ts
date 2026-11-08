import type { RoomMessage } from './types.ts';
import { remove, writeJson } from '../../app/storage.ts';
import { getSupabaseConfig } from '../../data/supabase-client.ts';
import { StorageKeys, type ClassroomSyncStorageKey } from '../../shared/storage-keys.ts';

type MessageHandler = (msg: RoomMessage) => void;
type ClassroomChannelName = `${typeof StorageKeys.CLASSROOM_CHANNEL_PREFIX}${string}`;

function createChannelName(roomId: string): ClassroomChannelName {
  return `${StorageKeys.CLASSROOM_CHANNEL_PREFIX}${roomId.trim().toUpperCase()}`;
}

function createSyncKey(channelName: ClassroomChannelName): ClassroomSyncStorageKey {
  return `sync_${channelName}`;
}

interface PhoenixEnvelope {
  topic?: string;
  event?: string;
  payload?: {
    type?: string;
    event?: string;
    payload?: RoomMessage;
  };
  ref?: string | null;
}

class RoomChannel {
  private channel: BroadcastChannel | null = null;
  private ws: WebSocket | null = null;
  private wsHeartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private wsJoined: boolean = false;
  private isConnecting: boolean = false;
  private wsPendingQueue: RoomMessage[] = [];
  private wsRefCounter: number = 1;
  private channelName: ClassroomChannelName | '' = '';
  private handlers: Set<MessageHandler> = new Set();
  private storageListener: ((e: StorageEvent) => void) | null = null;
  private onlineListener: (() => void) | null = null;
  private seenMessages: Map<string, number> = new Map();

  connect(roomId: string, onMessage: MessageHandler): void {
    this.disconnect();
    this.channelName = createChannelName(roomId);
    this.handlers.add(onMessage);

    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(this.channelName);
      this.channel.onmessage = (event) => {
        if (event.data && typeof event.data === 'object') {
          this.notifyHandlers(event.data as RoomMessage);
        }
      };
    }

    this.storageListener = (e: StorageEvent) => {
      if (e.key === `sync_${this.channelName}` && e.newValue) {
        try {
          this.notifyHandlers(JSON.parse(e.newValue) as RoomMessage);
        } catch {}
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.storageListener);
      this.onlineListener = () => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          this.clearReconnectTimer();
          this.connectRealtimeSocket();
        }
      };
      window.addEventListener('online', this.onlineListener);
    }

    this.connectRealtimeSocket();
  }

  send(msg: RoomMessage): void {
    this.markSeen(msg);

    if (this.channel) {
      try { this.channel.postMessage(msg); } catch {}
    }

    if (this.channelName) {
      const syncKey = createSyncKey(this.channelName);
      if (writeJson(syncKey, msg)) setTimeout(() => remove(syncKey), 100);
    }

    this.sendOverRealtimeSocket(msg);
  }

  disconnect(): void {
    this.clearReconnectTimer();
    this.wsPendingQueue = [];
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.storageListener && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = null;
    }
    if (this.onlineListener && typeof window !== 'undefined') {
      window.removeEventListener('online', this.onlineListener);
      this.onlineListener = null;
    }
    this.disconnectRealtimeSocket();
    this.handlers.clear();
    this.seenMessages.clear();
    this.channelName = '';
  }

  private connectRealtimeSocket(): void {
    const config = getSupabaseConfig();
    if (!config || typeof WebSocket === 'undefined' || this.isConnecting || !this.channelName) return;

    this.isConnecting = true;
    try {
      const wsBase = config.url.replace(/^http/, 'ws');
      const wsUrl = `${wsBase}/realtime/v1/websocket?apikey=${encodeURIComponent(config.anonKey)}&vsn=1.0.0`;
      this.ws = new WebSocket(wsUrl);
      const topic = `realtime:${this.channelName}`;

      this.ws.onopen = () => {
        this.isConnecting = false;
        if (!this.ws) return;
        const joinFrame = {
          topic,
          event: 'phx_join',
          payload: { config: { broadcast: { ack: false, self: false } } },
          ref: String(this.wsRefCounter++),
        };
        this.ws.send(JSON.stringify(joinFrame));
        this.wsJoined = true;

        this.flushPendingQueue();
        this.startWsHeartbeat();
      };

      this.ws.onmessage = (event) => {
        if (typeof event.data !== 'string') return;
        try {
          const frame = JSON.parse(event.data) as PhoenixEnvelope;
          if (frame.event === 'broadcast' && frame.payload?.payload) {
            this.notifyHandlers(frame.payload.payload);
          }
        } catch {}
      };

      this.ws.onclose = () => this.handleWsDrop();
      this.ws.onerror = () => this.handleWsDrop();
    } catch {
      this.handleWsDrop();
    }
  }

  private flushPendingQueue(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.wsJoined) return;
    while (this.wsPendingQueue.length > 0) {
      const pending = this.wsPendingQueue.shift();
      if (pending) this.sendOverRealtimeSocket(pending);
    }
  }

  private enqueuePendingMessage(msg: RoomMessage): void {
    if (msg.type === 'STUDENT_HEARTBEAT' || msg.type === 'ROOM_SYNC') {
      const existingIdx = this.wsPendingQueue.findIndex(
        (m) => m.type === msg.type && m.senderId === msg.senderId
      );
      if (existingIdx !== -1) {
        this.wsPendingQueue[existingIdx] = msg;
        return;
      }
    }
    if (this.wsPendingQueue.length >= 40) {
      this.wsPendingQueue.shift();
    }
    this.wsPendingQueue.push(msg);
  }

  private handleWsDrop(): void {
    this.isConnecting = false;
    this.wsJoined = false;
    this.disconnectRealtimeSocket();
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || !this.channelName) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.channelName) this.connectRealtimeSocket();
    }, 2000);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startWsHeartbeat(): void {
    if (this.wsHeartbeatTimer) clearInterval(this.wsHeartbeatTimer);
    this.wsHeartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            topic: 'phoenix',
            event: 'heartbeat',
            payload: {},
            ref: String(this.wsRefCounter++),
          })
        );
      }
    }, 25000);
  }

  private sendOverRealtimeSocket(msg: RoomMessage): void {
    if (!this.channelName) return;

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.wsJoined) {
      this.enqueuePendingMessage(msg);
      if (!this.ws && !this.isConnecting) {
        this.scheduleReconnect();
      }
      return;
    }

    try {
      const frame = {
        topic: `realtime:${this.channelName}`,
        event: 'broadcast',
        payload: { type: 'broadcast', event: 'room_msg', payload: msg },
        ref: String(this.wsRefCounter++),
      };
      this.ws.send(JSON.stringify(frame));
    } catch {
      this.enqueuePendingMessage(msg);
      this.handleWsDrop();
    }
  }

  private disconnectRealtimeSocket(): void {
    if (this.wsHeartbeatTimer) {
      clearInterval(this.wsHeartbeatTimer);
      this.wsHeartbeatTimer = null;
    }
    if (this.ws) {
      try {
        this.ws.onclose = null;
        this.ws.onerror = null;
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.wsJoined = false;
    this.isConnecting = false;
  }

  private makeMessageFingerprint(msg: RoomMessage): string {
    const extra = msg.payload?.questionId ?? msg.payload?.feedId ?? msg.payload?.studentId ?? msg.payload?.text ?? '';
    return `${msg.senderId}:${msg.type}:${msg.timestamp}:${extra}`;
  }

  private markSeen(msg: RoomMessage): boolean {
    const key = this.makeMessageFingerprint(msg);
    if (this.seenMessages.has(key)) return true;
    this.seenMessages.set(key, msg.timestamp);
    if (this.seenMessages.size > 500) {
      const firstKey = this.seenMessages.keys().next().value;
      if (firstKey) this.seenMessages.delete(firstKey);
    }
    return false;
  }

  private notifyHandlers(msg: RoomMessage): void {
    if (!msg || typeof msg.type !== 'string' || this.markSeen(msg)) return;
    for (const h of this.handlers) h(msg);
  }
}

export const roomChannel = new RoomChannel();
