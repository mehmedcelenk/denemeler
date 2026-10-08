# 5-Component Handoff Report: MEB AÖL Tarih Curriculum & Classification Survey

**Agent:** Explorer 3 (`teamwork_preview_explorer_survey_3`)  
**Target:** Parent Orchestrator (`8a3cccd6-b467-493a-9354-4d97f7291f06`)  
**Mission:** Survey of MEB AÖL Tarih curriculum, course codes, canonical taxonomy, classifier history, and validation schema.  
**Report Artifact:** `/home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_survey_3/report.md`

---

## 1. Observation

1. **Master Question Dataset:**
   - File: `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json`
   - Total questions: 4,716 questions.
   - History subset: Exactly **656 questions** across 8 courses (each with 82 questions):
     - `TARİH – 1`: 82 questions, `ders_kodu`: 131
     - `TARİH – 2`: 82 questions, `ders_kodu`: 132
     - `TARİH – 3`: 82 questions, `ders_kodu`: 133
     - `TARİH – 4`: 82 questions, `ders_kodu`: 134
     - `TARİH – 5`: 82 questions, `ders_kodu`: 137
     - `TARİH – 6`: 82 questions, `ders_kodu`: 138
     - `T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 1`: 82 questions, `ders_kodu`: 141
     - `T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 2`: 82 questions, `ders_kodu`: 142
   - Verification command:
     ```bash
     python3 -c "import json; from collections import Counter; qs=json.load(open('scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json')); print(Counter(q['ders'] for q in qs if 'TARİH' in q['ders'] or 'İNKILAP' in q['ders']))"
     ```
     Result: `Counter({'TARİH – 2': 82, 'TARİH – 1': 82, 'TARİH – 5': 82, 'T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 1': 82, 'TARİH – 3': 82, 'TARİH – 4': 82, 'TARİH – 6': 82, 'T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 2': 82})`

2. **Subtopic Flattening and Catch-all Dumping in Working Tree:**
   - In `tum_analizli_sorular_temiz.json`:
     - Topic 2 (`2. Orta Çağ'da Dünya ve Türk Dünyası`): 100% of questions (87/87) were mapped to `2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları`.
       * Verbatim example: Question ID 56 (`TARİH – 2`), stem *"Kök Türklere ait Orhun Kitabeleri’nde 'Tanrı gibi gökte olmuş Türk Bilge Kağan’ı, bu zaman...' "* is assigned to `2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları`.
     - Topic 6 (`6. Dünya Gücü Osmanlı ve Osmanlı Medeniyeti`): 100% of questions (86/86) were mapped to `6.3 Osmanlı Toplum Yapısı, Eyalet Yönetimi, Millet Sistemi ve Vakıflar`.
       * Verbatim example: Question ID 1112 (`TARİH – 4`), stem *"'Fatih' ünvanı ile anılan Osmanlı padişahı aşağıdakilerden hangisidir?"* is assigned to `6.3 Osmanlı Toplum Yapısı...`.
     - Topic 9 (`9. Millî Mücadele ve T.C. İnkılap Tarihi`): 100% of questions (107/107) were mapped to `9.4 Atatürkçülük ve Türk İnkılabı (Siyasi, Hukuki, Eğitsel, Toplumsal, Ekonomik Alanda İnkılaplar)`.
       * Verbatim example: Question ID 598 (`T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 1`), stem *"Aşağıdakilerden hangisi Erzurum Kongresi’nde alınan kararlardandır?"* is assigned to `9.4 Atatürkçülük ve Türk İnkılabı...`.
     - Topic 10 (`10. Çağdaş Türk ve Dünya Tarihi`): 100% of questions (50/50) were mapped to `10.4 Küreselleşen Dünya, İletişim Çağı ve 21. Yüzyılın Eşiğinde Türkiye ve Dünya`.
       * Verbatim example: Question ID 1136 (`T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 2`), stem *"Aşağıdakilerden hangisi II. Dünya Savaşı’na Mihver Devletler grubunda katılmıştır?"* is assigned to `10.4 Küreselleşen Dünya...`.

3. **Naive Regex Traps from Predecessor Scripts:**
   - Documented in `scripts/docs/SAVED_CLASSIFIER_NOTES.md` and visible in old `process_tarih.py` / `process_inkilap.py`:
     * Question ID 2643, 5437, 8178: Stem mentions *"Mısır valisi olan Mehmet Ali Paşa"* (19th-century Ottoman decentralization & diplomacy). Classified under `1. Tarih Bilimi ve İlk Çağ Medeniyetleri` due to keyword "mısır" triggering Ancient Egypt.
     * Question ID 1132: Stem mentions *"1912-1913 Balkan Savaşlarından faydalanarak bağımsızlığını ilan eden devlet..."*. Classified under `1. Tarih Bilimi ve İlk Çağ Medeniyetleri` due to options containing "Yunanistan".

4. **Webapp Build Pipeline & Test Baseline:**
   - File: `scripts/core/build_webapp.py`
     - Reads `tum_analizli_sorular_temiz.json` and writes `data/subjects/TAR.json` (for courses containing 'TARİH' and not 'İNKILAP' -> 492 questions) and `data/subjects/INK.json` (for courses containing 'İNKILAP' -> 164 questions).
     - Writes `src/data/generated/subjectManifest.json`.
   - `npm run check` currently runs clean: 29/29 tests pass, ESLint 0 errors, TypeScript 0 errors, architecture audit 0 errors.

