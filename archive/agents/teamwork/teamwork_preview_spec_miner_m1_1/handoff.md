# Handoff Report: Milestone 1 Tarih Taxonomy & Validation Specification

**Agent:** `teamwork_preview_spec_miner_m1_1` (Milestone 1 Spec Miner)  
**Date:** 2026-10-07  
**Working Directory:** `/home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_spec_miner_m1_1/`  
**Milestone:** M1 — Taxonomy Definition & Validation Engine  
**Recipient:** Orchestrator (`8a3cccd6-b467-493a-9354-4d97f7291f06`) & Downstream Worker  

---

## 1. Observation

1. **Dataset Inventory and Course Counts:**
   - In `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json` (4,716 questions total), there are exactly **656 History questions** across 8 courses, with exactly 82 questions per course:
     ```
     131 (TARİH – 1): 82 questions
     132 (TARİH – 2): 82 questions
     133 (TARİH – 3): 82 questions
     134 (TARİH – 4): 82 questions
     137 (TARİH – 5): 82 questions
     138 (TARİH – 6): 82 questions
     141 (T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 1): 82 questions
     142 (T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 2): 82 questions
     ```
   - Total questions: $8 \times 82 = 656$. All questions have integer IDs, non-empty `soru_temiz`, and 4 choices (`A`, `B`, `C`, `D`).

2. **Current Degradation and Single-Subtopic Collapsing:**
   - In `tum_analizli_sorular_temiz.json`, questions are artificially collapsed into single subtopics per main unit:
     - In Unit 2 (`2. Orta Çağ'da Dünya ve Türk Dünyası`): all 87 questions are assigned to `2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları`. Kök Türkler, Uygurlar, Orhun Kitabeleri (e.g. ID 56) are erroneously placed under Feodalite.
     - In Unit 6 (`6. Dünya Gücü Osmanlı ve Osmanlı Medeniyeti`): all 86 questions are assigned to `6.3 Osmanlı Toplum Yapısı...`.
     - In Unit 9 (`9. Millî Mücadele ve T.C. İnkılap Tarihi`): all 107 questions are assigned to `9.4 Atatürkçülük ve Türk İnkılabı...`.
     - In Unit 10 (`10. Çağdaş Türk ve Dünya Tarihi`): all 50 questions are assigned to `10.4 Küreselleşen Dünya...`.

3. **Empirical Course Boundary Edge Cases in MEB Exams:**
   - In Course 132 (`TARİH – 2`), questions ID 4467, 4468, 5848, 7227, 7228, 8587, 9957 test Ancient Egypt, Mesopotamia, Urartu, and the Kings Road. MEB AÖL Grade 9 semester 2 exams explicitly include cumulative review questions from semester 1 (Unit 1).
   - In Course 133 (`TARİH – 3`), questions ID 8157 (Pasinler Ovası 1048), ID 8159 (Karahanlılar), ID 8161 (Biruni), ID 9529 (Selçuklu melikleri), ID 9531 (Kaşgarlı Mahmud) test Great Seljuk and early Islamic Turk states (Unit 3).
   - In Course 138 (`TARİH – 6`), questions ID 1124 (Halepa Fermanı 1878), ID 1132 (1912 Balkan Wars), ID 2642 (93 Harbi), ID 2643 (Mehmet Ali Paşa), ID 2644 (Crimean War 1853), ID 5437 (Napoleon 1798 Egypt) are all 19th c. Ottoman history (Unit 8), yet were dumped into Unit 1 or Unit 2 because the legacy regex classifier hit surface keywords like "Mısır", "Yunan", and "Rum".
   - In Course 141 (`T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 1`), questions ID 604 (Mussolini / Fascism) and ID 9086 (Briand-Kellogg Pact 1929) are question #10 in their respective exam sessions, reaching Interwar diplomacy (Unit 10).

4. **Taxonomy Map Reference (`scripts/tde_taxonomy_map.json`):**
   - File length: 59 lines. JSON object with 9 main unit keys. Indentation: 2 spaces. Numbered keys (`"1. ..."`) and numbered array items (`"1.1 ..."`). Standard ASCII straight apostrophes (`'`).

5. **Existing Verification Suite Baseline:**
   - Running `npm run check` executes lint, typecheck, `scripts/check-architecture.js`, and `tests/*.test.ts`. Current status: 29 tests passing, 0 errors.
   - Running `npm run build` succeeds cleanly in 285ms, producing `dist/`.

---

## 2. Logic Chain

