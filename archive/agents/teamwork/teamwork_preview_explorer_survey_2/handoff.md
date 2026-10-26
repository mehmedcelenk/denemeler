# Handoff Report: Explorer 2 (Tarih & İnkılap Tarihi Question Survey)

## 1. Observation

- **Master File Size and Question Count:**
  `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json` is a 4.5MB JSON file containing exactly **4,716 questions** across 58 course modules.
  Command: `python3 -c "import json; data=json.load(open('scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json')); print(len(data))"` -> `4716`.

- **Tarih & İnkılap Tarihi Count and Breakdown:**
  Filtering by `ders_kodu in [131, 132, 133, 134, 137, 138, 141, 142]` or `'TARİH' in ders or 'İNKILAP' in ders` yields exactly **656 questions** (82 questions across each of the 8 courses):
  - `131: TARİH – 1`: 82 questions
  - `132: TARİH – 2`: 82 questions
  - `133: TARİH – 3`: 82 questions
  - `134: TARİH – 4`: 82 questions
  - `137: TARİH – 5`: 82 questions
  - `138: TARİH – 6`: 82 questions
  - `141: T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 1`: 82 questions
  - `142: T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 2`: 82 questions
  Total Tarih 1–6: 492 questions. Total İnkılap Tarihi 1–2: 164 questions. 492 + 164 = 656 questions.

- **Exam Term Uniformity:**
  The 656 questions span 8 exam terms with exact uniformity:
  - 2023-2024 Donem 1: 11 questions × 8 courses = 88 questions
  - 2023-2024 Donem 2: 11 questions × 8 courses = 88 questions
  - 2024-2025 Donem 1..3: 10 questions × 8 courses × 3 terms = 240 questions
  - 2025-2026 Donem 1..3: 10 questions × 8 courses × 3 terms = 240 questions
  Sum: 88 + 88 + 240 + 240 = 656 questions.

- **Question Object Schema:**
  Every question has 11 required keys: `id` (int, min 56, max 10936), `ders` (str), `ders_kodu` (int), `yil` (str), `donem` (str), `soru_no` (int), `soru_temiz` (str, avg 234.6 chars, min 56 chars), `secenekler_temiz` (dict with keys 'A', 'B', 'C', 'D'), `dogru_cevap` (str: 'A', 'B', 'C', or 'D'), `ana_konu` (str), `alt_konu` (str).
  All 656 questions have 0 missing options, 0 invalid answers, and 0 visual dependencies (`sekilli = False`).

- **Taxonomy Collapse & Pseudo-Catch-All Skew:**
  In `tum_analizli_sorular_temiz.json`, all 656 questions are squashed into only **10 main topics** and **13 subtopics**.
  The top 5 subtopics absorb 427 of the 656 questions (65.1%):
  - `9.4 Atatürkçülük ve Türk İnkılabı...`: 107 questions (16.3%)
  - `1.4 Ege, Yunan, Doğu Akdeniz ve Roma Medeniyetleri`: 97 questions (14.8%)
  - `2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları`: 87 questions (13.3%)
  - `6.3 Osmanlı Toplum Yapısı, Eyalet Yönetimi, Millet Sistemi ve Vakıflar`: 86 questions (13.1%)
  - `10.4 Küreselleşen Dünya, İletişim Çağı ve 21. Yüzyılın Eşiğinde Türkiye ve Dünya`: 50 questions (7.6%)

