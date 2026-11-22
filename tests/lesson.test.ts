import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { parseQuestions } from '../src/data/question.ts';
import {
  cacheSingleLesson,
  clearLessonCache,
  getCachedLesson,
  hasCachedLesson,
  isSubjectLessonsLoaded,
  loadSubjectLessons,
  parseQuestionLesson,
  parseQuestionLessons,
  primeLessonCache,
} from '../src/data/lesson.ts';

function validRawLesson(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    questionId: 1001,
    subject: 'MAT',
    title: 'Üslü Sayılarda Taban Birliği',
    explanation: 'Aynı taban altında çarpılan sayılarda taban yerinde durur, yalnızca üsler toplanır.\n\nBu soruda $2^3 \\cdot 2^2 = 2^5 = 32$ elde edilir ve doğru cevap **B** şıkkı olur; tabanları da çarpmak en sık düşülen tuzaktır.',
    ezber: {
      rhyme: 'Taban birse durur saf,\nÜsler eklenir, netleşir taraf.',
    },
    concepts: [
      {
        term: 'Taban',
        definition: 'Kendisiyle art arda çarpılan asıl sayıdır.',
        example: '$2^5$ ifadesinde taban 2’dir.',
        emoji: '🧱',
      },
      {
        term: 'Üs',
        definition: 'Tabanın kaç kez yan yana çarpılacağını gösteren sayaçtır.',
        emoji: '⚡',
      },
    ],
    model: 'deepseek-v4.1-flash',
    version: 3,
    ...overrides,
  };
}

test('parseQuestionLesson: geçerli v3 ders anlatımını temizleyip doğrular', () => {
  const parsed = parseQuestionLesson(validRawLesson({
    title: '  Üslü Sayılarda Taban Birliği  ',
    version: undefined,
  }));
  assert.equal(parsed.questionId, 1001);
  assert.equal(parsed.subject, 'MAT');
  assert.equal(parsed.title, 'Üslü Sayılarda Taban Birliği');
  assert.equal(parsed.version, 5);
  assert.equal(parsed.ezber?.rhyme.split('\n').length, 2);
  assert.equal(parsed.concepts[0].emoji, '🧱');

  const withoutEzber = parseQuestionLesson(validRawLesson({ ezber: undefined, version: 5 }));
  assert.equal(withoutEzber.ezber, undefined);
});

test('parseQuestionLesson: eksik veya hatalı alanları ve 2 satır dışı ezberi reddeder', () => {
  assert.throws(() => parseQuestionLesson(null));
  assert.throws(() => parseQuestionLesson(validRawLesson({ questionId: 0 })));
  assert.throws(() => parseQuestionLesson(validRawLesson({ explanation: '' })));
  assert.throws(() => parseQuestionLesson(validRawLesson({ concepts: [] })));
  assert.throws(() => parseQuestionLesson(validRawLesson({ ezber: { rhyme: 'Tek satırlık ezber' } })));
  assert.throws(() => parseQuestionLesson(validRawLesson({ ezber: { rhyme: 'Bir\nİki\nÜç\nDört' } })));
  assert.throws(() => parseQuestionLesson(validRawLesson({ version: 0 })));
  assert.throws(() => parseQuestionLesson(validRawLesson({ visual: { kind: 'deck', steps: [] } })));
  const withDeck = parseQuestionLesson(validRawLesson({
    version: 4,
    visual: {
      kind: 'deck',
      steps: [
        { type: 'highlight', cue: 'Kilit ipucu', badge: 'HACK', mood: 'hack', quote: 'Örnek metin burada.', focus: 'metin', note: 'Buraya odaklan' },
        { type: 'result', cue: 'Cevap netleşti', badge: 'SONUÇ', mood: 'done', answer: 'B', summary: '32', trap: 'Tabanları çarpma.' },
      ],
    },
  }));
  assert.equal(withDeck.visual?.kind, 'deck');
  assert.equal(withDeck.visual?.steps.length, 2);
});

test('parseQuestionLessons: yinelenen questionId ve dizi dışı girdiyi reddeder', () => {
  assert.throws(() => parseQuestionLessons({}));
  assert.throws(() => parseQuestionLessons([validRawLesson(), validRawLesson()]));
  const list = parseQuestionLessons([validRawLesson({ questionId: 1 }), validRawLesson({ questionId: 2 })]);
  assert.equal(list.length, 2);
});

