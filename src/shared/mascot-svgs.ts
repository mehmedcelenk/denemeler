import type { ActiveMascotId, AnyMascotId, MascotId } from './mascot-types.ts';
import { renderRoboBirdSvg } from './mascot-bird-svg.ts';

/**
 * Üst HUD yuvarlak çerçevesi için önden bakan (portre/büst) Robo-Maskot SVG şablonları.
 * Renkler doğrudan kullanıcının seçtiği vurgu rengine (`--brand-accent`) bağlanır.
 */
const CAT_SVG = `
  <svg class="mc-svg mc-svg-cat" viewBox="0 0 64 64" role="img" aria-hidden="true">
    <g class="mc-root">
      <path class="mc-coat-deep" d="M 11 64 C 13 51 21 47 32 47 C 43 47 51 51 53 64 Z" />
      <path class="mc-coat-hi" d="M 26 51 L 32 58 L 38 51 Z" />
      <path class="mc-body mc-coat" d="M 15 26 L 13 8 L 27 17 Z" />
      <path class="mc-coat-hi" d="M 17 22 L 16 12.5 L 23.5 18 Z" />
      <path class="mc-body mc-coat" d="M 49 26 L 51 8 L 37 17 Z" />
      <path class="mc-coat-hi" d="M 47 22 L 48 12.5 L 40.5 18 Z" />
      <path class="mc-body mc-cat-head" d="M 14 29 C 14 19 22 15 32 15 C 42 15 50 19 50 29 C 50 40 43 49 32 50 C 21 49 14 40 14 29 Z" />
      <path class="mc-visor" d="M 18 28.5 C 21 25.5 43 25.5 46 28.5 C 46.5 34 42.5 37.5 32 37.5 C 21.5 37.5 17.5 34 18 28.5 Z" />
      <path class="mc-seam" d="M 32 15.5 L 32 23 M 14.5 34 L 19 35 M 49.5 34 L 45 35" />
      <g class="mc-eye">
        <path class="mc-eye-glow" d="M 21 31.2 Q 25 27.8 29 31.4 Q 25 34.4 21 31.2 Z" />
        <ellipse class="mc-pupil" cx="25.2" cy="31.2" rx="1.15" ry="2.4" />
        <path class="mc-eye-glow" d="M 35 31.4 Q 39 27.8 43 31.2 Q 39 34.4 35 31.4 Z" />
        <ellipse class="mc-pupil" cx="38.8" cy="31.2" rx="1.15" ry="2.4" />
      </g>
      <g class="mc-happy">
        <path d="M 21.5 32.5 Q 25 28.2 28.8 32.5" />
        <path d="M 35.2 32.5 Q 39 28.2 42.5 32.5" />
      </g>
      <g class="mc-wrong">
        <path d="M 20.5 27.6 L 29.5 30.2" />
        <path d="M 43.5 27.6 L 34.5 30.2" />
      </g>
      <path class="mc-nose" d="M 29.5 39.8 L 34.5 39.8 L 32 42.6 Z" />
      <path class="mc-mouth" d="M 28.2 44.6 Q 32 46.6 35.8 44.6" />
    </g>
  </svg>
`;

