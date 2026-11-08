import { notifyStateChange } from '../../app/state.ts';
import { registerCardHook, type CardHook } from '../booklet/card-hooks.ts';
import { roomService } from './room-service.ts';

const svgEye = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>`;

const hostRevealHook: CardHook = {
  toolbar(q) {
    const canReveal = roomService.isHost();
    if (!canReveal || q.sekilli) return '';
    return `<button class="btn-companion-icon" data-action="toggle-answer-reveal" data-qid="${q.id}" title="Cevabı Göster / Gizle">${svgEye}</button>`;
  },
};

let initialized = false;

export function initClassroomCardHook(): void {
  if (initialized) return;
  initialized = true;
  registerCardHook(hostRevealHook);
  let previous = roomService.isHost();
  roomService.subscribe(state => {
    if (state.isHost === previous) return;
    previous = state.isHost;
    notifyStateChange('booklet:refresh-hooks');
  });
}
