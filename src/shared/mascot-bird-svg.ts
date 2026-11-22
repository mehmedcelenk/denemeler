import type { BirdMascotId } from './mascot-types.ts';

let birdSvgSeq = 0;

/** Komik tavuk: yuvarlak hatlı, sıcak renkli çizgi film karakteri. */
function renderChickenSvg(): string {
  return `
    <svg class="mc-svg mc-svg-bird" viewBox="0 0 96 96" role="img" aria-hidden="true">
      <g class="mc-root rb-root">
        <ellipse class="rb-shadow" cx="48" cy="86" rx="16" ry="3.5" fill="rgba(15,23,42,0.22)" />
        <path class="rb-talons" d="M 42 72 L 40 84 M 36 85 L 44 85 M 54 72 L 54 84 M 50 85 L 58 85" stroke="#f97316" stroke-width="3" stroke-linecap="round" fill="none" />
        <path class="rb-tail" d="M 24 52 L 10 40 L 18 58 L 12 64 L 29 63 Z" fill="#e2e8f0" stroke="#1e293b" stroke-width="1.5" stroke-linejoin="round" />
        <path d="M 26 58 C 26 42 40 36 56 39 C 68 42 72 54 67 65 C 62 74 48 76 36 73 C 28 70 26 64 26 58 Z" fill="#fefce8" stroke="#1e293b" stroke-width="1.6" />
        <path class="rb-wing-front" d="M 46 49 C 34 48 25 53 26 62 C 36 66 49 65 55 58 C 56 54 52 50 46 49 Z" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5" />
        <g class="rb-head">
          <path class="rb-comb" d="M 49 20 L 47 10 L 55 17 L 59 9 L 63 17 L 68 12 L 67 22 Z" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.3" stroke-linejoin="round" />
          <circle cx="58" cy="31" r="14" fill="#fefce8" stroke="#1e293b" stroke-width="1.6" />
          <path d="M 71 29 L 83 33 L 71 37 Z" fill="#f59e0b" stroke="#78350f" stroke-width="1.4" stroke-linejoin="round" />
          <ellipse class="rb-wattle" cx="70" cy="40" rx="3.2" ry="4.5" fill="#ef4444" stroke="#7f1d1d" stroke-width="1.1" />
          <g class="mc-eye"><circle cx="63" cy="29" r="3.6" fill="#ffffff" stroke="#1e293b" stroke-width="1.2" /><circle class="rb-pupil" cx="64" cy="29" r="1.8" fill="#0f172a" /><circle cx="64.6" cy="28.2" r="0.6" fill="#ffffff" /></g>
          <g class="mc-happy"><path d="M 59 30 Q 63 26 67 30" stroke="#0f172a" /></g>
          <g class="mc-wrong"><path d="M 59 26 L 67 29" stroke="#ef4444" /></g>
        </g>
      </g>
    </svg>
  `;
}

