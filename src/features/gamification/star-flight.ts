import { getActiveQuestionCard } from '../booklet/card-query.ts';
import { renderWhiteStarSvg } from '../../shared/sky-rank.ts';

interface FlyingStarSpec {
  el: HTMLElement;
  startX: number;
  startY: number;
  cpX: number;
  cpY: number;
  endX: number;
  endY: number;
  delay: number;
  duration: number;
  accelPower: number;
  spinDeg: number;
  baseScale: number;
  landed: boolean;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function pulseStarBank(pill: HTMLElement): void {
  pill.classList.remove('streak-pulse');
  void pill.offsetWidth;
  pill.classList.add('streak-pulse');
}

/**
 * Doğru bilinen sorunun üzerinden sağ üst köşedeki yıldızhaneye
 * rastgele ivme ve kavislerle hızlı, akıcı beyaz yıldızlar uçurur.
 */
export function launchStarsToBank(qid: number, earnedStars: number): void {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  if (typeof requestAnimationFrame !== 'function' || prefersReducedMotion()) return;

  const pill = document.getElementById('topStreakPill');
  const card = getActiveQuestionCard(qid);
  if (!pill || !card) return;

  const pillRect = pill.getBoundingClientRect();
  const cardRect = card.getBoundingClientRect();
  if (pillRect.width === 0 || cardRect.width === 0) return;

  const iconEl = document.getElementById('streakIconDisplay');
  const targetRect = iconEl && iconEl.getBoundingClientRect().width > 0
    ? iconEl.getBoundingClientRect()
    : pillRect;
  const endX = targetRect.left + targetRect.width * 0.5;
  const endY = targetRect.top + targetRect.height * 0.5;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const visLeft = clamp(cardRect.left, 16, vw - 16);
  const visRight = clamp(cardRect.right, visLeft + 24, vw - 16);
  const visTop = clamp(cardRect.top, 64, vh - 80);
  const visBottom = clamp(cardRect.bottom, visTop + 32, vh - 40);

  const count = clamp(Math.round(earnedStars) + 2, 4, 10);
  const stars: FlyingStarSpec[] = [];

  for (let i = 0; i < count; i++) {
    const startX = randomBetween(visLeft + (visRight - visLeft) * 0.14, visLeft + (visRight - visLeft) * 0.86);
    const startY = randomBetween(visTop + (visBottom - visTop) * 0.12, visTop + (visBottom - visTop) * 0.58);
    const midX = (startX + endX) * 0.5;
    const midY = (startY + endY) * 0.5;
    const spreadX = randomBetween(-135, 115);
    const spreadY = randomBetween(-145, 55);

    const size = Math.round(randomBetween(13, 21));
    const el = document.createElement('span');
    el.className = 'flying-star-particle';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = renderWhiteStarSvg(size);
    el.style.transform = `translate3d(${startX}px, ${startY}px, 0) scale(0.3)`;
    el.style.opacity = '0';
    document.body.appendChild(el);

    stars.push({
      el,
      startX,
      startY,
      cpX: midX + spreadX,
      cpY: Math.min(startY, endY) + spreadY,
      endX: endX + randomBetween(-5, 5),
      endY: endY + randomBetween(-4, 4),
      delay: randomBetween(0, 115),
      duration: randomBetween(420, 720),
      accelPower: randomBetween(1.65, 3.15),
      spinDeg: randomBetween(-210, 210),
      baseScale: randomBetween(0.9, 1.25),
      landed: false,
    });
  }

  const t0 = performance.now();
  let lastPulseAt = 0;

  const step = (now: number): void => {
    let remaining = 0;

    for (const s of stars) {
      if (s.landed) continue;
      const elapsed = now - t0 - s.delay;
      if (elapsed < 0) {
        remaining++;
        continue;
      }

      const rawT = Math.min(1, elapsed / s.duration);
      // Her yıldız için rastgele ivmelenme (başta yumuşak çıkış, hedefe doğru roket hızı)
      const eased = Math.pow(rawT, s.accelPower);
      const inv = 1 - eased;

      const x = inv * inv * s.startX + 2 * inv * eased * s.cpX + eased * eased * s.endX;
      const y = inv * inv * s.startY + 2 * inv * eased * s.cpY + eased * eased * s.endY;

      const pop = rawT < 0.16 ? 0.35 + (rawT / 0.16) * 0.85 : 1.2 - rawT * 0.68;
      const scale = Math.max(0.35, pop * s.baseScale);
      const opacity = rawT < 0.1 ? rawT / 0.1 : rawT > 0.86 ? (1 - rawT) / 0.14 : 1;
      const rot = s.spinDeg * eased;

      s.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)}) rotate(${rot.toFixed(1)}deg)`;
      s.el.style.opacity = opacity.toFixed(3);

      if (rawT >= 1) {
        s.landed = true;
        s.el.remove();
        if (now - lastPulseAt > 95) {
          lastPulseAt = now;
          pulseStarBank(pill);
        }
      } else {
        remaining++;
      }
    }

    if (remaining > 0) {
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}
