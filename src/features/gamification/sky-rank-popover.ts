import { registerActions } from '../../app/actions.ts';
import { state } from '../../app/state.ts';
import { escapeHtml } from '../../shared/escape.ts';
import { formatStars, getSkyRank, renderSkyIconSvg, renderWhiteStarSvg, SKY_TIERS } from '../../shared/sky-rank.ts';

let initialized = false;

function getOverlay(): HTMLElement | null {
  if (typeof document === 'undefined' || !document.body) return null;
  let el = document.getElementById('skyRankPopover');
  if (!el) {
    el = document.createElement('div');
    el.id = 'skyRankPopover';
    el.className = 'sky-rank-overlay';
    el.setAttribute('data-action', 'close-sky-rank-popover');
    el.setAttribute('data-action-self', 'true');
    el.hidden = true;
    document.body.appendChild(el);
  }
  return el;
}

function renderSkyRankCard(): void {
  const overlay = getOverlay();
  if (!overlay) return;
  const rank = getSkyRank(state.waterStreak);
  const subtext = rank.isMax
    ? 'Yedinci Gök zirvesine ulaştın.'
    : `${rank.nextLabel} için ${formatStars(rank.remainingToNext)} yıldız kaldı`;

  const ladderHtml = [...SKY_TIERS].reverse().map(tier => {
    const reached = rank.layer >= tier.layer;
    const isCurrent = rank.layer === tier.layer;
    return `
      <li class="sky-ladder-item ${reached ? 'is-reached' : ''} ${isCurrent ? 'is-current' : ''}" data-sky-layer="${tier.layer}">
        <span class="sky-ladder-icon">${renderSkyIconSvg(tier.layer, 20)}</span>
        <span class="sky-ladder-name">${escapeHtml(tier.label)}</span>
        <span class="sky-ladder-min">${renderWhiteStarSvg(10)}<span>${formatStars(tier.minStars)}</span></span>
      </li>
    `;
  }).join('');

  overlay.innerHTML = `
    <section class="sky-rank-card" data-sky-layer="${rank.layer}" role="dialog" aria-modal="true" aria-labelledby="skyRankDialogTitle">
      <header class="sky-card-head">
        <div class="sky-card-hero">
          <span class="sky-card-emblem">${renderSkyIconSvg(rank.layer, 48)}</span>
          <div class="sky-card-meta">
            <span class="sky-card-eyebrow">SEMA DERECESİ</span>
            <h2 id="skyRankDialogTitle">${escapeHtml(rank.label)}</h2>
            <span class="sky-card-stars">${renderWhiteStarSvg(12)}<span>${formatStars(rank.stars)} yıldız</span></span>
          </div>
        </div>
        <button type="button" class="sky-card-close" data-action="close-sky-rank-popover" aria-label="Kapat">✕</button>
      </header>
      <div class="sky-card-progress">
        <div class="sky-card-track" role="progressbar" aria-valuenow="${rank.progressPercent}" aria-valuemin="0" aria-valuemax="100">
          <span class="sky-card-fill" style="width: ${rank.progressPercent}%"></span>
        </div>
        <p class="sky-card-sub">${escapeHtml(subtext)}</p>
      </div>
      <ul class="sky-ladder" aria-label="7 Sema Katmanı">
        ${ladderHtml}
      </ul>
      <p class="sky-card-hint">Doğru soru ders kredisi kadar, Rövanş başarısı %50 yıldız kazandırır; yanlışta yıldız düşmez.</p>
    </section>
  `;
}

export function openSkyRankPopover(): void {
  const overlay = getOverlay();
  if (!overlay) return;
  renderSkyRankCard();
  overlay.hidden = false;
  document.getElementById('topStreakPill')?.setAttribute('aria-expanded', 'true');
  overlay.querySelector<HTMLElement>('.sky-card-close')?.focus();
}

export function closeSkyRankPopover(): void {
  const overlay = document.getElementById('skyRankPopover');
  if (overlay) overlay.hidden = true;
  document.getElementById('topStreakPill')?.setAttribute('aria-expanded', 'false');
}

export function initSkyRankPopover(): void {
  if (initialized) return;
  initialized = true;

  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      const overlay = document.getElementById('skyRankPopover');
      if (overlay && !overlay.hidden) {
        event.preventDefault();
        closeSkyRankPopover();
      }
    });
  }

  registerActions({
    'toggle-sky-rank-popover': () => {
      const overlay = document.getElementById('skyRankPopover');
      if (overlay && !overlay.hidden) closeSkyRankPopover();
      else openSkyRankPopover();
    },
    'close-sky-rank-popover': () => closeSkyRankPopover(),
  });
}
