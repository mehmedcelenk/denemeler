import { onStateChange, state, type AnswerMarkedPayload } from '../../app/state.ts';
import { getCourseEntry } from '../../data/course-catalog.ts';
import { computeQuestionStarReward, formatStars, getSkyRank, renderSkyIconSvg } from '../../shared/sky-rank.ts';
import { recordAnswerForCombo, resetComboState, showComboToast } from './combo-toast.ts';
import { addStreakPoints, updateStreakUI } from './streak.ts';
import { initSkyRankPopover } from './sky-rank-popover.ts';
import { launchStarsToBank } from './star-flight.ts';

let initialized = false;

function isAnswerMarkedPayload(value: unknown): value is AnswerMarkedPayload {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AnswerMarkedPayload>;
  return Number.isSafeInteger(candidate.qid)
    && ['A', 'B', 'C', 'D', 'E'].includes(candidate.choice ?? '')
    && typeof candidate.isCorrect === 'boolean';
}

function resolveQuestionCredit(qid: number): number | undefined {
  const q = state.allData.find(item => item.id === qid);
  if (!q) return undefined;
  if (typeof q.kredi === 'number' && Number.isFinite(q.kredi) && q.kredi > 0) return q.kredi;
  return getCourseEntry(q.ders)?.kredi;
}

export function initGamification(): void {
  if (initialized) return;
  initialized = true;
  initSkyRankPopover();
  onStateChange('study:changed', () => { resetComboState(); updateStreakUI(); });

  onStateChange('answer:marked', (payload) => {
    if (!isAnswerMarkedPayload(payload) || payload.isReview) return;
    recordAnswerForCombo(payload.isCorrect);
  }, 10);

  onStateChange('answer:marked', (payload) => {
    if (!isAnswerMarkedPayload(payload) || !payload.isCorrect || payload.isReview) return;
    const wasRematch = state.rematchQuestionIds.has(payload.qid);
    const earned = computeQuestionStarReward(resolveQuestionCredit(payload.qid), wasRematch);
    const prevLayer = getSkyRank(state.waterStreak).layer;
    addStreakPoints(earned);
    launchStarsToBank(payload.qid, earned);
    const nextRank = getSkyRank(state.waterStreak);
    if (nextRank.layer > prevLayer) {
      showComboToast({
        type: 'combo',
        title: `${nextRank.label}'a Yükseldin`,
        subtitle: `${formatStars(nextRank.stars)} yıldız`,
        icon: renderSkyIconSvg(nextRank.layer, 28),
        badgeClass: 'combo-tier',
        skyLayer: nextRank.layer,
      });
    }
  }, 30);
}
