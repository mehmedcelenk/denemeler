import type { RoomMessage } from './types.ts';

type MessageHandler = (msg: RoomMessage) => void;

class RoomChannel {
  private channel: BroadcastChannel | null = null;
  private channelName: string = '';
  private handlers: Set<MessageHandler> = new Set();
  private storageListener: ((e: StorageEvent) => void) | null = null;

  connect(roomId: string, onMessage: MessageHandler): void {
    this.disconnect();
    this.channelName = `aol_room_${roomId.trim().toUpperCase()}`;
    this.handlers.add(onMessage);

    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(this.channelName);
      this.channel.onmessage = (event) => {
        if (event.data && typeof event.data === 'object') {
          this.notifyHandlers(event.data as RoomMessage);
        }
      };
    }

    // Farklı pencereler / iframe'ler ve BroadcastChannel fallback için localStorage yedek köprüsü
    this.storageListener = (e: StorageEvent) => {
      if (e.key === `sync_${this.channelName}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          this.notifyHandlers(parsed);
        } catch {}
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.storageListener);
    }
  }

  send(msg: RoomMessage): void {
    if (this.channel) {
      try {
        this.channel.postMessage(msg);
      } catch {}
    }
    // Yedek depolama sinyali
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`sync_${this.channelName}`, JSON.stringify(msg));
        setTimeout(() => localStorage.removeItem(`sync_${this.channelName}`), 100);
      } catch {}
    }
  }

  disconnect(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.storageListener && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = null;
    }
    this.handlers.clear();
  }

  private notifyHandlers(msg: RoomMessage): void {
    for (const h of this.handlers) {
      h(msg);
    }
  }
}

export const roomChannel = new RoomChannel();
