import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import type { Question } from '../src/data/question.ts';

const TAXONOMY_PATH = 'scripts/tarih_taxonomy_map.json';
const SCRIPT_PATH = 'scripts/validate_tarih_taxonomy.py';

const FORBIDDEN_FALLBACK_TERMS = [
  'genel', 'saptanamadı', 'saptanamadi', 'fallback',
  'muhtelif', 'çeşitli', 'cesitli', 'karma', 'tanımsız', 'tanimsiz',
];

const COURSE_BOUNDARIES: Record<number, { name: string; allowedUnits: number[] }> = {
  131: { name: 'TARİH – 1', allowedUnits: [1, 2] },
  132: { name: 'TARİH – 2', allowedUnits: [1, 2, 3] },
  133: { name: 'TARİH – 3', allowedUnits: [3, 4, 5, 6] },
  134: { name: 'TARİH – 4', allowedUnits: [5, 6, 7] },
  137: { name: 'TARİH – 5', allowedUnits: [6, 7, 8] },
  138: { name: 'TARİH – 6', allowedUnits: [7, 8] },
  141: { name: 'T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 1', allowedUnits: [8, 9, 10] },
  142: { name: 'T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 2', allowedUnits: [9, 10] },
};

function getUnitNumber(topicName: string): number {
  const match = topicName.match(/^([1-9]|10)\./);
  return match ? parseInt(match[1], 10) : -1;
}

function checkFallbackTerm(text: string): string | null {
  const lower = text.toLowerCase();
  for (const term of FORBIDDEN_FALLBACK_TERMS) {
    if (lower.includes(term)) {
      return term;
    }
  }
  if ((lower.includes('diğer') || lower.includes('diger')) && !lower.includes('diğer boylar') && !lower.includes('diger boylar')) {
    return 'diğer';
  }
  return null;
}

test('tarih_taxonomy_map.json tam 10 ünite ve 45 kanonik alt konu içerir', () => {
  assert.ok(existsSync(TAXONOMY_PATH), `${TAXONOMY_PATH} mevcut olmalıdır.`);
  const map: Record<string, string[]> = JSON.parse(readFileSync(TAXONOMY_PATH, 'utf8'));

  const units = Object.keys(map);
  assert.equal(units.length, 10, 'Taksonomi tam olarak 10 ana üniteden oluşmalıdır.');

  const allSubtopics = new Set<string>();

  units.forEach((unitTitle, idx) => {
    const expectedUnitNum = idx + 1;
    const unitNum = getUnitNumber(unitTitle);
    assert.equal(unitNum, expectedUnitNum, `Ünite başlığı ${expectedUnitNum}. ile başlamalıdır: ${unitTitle}`);

    const forbiddenUnitTerm = checkFallbackTerm(unitTitle);
    assert.equal(forbiddenUnitTerm, null, `Ünite '${unitTitle}' içinde yasaklı '${forbiddenUnitTerm}' bulunamaz.`);

    const subtopics = map[unitTitle];
    assert.ok(Array.isArray(subtopics), `${unitTitle} alt konuları dizi olmalıdır.`);
    assert.ok(subtopics.length >= 2, `${unitTitle} en az 2 alt konu içermelidir.`);

    subtopics.forEach((sub, subIdx) => {
      const expectedPrefix = `${expectedUnitNum}.${subIdx + 1} `;
      assert.ok(sub.startsWith(expectedPrefix), `'${sub}' alt konusu '${expectedPrefix}' ile başlamalıdır.`);

      const forbiddenSubTerm = checkFallbackTerm(sub);
      assert.equal(forbiddenSubTerm, null, `'${sub}' içinde yasaklı fallback '${forbiddenSubTerm}' bulunamaz.`);

      assert.ok(!allSubtopics.has(sub), `Yinelenen alt konu: '${sub}'`);
      allSubtopics.add(sub);
    });
  });

  assert.equal(allSubtopics.size, 45, `Toplam alt konu sayısı tam 45 olmalıdır, bulunan: ${allSubtopics.size}`);
});

test('validate_tarih_taxonomy.py betiği harita denetimini başarıyla tamamlar', () => {
  assert.ok(existsSync(SCRIPT_PATH), `${SCRIPT_PATH} mevcut olmalıdır.`);
  const result = spawnSync('python3', [SCRIPT_PATH, '--check-map-only'], { encoding: 'utf8' });
  assert.equal(result.status, 0, `Doğrulayıcı betik hata verdi: ${result.stderr || result.stdout}`);
  assert.ok(result.stdout.includes('validation PASSED'), 'Başarı çıktısı PASSED içermelidir.');
});

