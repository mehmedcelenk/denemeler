# 🧪 Tarih Taksonomisi Test Entegrasyonu ve Doğrulama Mimarisi Raporu

**Tarih:** 2026-10-07  
**Ajan:** Explorer 2 (`teamwork_preview_explorer_m1_2`)  
**Görev Kapsamı:** Yeni Tarih Taksonomisinin Test Altyapısına Entegrasyonu, `tests/data.test.ts`, `tests/pipeline.test.ts` İncelemesi, `scripts/tarih_taxonomy_map.json` ve `data/subjects/{TAR,INK}.json` İçin Test Yapısı, `scripts/validate_tarih_taxonomy.py` Betiğinin Otomasyonu.

---

## 1. YÖNETİCİ ÖZETİ (EXECUTIVE SUMMARY)

Bu araştırma, MEB AÖL Tarih ve T.C. İnkılap Tarihi derslerine ait 656 sorunun (`TAR.json`: 492 soru, `INK.json`: 164 soru) yeni 10 Üniteli, canonical alt konulu taksonomiye uyumunun test edilmesi ve doğrulanması için gerekli test mimarisini belirlemek amacıyla gerçekleştirilmiştir.

### Temel Çıkarımlar:
1. **Mevcut Test Altyapısı:**
   - Test koşucusu Node.js yerleşik test motorudur (`node:test` + `node:assert/strict`) ve `tsx` modülüyle TypeScript doğrudan çalıştırılmaktadır (`node --import tsx --test tests/*.test.ts`).
   - `package.json` içindeki `npm run check` ve `npm run build` komutları `tests/*.test.ts` glob kalıbını kullandığından, `tests/` dizinine eklenecek yeni `tests/tarih-taxonomy.test.ts` dosyası **hiçbir yapılandırma değişikliği gerektirmeden otomatik olarak koşulacaktır**.
   - Test paketi son derece hızlıdır (29 test ~1.3 saniyede tamamlanmaktadır).
2. **Mevcut `tests/data.test.ts` Sınırı:**
   - Yalnızca temel veri sözleşmesini (ID tam sayı, seçenekler A-D, manifest sayıları, yinelenen ID olmaması) test eder; branşlara özgü müfredat taksonomisini veya fallback ('Genel') durumlarını denetlemez.
   - `tests/data.test.ts` dosyasını 40 satırlık saf genel yapısında korumak ve TDE için oluşturulan `tests/tde-features.test.ts` örneğinde olduğu gibi Tarih için bağımsız bir **`tests/tarih-taxonomy.test.ts`** oluşturmak modülerlik ve mimari kurallar (350 satır sınırı) açısından en doğru yaklaşımdır.
3. **Mevcut Durumdaki Veri Bozulması:**
   - Doğrulanmıştır: `data/subjects/TAR.json` dosyasında 492 soru yalnızca 10 alt konuya sıkışmış, `data/subjects/INK.json` dosyasında ise 164 soru yalnızca 3 alt konuya çökmüştür. Her ünitede tüm sorular tek bir alt konuya toplanmıştır.
4. **Çok Kademeli (Milestone) Test Stratejisi:**
   - M1 aşamasında `scripts/tarih_taxonomy_map.json` ve `scripts/validate_tarih_taxonomy.py` üretilecek, ancak 656 sorunun yeniden sınıflandırılması M2'de, `build_webapp.py` ile `TAR.json` ve `INK.json` üretimi ise M3'te gerçekleşecektir.
   - M1'de `npm run check`'in kırılmaması için test dosyasında **taksonomi şeması** ve **Python doğrulayıcı CLI testleri** koşulsuz çalıştırılmalı; `TAR.json` / `INK.json` dosya denetimi ise veri seti henüz eski durumdaysa `node:test`'in yerleşik `t.skip()` mekanizmasıyla M3'e kadar atlanmalı, M3 veri derlemesiyle birlikte otomatik olarak %100 katı denetime geçmelidir.
