import test from 'node:test';
import assert from 'node:assert/strict';
import { state, store } from '../src/app/state.ts';
import { eliminateOneWrongChoice } from '../src/features/booklet/features-bar.ts';
import { clearAllMarks } from '../src/features/answers/marking.ts';
import type { Question } from '../src/data/question.ts';

const mockQuestion: Question = {
  id: 9999,
  ders: 'TÜRK DİLİ VE EDEBİYATI 1',
  yil: '2024',
  donem: 1,
  soru: 'Hangisi bir edebi türdür?',
  secenekler: {
    A: 'Roman',
    B: 'Kalem',
    C: 'Defter',
    D: 'Silgi',
  },
  dogru_cevap: 'A',
  ana_konu: 'Giriş',
};

test('eliminateOneWrongChoice: yanlış şıklardan birini kırmızıyla eler ve tekrar çağrılınca geri alır (toggle)', () => {
  store.setBookletQuestions([mockQuestion]);
  store.clearAllEliminatedWrongChoices(false);

  // 1. Tıklama: Yanlış bir şıkkı (B, C veya D) elemeli, A'yı (doğru cevap) ASLA elememeli
  eliminateOneWrongChoice(9999);
  const eliminated = state.eliminatedWrongChoices[9999];
  assert.ok(eliminated, 'Bir şık elenmiş olmalı');
  assert.notEqual(eliminated, 'A', 'Doğru cevap olan A asla elenmemeli');
  assert.ok(['B', 'C', 'D'].includes(eliminated), 'Yanlış seçeneklerden biri elenmeli');

  // 2. Tıklama: Aynı soru için tekrar çağrılınca eleme kaldırılmalı (toggle)
  eliminateOneWrongChoice(9999);
  assert.equal(state.eliminatedWrongChoices[9999], undefined, 'İkinci tıklamada eleme geri alınmalı');
});

test('clearAllMarks: elenen yanlış şıkları da temizler', () => {
  store.setBookletQuestions([mockQuestion]);
  eliminateOneWrongChoice(9999);
  assert.ok(state.eliminatedWrongChoices[9999]);

  clearAllMarks();
  assert.equal(state.eliminatedWrongChoices[9999], undefined, 'clearAllMarks çağrılınca elenen yanlış şık temizlenmeli');
});

test('copyQuestionText: soru metni ve şıklarını hatasız formatlar ve panoya kopyalar', async () => {
  let copiedText = '';
  const originalClipboard = Object.getOwnPropertyDescriptor(globalThis.navigator, 'clipboard');

  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: {
      writeText: async (text: string) => { copiedText = text; },
    },
    configurable: true,
  });

  try {
    const { copyQuestionText } = await import('../src/features/booklet/features-bar.ts');
    store.setBookletQuestions([mockQuestion]);
    const success = await copyQuestionText(9999);
    assert.equal(success, true);
    assert.ok(copiedText.includes('TÜRK DİLİ VE EDEBİYATI 1'));
    assert.ok(copiedText.includes('Hangisi bir edebi türdür?'));
    assert.ok(copiedText.includes('A) Roman'));
    assert.ok(copiedText.includes('D) Silgi'));
  } finally {
    if (originalClipboard) {
      Object.defineProperty(globalThis.navigator, 'clipboard', originalClipboard);
    } else {
      // @ts-ignore
      delete globalThis.navigator.clipboard;
    }
  }
});

