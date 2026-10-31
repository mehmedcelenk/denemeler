import {
  hideTdePopups,
  showDivanBubble,
  showEdebiKimlikKarti,
} from './edebiyat-pusulasi.ts';

export function initTde(): void {
  if (typeof window === 'undefined') return;
  Object.assign(window, { hideTdePopups, showDivanBubble, showEdebiKimlikKarti });
}