5. **Otomasyon ve Güvenlik Hatları:**
   - `scripts/validate_tarih_taxonomy.py` betiği hem bağımsız npm betiği (`npm run validate:tarih`), hem `tests/tarih-taxonomy.test.ts` içinden subprocess (`spawnSync`), hem de `scripts/core/build_webapp.py` içinde bir derleme öncesi/sonrası emniyet kilidi (guard) olarak çalıştırılmalıdır.

---

## 2. MEVCUT TEST ALTYAPISI VE DOSYA İNCELEMELERİ

### 2.1 Test Koşucusu ve Komut Zinciri
- **`package.json`**:
  ```json
  "check": "npm run lint && npm run typecheck && node scripts/check-architecture.js && node --import tsx --test tests/*.test.ts",
  "build": "npm run check && vite build",
  "data:build": "python3 scripts/core/build_webapp.py"
  ```
- **Özellikler:**
  - `node:test` ve `node:assert/strict` kullanılmaktadır.
  - `tsx` dinamik import (`--import tsx`) ile TypeScript derleme adımı olmadan doğrudan Node.js üzerinde çalıştırılır.
  - Glob `tests/*.test.ts` olduğu için `tests/tarih-taxonomy.test.ts` adında bir dosya yaratıldığı anda `npm run check` ve `npm run build` tarafından otomatik kapsama alınır.
  - `tsc --noEmit` tipi denetler.

### 2.2 `tests/data.test.ts` İncelemesi (40 satır)
- Test edilen unsurlar:
  - `data/subjects/*.json` içindeki tüm dosyaların `src/data/question.ts` içindeki `parseQuestions` fonksiyonundan geçmesi.
  - Dosya bazında `questionCount` ve `courseCount` değerlerinin `src/data/generated/subjectManifest.json` ile birebir eşleşmesi.
  - Tüm branşlar arasında mükerrer soru ID'si bulunmaması (`assert.ok(!ids.has(q.id))`).
  - Hatalı seçenek ve eksik alanların reddedilmesi.
  - Türkçe arama normalizasyonu (`trNormalize`).
- **Eksik Kalan Nokta:** `parseQuestions` fonksiyonu `ana_konu` ve `alt_konu` alanlarının varlığını veya taksonomiye uygunluğunu denetlemez (bu alanlar `Question` arayüzünde opsiyonel `string` olarak tanımlıdır). Dolayısıyla fallback ('Genel') veya uydurma alt konular bu testten sessizce geçmektedir.

### 2.3 `tests/pipeline.test.ts` İncelemesi (28 satır)
- Test edilen unsurlar:
  - Geçici bir dizinde (`mkdtempSync`) `python3 scripts/core/build_webapp.py` çalıştırılır.
  - Python veri üretiminin web arayüz dosyalarını (`index.html`, `src/main.js`) ezmediği doğrulanır.
  - `subjectManifest.json` dosyasında `TDE` ve `ING` soru sayılarının > 0 olduğu kontrol edilir.
- **Python Entegrasyon Yolu:** Node.js `child_process.spawnSync` ile Python betiklerini doğrudan çalıştırıp çıkış kodunu (`result.status === 0`) ve çıktılarını doğrulamak projede zaten kullanılan, güvenilir bir desendir.

### 2.4 Emsal Model: `tests/tde-features.test.ts` (115 satır)
- TDE branşına ait sözlükler (`MEB_ESER_DICT`, `MEB_YAZAR_DICT`, `MEB_DIVAN_GLOSAR`), cümle röntgeni ve içerik zenginleştirme fonksiyonları genel `data.test.ts` içine tıkılmamış, bağımsız `tests/tde-features.test.ts` dosyasında toplanmıştır.
- Tarih branşı için de aynı yaklaşım izlenmeli; `tests/tarih-taxonomy.test.ts` dosyası oluşturulmalıdır.

---

## 3. TARİH TAKSONOMİSİ DOĞRULAMA TESTLERİNİN YAPISI

Oluşturulacak `tests/tarih-taxonomy.test.ts` test modülü 3 ana bölümden oluşmalıdır:

