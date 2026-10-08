export interface StudentStatus {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'blurred' | 'offline';
  solvedCount: number;
  lastPing: number;
}

export interface FocusSessionState {
  isTeacher: boolean;
  isStudent: boolean;
  sessionCode: string | null;
  studentName: string;
  students: Record<string, StudentStatus>;
  notificationsEnabled: boolean;
}

const localState: FocusSessionState = {
  isTeacher: false,
  isStudent: false,
  sessionCode: null,
  studentName: '',
  students: {},
  notificationsEnabled: false,
};

let channel: BroadcastChannel | null = null;
let eventSource: EventSource | null = null;
let heartbeatInterval: number | null = null;
let audioCtx: AudioContext | null = null;

let lastSentStatus: string | null = null;
let lastSentTime = 0;

function getChannel(): BroadcastChannel | null {
  if (!channel && typeof BroadcastChannel !== 'undefined') {
    try {
      channel = new BroadcastChannel('aol_focus_session_channel');
      channel.onmessage = (event) => handleChannelMessage(event.data);
    } catch (e) {}
  }
  return channel;
}

function broadcast(type: string, payload: any) {
  const msg = { type, payload, t: Date.now() };
  try { getChannel()?.postMessage(msg); } catch (e) {}
  try { localStorage.setItem('aol_focus_event', JSON.stringify(msg)); } catch (e) {}
  const code = payload?.code || localState.sessionCode;
  if (code) {
    try { fetch(`https://ntfy.sh/aol_session_${code}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msg) }).catch(() => {}); } catch (e) {}
  }
}

function playWarningBeep() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {}
}

function triggerAlertNotification(title: string, body: string) {
  playWarningBeep();
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(title, { body, tag: 'aol-focus-alert', renotify: true, vibrate: [300, 100, 300] } as any);
      }).catch(() => {
        try { new Notification(title, { body, dir: 'auto' }); } catch (e) {}
      });
    } else {
      try { new Notification(title, { body, dir: 'auto' }); } catch (e) {}
    }
  }
}

export function requestNotificationPermission(): void {
  playWarningBeep();
  if (typeof Notification === 'undefined') {
    alert('iOS Safari\'de bildirim almak için siteyi önce Safari menüsünden "Ana Ekrana Ekle" yaparak PWA olarak açmalısınız.');
    return;
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  const handlePerm = (perm: string) => {
    localState.notificationsEnabled = perm === 'granted';
    if (perm === 'granted') {
      triggerAlertNotification('🔔 Bildirimler Aktif', 'Öğrenci siteden çıktığında bildirim alacaksınız.');
    } else if (perm === 'denied') {
      alert('Bildirim izni engellendi. Safari ayarlarından bildirime izin verin.');
    }
    renderTeacherView();
  };
  try {
    const res = Notification.requestPermission(handlePerm);
    if (res && typeof res.then === 'function') res.then(handlePerm).catch(() => {});
  } catch (e) {}
}

function connectTeacherRelay(code: string) {
  if (eventSource) { try { eventSource.close(); } catch (e) {} }
  try {
    eventSource = new EventSource(`https://ntfy.sh/aol_session_${code}/sse`);
    eventSource.onmessage = (e) => {
      try {
        const raw = JSON.parse(e.data);
        if (raw?.message) handleChannelMessage(JSON.parse(raw.message));
      } catch (err) {}
    };
    eventSource.onerror = () => {
      setTimeout(() => { if (localState.isTeacher && localState.sessionCode === code) connectTeacherRelay(code); }, 3000);
    };
  } catch (e) {}
}

function handleChannelMessage(msg: { type: string; payload: any }) {
  if (!msg?.type) return;
  if (localState.isTeacher && localState.sessionCode) {
    if (msg.type === 'STUDENT_PING' || msg.type === 'STUDENT_STATUS') {
      const student: StudentStatus = msg.payload;
      if (student?.code === localState.sessionCode) {
        const prev = localState.students[student.id];
        if (prev && prev.status === 'active' && student.status === 'blurred') {
          triggerAlertNotification(`🔴 UYARI: ${student.name} siteden çıktı!`, `${student.name} WhatsApp veya başka sekmeye geçti.`);
        }
        localState.students[student.id] = { ...student, lastPing: Date.now() };
        renderTeacherView();
      }
    } else if (msg.type === 'STUDENT_LEAVE' && msg.payload?.id) {
      const std = localState.students[msg.payload.id];
      if (std) {
        if (std.status === 'active') triggerAlertNotification(`⚪ UYARI: ${std.name} ayrıldı!`, 'Öğrenci oturumdan çıktı.');
        std.status = 'offline';
        renderTeacherView();
      }
    }
  } else if (localState.isStudent && localState.sessionCode && msg.type === 'SESSION_ENDED' && msg.payload?.code === localState.sessionCode) {
    exitFocusSession(true);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'aol_focus_event' && e.newValue) {
      try { handleChannelMessage(JSON.parse(e.newValue)); } catch (err) {}
    }
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      if (localState.isTeacher && localState.sessionCode) {
        connectTeacherRelay(localState.sessionCode);
      } else if (localState.isStudent && localState.sessionCode) {
        sendStudentPing('active', true);
      }
    }
  });
}

