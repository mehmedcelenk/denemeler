import test from 'node:test';
import assert from 'node:assert/strict';
import type { Question } from '../src/data/question.ts';
import { initClassroomCardHook } from '../src/features/classroom/card-hook.ts';
import { roomService } from '../src/features/classroom/room-service.ts';
import { withClassroom } from './fixtures/classroom.ts';
import { renderCardHeader } from '../src/features/booklet/question-card.ts';

const question: Question = {
  id: 77101,
  ders: 'TÜRK DİLİ VE EDEBİYATI – 1',
  soru: 'Deneme sorusu',
  secenekler: { A: 'A', B: 'B', C: 'C', D: 'D' },
  dogru_cevap: 'A',
};

test('cevabı göster gözü yalnızca sunucunun oda kurucusu dediği kullanıcıya çizilir', async () => {
  await withClassroom(async fixture => {
    initClassroomCardHook();
    assert.doesNotMatch(renderCardHeader(question, 1, false), /data-action="toggle-answer-reveal"/);
    fixture.snapshot.hostId = fixture.auth.user.id;
    await roomService.joinOrCreateRoom('HOOK');
    assert.match(renderCardHeader(question, 1, false), /data-action="toggle-answer-reveal"[^>]*data-qid="77101"/);
    await roomService.leaveRoom();
    assert.doesNotMatch(renderCardHeader(question, 1, false), /data-action="toggle-answer-reveal"/);
    fixture.snapshot.hostId = 'another-host';
    await roomService.joinOrCreateRoom('HOOK');
    assert.doesNotMatch(renderCardHeader(question, 1, false), /data-action="toggle-answer-reveal"/);
  });
});