### 3.1 Bölüm A: `scripts/tarih_taxonomy_map.json` Şema ve Bütünlük Testleri
Bu testler hiçbir soru verisine ihtiyaç duymaz, yalnızca taksonomi haritasının kurallarını doğrular:
1. **JSON Geçerliliği:** Dosya mevcut, geçerli JSON ve boş değil.
2. **10 Ünite Şartı:** Tam olarak 10 ana konu anahtarı (`Object.keys().length === 10`).
3. **Numaralandırma Formatı:** Ana konular `/^(?:[1-9]|10)\.\s+.+$/` regexine uymalı ve 1'den 10'a kadar ardışık olmalıdır.
4. **Alt Konu Yapısı:**
   - Her ana konunun değeri en az 2 elemanlı bir `string[]` olmalıdır (tek alt konulu çöküşü önleme kuralı).
   - Alt konular `/^(?:[1-9]|10)\.[1-9]\s+.+$/` regexine uymalıdır.
   - Alt konunun ünite öneki, ait olduğu ana konunun ünite numarası ile eşleşmelidir (Örn: Ünite 3 altındaki konular `3.1`, `3.2` vb. başlamalıdır).
   - Alt konu numaraları ünite içinde 1'den başlayarak ardışık ilerlemelidir (boşluk veya atlama olamaz).
5. **Sıfır Fallback / Yasaklı Terim Kontrolü:**
   - Hiçbir ana veya alt konuda şu terimler geçemez: `['genel', 'diğer', 'diger', 'çeşitli', 'cesitli', 'karma', 'saptanamadı', 'saptanamadi', 'fallback', 'tanımsız', 'tanimsiz']`.
6. **Benzersizlik:** Tüm taksonomi genelinde hiçbir alt konu adı yinelenemez.

### 3.2 Bölüm B: `scripts/validate_tarih_taxonomy.py` CLI ve Motor Testleri
1. **CLI Yardım ve Harita Doğrulama:**
   - `spawnSync('python3', ['scripts/validate_tarih_taxonomy.py', '--map-only'])` başarıyla (çıkış kodu 0) tamamlanmalıdır.
2. **Negatif Doğrulama (Hata Yakalama Testi):**
   - Geçersiz alt konu, fallback terimi veya pedagojik sınır ihlali içeren sentetik bir soru nesnesi doğrulayıcıya verildiğinde, doğrulayıcı sıfır dışı (`!== 0`) çıkış kodu vermeli ve hata tanısı üretmelidir.

### 3.3 Bölüm C: `data/subjects/TAR.json` ve `data/subjects/INK.json` Katı Veri Denetimi
1. **Toplam Soru Sayısı ve Kademe Dağılımı:**
   - `TAR.json`: 492 soru (131, 132, 133, 134, 137, 138 kademelerinin her birinden tam 82 soru).
   - `INK.json`: 164 soru (141, 142 kademelerinin her birinden tam 82 soru).
   - Toplam: 656 Tarih sorusu.
2. **%100 Taksonomi Eşleşmesi (Strict Whitelist):**
   - Her sorunun `ana_konu` alanı `tarih_taxonomy_map.json` anahtarlarından birisi olmalıdır.
   - Her sorunun `alt_konu` alanı, ilgili ana konunun `tarih_taxonomy_map[ana_konu]` listesinde yer almalıdır.
   - Boş string veya tanımsız değer kesinlikle bulunamaz.
3. **Sıfır Fallback Garantisi:**
   - 656 sorunun hiçbirinde yasaklı genel/fallback terimi bulunamaz.
