import { escapeHtml } from '../../shared/escape.ts';
import type { FeedEventType, RoomFeedItem, RoomState, StudentStats } from './types.ts';

const eventLabels: Record<FeedEventType, { text: string; icon: string; className: string }> = {
  JOIN: { text: 'odaya katıldı', icon: '🟢', className: 'row-success' },
  LEAVE: { text: 'odadan ayrıldı', icon: '⚪', className: 'row-warning' },
  AWAY: { text: 'sayfadan ayrıldı', icon: '🟠', className: 'row-warning' },
  RETURN: { text: 'sayfaya döndü', icon: '🟢', className: 'row-success' },
  OFFLINE: { text: 'bağlantısı kesildi', icon: '🔴', className: 'row-danger' },
  ONLINE: { text: 'yeniden bağlandı', icon: '🟢', className: 'row-success' },
};

export function updateTeacherFeed(state: RoomState): void {
  const list = document.getElementById('teacherExitLogsList');
  if (!list) return;
  list.innerHTML = state.feedItems.length
    ? [...state.feedItems].reverse().map(renderFeedRow).join('')
    : '<div class="exit-log-empty">Henüz bir hareket yok.</div>';
}

function renderFeedRow(item: RoomFeedItem): string {
  const label = eventLabels[item.type];
  const time = new Date(item.timestamp).toLocaleTimeString('tr-TR');
  return `<div class="exit-log-row ${label.className}" data-event-id="${escapeHtml(item.id)}">
    <span aria-hidden="true">${label.icon}</span>
    <span class="exit-log-name">${escapeHtml(item.studentName)}</span>
    <span class="exit-log-status">${label.text}</span>
    <time class="exit-log-time">${escapeHtml(time)}</time>
  </div>`;
}

export function updateTeacherStats(state: RoomState): void {
  const list = document.getElementById('teacherStatsList');
  if (!list) return;
  const students = Object.values(state.studentStats)
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  list.innerHTML = students.length
    ? students.map(renderStudentStatRow).join('')
    : '<div class="exit-log-empty">Henüz katılımcı yok.</div>';
}

function renderStudentStatRow(student: StudentStats): string {
  const status = !student.isOnline ? 'Bağlantısı kesildi' : student.visible ? 'Sayfada' : 'Sayfa dışında';
  return `<div class="student-stat-row" data-student-id="${escapeHtml(student.id)}">
    <div class="student-stat-identity">
      <span class="stat-name">${escapeHtml(student.name)}</span>
      <span class="student-presence">${status}</span>
    </div>
    <div class="stat-badges">
      <span class="stat-correct" title="Doğru sayısı">${student.correctCount} doğru</span>
      <span class="stat-incorrect" title="Yanlış sayısı">${student.incorrectCount} yanlış</span>
    </div>
  </div>`;
}
