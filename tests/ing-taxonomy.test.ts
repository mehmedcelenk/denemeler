import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const TAXONOMY_PATH = 'scripts/ing_taxonomy_map.json';
const SCRIPT_PATH = 'scripts/validate_ing_taxonomy.py';
const QUESTIONS_PATH = 'data/subjects/ING.json';

const FORBIDDEN_FALLBACK_TERMS = [
  'genel', 'saptanamadı', 'saptanamadi', 'fallback',
  'muhtelif', 'çeşitli', 'cesitli', 'karma', 'tanımsız', 'tanimsiz',
];

test('ing_taxonomy_map.json tam 8 dönem ünitesi içerir', () => {
  assert.ok(existsSync(TAXONOMY_PATH), `${TAXONOMY_PATH} mevcut olmalıdır.`);
  const map: Record<string, string[]> = JSON.parse(readFileSync(TAXONOMY_PATH, 'utf8'));

  const units = Object.keys(map);
  assert.equal(units.length, 8, 'İngilizce taksonomisi tam olarak 8 dönem ünitesinden oluşmalıdır.');

  units.forEach((unitTitle) => {
    const subtopics = map[unitTitle];
    assert.ok(Array.isArray(subtopics), `${unitTitle} alt konuları dizi olmalıdır.`);
    assert.ok(subtopics.length >= 2, `${unitTitle} en az 2 alt konu içermelidir.`);

    subtopics.forEach((sub) => {
      FORBIDDEN_FALLBACK_TERMS.forEach((forbidden) => {
        const regex = new RegExp(`\\b${forbidden}\\b`, 'i');
        assert.ok(!regex.test(sub), `'${sub}' içinde yasaklı fallback '${forbidden}' bulunamaz.`);
      });
    });
  });
});

test('validate_ing_taxonomy.py betiği harita ve soru denetimini başarıyla tamamlar', () => {
  assert.ok(existsSync(SCRIPT_PATH), `${SCRIPT_PATH} mevcut olmalıdır.`);
  const result = spawnSync('python3', [SCRIPT_PATH, '-m', TAXONOMY_PATH, '-q', QUESTIONS_PATH], { encoding: 'utf8' });
  assert.equal(result.status, 0, `Doğrulayıcı betik hata verdi: ${result.stderr || result.stdout}`);
  assert.ok(result.stdout.includes('validation PASSED'), 'Başarı çıktısı PASSED içermelidir.');
});