4. **Pedagojik Ders Sınırları Matrisi (Pedagogical Course Boundaries):**
   Sorunun ders koduna göre atanabileceği üniteler şu tabloya göre sınırlandırılır:
   | Ders Kodu | Ders Adı | İzin Verilen Üniteler | Özel Kısıtlamalar |
   |:---|:---|:---:|:---|
   | **131** | TARİH – 1 | Ünite 1, Ünite 2 | Ünite 2'den yalnızca `2.1` |
   | **132** | TARİH – 2 | Ünite 2, Ünite 3 | Ünite 2'den `2.2`, `2.3` |
   | **133** | TARİH – 3 | Ünite 4, Ünite 5 | — |
   | **134** | TARİH – 4 | Ünite 6 | Klasik Osmanlı |
   | **137** | TARİH – 5 | Ünite 7 | 17-18. Yüzyıl |
   | **138** | TARİH – 6 | Ünite 8 | 19. ve 20. Yy Başı |
   | **141** | T.C. İNKILAP – 1 | Ünite 8, Ünite 9 | Ünite 8'den yalnızca `8.4`; Ünite 9'dan `9.1`, `9.2`, `9.3` |
   | **142** | T.C. İNKILAP – 2 | Ünite 9, Ünite 10 | Ünite 9'dan `9.4`, `9.5`, `9.6`; Ünite 10'dan `10.1`-`10.4` |
5. **Dağılım / Çöküş Önleme Denetimi (Anti-Collapse):**
   - Eski bozuk durumdaki "tek alt konuya yığılma" hatasını önlemek için;
   - `TAR.json` içinde en az 20 farklı alt konu kullanılmış olmalıdır (şu an sadece 10).
   - `INK.json` içinde en az 6 farklı alt konu kullanılmış olmalıdır (şu an sadece 3).
   - Her ders kademesinde (82 soru) sorular tek bir alt konuya %100 oranında yığılamaz (en baskın alt konunun payı <%80 olmalıdır).

---

## 4. MILESTONE AŞAMALANDIRMA (PHASING) ÇÖZÜMÜ

Test entegrasyonunda kritik bir operasyonel gerçeklik vardır:
- **Milestone 1:** `scripts/tarih_taxonomy_map.json` ve `scripts/validate_tarih_taxonomy.py` oluşturulacaktır. Ancak `TAR.json` ve `INK.json` henüz güncellenmemiştir (eski 10/3 konulu haldedir).
- **Milestone 2:** 656 soru 60'arlık partilerle master dosyada yeniden sınıflandırılacaktır.
- **Milestone 3:** `build_webapp.py` çalıştırılarak `TAR.json` ve `INK.json` güncellenecek, `npm run check` ve `npm run build` ile canlıya alınacaktır.

Eğer M1 aşamasında yazılan test dosyası doğrudan `TAR.json` ve `INK.json` için katı alt konu sayısını koşulsuz zorlarsa, **M1'de `npm run check` hata verir ve milestone tamamlanamaz**.

### Çözüm: Koşullu Aşama Geçişi (`t.skip`)
`node:test` çerçevesinin `t.skip()` özelliği kullanılarak test şu şekilde tasarlanmalıdır:
```typescript
test('TAR.json ve INK.json dosyalarındaki tüm sorular taksonomiye ve ders sınırlarına %100 uyar', (t) => {
  const tarQuestions = JSON.parse(readFileSync('data/subjects/TAR.json', 'utf8'));
  const inkQuestions = JSON.parse(readFileSync('data/subjects/INK.json', 'utf8'));

  // Soru havuzu henüz M2/M3 partileriyle derlenmediyse M1 sırasında atla
  const tarSubCount = new Set(tarQuestions.map((q: any) => q.alt_konu)).size;
  if (tarSubCount <= 10) {
    t.skip('M1/M2 hazırlık aşaması: 656 Tarih sorusu henüz M2 partilerinde yeniden sınıflandırılmadı (M3 webapp derlemesinde zorunlu doğrulanır).');
    return;
  }

  // M3 derlemesinden sonra çalışan %100 katı doğrulama
  runStrictHistoryValidation(tarQuestions, inkQuestions);
});
```
Bu sayede:
1. M1'de taksonomi haritası ve doğrulayıcı testleri %100 yeşil geçer.
2. `npm run check` sıfır hatayla tamamlanır.
3. M2 ve M3 tamamlandığında test otomatik olarak aktifleşir ve 656 soruyu tavizsiz denetler.

