export interface SkyTier {
  readonly layer: number;
  readonly label: string;
  readonly minStars: number;
}

export interface SkyRankProgress {
  readonly layer: number;
  readonly label: string;
  readonly stars: number;
  readonly currentMin: number;
  readonly nextMin: number | null;
  readonly nextLabel: string | null;
  readonly remainingToNext: number;
  readonly progressPercent: number;
  readonly isMax: boolean;
}

export const SKY_TIERS: readonly SkyTier[] = [
  { layer: 0, label: 'Arz', minStars: 0 },
  { layer: 1, label: '1. Kat', minStars: 50 },
  { layer: 2, label: '2. Kat', minStars: 250 },
  { layer: 3, label: '3. Kat', minStars: 750 },
  { layer: 4, label: '4. Kat', minStars: 1800 },
  { layer: 5, label: '5. Kat', minStars: 4000 },
  { layer: 6, label: '6. Kat', minStars: 7000 },
  { layer: 7, label: '7. Kat', minStars: 10000 },
];

export function computeQuestionStarReward(kredi: number | undefined, isRematch: boolean): number {
  const base = typeof kredi === 'number' && Number.isFinite(kredi) && kredi > 0
    ? Math.round(kredi)
    : 2;
  return isRematch ? Math.max(1, Math.round(base * 0.5)) : base;
}

export function getSkyRank(rawStars: number): SkyRankProgress {
  const stars = Number.isFinite(rawStars) && rawStars > 0 ? Math.floor(rawStars) : 0;
  let current = SKY_TIERS[0];
  for (const tier of SKY_TIERS) {
    if (stars >= tier.minStars) current = tier;
  }
  const next = SKY_TIERS[current.layer + 1] ?? null;
  if (!next) {
    return {
      layer: current.layer,
      label: current.label,
      stars,
      currentMin: current.minStars,
      nextMin: null,
      nextLabel: null,
      remainingToNext: 0,
      progressPercent: 100,
      isMax: true,
    };
  }
  const span = Math.max(1, next.minStars - current.minStars);
  const progressPercent = Math.min(100, Math.max(0, Math.round(((stars - current.minStars) / span) * 100)));
  return {
    layer: current.layer,
    label: current.label,
    stars,
    currentMin: current.minStars,
    nextMin: next.minStars,
    nextLabel: next.label,
    remainingToNext: Math.max(0, next.minStars - stars),
    progressPercent,
    isMax: false,
  };
}

export function formatStars(stars: number): string {
  const safe = Number.isFinite(stars) && stars > 0 ? Math.floor(stars) : 0;
  return safe >= 1000 ? safe.toLocaleString('tr-TR') : String(safe);
}

/**
 * 7 iç içe ince gökkubbe yayı (özel vektör SVG, emoji yok).
 * Aktif katmana kadar olan yaylar parlak, üst katmanlar silüet görünür.
 */
export function renderSkyIconSvg(rawLayer: number, size = 20): string {
  const layer = Math.max(0, Math.min(7, Math.floor(rawLayer)));
  const cx = 14;
  const cy = 20.5;
  const radii = [2.6, 4.4, 6.2, 8.0, 9.8, 11.6, 13.4];

  const arcs = radii.map((r, index) => {
    const tierLayer = index + 1;
    const isActive = tierLayer <= layer;
    const isPeak = tierLayer === layer;
    const cls = isPeak ? 'sky-arc is-active is-peak' : isActive ? 'sky-arc is-active' : 'sky-arc';
    const x1 = (cx - r).toFixed(2);
    const x2 = (cx + r).toFixed(2);
    return `<path class="${cls}" d="M${x1} ${cy} A${r} ${r} 0 0 1 ${x2} ${cy}"/>`;
  }).join('');

  const zenithDot = layer >= 7
    ? `<circle class="sky-zenith is-active" cx="${cx}" cy="4.2" r="1.4"/>`
    : `<circle class="sky-origin ${layer === 0 ? 'is-peak' : 'is-active'}" cx="${cx}" cy="${cy}" r="1.15"/>`;

  return `<svg class="sky-rank-svg" width="${size}" height="${Math.round(size * 0.86)}" viewBox="0 0 28 24" fill="none" aria-hidden="true"><line class="sky-horizon" x1="2" y1="${cy}" x2="26" y2="${cy}"/>${arcs}${zenithDot}</svg>`;
}

/**
 * Puan sayaçlarında görünen saf, 4-köşeli astronomik yıldız SVG'si (emoji yok).
 */
export function renderWhiteStarSvg(size = 14): string {
  return `<svg class="sky-star-svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 1.6L14.65 9.35L22.4 12L14.65 14.65L12 22.4L9.35 14.65L1.6 12L9.35 9.35Z" fill="currentColor"/></svg>`;
}

export function renderSkyRankStripHtml(stars: number): string {
  const rank = getSkyRank(stars);
  const meta = rank.isMax
    ? `${formatStars(rank.stars)} · Zirve`
    : `${formatStars(rank.stars)} / ${formatStars(rank.nextMin ?? 0)}`;
  return `<button type="button" class="arena-sky-strip" id="btnHomeSkyRank" data-sky-layer="${rank.layer}" data-action="toggle-sky-rank-popover"><span class="arena-sky-left">${renderSkyIconSvg(rank.layer, 24)}<span class="arena-sky-label">${rank.label}</span></span><span class="arena-sky-right"><span class="arena-sky-stars-pill">${renderWhiteStarSvg(11)}<span>${meta}</span></span><span class="arena-sky-bar" aria-hidden="true"><span class="arena-sky-bar-fill" style="width: ${rank.progressPercent}%"></span></span></span></button>`;
}
