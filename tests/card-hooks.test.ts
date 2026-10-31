import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyStemHooks,
  registerCardHook,
  renderHeaderExtraHooks,
  renderToolbarExtraHooks,
  type CardHook,
} from '../src/features/booklet/card-hooks.ts';
import type { Question } from '../src/data/question.ts';

const question: Question = {
  id: 93101,
  ders: 'TARİH – 1',
  soru: 'Soru',
  secenekler: { A: 'A', B: 'B', C: 'C', D: 'D' },
  dogru_cevap: 'A',
};

test('kart kancaları kayıt sırasıyla uygulanır ve aynı nesne iki kez kaydedilmez', () => {
  const first: CardHook = {
    stem: (_q, html) => `${html}-first`,
    header: () => '<span>header</span>',
  };
  const second: CardHook = {
    stem: (_q, html) => `${html}-second`,
    toolbar: () => '<button>tool</button>',
  };

  registerCardHook(first);
  registerCardHook(second);
  registerCardHook(first);

  assert.equal(applyStemHooks(question, 'base'), 'base-first-second');
  assert.equal(renderHeaderExtraHooks(question), '<span>header</span>');
  assert.equal(renderToolbarExtraHooks(question), '<button>tool</button>');
});