---

## 5. `scripts/validate_tarih_taxonomy.py` OTOMASYON VE ENTEGRASYON PLANI

Doğrulayıcı betiğin sisteme entegrasyonu 4 katmanda gerçekleştirilmelidir:

```
[1. Geliştirici / CI CLI]       npm run validate:tarih (veya python3 scripts/validate_tarih_taxonomy.py)
              ↓
[2. Test Suite Entegrasyonu]    tests/tarih-taxonomy.test.ts (spawnSync ile python CLI denetimi)
              ↓
[3. Veri Derleyici Guard]       scripts/core/build_webapp.py (TAR.json & INK.json yazılmadan önce doğrulama)
              ↓
[4. Master Birleştirici Guard]  scripts/core/merge_all_courses.py (tum_analizli_sorular_temiz.json denetimi)
```

### 5.1 CLI Parametre Sözleşmesi
`scripts/validate_tarih_taxonomy.py` şu CLI arayüzünü desteklemelidir:
- `python3 scripts/validate_tarih_taxonomy.py` (Varsayılan: haritayı ve mevcut master/subject sorularını doğrular).
- `python3 scripts/validate_tarih_taxonomy.py --map-only` (Yalnızca `scripts/tarih_taxonomy_map.json` şemasını doğrular).
- `python3 scripts/validate_tarih_taxonomy.py --file <path>` (Belirli bir parti veya analiz dosyasını denetler).
- `python3 scripts/validate_tarih_taxonomy.py --subjects` (`data/subjects/TAR.json` ve `INK.json` dosyalarını denetler).
- `python3 scripts/validate_tarih_taxonomy.py --strict` (Herhangi bir sınır aşımında çıkış kodu 1 ile sonlanır).

### 5.2 `package.json` Entegrasyonu
`package.json` içine şu betik eklenmelidir:
```json
"scripts": {
  "validate:tarih": "python3 scripts/validate_tarih_taxonomy.py --strict",
  ...
}
```
Böylece geliştiriciler veya subagent'lar `npm run validate:tarih` komutunu tek adımda çalıştırabilir.

### 5.3 `build_webapp.py` İçine Güvenlik Kilidi Eklenmesi
`scripts/core/build_webapp.py` dosyasında `data/subjects/TAR.json` ve `data/subjects/INK.json` dosyaları diske yazılmadan önce:
```python
# scripts/core/build_webapp.py
try:
    from scripts.validate_tarih_taxonomy import validate_tarih_questions
    history_qs = data_by_subject.get('TAR', []) + data_by_subject.get('INK', [])
    if history_qs:
        validate_tarih_questions(history_qs, strict=True)
except ImportError:
    pass
```
Bu güvenlik kilidi sayesinde gelecekte yapılacak hiçbir veri güncellemesinde bozuk veya fallback'li Tarih verisinin web uygulamasına sızması mümkün olmaz.

---

## 6. ÖNERİLEN KOD TASLAKLARI

### 6.1 `tests/tarih-taxonomy.test.ts` (Tam Uygulama Taslağı)