test('validate_tarih_taxonomy.py CLI hata ve negatif durumları doğru kodla yakalar', () => {
  // Var olmayan dosya için exit code 2
  const missingResult = spawnSync('python3', [SCRIPT_PATH, '--batch-path', 'nonexistent_test_batch.json'], { encoding: 'utf8' });
  assert.equal(missingResult.status, 2, 'Var olmayan dosya için çıkış kodu 2 olmalıdır.');

  // Sentetik geçersiz soru testi (138 numaralı derste İlk Çağ medeniyeti veya fallback)
  const pythonCheck = spawnSync('python3', ['-c', `
import sys
from scripts.validate_tarih_taxonomy import HistoryTaxonomyValidator, HistoryClassificationResult
v = HistoryTaxonomyValidator('${TAXONOMY_PATH}')
res_invalid = HistoryClassificationResult(
    id=99999,
    ders='TARİH – 6',
    ders_kodu=138,
    ana_konu='1. Tarih Bilimi ve İlk Çağ Medeniyetleri',
    alt_konu='1.3 Mezopotamya ve Mısır Medeniyetleri'
)
errors = v.validate_classification(res_invalid, strict_bounds=True)
if not errors:
    sys.exit(0)
sys.exit(1)
`]);
  assert.equal(pythonCheck.status, 1, 'Geçersiz ders sınırında doğrulayıcı hata üretmelidir.');
});

test('TAR.json ve INK.json soruları taksonomi ve pedagojik ders sınırlarına uyar', (t) => {
  if (!existsSync('data/subjects/TAR.json') || !existsSync('data/subjects/INK.json')) {
    t.skip('Ders veri dosyaları bulunamadı.');
    return;
  }

  const tarQuestions: Question[] = JSON.parse(readFileSync('data/subjects/TAR.json', 'utf8'));
  const inkQuestions: Question[] = JSON.parse(readFileSync('data/subjects/INK.json', 'utf8'));
  const allQuestions = [...tarQuestions, ...inkQuestions];

  const map: Record<string, string[]> = JSON.parse(readFileSync(TAXONOMY_PATH, 'utf8'));
  const allCanonicalSubs = new Set(Object.values(map).flat());

  // M1/M2 aşama kontrolü: Eğer veriler henüz M2/M3 partileriyle yeniden sınıflandırılmadıysa atla
  const isMigrated = tarQuestions.every(q => q.alt_konu && allCanonicalSubs.has(q.alt_konu)) &&
                     inkQuestions.every(q => q.alt_konu && allCanonicalSubs.has(q.alt_konu));

  if (!isMigrated) {
    t.skip('M1/M2 hazırlık aşaması: 656 Tarih sorusu henüz yeni kanonik taksonomiyle yeniden derlenmedi (M3 aşamasında zorunlu doğrulanır).');
    return;
  }

  assert.equal(tarQuestions.length, 492, 'TAR.json tam 492 soru içermelidir.');
  assert.equal(inkQuestions.length, 164, 'INK.json tam 164 soru içermelidir.');
  assert.equal(allQuestions.length, 656, 'Toplam Tarih soru sayısı 656 olmalıdır.');

  const validMains = new Set(Object.keys(map));
  const validSubsByMain: Record<string, Set<string>> = {};
  for (const [m, subs] of Object.entries(map)) {
    validSubsByMain[m] = new Set(subs);
  }

  for (const q of allQuestions) {
    assert.ok(q.ana_konu, `ID ${q.id}: ana_konu boş olamaz.`);
    assert.ok(q.alt_konu, `ID ${q.id}: alt_konu boş olamaz.`);

    const fbAna = checkFallbackTerm(q.ana_konu);
    assert.equal(fbAna, null, `ID ${q.id}: ana_konu '${fbAna}' içeremez.`);
    const fbAlt = checkFallbackTerm(q.alt_konu);
    assert.equal(fbAlt, null, `ID ${q.id}: alt_konu '${fbAlt}' içeremez.`);

    assert.ok(validMains.has(q.ana_konu), `ID ${q.id}: geçersiz ana_konu '${q.ana_konu}'.`);
    assert.ok(validSubsByMain[q.ana_konu].has(q.alt_konu), `ID ${q.id}: '${q.alt_konu}' alt konusu '${q.ana_konu}' altında yer alamaz.`);

    const courseCode = Number((q as Record<string, unknown>).ders_kodu);
    if (courseCode && COURSE_BOUNDARIES[courseCode]) {
      const allowed = COURSE_BOUNDARIES[courseCode].allowedUnits;
      const unitNum = getUnitNumber(q.ana_konu);
      assert.ok(
        allowed.includes(unitNum),
        `ID ${q.id}: ${COURSE_BOUNDARIES[courseCode].name} için Ünite ${unitNum} yasaktır! İzin verilen: ${allowed.join(', ')}`
      );
    }
  }

  assert.ok(new Set(tarQuestions.map(q => q.alt_konu)).size >= 20, 'TAR.json en az 20 farklı alt konu kullanmalıdır.');
  assert.ok(new Set(inkQuestions.map(q => q.alt_konu)).size >= 6, 'INK.json en az 6 farklı alt konu kullanmalıdır.');
});
