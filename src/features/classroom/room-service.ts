import { onStateChange } from '../../app/state.ts';
import { classroomRpc, fetchRoomSnapshot, ClassroomError, type RoomSnapshot, type ClassroomRpc } from '../../data/classroom.ts';
import type { AuthSession } from '../../data/supabase-auth.ts';
import { ensureFreshSession, getActiveSession } from '../welcome/cloud-sync.ts';
import { clearRoomSession, loadPendingAnswers, loadRoomSession, savePendingAnswers, saveRoomSession,
  type PendingAnswers, type RoomSession } from './session-store.ts';
import { acknowledgeAnswers, emptyRoomState, snapshotToState, roomEventLabels } from './room-model.ts';
import { showRoomToast } from './toast.ts';
import type { RoomState } from './types.ts';
import { claimClassroomTab } from './tab-lock.ts';
export type { RoomState } from './types.ts';

export class RoomService {
  private state = emptyRoomState();
  private session: RoomSession | null = null;
  private pending: PendingAnswers = {};
  private listeners = new Set<(state: RoomState) => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private flight: Promise<void> | null = null;
  private controller: AbortController | null = null;
  private generation = 0;
  private failures = 0;
  private revision = 0;
  private visible = true;
  private dirtyVisibility = false;
  private eventCursor = 0n;
  private eventBacklog = false;
  private announcementId = '';
  private releaseTab: (() => void) | null = null;
  private storageFailed = false;