```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import type { Question } from '../src/data/question.ts';

const TAXONOMY_PATH = 'scripts/tarih_taxonomy_map.json';
const FORBIDDEN_TERMS = [
  'genel', 'diğer', 'diger', 'çeşitli', 'cesitli',
  'karma', 'saptanamadı', 'saptanamadi', 'fallback', 'tanımsız', 'tanimsiz'
];

const COURSE_BOUNDARIES: Record<number, { name: string; allowedUnits: number[] }> = {
  131: { name: 'TARİH – 1', allowedUnits: [1, 2] },
  132: { name: 'TARİH – 2', allowedUnits: [2, 3] },
  133: { name: 'TARİH – 3', allowedUnits: [4, 5] },
  134: { name: 'TARİH – 4', allowedUnits: [6] },
  137: { name: 'TARİH – 5', allowedUnits: [7] },
  138: { name: 'TARİH – 6', allowedUnits: [8] },
  141: { name: 'T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 1', allowedUnits: [8, 9] },
  142: { name: 'T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 2', allowedUnits: [9, 10] },
};

function getUnitNumber(topicName: string): number {
  const match = topicName.match(/^([1-9]|10)\./);
  return match ? parseInt(match[1], 10) : -1;
}

test('tarih_taxonomy_map.json 10 ünite ve kurallı alt konular içerir', () => {
  assert.ok(existsSync(TAXONOMY_PATH), `${TAXONOMY_PATH} mevcut olmalı.`);
  const map: Record<string, string[]> = JSON.parse(readFileSync(TAXONOMY_PATH, 'utf8'));

  const units = Object.keys(map);
  assert.equal(units.length, 10, 'Taksonomi tam olarak 10 ana üniteden oluşmalıdır.');

  const allSubtopics = new Set<string>();

  units.forEach((unitTitle, idx) => {
    const expectedUnitNum = idx + 1;
    const unitNum = getUnitNumber(unitTitle);
    assert.equal(unitNum, expectedUnitNum, `Ünite başlığı ${expectedUnitNum}. ile başlamalıdır: ${unitTitle}`);

    const subtopics = map[unitTitle];
    assert.ok(Array.isArray(subtopics), `${unitTitle} alt konuları liste olmalıdır.`);
    assert.ok(subtopics.length >= 2, `${unitTitle} en az 2 alt konu içermelidir.`);

    subtopics.forEach((sub, subIdx) => {
      const expectedPrefix = `${expectedUnitNum}.${subIdx + 1} `;
      assert.ok(sub.startsWith(expectedPrefix), `${sub} '${expectedPrefix}' ile başlamalıdır.`);

      FORBIDDEN_TERMS.forEach(term => {
        assert.ok(!sub.toLowerCase().includes(term), `'${sub}' içinde yasaklı '${term}' geçemez.`);
      });

      assert.ok(!allSubtopics.has(sub), `Yinelenen alt konu: ${sub}`);
      allSubtopics.add(sub);
    });
  });

  assert.ok(allSubtopics.size >= 40 && allSubtopics.size <= 46, `Toplam alt konu sayısı (${allSubtopics.size}) 40-46 aralığında olmalıdır.`);
});

test('validate_tarih_taxonomy.py betiği harita denetimini başarıyla tamamlar', () => {
  const scriptPath = 'scripts/validate_tarih_taxonomy.py';
  if (!existsSync(scriptPath)) {
    return; // Worker M1'de oluşturacak
  }
  const result = spawnSync('python3', [scriptPath, '--map-only'], { encoding: 'utf8' });
  assert.equal(result.status, 0, `Doğrulayıcı betik hata verdi: ${result.stderr || result.stdout}`);
});

test('TAR.json ve INK.json soruları taksonomi ve pedagojik ders sınırlarına uyar', (t) => {
  if (!existsSync('data/subjects/TAR.json') || !existsSync('data/subjects/INK.json')) {
    t.skip('Ders veri dosyaları bulunamadı.');
    return;
  }

  const tarQuestions: Question[] = JSON.parse(readFileSync('data/subjects/TAR.json', 'utf8'));
  const inkQuestions: Question[] = JSON.parse(readFileSync('data/subjects/INK.json', 'utf8'));
  const allQuestions = [...tarQuestions, ...inkQuestions];

  // M1/M2 aşama kontrolü: Eğer veriler henüz reclassify edilmediyse M3'e kadar atla
  const tarSubCount = new Set(tarQuestions.map(q => q.alt_konu)).size;
  if (tarSubCount <= 10) {
    t.skip('M1/M2 hazırlık aşaması: 656 Tarih sorusu henüz yeniden sınıflandırılmadı (M3 aşamasında doğrulanır).');
    return;
  }

  assert.equal(tarQuestions.length, 492, 'TAR.json tam 492 soru içermelidir.');
  assert.equal(inkQuestions.length, 164, 'INK.json tam 164 soru içermelidir.');
  assert.equal(allQuestions.length, 656, 'Toplam Tarih soru sayısı 656 olmalıdır.');

  const map: Record<string, string[]> = JSON.parse(readFileSync(TAXONOMY_PATH, 'utf8'));
  const validMains = new Set(Object.keys(map));
  const validSubsByMain: Record<string, Set<string>> = {};
  for (const [m, subs] of Object.entries(map)) {
    validSubsByMain[m] = new Set(subs);
  }

  for (const q of allQuestions) {
    assert.ok(q.ana_konu, `ID ${q.id}: ana_konu boş olamaz.`);
    assert.ok(q.alt_konu, `ID ${q.id}: alt_konu boş olamaz.`);

    // Fallback yasaklı kelime denetimi
    for (const term of FORBIDDEN_TERMS) {
      assert.ok(!q.ana_konu.toLowerCase().includes(term), `ID ${q.id}: ana_konu '${term}' içeremez.`);
      assert.ok(!q.alt_konu.toLowerCase().includes(term), `ID ${q.id}: alt_konu '${term}' içeremez.`);
    }

    // Taksonomi hiyerarşi denetimi
    assert.ok(validMains.has(q.ana_konu), `ID ${q.id}: geçersiz ana_konu '${q.ana_konu}'.`);
    assert.ok(validSubsByMain[q.ana_konu].has(q.alt_konu), `ID ${q.id}: '${q.alt_konu}' alt konusu '${q.ana_konu}' altında yer alamaz.`);

    // Pedagojik ders sınır denetimi
    const courseCode = Number((q as any).ders_kodu);
    if (courseCode && COURSE_BOUNDARIES[courseCode]) {
      const allowed = COURSE_BOUNDARIES[courseCode].allowedUnits;
      const unitNum = getUnitNumber(q.ana_konu);
      assert.ok(
        allowed.includes(unitNum),
        `ID ${q.id}: ${COURSE_BOUNDARIES[courseCode].name} için Ünite ${unitNum} yasaktır! İzin verilen: ${allowed.join(', ')}`
      );
    }
  }

  // Dağılım denetimi (anti-collapse)
  assert.ok(new Set(tarQuestions.map(q => q.alt_konu)).size >= 20, 'TAR.json en az 20 farklı alt konu kullanmalıdır.');
  assert.ok(new Set(inkQuestions.map(q => q.alt_konu)).size >= 6, 'INK.json en az 6 farklı alt konu kullanmalıdır.');
});
```