export function generateSessionCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function openFocusModal(): void {
  restoreSavedSession();
  const overlay = document.getElementById('focusSessionOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    renderFocusModalContent();
  }
}

export function closeFocusModal(): void {
  const overlay = document.getElementById('focusSessionOverlay');
  if (overlay) overlay.style.display = 'none';
}

export function restoreSavedSession(): void {
  if (localState.isTeacher || localState.isStudent) return;
  try {
    const sT = localStorage.getItem('aol_teacher_session');
    if (sT) {
      const p = JSON.parse(sT);
      if (p?.code && Date.now() - p.t < 6 * 3600 * 1000) {
        localState.isTeacher = true; localState.sessionCode = p.code; localState.students = {};
        connectTeacherRelay(p.code); startHeartbeatMonitor(); return;
      }
    }
    const sS = localStorage.getItem('aol_student_session');
    if (sS) {
      const p = JSON.parse(sS);
      if (p?.code && p?.name) {
        localState.isStudent = true; localState.sessionCode = p.code; localState.studentName = p.name;
        setupStudentListeners(); sendStudentPing('active', true);
      }
    }
  } catch (e) {}
}

export function startTeacherSession(): void {
  localState.isTeacher = true; localState.isStudent = false; localState.sessionCode = generateSessionCode(); localState.students = {};
  try { localStorage.setItem('aol_teacher_session', JSON.stringify({ code: localState.sessionCode, t: Date.now() })); } catch (e) {}
  if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission();
  connectTeacherRelay(localState.sessionCode); startHeartbeatMonitor(); renderFocusModalContent();
}

export function joinStudentSession(name: string, code: string): boolean {
  if (!name.trim() || !code.trim()) return false;
  localState.isTeacher = false; localState.isStudent = true; localState.sessionCode = code.trim(); localState.studentName = name.trim();
  try { localStorage.setItem('aol_student_session', JSON.stringify({ code: localState.sessionCode, name: localState.studentName })); } catch (e) {}
  setupStudentListeners(); sendStudentPing('active', true); renderFocusModalContent(); return true;
}

export function exitFocusSession(silent = false): void {
  if (localState.isTeacher && localState.sessionCode) broadcast('SESSION_ENDED', { code: localState.sessionCode });
  else if (localState.isStudent && localState.sessionCode) broadcast('STUDENT_LEAVE', { id: getStudentId() });
  try { localStorage.removeItem('aol_teacher_session'); localStorage.removeItem('aol_student_session'); } catch (e) {}
  if (eventSource) { try { eventSource.close(); } catch (e) {} eventSource = null; }
  localState.isTeacher = false; localState.isStudent = false; localState.sessionCode = null; localState.students = {};
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  removeStudentListeners();
  if (!silent) renderFocusModalContent();
}

function getStudentId(): string {
  let id = sessionStorage.getItem('aol_student_id');
  if (!id) {
    id = 'std_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('aol_student_id', id);
  }
  return id;
}

export function sendStudentPing(statusOverride?: 'active' | 'blurred' | 'offline', force = false): void {
  if (!localState.isStudent || !localState.sessionCode) return;

  const isHidden = document.hidden || !document.hasFocus();
  const currentStatus = statusOverride || (isHidden ? 'blurred' : 'active');
  const now = Date.now();

  if (!force && lastSentStatus === currentStatus && now - lastSentTime < 10000) {
    return;
  }

  lastSentStatus = currentStatus;
  lastSentTime = now;

  let solvedCount = 0;
  try {
    const choices = localStorage.getItem('aol_marked_choices');
    if (choices) solvedCount = Object.keys(JSON.parse(choices)).length;
  } catch (e) {}

  const studentData: StudentStatus = { id: getStudentId(), name: localState.studentName, code: localState.sessionCode, status: currentStatus, solvedCount, lastPing: now };
  broadcast('STUDENT_PING', studentData);
}

let studentEventsAttached = false;
function handleVisibilityOrBlur(): void {
  sendStudentPing(undefined, true);
}

function setupStudentListeners(): void {
  if (studentEventsAttached) return;
  document.addEventListener('visibilitychange', handleVisibilityOrBlur);
  window.addEventListener('blur', handleVisibilityOrBlur);
  window.addEventListener('focus', handleVisibilityOrBlur);
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = window.setInterval(() => sendStudentPing(), 8000);
  studentEventsAttached = true;
}

function removeStudentListeners(): void {
  document.removeEventListener('visibilitychange', handleVisibilityOrBlur);
  window.removeEventListener('blur', handleVisibilityOrBlur);
  window.removeEventListener('focus', handleVisibilityOrBlur);
  studentEventsAttached = false;
}

