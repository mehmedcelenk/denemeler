import { onStateChange, state } from '../../app/state.ts';
import { registerActions } from '../../app/actions.ts';
import type { Question } from '../../data/question.ts';
import { registerCardHook, type CardHook } from '../booklet/card-hooks.ts';
import { speechService } from './speech-service.ts';
import { cycleVoiceGender, cycleVoiceEngine } from './voice-gender.ts';

let initialized = false;

const volumeIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`;

const audioCardHook: CardHook = {
  toolbar(q) {
    if (q.sekilli) return '';
    return `<button class="btn-companion-icon btn-speech-question" id="btnSpeech_${q.id}" data-action="speak-question" data-qid="${q.id}" title="Sesli Dinle">${volumeIcon}</button>`;
  },
};

function isQuestion(value: unknown): value is Question {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<Question>;
  return Number.isSafeInteger(candidate.id)
    && typeof candidate.ders === 'string'
    && typeof candidate.soru === 'string';
}

export function initAudio(): void {
  if (initialized) return;
  initialized = true;
  registerActions({
    'cycle-tts-gender': () => { cycleVoiceGender(); },
    'cycle-tts-engine': () => { cycleVoiceEngine(); },
    'speak-question': async (el, ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      const qid = Number(el.dataset.qid);
      const question = state.bookletQuestions.find(q => q.id === qid)
        || state.allData.find(q => q.id === qid);
      if (question) await speechService.toggleQuestion(question);
    },
  });
  registerCardHook(audioCardHook);
  onStateChange('audio:speak', (payload) => {
    if (isQuestion(payload)) void speechService.toggleQuestion(payload);
  });
}
