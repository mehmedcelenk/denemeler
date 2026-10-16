import type { StudentStats } from './types.ts';

export function calculateStudentRank(
  userName: string,
  allStats: Record<string, StudentStats>
): { rank: number; total: number; score: number } {
  const list = Object.values(allStats);
  if (list.length === 0) {
    return { rank: 1, total: 1, score: 0 };
  }

  // Puan Formülü: (Doğru * 10) - (Yanlış * 2) + Hız Puanı (toplam soru / geçen süre)
  const scoredList = list.map((s) => {
    const totalSolved = s.correctCount + s.incorrectCount;
    const elapsedMinutes = Math.max(0.2, (Date.now() - s.joinedAt) / 60000);
    const speedScore = totalSolved > 0 ? (totalSolved / elapsedMinutes) * 2 : 0;
    const totalScore = s.correctCount * 10 - s.incorrectCount * 2 + speedScore;
    return { name: s.name, score: totalScore };
  });

  scoredList.sort((a, b) => b.score - a.score);

  const idx = scoredList.findIndex((item) => item.name === userName);
  const myRank = idx !== -1 ? idx + 1 : scoredList.length;
  const myScore = idx !== -1 ? Math.round(scoredList[idx].score) : 0;

  return { rank: myRank, total: scoredList.length, score: myScore };
}
