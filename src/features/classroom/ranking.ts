import type { StudentStats } from './types.ts';

export function calculateStudentRank(
  studentIdentifier: string,
  allStats: Record<string, StudentStats>
): { rank: number; total: number; score: number } {
  const list = Object.values(allStats);
  if (list.length === 0) {
    return { rank: 1, total: 1, score: 0 };
  }

  // Puan Formülü: (Doğru * 10) - (Yanlış * 2) + Hız Puanı (toplam soru / geçen süre)
  // NaN, Infinity, negatif veya bozuk süre manipülasyonlarına karşı matematiksel sanitizasyon
  const scoredList = list.map((s) => {
    const correct = Number.isFinite(s.correctCount) && s.correctCount >= 0 ? s.correctCount : 0;
    const incorrect = Number.isFinite(s.incorrectCount) && s.incorrectCount >= 0 ? s.incorrectCount : 0;
    const joined = Number.isFinite(s.joinedAt) && s.joinedAt > 0 && s.joinedAt <= Date.now()
      ? s.joinedAt
      : Date.now() - 60000;

    const totalSolved = correct + incorrect;
    const elapsedMinutes = Math.max(0.2, (Date.now() - joined) / 60000);
    const speedScore = totalSolved > 0 ? (totalSolved / elapsedMinutes) * 2 : 0;
    let totalScore = correct * 10 - incorrect * 2 + speedScore;

    if (!Number.isFinite(totalScore)) {
      totalScore = 0;
    }

    return { id: s.id, name: s.name, score: totalScore };
  });

  scoredList.sort((a, b) => b.score - a.score);

  // Önce benzersiz ID (peerId) ile ara, bulunamazsa isimle eşleştir
  let idx = scoredList.findIndex((item) => item.id === studentIdentifier);
  if (idx === -1) {
    idx = scoredList.findIndex((item) => item.name === studentIdentifier);
  }

  const myRank = idx !== -1 ? idx + 1 : scoredList.length;
  const rawScore = idx !== -1 ? scoredList[idx].score : 0;
  const myScore = Number.isFinite(rawScore) ? Math.round(rawScore) : 0;

  return { rank: myRank, total: scoredList.length, score: myScore };
}