function startHeartbeatMonitor(): void {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  heartbeatInterval = window.setInterval(() => {
    if (!localState.isTeacher) return;
    const now = Date.now();
    let updated = false;
    for (const id in localState.students) {
      const std = localState.students[id];
      if (now - std.lastPing > 15000 && std.status !== 'offline') {
        if (std.status === 'active') triggerAlertNotification(`⚪ UYARI: ${std.name} çevrimdışı!`, 'İnternet koptu veya kapandı.');
        std.status = 'offline'; updated = true;
      }
    }
    if (updated) renderTeacherView();
  }, 4000);
}

export function renderFocusModalContent(): void {
  const container = document.getElementById('focusModalBody');
  if (!container) return;
  if (localState.isTeacher && localState.sessionCode) { renderTeacherView(); return; }
  if (localState.isStudent && localState.sessionCode) {
    container.innerHTML = `<div class="focus-connected-card"><div class="focus-status-icon">🟢</div><h3>Ders Oturumuna Bağlandın</h3><p class="focus-code-badge">Oturum Kodu: <strong>${localState.sessionCode}</strong></p><p class="focus-desc">Serbestçe sorularını çözebilirsin. Siteden çıktığında öğretmenine anlık bildirim gider.</p><button class="focus-btn-secondary" onclick="window.exitFocusSession()">Oturumdan Ayrıl</button></div>`;
    return;
  }
  container.innerHTML = `<div class="focus-setup-grid"><div class="focus-setup-card"><div class="focus-card-icon">👨‍🏫</div><h4>Öğretmen Modu</h4><p>Sınıf için 4 haneli oturum kodu oluştur ve katılan öğrencileri canlı takip et.</p><button class="focus-btn-primary" onclick="window.startTeacherSession()">Oturum Başlat →</button></div><div class="focus-setup-divider">veya</div><div class="focus-setup-card"><div class="focus-card-icon">🎓</div><h4>Öğrenci Modu</h4><p>Öğretmeninin verdiği 4 haneli oturum kodunu girerek sınıfa katıl.</p><div class="focus-input-group"><input type="text" id="txtStudentName" placeholder="Adınız Soyadınız" autocomplete="off"><input type="number" id="txtSessionCode" placeholder="4 Haneli Kod (örn: 4815)" autocomplete="off"><button class="focus-btn-primary" onclick="window.submitStudentJoin()">Katıl →</button></div></div></div>`;
}

function renderTeacherView(): void {
  const container = document.getElementById('focusModalBody');
  if (!container) return;
  const studentsList = Object.values(localState.students);
  const activeCount = studentsList.filter((s) => s.status === 'active').length;
  const blurredCount = studentsList.filter((s) => s.status === 'blurred').length;
  const offlineCount = studentsList.filter((s) => s.status === 'offline').length;
  let notifBtnText = typeof Notification !== 'undefined' && Notification.permission === 'granted' ? '🔔 Sesli & Ekran Bildirimi Aktif' : '🔔 Bildirimleri Aç';

  let listHtml = studentsList.length === 0 ? `<div class="focus-empty-state">Öğrencilerin <strong>${localState.sessionCode}</strong> kodunu girerek katılması bekleniyor...</div>` : studentsList.map((s) => {
    let statusBadge = '<span class="std-badge active">🟢 Sitede Aktif</span>';
    if (s.status === 'blurred') statusBadge = '<span class="std-badge blurred">🔴 Arka Planda / Çıktı!</span>';
    else if (s.status === 'offline') statusBadge = '<span class="std-badge offline">⚪ Çevrimdışı</span>';
    return `<div class="std-row status-${s.status}"><div class="std-info"><strong>${s.name}</strong><span class="std-solved">Çözülen: ${s.solvedCount} Soru</span></div><div class="std-status">${statusBadge}</div></div>`;
  }).join('');

  container.innerHTML = `<div class="focus-teacher-view"><div class="focus-code-banner"><span>Sınıf Oturum Kodu:</span><strong class="focus-code-big">${localState.sessionCode}</strong></div><div class="focus-stats-bar"><span class="stat-pill active">🟢 Sitede: ${activeCount}</span><span class="stat-pill blurred">🔴 Arka Planda: ${blurredCount}</span><span class="stat-pill offline">⚪ Çevrimdışı: ${offlineCount}</span></div><div style="text-align:center; margin:-6px 0 4px 0;"><button class="focus-btn-secondary" style="font-size:11.5px; padding:4px 10px;" onclick="window.requestNotificationPermission()">${notifBtnText}</button></div><div class="focus-student-list">${listHtml}</div><div class="focus-footer-actions"><button class="focus-btn-danger" onclick="window.exitFocusSession()">Oturumu Bitir</button></div></div>`;
}

export function submitStudentJoin(): void {
  const nameInput = document.getElementById('txtStudentName') as HTMLInputElement;
  const codeInput = document.getElementById('txtSessionCode') as HTMLInputElement;
  if (!nameInput || !codeInput) return;
  const success = joinStudentSession(nameInput.value, codeInput.value);
  if (!success) alert('Lütfen adınızı ve 4 haneli oturum kodunu eksiksiz girin.');
}

if (typeof window !== 'undefined') {
  setTimeout(() => restoreSavedSession(), 300);
}
