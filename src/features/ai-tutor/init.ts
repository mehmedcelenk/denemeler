import { registerActions, type ActionHandler } from '../../app/actions.ts';
import {
  deleteAiTurn,
  loadSavedAiExplanations,
  submitAiQuestion,
  toggleAiAskBox,
} from './ai-tutor.ts';

let initialized = false;

const closeChat: ActionHandler = el => {
  const qid = Number(el.dataset.qid);
  if (!qid) return;
  const box = document.getElementById(`aiAskBox_${qid}`);
  if (box) box.style.display = 'none';
  const card = document.getElementById(`aiChatReply_${qid}`);
  if (card) card.style.display = 'none';
};

export function initAiTutor(): void {
  loadSavedAiExplanations();
  if (initialized || typeof document === 'undefined') return;
  initialized = true;
  registerActions({
    'toggle-ai-ask': el => {
      const qid = Number(el.dataset.qid);
      if (qid) toggleAiAskBox(qid);
    },
    'submit-ai-ask': async el => {
      const qid = Number(el.dataset.qid);
      if (qid) await submitAiQuestion(qid);
    },
    'use-ai-chip': async el => {
      const qid = Number(el.dataset.qid);
      if (!qid) return;
      const input = document.getElementById(`aiAskInput_${qid}`) as HTMLInputElement | null;
      if (input) input.value = el.dataset.prompt || '';
      await submitAiQuestion(qid);
    },
    'show-ai-reply': el => {
      const qid = Number(el.dataset.qid);
      if (qid) toggleAiAskBox(qid);
    },
    'delete-ai-turn': (el, ev) => {
      const qid = Number(el.dataset.qid);
      if (!qid) return;
      ev.stopPropagation();
      ev.preventDefault();
      deleteAiTurn(qid, Number(el.dataset.turnIdx ?? -1));
    },
    'clear-ai-chat': (el, ev) => {
      const qid = Number(el.dataset.qid);
      if (!qid) return;
      ev.stopPropagation();
      ev.preventDefault();
      deleteAiTurn(qid, -1);
    },
    'close-ai-chat': closeChat,
    'close-ai-box': closeChat,
  });
  document.addEventListener('keydown', ev => {
    const target = ev.target;
    if (ev.key === 'Enter' && target instanceof HTMLElement
      && target.classList.contains('ai-ask-input')) {
      ev.preventDefault();
      const qid = Number(target.dataset.qid);
      if (qid) void submitAiQuestion(qid);
    }
  });
}
