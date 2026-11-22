import type { BirdMascotId } from './mascot-types.ts';

let birdSvgSeq = 0;

/**
 * Tavuk (low-poly gerçek tavuk), Karga (zeki karga) ve RoboBaykuş için profil seçici & yedek SVG şablonları.
 */
export function renderRoboBirdSvg(species: BirdMascotId = 'bird'): string {
  const p = `rb${++birdSvgSeq}_`;
  if (species === 'bird') {
    return `
      <svg class="mc-svg mc-svg-bird" viewBox="0 0 96 96" role="img" aria-hidden="true">
        <g class="mc-root rb-root">
          <path d="M 42 72 L 40 84 M 36 85 L 44 85 M 54 72 L 54 84 M 50 85 L 58 85" stroke="#f97316" stroke-width="3" stroke-linecap="round" fill="none" />
          <path d="M 24 52 L 10 40 L 18 58 L 12 64 L 29 63 Z" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.5" stroke-linejoin="round" />
          <path d="M 26 58 C 26 42 40 36 56 39 C 68 42 72 54 67 65 C 62 74 48 76 36 73 C 28 70 26 64 26 58 Z" fill="#fefce8" stroke="#1e293b" stroke-width="1.6" />
          <path class="rb-wing-front" d="M 46 49 C 34 48 25 53 26 62 C 36 66 49 65 55 58 C 56 54 52 50 46 49 Z" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5" />
          <g class="rb-head">
            <path d="M 49 20 L 47 10 L 55 17 L 59 9 L 63 17 L 68 12 L 67 22 Z" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.3" stroke-linejoin="round" />
            <circle cx="58" cy="31" r="14" fill="#fefce8" stroke="#1e293b" stroke-width="1.6" />
            <path d="M 71 29 L 83 33 L 71 37 Z" fill="#f59e0b" stroke="#78350f" stroke-width="1.4" stroke-linejoin="round" />
            <ellipse cx="70" cy="40" rx="3.2" ry="4.5" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.1" />
            <g class="mc-eye"><circle cx="63" cy="29" r="3.6" fill="#ffffff" stroke="#1e293b" stroke-width="1.2" /><circle cx="64" cy="29" r="1.8" fill="#0f172a" /></g>
            <g class="mc-happy"><path d="M 59 30 Q 63 26 67 30" stroke="#0f172a" /></g>
            <g class="mc-wrong"><path d="M 59 26 L 67 29" stroke="#ef4444" /></g>
          </g>
        </g>
      </svg>
    `;
  }

  const isOwl = species === 'owl';
  const primaryStop = isOwl ? 'var(--brand-accent, #0284c7)' : '#273244';
  const eyeColor = isOwl ? '#fbbf24' : '#f8fafc';
  const beakPath = isOwl ? 'M 70 30 L 81 35 L 71 39 Z' : 'M 71 27 L 90 33 L 71 38 Z';
  const crestSvg = isOwl
    ? `<path d="M 48 22 L 42 10 L 55 19 Z" fill="url(#${p}WingF)" stroke="#020617" stroke-width="1.3" /><path d="M 60 20 L 66 9 L 66 21 Z" fill="url(#${p}WingF)" stroke="#020617" stroke-width="1.3" />`
    : '';

  return `
    <svg class="mc-svg mc-svg-${species} mc-svg-bird" viewBox="0 0 96 96" role="img" aria-hidden="true">
      <defs>
        <radialGradient id="${p}Body" cx="38%" cy="28%" r="68%">
          <stop offset="0%" stop-color="${isOwl ? '#f8fafc' : '#475569'}" />
          <stop offset="36%" stop-color="${primaryStop}" />
          <stop offset="100%" stop-color="#090d16" />
        </radialGradient>
        <linearGradient id="${p}WingF" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${isOwl ? '#e2e8f0' : '#334155'}" />
          <stop offset="100%" stop-color="#090d16" />
        </linearGradient>
      </defs>
      <g class="mc-root rb-root">
        <path d="M 43 72 L 40 83 M 35 85 L 45 85 M 54 72 L 53 83 M 48 85 L 58 85" stroke="#64748b" stroke-width="2.6" stroke-linecap="round" fill="none" />
        <path d="M 28 60 L 7 70 L 14 75 L 34 67 Z" fill="#0f172a" stroke="#020617" stroke-width="1.3" />
        <path d="M 27 57 C 27 42 40 35 55 37 C 66 39 71 49 67 61 C 63 72 51 76 38 74 C 30 72 27 65 27 57 Z" fill="url(#${p}Body)" stroke="#020617" stroke-width="1.6" />
        <path class="rb-wing-front" d="M 48 48 C 35 44 21 48 14 59 C 24 64 38 66 52 60 C 55 56 54 50 48 48 Z" fill="url(#${p}WingF)" stroke="#020617" stroke-width="1.5" />
        <g class="rb-head">
          ${crestSvg}
          <path d="M 43 32 C 43 22 52 17 62 19 C 71 21 75 28 73 37 C 71 44 63 47 54 46 C 46 45 43 39 43 32 Z" fill="url(#${p}Body)" stroke="#020617" stroke-width="1.6" />
          <path d="${beakPath}" fill="${isOwl ? '#f59e0b' : '#334155'}" stroke="#020617" stroke-width="1.4" stroke-linejoin="round" />
          <g class="mc-eye"><circle cx="64.5" cy="31.5" r="${isOwl ? '4.2' : '3.2'}" fill="${eyeColor}" stroke="#020617" stroke-width="1.1" /><circle cx="65.2" cy="31.2" r="1.4" fill="#0f172a" /></g>
          <g class="mc-happy"><path d="M 60.5 32.5 Q 64.5 28 68.5 32.2" /></g>
          <g class="mc-wrong"><path d="M 60 28.2 L 69 30.8" /></g>
        </g>
      </g>
    </svg>
  `;
}
