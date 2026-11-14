import type { Question } from '../../data/question.ts';
import { state } from '../../app/state.ts';
import { getQuestionInstitutionMetrics, getQuestionRoomMetrics } from '../../shared/question-filter.ts';

export function renderQuestionStatBadge(q: Question): string {
  const roomStat = state.roomQuestionStats[q.id];
  const roomMetrics = getQuestionRoomMetrics(roomStat);

  const instStat = state.institutionStats[q.id];
  const instMetrics = getQuestionInstitutionMetrics(q, instStat);

  let html = '';

  if (state.isRoomActive && roomMetrics.total > 0) {
    if (roomMetrics.wrong > 0) {
      html += `<span class="q-stat-badge q-stat-badge-room has-error" title="Oda İstatistiği: ${roomMetrics.wrong} Yanlış, ${roomMetrics.correct} Doğru (%${roomMetrics.wrongRate} Hata)">👥 Oda: 🔴 ${roomMetrics.wrong}Y · 🟢 ${roomMetrics.correct}D</span>`;
    } else {
      html += `<span class="q-stat-badge q-stat-badge-room all-correct" title="Oda İstatistiği: ${roomMetrics.correct} Doğru">👥 Oda: 🟢 ${roomMetrics.correct}D</span>`;
    }
  }

  if (instMetrics.total > 0) {
    if (instMetrics.wrong > 0) {
      html += `<span class="q-stat-badge q-stat-badge-inst has-error" title="Kurum İstatistiği: ${instMetrics.wrong} Yanlış, ${instMetrics.correct} Doğru (%${instMetrics.wrongRate} Hata)">🔥 Kurum: 🔴 ${instMetrics.wrong}Y · 🟢 ${instMetrics.correct}D (%${instMetrics.wrongRate})</span>`;
    } else {
      html += `<span class="q-stat-badge q-stat-badge-inst all-correct" title="Kurum İstatistiği: ${instMetrics.correct} Doğru (0 Hata)">🔥 Kurum: 🟢 ${instMetrics.correct}D</span>`;
    }
  }

  return html;
}