/** Karga: koyu, sade ve keskin gagalı. */
function renderRavenSvg(p: string): string {
  return `
    <svg class="mc-svg mc-svg-raven mc-svg-bird" viewBox="0 0 96 96" role="img" aria-hidden="true">
      <defs>
        <radialGradient id="${p}Body" cx="38%" cy="28%" r="68%"><stop offset="0%" stop-color="#475569" /><stop offset="36%" stop-color="#273244" /><stop offset="100%" stop-color="#090d16" /></radialGradient>
        <linearGradient id="${p}Wing" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#334155" /><stop offset="100%" stop-color="#090d16" /></linearGradient>
      </defs>
      <g class="mc-root rb-root">
        <ellipse class="rb-shadow" cx="48" cy="86" rx="16" ry="3.5" fill="rgba(2,6,23,0.3)" />
        <path class="rb-talons" d="M 43 72 L 40 83 M 35 85 L 45 85 M 54 72 L 53 83 M 48 85 L 58 85" stroke="#64748b" stroke-width="2.6" stroke-linecap="round" fill="none" />
        <path class="rb-tail" d="M 28 60 L 7 70 L 14 75 L 34 67 Z" fill="#0f172a" stroke="#020617" stroke-width="1.3" />
        <path d="M 27 57 C 27 42 40 35 55 37 C 66 39 71 49 67 61 C 63 72 51 76 38 74 C 30 72 27 65 27 57 Z" fill="url(#${p}Body)" stroke="#020617" stroke-width="1.6" />
        <path class="rb-wing-front" d="M 48 48 C 35 44 21 48 14 59 C 24 64 38 66 52 60 C 55 56 54 50 48 48 Z" fill="url(#${p}Wing)" stroke="#020617" stroke-width="1.5" />
        <g class="rb-head">
          <path d="M 43 32 C 43 22 52 17 62 19 C 71 21 75 28 73 37 C 71 44 63 47 54 46 C 46 45 43 39 43 32 Z" fill="url(#${p}Body)" stroke="#020617" stroke-width="1.6" />
          <path d="M 71 27 L 90 33 L 71 38 Z" fill="#334155" stroke="#020617" stroke-width="1.4" stroke-linejoin="round" />
          <g class="mc-eye"><circle cx="64.5" cy="31.5" r="3.2" fill="#f8fafc" stroke="#020617" stroke-width="1.1" /><circle class="rb-pupil" cx="65.2" cy="31.2" r="1.4" fill="#0f172a" /><circle cx="65.8" cy="30.5" r="0.5" fill="#ffffff" /></g>
          <g class="mc-happy"><path d="M 60.5 32.5 Q 64.5 28 68.5 32.2" /></g>
          <g class="mc-wrong"><path d="M 60 28.2 L 69 30.8" /></g>
        </g>
      </g>
    </svg>
  `;
}

/**
 * RoboBaykuş: köşeli zırh plakaları, panel çizgileri ve tek parça tarayıcı vizörlü
 * gece-operasyon robotu. Vizör ve gövde dikişi tema vurgu rengiyle yanar.
 */
