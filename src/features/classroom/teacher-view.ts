import type { RoomFeedItem, RoomState, StudentStats } from './types.ts';

export function updateTeacherFeed(state: RoomState): void {
  const listEl = document.getElementById('teacherExitLogsList');
  if (!listEl) return;
  if (state.feedItems.length === 0) {
    listEl.innerHTML = '<div class="exit-log-empty">Henüz bir hareket yok.</div>';
    return;
  }
  listEl.innerHTML = state.feedItems.map((item) => renderFeedRow(item)).join('');
}

function renderFeedRow(item: RoomFeedItem): string {
  const timeStr = formatTime(item.timestamp);
  let icon = 'ℹ️';
  let statusText = '';
  let rowClass = '';
  let actionBtn = '';

  switch (item.type) {
    case 'JOIN':
      icon = '🟢';
      statusText = 'katıldı';
      rowClass = 'row-success';
      break;
    case 'LEAVE':
      icon = '⚪';
      statusText = 'ayrıldı';
      rowClass = 'row-danger';
      break;
    case 'FOCUS_LOST':
      if (item.returnedAt) {
        icon = '🔄';
        const returnedTime = formatTime(item.returnedAt);
        const diffSec = Math.round((item.returnedAt - item.timestamp) / 1000);
        statusText = `ayrıldı, geri döndü (${diffSec} sn sonra - ${returnedTime})`;
        rowClass = 'row-warning';
      } else {
        icon = '⚪';
        statusText = 'ayrıldı';
        rowClass = 'row-danger';
      }
      break;
    case 'HELP_CALL':
      icon = '✋';
      statusText = 'hoca çağırdı!';
      rowClass = 'row-warning';
      if (!item.resolved) {
        actionBtn = `<button type="button" class="btn-resolve-help" data-action="resolve-help" data-id="${item.id}" data-student-id="${item.studentId}" data-name="${escapeHtml(item.studentName)}" title="Gidildi / Tamamlandı">Tamam ✓</button>`;
      } else {
        statusText = 'hoca ilgilendi ✓';
        rowClass = 'row-success';
      }
      break;
  }

  return `<div class="exit-log-row ${rowClass}" id="feed_${item.id}">
    <span class="exit-log-bullet">${icon}</span>
    <span class="exit-log-name">${escapeHtml(item.studentName)}</span>
    <span class="exit-log-status">${statusText}</span>
    <span class="exit-log-time">(${timeStr})</span>
    ${actionBtn}
  </div>`;
}

export function updateTeacherStats(state: RoomState): void {
  const listEl = document.getElementById('teacherStatsList');
  if (!listEl) return;

  const statsList = Object.values(state.studentStats);
  if (statsList.length === 0) {
    listEl.innerHTML = '<div class="exit-log-empty">Henüz soru çözen öğrenci yok.</div>';
    return;
  }

  listEl.innerHTML = statsList.map((s) => renderStudentStatRow(s)).join('');
}

function renderStudentStatRow(s: StudentStats): string {
  const totalSolved = s.correctCount + s.incorrectCount;
  const elapsedMinutes = Math.max(0.2, (Date.now() - s.joinedAt) / 60000);
  const pace = totalSolved > 0 ? (elapsedMinutes / totalSolved).toFixed(1) : '-';

  const exitCount = s.exitCount || 0;
  const awaySec = Math.round((s.totalAwayMs || 0) / 1000);
  const awayStr = awaySec >= 60 ? `${Math.floor(awaySec / 60)}d ${awaySec % 60}s` : `${awaySec}s`;
  const violationBadge = exitCount > 0
    ? `<span class="stat-violation" style="color:#ef4444; font-weight:700;" title="Toplam ${exitCount} kez ayrıldı (Dışarıda: ${awayStr})">🚨 ${exitCount} çıkış (${awayStr})</span>`
    : `<span class="stat-clean" style="color:#10b981;" title="Hiç ayrılmadı">🛡️ 0 ihlal</span>`;

  const onlineDot = s.isOnline !== false ? '🟢' : '⚪ (Ayrıldı)';

  return `<div class="student-stat-row">
    <div style="display:flex; flex-direction:column; gap:2px;">
      <span class="stat-name">${onlineDot} ${escapeHtml(s.name)}</span>
      <div style="font-size:0.82em;">${violationBadge}</div>
    </div>
    <div class="stat-badges">
      <span class="stat-correct" title="Doğru Sayısı">🟢 ${s.correctCount}</span>
      <span class="stat-incorrect" title="Yanlış Sayısı">🔴 ${s.incorrectCount}</span>
      <span class="stat-pace" title="Soru Başına Ortalama Süre">⏱️ ${pace} dk</span>
      <button type="button" class="btn-star-student" data-action="award-star" data-id="${s.id}" data-name="${escapeHtml(s.name)}" title="Öğrenciye Yıldız Gönder">⭐</button>
    </div>
  </div>`;
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