1. From Observation 1, the total scope of questions to be governed by the Tarih taxonomy is exactly 656 questions across 8 course codes (131, 132, 133, 134, 137, 138, 141, 142).
2. From Observation 2 and Observation 4, the root cause of the current data degradation is the lack of a standardized canonical taxonomy map and the absence of a strict validation gate. Therefore, establishing `scripts/tarih_taxonomy_map.json` mirroring `scripts/tde_taxonomy_map.json` is mandatory.
3. From Observation 2 and 3, an authoritative 10-Unit, 45-Subtopic curriculum mapping covers the entire historical span from prehistory to 21st-century contemporary history, providing dedicated subtopics for:
   - Central Asian Turkish History (Units 2.2, 2.3) separate from European Feudalism (2.1).
   - Great Seljuk & Turkish-Islamic culture (Units 3.3, 3.4) separate from Anatolian Seljuks (4.1, 4.2).
   - Classical Ottoman political & military events (Units 6.1, 6.2, 6.3) separate from societal institutions (6.4, 6.5).
   - WWI, National Struggle prep, and War of Independence campaigns (Units 9.1, 9.2, 9.3) separate from Reforms (9.4, 9.5) and Foreign Policy (9.6).
   - WWII & Cold War (Units 10.1, 10.2, 10.3) separate from 21st-century globalization (10.4).
4. From Observation 3, if pedagogical course boundaries are drawn too rigidly based solely on textbook semester titles without inspecting actual MEB exam questions, legitimate questions in cumulative exams (e.g. Unit 1 questions in Course 132, Unit 3 questions in Course 133) would be rejected or forced into inappropriate units. Therefore, `ALLOWED_COURSE_TOPICS` in `validate_tarih_taxonomy.py` must accommodate proven cumulative semester review questions while strictly forbidding epochal corruptions (e.g. Tarih 6 questions placed in Ancient Greece/Rome).
5. From Observation 4 and 5, implementing `scripts/tarih_taxonomy_map.json` and `scripts/validate_tarih_taxonomy.py` as pure Python and JSON assets introduces zero disruptions to the webapp build pipeline and leaves `npm run check` at 100% pass rate.

---

## 3. Caveats

1. **Master Dataset Reclassification Dependency:**
   - In Milestone 1, the master dataset `tum_analizli_sorular_temiz.json` has NOT yet undergone the 60-by-60 LLM batch reclassification. Therefore, running `validate_tarih_taxonomy.py` against the unreclassified master dataset will intentionally detect and report errors (which is the expected behavior of a strict validator).
   - The validator's self-test mode (`--check-map-only`) validates the taxonomy map schema and exits with code `0`.
2. **Batch Audit Pipeline Integration:**
   - In Milestone 2, the reclassification script will process questions in 11 batches. The validator's `--batch-path` option will validate individual batch files during this process.
3. **Typography Standard:**
   - All taxonomy map keys and subtopic strings use standard ASCII single quotes (`'`) to ensure consistent hashing and avoid encoding discrepancies across platforms.

---

## 4. Conclusion

The specification for Milestone 1 is completely mined, empirically grounded, and documented with zero ambiguities in `report.md`. The Worker has an exact verbatim specification for `scripts/tarih_taxonomy_map.json` and a complete interface/logic specification for `scripts/validate_tarih_taxonomy.py`.

---

## 5. Verification Method

To verify the implementation of Milestone 1 artifacts:

1. **Verify Taxonomy Map JSON Validity & Counts:**
   ```bash
   python3 -c "
   import json
   with open('scripts/tarih_taxonomy_map.json', 'r', encoding='utf-8') as f:
       m = json.load(f)
   assert len(m) == 10, f'Expected 10 units, got {len(m)}'
   subs = sum(len(v) for v in m.values())
   assert subs == 45, f'Expected 45 subtopics, got {subs}'
   print('Taxonomy map JSON verification PASSED: 10 units, 45 subtopics.')
   "
   ```

2. **Verify Validator Self-Check Execution:**
   ```bash
   python3 scripts/validate_tarih_taxonomy.py --check-map-only
   # Must exit with code 0.
   ```

3. **Verify Programmatic API & Dataclasses:**
   ```bash
   python3 -c "
   from scripts.validate_tarih_taxonomy import HistoryTaxonomyValidator, HistoryClassificationResult

   v = HistoryTaxonomyValidator('scripts/tarih_taxonomy_map.json')
   res_valid = HistoryClassificationResult(
       id=1132, ders='TARİH – 6', ders_kodu=138,
       ana_konu='8. En Uzun Yüzyıl (19. ve 20. Yüzyıl Başı Osmanlı)',
       alt_konu='8.4 20. Yüzyıl Başlarında Osmanlı Devleti, Trablusgarp ve Balkan Savaşları',
       gerekce='1912 Balkan Savaşları'
   )
   errs = v.validate_classification(res_valid)
   assert len(errs) == 0, f'Unexpected errors: {errs}'

   res_invalid = HistoryClassificationResult(
       id=1132, ders='TARİH – 6', ders_kodu=138,
       ana_konu='1. Tarih Bilimi ve İlk Çağ Medeniyetleri',
       alt_konu='1.4 Ege, Yunan, Doğu Akdeniz ve Roma Medeniyetleri',
       gerekce='Keyword error'
   )
   errs = v.validate_classification(res_invalid)
   assert len(errs) > 0, 'Validator failed to catch boundary violation!'
   print('Validator class unit verification PASSED.')
   "
   ```

4. **Verify Webapp Integrity:**
   ```bash
   npm run check
   # Must exit with code 0 (29 tests pass).
   ```