function renderRoboOwlSvg(p: string): string {
  return `
    <svg class="mc-svg mc-svg-owl mc-svg-bird" viewBox="0 0 96 96" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="${p}Armor" x1="20%" y1="0%" x2="80%" y2="100%"><stop offset="0%" stop-color="#4b5563" /><stop offset="45%" stop-color="#232b38" /><stop offset="100%" stop-color="#0a0e16" /></linearGradient>
        <linearGradient id="${p}Plate" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7c8798" /><stop offset="100%" stop-color="#1e293b" /></linearGradient>
        <linearGradient id="${p}Wing" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#3b4556" /><stop offset="100%" stop-color="#0b0f17" /></linearGradient>
        <filter id="${p}Glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.1" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <g class="mc-root rb-root">
        <ellipse class="rb-shadow" cx="48" cy="87" rx="15" ry="3" fill="rgba(2,6,23,0.34)" />
        <path class="rb-talons" d="M 42 74 L 40 84 M 36 86 L 41 83 L 45 86 M 54 74 L 54 84 M 50 86 L 54 83 L 58 86" stroke="#475569" stroke-width="2.3" stroke-linecap="square" stroke-linejoin="miter" fill="none" />
        <path class="rb-tail" d="M 31 66 L 14 77 L 22 77 L 18 84 L 35 72 Z" fill="#111827" stroke="#020617" stroke-width="1.2" stroke-linejoin="miter" />
        <path d="M 34 44 L 52 40 L 64 48 L 66 62 L 58 74 L 42 76 L 32 68 L 30 54 Z" fill="url(#${p}Armor)" stroke="#020617" stroke-width="1.4" stroke-linejoin="miter" />
        <path d="M 52 44 L 62 50 L 63 62 L 56 70 L 50 60 Z" fill="url(#${p}Plate)" opacity="0.85" />
        <path d="M 34.6 44.8 L 52 41 L 63.4 48.6" stroke="#8b98ab" stroke-width="0.9" opacity="0.7" fill="none" />
        <path d="M 36 52 L 46 50 M 34 62 L 44 64 M 44 70 L 52 68" stroke="#05080e" stroke-width="0.9" opacity="0.75" fill="none" />
        <path class="rb-glow-stroke" d="M 50 47 L 50 60 L 55 69" stroke-width="1.1" fill="none" opacity="0.9" filter="url(#${p}Glow)" />
        <g class="rb-wing-front">
          <path d="M 50 47 L 36 46 L 24 54 L 18 66 L 30 64 L 40 68 L 52 60 Z" fill="url(#${p}Wing)" stroke="#020617" stroke-width="1.3" stroke-linejoin="miter" />
          <path d="M 25 58 L 41 55 M 22 63 L 43 61 M 33 65 L 46 63" stroke="#56627a" stroke-width="0.8" opacity="0.8" fill="none" />
        </g>
        <g class="rb-head">
          <path class="rb-crest" d="M 47 23 L 37 10 L 54 20 Z" fill="#1f2937" stroke="#020617" stroke-width="1.2" stroke-linejoin="miter" />
          <path class="rb-crest" d="M 64 20 L 75 9 L 72 23 Z" fill="#1f2937" stroke="#020617" stroke-width="1.2" stroke-linejoin="miter" />
          <path d="M 44 28 L 52 19 L 67 18 L 77 26 L 77 38 L 69 46 L 52 46 L 44 38 Z" fill="url(#${p}Armor)" stroke="#020617" stroke-width="1.4" stroke-linejoin="miter" />
          <path d="M 45 28.4 L 52.4 20 L 66.6 19 L 76 26.4" stroke="#8b98ab" stroke-width="0.9" opacity="0.7" fill="none" />
          <path d="M 53 24 L 70 23 L 75 30 L 73 40 L 64 43 L 54 41 L 50 33 Z" fill="#0b1120" stroke="#334155" stroke-width="0.8" />
          <path d="M 73 35 L 80 38 L 75 43 L 72 39 Z" fill="#94a3b8" stroke="#020617" stroke-width="1" stroke-linejoin="miter" />
          <g class="mc-eye">
            <rect x="53" y="28.5" width="20" height="5" rx="1.2" fill="#020617" />
            <rect class="rb-glow-fill" x="54.5" y="29.8" width="17" height="2.4" rx="1" opacity="0.55" />
            <rect class="rb-pupil" x="66" y="29.3" width="4.4" height="3.4" rx="1" fill="#f8fafc" filter="url(#${p}Glow)" />
          </g>
          <g class="mc-happy"><rect x="53" y="28.5" width="20" height="5" rx="1.2" /></g>
          <g class="mc-wrong"><rect x="53" y="28.5" width="8" height="5" rx="1" /><rect x="63" y="28.5" width="10" height="5" rx="1" /></g>
        </g>
      </g>
    </svg>
  `;
}

/**
 * Drone: kuadkopter keşif dronu. Konarken rotorlar durur, uçarken döner;
 * burun altındaki gimbal kamera göz görevi görür, gövde dikişi tema rengiyle yanar.
 */