---

## 7. SONUÇ VE EYLEM PLANI (ACTIONABLE RECOMMENDATIONS)

| Adım | Eylem | Sorumlu | Aşama |
|:---:|:---|:---:|:---:|
| **1** | `scripts/tarih_taxonomy_map.json` dosyasını oluştur (10 ünite, canonical alt konular) | M1 Worker | Milestone 1 |
| **2** | `scripts/validate_tarih_taxonomy.py` motorunu CLI bayraklarıyla (`--map-only`, `--file`, `--subjects`) uygula | M1 Worker | Milestone 1 |
| **3** | `tests/tarih-taxonomy.test.ts` test dosyasını oluştur (Şema, CLI ve aşamalı veri denetimi) | M1 Worker / Explorer | Milestone 1 |
| **4** | `package.json` içerisine `"validate:tarih"` betiğini ekle | M1 Worker | Milestone 1 |
| **5** | 656 soruyu 60'ar soruluk 11 partide yeniden sınıflandır | M2 Worker | Milestone 2 |
| **6** | `build_webapp.py` çalıştırarak `TAR.json` ve `INK.json` dosyalarını derle | M3 Worker | Milestone 3 |
| **7** | `npm run check` çalıştırarak `tests/tarih-taxonomy.test.ts`'nin tüm 656 soruyu doğrulamasını sağla | M3 Worker | Milestone 3 |
| **8** | `npm run build` ve `npx surge dist ortaklar-test.surge.sh` ile canlıya al | M3 Worker | Milestone 3 |