---

## 2. Logic Chain

1. **Observation 1 $\rightarrow$ Inference on Scope:**
   There are exactly 656 History questions in the active dataset, distributed evenly across 8 courses (82 questions each). When reclassifying in 60-question batches, this translates to $\lceil 656 / 60 \rceil = 11$ batches (10 batches of 60 questions, 1 batch of 56 questions).

2. **Observation 2 & 3 $\rightarrow$ Inference on Root Cause of Misclassification:**
   The codebase suffered from two compounding classification errors:
   - *Phase 1:* Primitive regex/keyword matching blindly fired on proper nouns (e.g., "Mısır" $\rightarrow$ Ancient Egypt, "Yunan" $\rightarrow$ Ancient Greece), misattributing 19th-century and 20th-century questions to Antiquity.
   - *Phase 2:* A naive flattening script migrated questions into 10 numbered parent topics but collapsed all subtopics into a single fallback per unit (e.g. Orhun Inscriptions into Feudalism, Erzurum Congress into Legal Reforms, WW2 into Globalization).
   *Conclusion:* Rule-based regex cannot replace full LLM pedagogical reasoning that reads the entire stem, question intent, options, and historical context.

3. **Observation 1 & 4 $\rightarrow$ Curriculum Structure Formulation:**
   In MEB secondary education, High School History spans 8 semesters:
   - 9th grade: Tarih 1 (131), Tarih 2 (132)
   - 10th grade: Tarih 3 (133), Tarih 4 (134)
   - 11th grade: Tarih 5 (137), Tarih 6 (138)
   - 12th grade: T.C. İnkılap Tarihi 1 (141), T.C. İnkılap Tarihi 2 (142)
   Colloquially referred to as "Tarih 1 to 8", the 7th and 8th semesters are canonically titled "T.C. İnkılap Tarihi ve Atatürkçülük 1 & 2". Codes 135 and 136 are Elective History (Seçmeli Tarih).

4. **Synthesis $\rightarrow$ Canonical 10-Unit, 43-Subtopic Taxonomy:**
   Building a dedicated `scripts/tarih_taxonomy_map.json` (mirroring the established `scripts/tde_taxonomy_map.json` pattern) with 10 chronological units and 43 distinct subtopics provides a complete, 100% MEB-aligned taxonomy that eliminates all fallback catching.

---

## 3. Caveats

1. **Elective Course Questions in Raw PDF Pool:**
   Raw PDFs in `scripts/ciktilar/dersler/` contain elective history courses: 135 (Seçmeli Tarih 1), 136 (Seçmeli Tarih 2), 451/452 (Seçmeli Çağdaş Türk ve Dünya Tarihi 1 & 2), and 195/196 (Seçmeli Ortak Türk Tarihi). These are NOT in the active 4,716-question booklet dataset (`tum_analizli_sorular_temiz.json`), which strictly focuses on compulsory common culture courses (Zorunlu Ortak Kültür Dersleri). Our taxonomy supports these elective courses if ingested in the future.
2. **Read-Only Investigation Boundary:**
   Per Explorer instructions, no source code, JSON data, or production files were modified. The findings and proposed taxonomy are documented in `report.md`.

---

## 4. Conclusion

1. The MEB AÖL History curriculum in the project consists of **8 courses** (codes 131, 132, 133, 134, 137, 138, 141, 142) containing exactly **656 questions**.
2. Current misclassifications are severe due to naive keyword triggers and subtopic flattening; every question in units 2, 6, 9, and 10 is currently collapsed into a single catch-all subtopic.
3. A canonical **10-Unit, 43-Subtopic Taxonomy** has been fully specified in `report.md`, ready to be instantiated as `scripts/tarih_taxonomy_map.json`.
4. A strict validation schema (Python validator rejecting any "Genel"/fallback terms and enforcing course-to-topic pedagogical bounds) has been defined.
5. Reclassification must be executed across 11 batches of 60 questions using full LLM reasoning, followed by `python3 scripts/core/build_webapp.py`, `npm run check`, `npm run build`, and Surge deployment.

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Question Counts and Codes:**
   ```bash
   python3 -c "
   import json
   from collections import Counter
   qs = json.load(open('scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json'))
   hist = [q for q in qs if 'TARİH' in q['ders'] or 'İNKILAP' in q['ders']]
   print('Total:', len(hist))
   print(Counter(f\"{q['ders']} ({q.get('ders_kodu')})\" for q in hist))
   "
   ```
   *Expected Output:* Total: 656; Exactly 82 questions for each of the 8 courses/codes.

2. **Verify Flattened Catch-all Subtopics:**
   ```bash
   python3 -c "
   import json
   from collections import Counter
   qs = json.load(open('scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json'))
   hist = [q for q in qs if 'TARİH' in q['ders'] or 'İNKILAP' in q['ders']]
   for u in ['2.', '6.', '9.', '10.']:
       print(Counter(q['alt_konu'] for q in hist if q['ana_konu'].startswith(u)))
   "
   ```
   *Expected Output:* In each unit, a single subtopic holds 100% of the questions.

3. **Verify Baseline Health:**
   ```bash
   npm run check
   ```
   *Expected Output:* 29 passed tests, 0 lint/typecheck/architecture errors.