  constructor(private readonly autoPoll = true) {}
  getState(): RoomState { return this.state; }
  getPeerId(): string { return this.session?.userId ?? ''; }
  isHost(): boolean { return this.state.isHost; }
  subscribe(listener: (state: RoomState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => { this.listeners.delete(listener); };
  }

  async joinOrCreateRoom(name: string, _userName?: string): Promise<void> {
    await this.join(name);
  }

  private async join(name: string, saved?: RoomSession): Promise<void> {
    while (this.flight) await this.flight;
    if (this.session) await this.leaveRoom();
    const generation = ++this.generation;
    this.state = { ...emptyRoomState(), connection: 'connecting' };
    this.notify();
    let releaseTab: (() => void) | undefined;
    try {
      const auth = await ensureFreshSession();
      if (!auth || generation !== this.generation) throw new Error('Odaya girmek için oturum açın.');
      const lock = await claimClassroomTab(auth.user.id);
      releaseTab = lock.release;
      if (generation !== this.generation || getActiveSession()?.user.id !== auth.user.id) {
        throw new Error('Oturum değişti; odaya giriş iptal edildi.');
      }
      const connectionId = (lock.canResume && saved?.connectionId) || crypto.randomUUID();
      this.visible = typeof document === 'undefined' || !document.hidden;
      this.controller = new AbortController();
      const snapshot = await fetchRoomSnapshot(auth, 'join_or_create_room', {
        p_name: name, p_connection_id: connectionId, p_visible: this.visible,
        p_room_id: saved?.roomId ?? null,
      }, { signal: this.controller.signal });
      if (generation !== this.generation || getActiveSession()?.user.id !== auth.user.id) {
        void classroomRpc(auth, 'leave_room', { p_room_id: snapshot.roomId, p_connection_id: connectionId }).catch(() => {});
        throw new Error('Oturum değişti; odaya giriş iptal edildi.');
      }
      if (snapshot.closed) throw new ClassroomError('ROOM_CLOSED', 'Bu oda sonlandırılmış.');
      this.session = { userId: auth.user.id, connectionId, roomId: snapshot.roomId,
        roomName: snapshot.roomName, sequence: snapshot.sequence };
      this.releaseTab = releaseTab;
      this.pending = loadPendingAnswers(auth.user.id, snapshot.roomId);
      this.revision = Math.max(0, ...Object.values(this.pending).map(p => p.revision));
      saveRoomSession(this.session);
      this.applySnapshot(snapshot, true);
      this.schedule(Object.keys(this.pending).length ? 0 : undefined);
    } catch (error) {
      releaseTab?.();
      if (generation !== this.generation) throw error;
      this.state = { ...emptyRoomState(), connection: 'error', error: this.errorText(error) };
      this.notify();
      throw error;
    }
  }

  async restoreSessionIfActive(): Promise<boolean> {
    const userId = getActiveSession()?.user.id;
    if (!userId) return false;
    const saved = loadRoomSession(userId);
    if (!saved) return false;
    try { await this.join(saved.roomName, saved); return Boolean(this.session); }
    catch (error) {
      if (error instanceof ClassroomError && ['ROOM_CLOSED', 'CONNECTION_REPLACED', 'FORBIDDEN'].includes(error.code)) {
        clearRoomSession();
      }
      return false;
    }
  }

  refresh(keepalive = false): Promise<void> {
    if (this.flight) return this.flight;
    if (!this.session) return Promise.resolve();
    this.stopTimer();
    const generation = this.generation;
    this.flight = this.poll(keepalive).finally(() => {
      this.flight = null;
      if (generation === this.generation) this.schedule(this.dirtyVisibility || this.eventBacklog ? 0 : undefined);
    });
    return this.flight;
  }

  private async poll(keepalive: boolean): Promise<void> {
    const session = this.session;
    if (!session) return;
    const generation = this.generation;
    try {
      const auth = await ensureFreshSession();
      if (generation !== this.generation) return;
      if (!auth || auth.user.id !== session.userId) throw new Error('Oturum doğrulanamadı; bağlantı tekrar denenecek.');
      const sent = { ...this.pending };
      const visible = this.visible;
      this.dirtyVisibility = false;
      session.sequence++;
      saveRoomSession(session);
      this.controller = new AbortController();
      const snapshot = await fetchRoomSnapshot(auth, 'update_room_member', {
        ...this.args(session), p_sequence: session.sequence, p_visible: visible,
        p_after_event: this.state.isHost ? this.eventCursor.toString() : null,
        p_answers: Object.fromEntries(Object.entries(sent).map(([id, p]) => [id, p.value])),
      }, { signal: this.controller.signal, keepalive });
      if (generation !== this.generation || getActiveSession()?.user.id !== session.userId) return;
      if (snapshot.closed) {
        this.disconnect();
        showRoomToast('Oda sonlandırıldı', 'Bireysel çalışmaya devam edebilirsiniz.');
        return;
      }
      this.pending = acknowledgeAnswers(this.pending, sent);
      this.persistPending();
      this.failures = 0;
      this.eventBacklog = this.state.isHost && snapshot.events.length === 100;
      this.applySnapshot(snapshot);
    } catch (error) {
      if (generation !== this.generation) return;
      this.failures++;
      this.eventBacklog = false;
      this.dirtyVisibility = false;
      const fatal = error instanceof ClassroomError &&
        ['ROOM_CLOSED', 'CONNECTION_REPLACED', 'FORBIDDEN', 'AUTH_REQUIRED'].includes(error.code);
      if (fatal) this.disconnect();
      this.state = { ...this.state, connection: fatal ? 'error' : 'reconnecting', error: this.errorText(error) };
      this.notify();
    }
  }

  setVisibility(visible: boolean): void {
    if (!this.session || this.visible === visible) return;
    this.visible = visible;
    this.dirtyVisibility = true;
    void this.refresh(!visible);
  }

  logStudentAnswer(questionId: number, isCorrect: boolean): void { this.recordAnswer(questionId, isCorrect); }
  revokeStudentAnswer(questionId: number): void { this.recordAnswer(questionId, null); }
  private recordAnswer(questionId: number, value: boolean | null): void {
    if (!this.session || this.state.isHost || !Number.isSafeInteger(questionId) || questionId < 1) return;
    this.pending[String(questionId)] = { value, revision: ++this.revision };
    this.persistPending();
    this.schedule(150);
  }

  async broadcastAnnouncement(text: string): Promise<void> {
    if (!this.state.isHost || !text.trim() || text.trim().length > 280) throw new Error('Duyuru 1–280 karakter olmalıdır.');
    await this.command('publish_room_announcement', { p_text: text.trim() });
  }
  async closeRoomGlobally(): Promise<void> {
    if (!this.state.isHost) throw new Error('Yalnızca öğretmen odayı bitirebilir.');
    await this.command('close_classroom_room');
    this.disconnect();
  }
  private async command(name: ClassroomRpc, extra: Record<string, unknown> = {}): Promise<void> {
    while (this.flight) await this.flight;
    this.stopTimer();
    const session = this.session;
    if (!session) throw new Error('Aktif oda bulunamadı.');
    const generation = this.generation;
    this.flight = (async () => {
      const auth = await ensureFreshSession();
      if (!auth || auth.user.id !== session.userId || generation !== this.generation) throw new Error('Oturum açmanız gerekiyor.');
      await classroomRpc(auth, name, { ...this.args(session), ...extra });
    })();
    try { await this.flight; }
    finally { this.flight = null; if (generation === this.generation) this.schedule(0); }
  }

  async leaveRoom(): Promise<void> {
    await this.refresh();
    const session = this.session;
    const auth = getActiveSession();
    if (Object.keys(this.pending).length && this.storageFailed) {
      throw new Error('Cevaplar kaydedilemedi. Bağlantıyı düzeltip tekrar deneyin.');
    }
    if (Object.keys(this.pending).length) showRoomToast('Gönderilemeyen cevaplar', 'Cevaplar bu cihazda saklandı; aynı odaya dönünce tekrar gönderilecek.');
    this.disconnect();
    if (session && auth?.user.id === session.userId) {
      try { await classroomRpc(auth, 'leave_room', this.args(session), { keepalive: true }); }
      catch { showRoomToast('Bağlantı yok', 'Ayrılma sunucuda bağlantı zaman aşımıyla görünecek.'); }
    }
  }

  disconnect(auth?: AuthSession): void {
    const session = this.session;
    this.generation++;
    this.stopTimer();
    this.controller?.abort();
    this.releaseTab?.();
    this.releaseTab = null;
    this.session = null;
    this.pending = {};
    this.failures = 0;
    this.dirtyVisibility = false;
    this.eventCursor = 0n;
    this.eventBacklog = false;
    this.announcementId = '';
    this.storageFailed = false;
    clearRoomSession();
    this.state = emptyRoomState();
    this.notify();
    if (auth && session?.userId === auth.user.id) {
      void classroomRpc(auth, 'leave_room', this.args(session), { keepalive: true }).catch(() => {});
    }
  }

  private applySnapshot(snapshot: RoomSnapshot, initial = false): void {
    if (!this.session) return;
    const previousFeed = this.state.feedItems;
    this.state = snapshotToState(snapshot, this.session.userId);
    if (!initial && this.state.isHost) {
      const combined = new Map([...previousFeed, ...this.state.feedItems].map(item => [item.id, item]));
      this.state.feedItems = Array.from(combined.values()).slice(-100);
    }
    if (this.storageFailed) this.state.error = 'Cihazda kayıt yapılamadı. Bu sayfayı kapatmadan bağlantınızı kontrol edin.';
    for (const event of snapshot.events) {
      const id = BigInt(event.id);
      if (!initial && id > this.eventCursor && this.state.isHost && event.userId !== snapshot.hostId) {
        showRoomToast(roomEventLabels[event.type], event.name);
      }
      if (id > this.eventCursor) this.eventCursor = id;
    }
    const announcement = snapshot.announcement;
    if (!initial && announcement && announcement.id !== this.announcementId && !this.state.isHost) {
      showRoomToast('Öğretmen duyurusu', announcement.text);
    }
    this.announcementId = announcement?.id ?? '';
    this.notify();
  }
  private args(session: RoomSession): Record<string, unknown> {
    return { p_room_id: session.roomId, p_connection_id: session.connectionId };
  }
  private persistPending(): void {
    if (!this.session) return;
    this.storageFailed = !savePendingAnswers(this.session.userId, this.session.roomId, this.pending);
    if (this.storageFailed) {
      this.state.error = 'Cihazda kayıt yapılamadı. Bu sayfayı kapatmadan bağlantınızı kontrol edin.';
      this.notify();
    }
  }
  private errorText(error: unknown): string { return error instanceof Error ? error.message : 'Sınıf bağlantısı kurulamadı.'; }
  private stopTimer(): void { if (this.timer) clearTimeout(this.timer); this.timer = null; }
  private schedule(delay?: number): void {
    this.stopTimer();
    if (!this.autoPoll || !this.session) return;
    const base = this.state.isHost ? 2000 : 5000;
    this.timer = setTimeout(() => { void this.refresh(); }, delay ?? Math.min(30000, base * 2 ** this.failures));
  }
  private notify(): void { for (const listener of this.listeners) listener(this.state); }
}

export const roomService = new RoomService();
onStateChange('auth:signout', payload => {
  const auth = payload && typeof payload === 'object' && 'accessToken' in payload ? payload as AuthSession : undefined;
  roomService.disconnect(auth);
});
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { void roomService.refresh(); });
  window.addEventListener('storage', () => {
    if (roomService.getPeerId() && roomService.getPeerId() !== getActiveSession()?.user.id) roomService.disconnect();
  });
}