test('loadSubjectLessons: yerel JSON yükler, önbelleğe alır ve eşzamanlı çağrıları tekilleştirir', async () => {
  clearLessonCache();
  const originalFetch = globalThis.fetch;
  let fetchCount = 0;
  try {
    globalThis.fetch = async (input) => {
      fetchCount++;
      assert.ok(String(input).includes('data/lessons/MAT.json'));
      return new Response(JSON.stringify([validRawLesson({ questionId: 505 })]), { status: 200 });
    };

    const [a, b] = await Promise.all([
      loadSubjectLessons('MAT', { baseUrl: './' }),
      loadSubjectLessons('MAT', { baseUrl: './' }),
    ]);
    assert.equal(fetchCount, 1);
    assert.equal(a.length, 1);
    assert.equal(b.length, 1);
    assert.equal(isSubjectLessonsLoaded('MAT'), true);
    assert.equal(hasCachedLesson(505), true);
    assert.equal(getCachedLesson(505)?.questionId, 505);

    const c = await loadSubjectLessons('MAT', { baseUrl: './' });
    assert.equal(fetchCount, 1);
    assert.equal(c.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    clearLessonCache();
  }
});

test('loadSubjectLessons: 404 veya HTML yanıtında boş dizi döner; ağ hatasında önbelleği kilitlemez', async () => {
  clearLessonCache();
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response('Not Found', { status: 404 });
    const missing = await loadSubjectLessons('FIZ', { baseUrl: './' });
    assert.deepEqual(missing, []);
    assert.equal(isSubjectLessonsLoaded('FIZ'), true);

    globalThis.fetch = async () => new Response('<!doctype html><html></html>', { status: 200 });
    const htmlResp = await loadSubjectLessons('KIM', { baseUrl: './' });
    assert.deepEqual(htmlResp, []);
    assert.equal(isSubjectLessonsLoaded('KIM'), true);

    globalThis.fetch = async () => { throw new Error('network down'); };
    const errored = await loadSubjectLessons('BIO', { baseUrl: './' });
    assert.deepEqual(errored, []);
    assert.equal(isSubjectLessonsLoaded('BIO'), false);
  } finally {
    globalThis.fetch = originalFetch;
    clearLessonCache();
  }
});

test('primeLessonCache, cacheSingleLesson ve clearLessonCache önbelleği doğru yönetir', () => {
  clearLessonCache();
  const lesson = parseQuestionLesson(validRawLesson({ questionId: 777, subject: 'TDE' }));
  cacheSingleLesson(lesson);
  assert.equal(isSubjectLessonsLoaded('TDE'), false);
  assert.equal(getCachedLesson(777)?.subject, 'TDE');
  primeLessonCache('TDE', [lesson]);
  assert.equal(isSubjectLessonsLoaded('TDE'), true);
  clearLessonCache();
  assert.equal(isSubjectLessonsLoaded('TDE'), false);
  assert.equal(getCachedLesson(777), null);
});

test('data/lessons altındaki tüm ön-üretilmiş ders anlatımları şemaya, soru kimliklerine ve v3 kurallarına uyar', () => {
  if (!existsSync('data/lessons')) return;
  const files = readdirSync('data/lessons').filter(name => name.endsWith('.json'));
  for (const file of files) {
    const subject = file.slice(0, -5);
    const lessons = parseQuestionLessons(JSON.parse(readFileSync(`data/lessons/${file}`, 'utf8')));
    const subjectPath = `data/subjects/${subject}.json`;
    assert.ok(existsSync(subjectPath), `${file} için ${subjectPath} bulunmalı`);
    const questions = parseQuestions(JSON.parse(readFileSync(subjectPath, 'utf8')));
    const byId = new Map(questions.map(q => [q.id, q]));
    for (const lesson of lessons) {
      assert.equal(lesson.subject, subject, `${file}: ${lesson.questionId} subject uyuşmuyor`);
      const q = byId.get(lesson.questionId);
      assert.ok(q, `${file}: ${lesson.questionId} ${subjectPath} içinde yok`);
      const choiceRe = new RegExp(`(?<![A-Za-zÇĞİÖŞÜçğıöşü])${q.dogru_cevap}(?![A-Za-zÇĞİÖŞÜçğıöşü])`);
      assert.match(lesson.explanation, choiceRe, `${file}#${lesson.questionId}: explanation doğru şıkkı (${q.dogru_cevap}) içermeli`);
      if (lesson.ezber) {
        assert.equal(lesson.ezber.rhyme.split('\n').length, 2, `${file}#${lesson.questionId}: ezber tam 2 satır olmalı`);
        assert.doesNotMatch(
          lesson.ezber.rhyme,
          /\b(?:cevap|şık|şıkkı)\s*[A-E]\b|\b[A-E]\s*şıkk|\bhile\b/i,
          `${file}#${lesson.questionId}: ezber şık harfi veya 'hile' içermemeli`,
        );
      }
      const checkControlChars = (val: unknown): void => {
        if (typeof val === 'string') {
          assert.doesNotMatch(val, /[\u0008\u0009\u000b\u000c\u000d]/, `${file}#${lesson.questionId}: kaçırılmamış kontrol karakteri var`);
        } else if (Array.isArray(val)) {
          val.forEach(checkControlChars);
        } else if (val && typeof val === 'object') {
          Object.values(val).forEach(checkControlChars);
        }
      };
      checkControlChars(lesson);
    }
  }
});