- **Direct Verbatim Evidence of Mismatched Classifications:**
  - ID 1124 (Tarih 6, Halepa Fermanı & Girit Rumları, 1878) -> `2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları`
  - ID 1132 (Tarih 6, 1912-1913 Balkan Savaşları & Arnavutluk) -> `1.4 Ege, Yunan, Doğu Akdeniz ve Roma Medeniyetleri`
  - ID 2642 (Tarih 6, 93 Harbi & Balkan Türk göçleri, 1878) -> `2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları`
  - ID 2644 (Tarih 6, Kırım Savaşı 1853 & Kutsal Yerler Sorunu) -> `1.4 Ege, Yunan, Doğu Akdeniz ve Roma Medeniyetleri`
  - ID 56 (Tarih 2, Orhun Kitabeleri & Bilge Kağan Kut anlayışı) -> `2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları`
  - ID 595 (İnkılap 1, I. Dünya Savaşı'nda İtilaf grubuna katılan İtalya) -> `9.4 Atatürkçülük ve Türk İnkılabı...`

- **Build Script Alignment:**
  In `scripts/core/build_webapp.py` (lines 162–175):
  - Courses matching `'İNKILAP'` output to `data/subjects/INK.json` (164 questions).
  - Courses matching `'TARİH'` output to `data/subjects/TAR.json` (492 questions).
  Sum: 656 questions.

## 2. Logic Chain

1. **Step 1 (Scope & Criteria):**
   Observation shows that filtering by `ders_kodu in [131, 132, 133, 134, 137, 138, 141, 142]` or `'TARİH' in ders or 'İNKILAP' in ders` isolates exactly 656 questions, with 0 false positives and 0 false negatives across all 4,716 records.

2. **Step 2 (Data Integrity):**
   Observation of stems, options, and keys confirms that the raw question texts and option choices are intact, clean, and balanced. The problem is strictly confined to `ana_konu` and `alt_konu` classification.

3. **Step 3 (Root Cause of Misclassifications):**
   Observations from `SAVED_CLASSIFIER_NOTES.md` and git history show that previous automated classification used naive regex keyword rules. When keywords like "Yunan", "Mısır", "Rum" matched 19th/20th-century Ottoman questions (Tarih 6), the rule engine incorrectly assigned them to Ancient Greek/Roman civilization (`1.4`). When no specific keyword matched, fallback rules dumped Central Asian Turks into European Feudalism (`2.1`), and almost all İnkılap Tarihi 1 questions into Atatürk İnkılapları (`9.4`).

4. **Step 4 (Need for Curriculum Taxonomy & LLM Reasoning):**
   Because only 13 subtopics exist in `tum_analizli_sorular_temiz.json`, questions literally had nowhere else to go. A proper MEB taxonomy with ~30–40 canonical subtopics is required, and questions must be classified via full LLM semantic reasoning rather than keyword regexes.

5. **Step 5 (Optimal Partitioning for Audit):**
   With 656 questions and a target batch size of 60, dividing them into 11 batches (10 × 60 + 1 × 56) in Curriculum-Chronological order (Grade 9 through Grade 12) minimizes thematic jumping for the LLM auditor and maximizes audit precision.

## 3. Caveats

- Elective courses (Seçmeli Tarih 1 & 2, Seçmeli Çağdaş Türk ve Dünya Tarihi, codes 135, 136, 451, 452) exist in raw PDF scrape dumps (`scripts/ciktilar/dersler/`) but are deliberately not included in `tum_analizli_sorular_temiz.json` (which strictly contains the 12 compulsory common culture disciplines). This investigation remained strictly scoped to the 656 compulsory Tarih questions in `tum_analizli_sorular_temiz.json` as requested.
- No code or question data files were modified in this turn; all work was purely read-only investigation and reporting.

## 4. Conclusion

1. The exact Tarih & İnkılap Tarihi question population in `tum_analizli_sorular_temiz.json` is **656 questions** (492 Tarih 1–6 + 164 İnkılap Tarihi 1–2).
2. The current taxonomy is severely degraded (only 10 main topics, 13 subtopics), resulting in 65.1% of questions trapped in 5 pseudo-catch-all buckets with widespread cross-epoch contamination.
3. The questions must be reclassified against an expanded MEB curriculum taxonomy across **11 controlled 60-question batches** (10 of 60, 1 of 56), sequenced in Curriculum-Chronological order.
4. Comprehensive findings and the complete 11-batch audit schedule have been written to `report.md`.

## 5. Verification Method

- **Verify Question Counts & Codes:**
  ```bash
  python3 -c "
  import json
  data = json.load(open('scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json'))
  tarih = [q for q in data if q.get('ders_kodu') in [131, 132, 133, 134, 137, 138, 141, 142]]
  print('Total Tarih:', len(tarih))
  assert len(tarih) == 656
  "
  ```
- **Verify Subject Manifest Counts in `data/subjects/`:**
  ```bash
  python3 -c "
  import json
  tar = json.load(open('data/subjects/TAR.json'))
  ink = json.load(open('data/subjects/INK.json'))
  print(f'TAR: {len(tar)}, INK: {len(ink)}, Sum: {len(tar) + len(ink)}')
  assert len(tar) == 492 and len(ink) == 164
  "
  ```
- **Inspect Detailed Report:**
  Examine `/home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_survey_2/report.md`.
