import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeQuestionStarReward,
  formatStars,
  getSkyRank,
  renderSkyIconSvg,
  renderSkyRankStripHtml,
  renderWhiteStarSvg,
  SKY_TIERS,
} from '../src/shared/sky-rank.ts';

test('getSkyRank resolves all 7 Sema layers and progress accurately', () => {
  assert.equal(SKY_TIERS.length, 8);
  assert.deepEqual({ l: getSkyRank(0).layer, label: getSkyRank(0).label, rem: getSkyRank(0).remainingToNext }, { l: 0, label: 'Arz', rem: 50 });
  assert.equal(getSkyRank(49).layer, 0);
  assert.equal(getSkyRank(50).layer, 1);
  assert.equal(getSkyRank(250).layer, 2);
  assert.equal(getSkyRank(750).layer, 3);
  assert.equal(getSkyRank(1800).layer, 4);
  assert.equal(getSkyRank(4000).layer, 5);
  assert.equal(getSkyRank(7000).layer, 6);
  const max = getSkyRank(10000);
  assert.equal(max.layer, 7);
  assert.equal(max.label, '7. Kat');
  assert.equal(max.isMax, true);
  assert.equal(max.remainingToNext, 0);
  assert.equal(max.progressPercent, 100);
});

test('computeQuestionStarReward gives 1:1 credit on first try and 50% on rematch', () => {
  assert.equal(computeQuestionStarReward(6, false), 6);
  assert.equal(computeQuestionStarReward(5, false), 5);
  assert.equal(computeQuestionStarReward(2, false), 2);
  assert.equal(computeQuestionStarReward(1, false), 1);
  assert.equal(computeQuestionStarReward(undefined, false), 2);

  assert.equal(computeQuestionStarReward(6, true), 3);
  assert.equal(computeQuestionStarReward(5, true), 3);
  assert.equal(computeQuestionStarReward(2, true), 1);
  assert.equal(computeQuestionStarReward(1, true), 1);
});

test('renderSkyIconSvg produces 7 arcs with exact active count and zenith at layer 7', () => {
  const svg0 = renderSkyIconSvg(0, 20);
  assert.equal((svg0.match(/class="sky-arc/g) || []).length, 7);
  assert.equal((svg0.match(/is-active/g) || []).length, 0);

  const svg3 = renderSkyIconSvg(3, 20);
  assert.equal((svg3.match(/sky-arc is-active/g) || []).length, 3);
  assert.ok(svg3.includes('is-peak'));

  const svg7 = renderSkyIconSvg(7, 20);
  assert.equal((svg7.match(/sky-arc is-active/g) || []).length, 7);
  assert.ok(svg7.includes('sky-zenith is-active'));
  assert.equal(formatStars(7), '7');

  const starSvg = renderWhiteStarSvg(14);
  assert.ok(starSvg.includes('class="sky-star-svg"'));
  const strip = renderSkyRankStripHtml(4000);
  assert.ok(strip.includes('data-sky-layer="5"'));
  assert.ok(strip.includes('class="sky-star-svg"'));
});
