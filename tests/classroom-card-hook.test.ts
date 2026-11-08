import test from 'node:test';
import assert from 'node:assert/strict';
import type { Question } from '../src/data/question.ts';
import { initClassroomCardHook } from '../src/features/classroom/card-hook.ts';
import { roomService } from '../src/features/classroom/room-service.ts';
import { renderCardHeader } from '../src/features/booklet/question-card.ts';

const question: Question = {
  id: 77101,
  ders: 'TÜRK DİLİ VE EDEBİYATI – 1',
  soru: 'Deneme sorusu',
  secenekler: { A: 'A', B: 'B', C: 'C', D: 'D' },
  dogru_cevap: 'A',
};

test('cevabı göster gözü yalnızca oda kurucusuna çizilir', () => {
  initClassroomCardHook();
  const roomState = roomService.getState();
  roomState.isHost = false;
  assert.doesNotMatch(renderCardHeader(question, 1, false), /data-action="toggle-answer-reveal"/);
  roomState.isHost = true;
  const hostHeader = renderCardHeader(question, 1, false);
  assert.match(hostHeader, /data-action="toggle-answer-reveal"[^>]*data-qid="77101"/);
  roomState.isHost = false;
});