const DOG_SVG = `
  <svg class="mc-svg mc-svg-dog" viewBox="0 0 64 64" role="img" aria-hidden="true">
    <g class="mc-root">
      <path class="mc-coat-deep" d="M 10 64 C 12 51 20 47 32 47 C 44 47 52 51 54 64 Z" />
      <path class="mc-dog-collar" d="M 17 50.5 Q 32 56.5 47 50.5 L 45.5 56 Q 32 61.5 18.5 56 Z" />
      <circle class="mc-dog-tag" cx="32" cy="58.5" r="2.8" />
      <path class="mc-body mc-coat" d="M 16 25 L 11 9 L 25 16 Z" />
      <path class="mc-coat-deep" d="M 16.5 22 L 13.8 12.8 L 22.2 17 Z" />
      <path class="mc-body mc-coat" d="M 48 25 L 53 9 L 39 16 Z" />
      <path class="mc-coat-deep" d="M 47.5 22 L 50.2 12.8 L 41.8 17 Z" />
      <path class="mc-body mc-dog-head" d="M 15 28 C 15 18 22 14.5 32 14.5 C 42 14.5 49 18 49 28 L 48 39 C 47 46.5 41 51 32 51.5 C 23 51 17 46.5 16 39 Z" />
      <path class="mc-coat-hi" d="M 22.5 37 C 22.5 33.5 27 32 32 32 C 37 32 41.5 33.5 41.5 37 C 41.5 44.5 37.5 49 32 49 C 26.5 49 22.5 44.5 22.5 37 Z" />
      <path class="mc-visor" d="M 18.5 26.8 C 22 24.4 42 24.4 45.5 26.8 C 46 31.8 42.5 34.4 32 34.4 C 21.5 34.4 18 31.8 18.5 26.8 Z" />
      <g class="mc-eye">
        <circle class="mc-eye-glow" cx="25" cy="29.4" r="3.1" />
        <circle class="mc-pupil" cx="25.2" cy="29.4" r="1.45" />
        <circle class="mc-eye-glow" cx="39" cy="29.4" r="3.1" />
        <circle class="mc-pupil" cx="38.8" cy="29.4" r="1.45" />
      </g>
      <g class="mc-happy">
        <path d="M 21.8 30.2 Q 25 26.4 28.4 30.2" />
        <path d="M 35.6 30.2 Q 39 26.4 42.2 30.2" />
      </g>
      <g class="mc-wrong">
        <path d="M 20.8 25.8 L 29.2 28.2" />
        <path d="M 43.2 25.8 L 34.8 28.2" />
      </g>
      <path class="mc-dog-nose" d="M 27.6 37.2 Q 32 35.8 36.4 37.2 Q 35.6 41.2 32 42 Q 28.4 41.2 27.6 37.2 Z" />
      <path class="mc-mouth" d="M 27.5 44.8 Q 32 47.4 36.5 44.8" />
    </g>
  </svg>
`;

const FISH_SVG = `
  <svg class="mc-svg mc-svg-fish" viewBox="0 0 64 64" role="img" aria-hidden="true">
    <g class="mc-root">
      <path class="mc-fish-fin" d="M 32 9 L 25 20 L 39 20 Z" />
      <path class="mc-fish-fin" d="M 15 36 L 5 46 L 18 45 Z" />
      <path class="mc-fish-fin" d="M 49 36 L 59 46 L 46 45 Z" />
      <path class="mc-fish-belly" d="M 16 36 C 16 49 23 56 32 56 C 41 56 48 49 48 36 Z" />
      <path class="mc-fish-back" d="M 16 36 C 16 21 23 16 32 16 C 41 16 48 21 48 36 C 42 39 22 39 16 36 Z" />
      <path class="mc-fish-seam" d="M 32 16.5 L 32 26 M 20 42 L 24 46 M 44 42 L 40 46" />
      <path class="mc-fish-led" d="M 18 39 L 22 41 M 46 39 L 42 41" />
      <rect class="mc-fish-visor" x="18.5" y="25.5" width="27" height="10.5" rx="5.2" />
      <g class="mc-eye">
        <circle class="mc-fish-eye" cx="25.5" cy="30.8" r="2.6" />
        <circle class="mc-fish-eye" cx="38.5" cy="30.8" r="2.6" />
      </g>
      <g class="mc-happy">
        <path d="M 22.5 31.6 Q 25.5 27.6 28.5 31.6" />
        <path d="M 35.5 31.6 Q 38.5 27.6 41.5 31.6" />
      </g>
      <g class="mc-wrong">
        <path d="M 21.8 27.5 L 29.2 30.2" />
        <path d="M 42.2 27.5 L 34.8 30.2" />
      </g>
      <path class="mc-mouth" d="M 27.5 46.5 Q 32 49 36.5 46.5" />
    </g>
  </svg>
`;

const HIDDEN_SVG = `
  <svg class="mc-svg mc-svg-none" viewBox="0 0 64 64" role="img" aria-hidden="true">
    <g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 14 32 C 19 22 25 18 32 18 C 39 18 45 22 50 32 C 45 42 39 46 32 46 C 25 46 19 42 14 32 Z" opacity="0.55" />
      <line x1="16" y1="16" x2="48" y2="48" />
    </g>
  </svg>
`;

const ACTIVE_SVG_MAP: Readonly<Record<AnyMascotId, string>> = {
  cat: CAT_SVG,
  dog: DOG_SVG,
  fish: FISH_SVG,
  bird: renderRoboBirdSvg('bird'),
  owl: renderRoboBirdSvg('owl'),
  raven: renderRoboBirdSvg('raven'),
  drone: renderRoboBirdSvg('drone'),
  none: HIDDEN_SVG,
};

export function renderActiveMascotSvg(id: ActiveMascotId): string {
  return ACTIVE_SVG_MAP[id] ?? renderRoboBirdSvg('bird');
}

export function renderMascotOptionSvg(id: MascotId): string {
  return id === 'none' ? HIDDEN_SVG : renderActiveMascotSvg(id);
}