function renderDroneSvg(p: string): string {
  return `
    <svg class="mc-svg mc-svg-drone mc-svg-bird" viewBox="0 0 96 96" role="img" aria-hidden="true">
      <defs>
        <linearGradient id="${p}Armor" x1="20%" y1="0%" x2="80%" y2="100%"><stop offset="0%" stop-color="#4b5563" /><stop offset="45%" stop-color="#232b38" /><stop offset="100%" stop-color="#0a0e16" /></linearGradient>
        <linearGradient id="${p}Plate" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7c8798" /><stop offset="100%" stop-color="#1e293b" /></linearGradient>
        <filter id="${p}Glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.1" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      <g class="mc-root rb-root">
        <ellipse class="rb-shadow" cx="48" cy="87" rx="18" ry="2.8" fill="rgba(2,6,23,0.34)" />
        <g transform="translate(0 12)">
          <path class="rb-talons" d="M 39 61 L 36 72 M 57 61 L 60 72 M 31 72 L 43 72 M 53 72 L 65 72" stroke="#475569" stroke-width="2" stroke-linecap="round" fill="none" />
          <path d="M 36 50 L 20 41.5 M 60 50 L 76 41.5" stroke="#1f2937" stroke-width="3.2" stroke-linecap="round" />
          <path d="M 36 49 L 20.5 40.6 M 60 49 L 75.5 40.6" stroke="#64748b" stroke-width="0.7" opacity="0.7" />
          <rect x="15" y="39" width="10" height="6" rx="1.5" fill="url(#${p}Armor)" stroke="#020617" stroke-width="1" />
          <rect x="71" y="39" width="10" height="6" rx="1.5" fill="url(#${p}Armor)" stroke="#020617" stroke-width="1" />
          <ellipse class="rb-rotor-disc" cx="20" cy="37.5" rx="15" ry="2.2" fill="rgba(148,163,184,0.35)" />
          <ellipse class="rb-rotor-disc" cx="76" cy="37.5" rx="15" ry="2.2" fill="rgba(148,163,184,0.35)" />
          <path class="rb-rotor" d="M 6 37.5 L 34 37.5" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round" />
          <path class="rb-rotor" d="M 62 37.5 L 90 37.5" stroke="#94a3b8" stroke-width="1.6" stroke-linecap="round" />
          <circle cx="20" cy="37.5" r="1.6" fill="#cbd5e1" />
          <circle cx="76" cy="37.5" r="1.6" fill="#cbd5e1" />
          <path d="M 30 52 L 36 45 L 60 45 L 68 51 L 64 61 L 34 61 Z" fill="url(#${p}Armor)" stroke="#020617" stroke-width="1.4" stroke-linejoin="miter" />
          <path d="M 38 45 L 42 41 L 56 41 L 60 45 Z" fill="url(#${p}Plate)" stroke="#020617" stroke-width="1" />
          <path d="M 36.4 45.7 L 59.6 45.7" stroke="#8b98ab" stroke-width="0.9" opacity="0.7" />
          <path d="M 35 53 L 63 53 M 47 45 L 45 61" stroke="#05080e" stroke-width="0.9" opacity="0.75" />
          <path class="rb-glow-stroke" d="M 34 56 L 47 57.8 L 62 56" stroke-width="1.2" fill="none" opacity="0.95" filter="url(#${p}Glow)" />
          <circle class="rb-led rb-glow-fill" cx="33" cy="50" r="1.3" filter="url(#${p}Glow)" />
          <circle cx="66.4" cy="51.6" r="0.9" fill="#34d399" />
          <g class="rb-head">
            <rect x="64" y="59.5" width="4" height="2.4" fill="#1f2937" />
            <circle cx="67" cy="65" r="4.8" fill="url(#${p}Armor)" stroke="#020617" stroke-width="1.1" />
            <g class="mc-eye">
              <circle class="rb-glow-stroke" cx="68" cy="65" r="3" fill="#020617" stroke-width="0.9" />
              <circle class="rb-pupil" cx="68.6" cy="64.6" r="1.2" fill="#f8fafc" filter="url(#${p}Glow)" />
            </g>
            <g class="mc-happy"><circle cx="68" cy="65" r="3" /></g>
            <g class="mc-wrong"><circle cx="68" cy="65" r="3" /></g>
          </g>
        </g>
      </g>
    </svg>
  `;
}

/** Tavuk, Karga, RoboBaykuş ve Drone için profil seçici & uçan maskot SVG şablonları. */
export function renderRoboBirdSvg(species: BirdMascotId = 'bird'): string {
  if (species === 'bird') return renderChickenSvg();
  const p = `rb${++birdSvgSeq}_`;
  if (species === 'owl') return renderRoboOwlSvg(p);
  if (species === 'drone') return renderDroneSvg(p);
  return renderRavenSvg(p);
}
