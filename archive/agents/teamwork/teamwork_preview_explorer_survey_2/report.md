# 🏛️ Comprehensive Investigation & Inventory Report: AÖL Tarih & İnkılap Tarihi Question Pool

> **Investigator:** Explorer 2 (`teamwork_preview_explorer_survey_2`)  
> **Target Dataset:** `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json`  
> **Related Datasets:** `data/subjects/TAR.json`, `data/subjects/INK.json`, `scripts/ciktilar/analiz/tarih_analizli_sorular_temiz.json`, `scripts/ciktilar/analiz/inkilap_analizli_sorular_temiz.json`, `scripts/ciktilar/analiz/tarih_sorulari_etiketli.json`  
> **Date:** October 2026  
> **Status:** Completed  

---

## 1. Executive Summary

A comprehensive, read-only forensic audit and data survey was conducted on all Tarih and İnkılap Tarihi questions within the AÖL exam ecosystem. The primary master dataset `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json` contains exactly **4,716 questions** across 12 disciplines (58 course modules).

Within this master pool, Tarih and İnkılap Tarihi comprise exactly **656 questions** (13.91% of the repository), perfectly distributed across **8 official MEB AÖL courses** (82 questions per course across 8 historical exam terms from 2023–2024 to 2025–2026).

### Key Empirical Discoveries
1. **Clean Question Stems & Options:** The raw question data is structurally healthy: 100% of the 656 questions have clean stems (min 56, max 800 chars, avg 234.6 chars), valid 4-option sets (`A`, `B`, `C`, `D`), well-balanced answer distributions, and zero visual/diagrammatic dependencies (`sekilli = False` for all 656 questions).
2. **Severely Degraded Taxonomy (10 Topics / 13 Subtopics):** While earlier interim files (`tarih_analizli` and `inkilap_analizli`) contained up to 68 granular subtopics, the current unified file `tum_analizli_sorular_temiz.json` has collapsed all 656 questions into just **10 main topics** and **13 subtopics**.
3. **The "Pseudo-Catch-All" Pathology:** While literal string markers (`"Genel"` or `"Diğer"`) were blocked by previous code assertions, the classifier substituted them with 5 massive pseudo-catch-all buckets that absorb **427 of the 656 questions (65.1%)**.
4. **Cross-Epoch Temporal Contamination:** Keyword regexes caused severe pedagogical errors. For example, in **Tarih 6 (19th/20th c. Ottoman)**, questions on the 1912 Balkan Wars, 1853 Crimean War, 1878 Berlin Treaty, and 1909 31 Mart Vakası were assigned to `1.4 Ege, Yunan, Doğu Akdeniz ve Roma Medeniyetleri` simply because the text mentioned "Girit Rumları", "Yunan", or "Mısır".
5. **Eradication of Central Asian Turkish History:** In **Tarih 2**, questions on the Kök Türks, Bilge Kağan, Orhun Inscriptions, and nomadic steppe culture were forcibly stamped as `2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları` (European Feudalism).
6. **Monolithic Squashing of Republic History:** In **İnkılap Tarihi 1**, 70 of 82 questions (85.4%) were dumped into `9.4 Atatürk İnkılapları`, erasing the entire World War I and Turkish War of Independence (Millî Mücadele) progression.
7. **Controlled 60-Question Partitioning:** The 656 questions partition cleanly into **11 batches** (10 batches of 60 questions + 1 batch of 56 questions). Structuring these batches in **Curriculum-Chronological Order** (Grade 9 through Grade 12) provides optimal thematic coherence for full LLM reasoning audits.

---

## 2. Question Pool Scope, Identification & Filter Criteria

### 2.1 Total Question Counts
- **Total in `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json`:** `4,716` questions.
- **Total Tarih & İnkılap Tarihi questions:** `656` questions.
- **Tarih (General History, Tarih 1–6):** `492` questions (75.0% of History pool).
- **T.C. İnkılap Tarihi ve Atatürkçülük (İnkılap 1–2):** `164` questions (25.0% of History pool).

### 2.2 Official Course Structure & Exam Term Breakdown
In the MEB AÖL high school curriculum, the compulsory common culture history requirement spans 4 years (8 semesters), divided into 6 Tarih courses and 2 İnkılap Tarihi courses:

| Course Code (`ders_kodu`) | Course Name (`ders`) | Grade Level | MEB Credit | Questions in Pool |
| :---: | :--- | :---: | :---: | :---: |
| **131** | `TARİH – 1` | Grade 9, Term 1 | 2 | 82 |
| **132** | `TARİH – 2` | Grade 9, Term 2 | 2 | 82 |
| **133** | `TARİH – 3` | Grade 10, Term 1 | 2 | 82 |
| **134** | `TARİH – 4` | Grade 10, Term 2 | 2 | 82 |
| **137** | `TARİH – 5` | Grade 11, Term 1 | 2 | 82 |
| **138** | `TARİH – 6` | Grade 11, Term 2 | 2 | 82 |
| **141** | `T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 1` | Grade 12, Term 1 | 2 | 82 |
| **142** | `T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 2` | Grade 12, Term 2 | 2 | 82 |
| **TOTAL** | **8 Compulsory Courses** | **High School 1–4** | **16 Kredi** | **656** |

*(Note on code sequence: MEB allocated codes 135 and 136 to elective courses `Seçmeli Tarih 1` and `Seçmeli Tarih 2`, which is why the compulsory numbering jumps from 134 to 137).*

#### Exam Term Matrix (Questions per Session)
Every single exam session in the database contains an exact, uniform number of questions per course:

| Academic Year (`yil`) | Term (`donem`) | 131 | 132 | 133 | 134 | 137 | 138 | 141 | 142 | Session Total |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **2023-2024** | 1 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | **88** |
| **2023-2024** | 2 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | 11 | **88** |
| **2024-2025** | 1 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **80** |
| **2024-2025** | 2 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **80** |
| **2024-2025** | 3 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **80** |
| **2025-2026** | 1 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **80** |
| **2025-2026** | 2 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **80** |
| **2025-2026** | 3 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | 10 | **80** |
| **Total per Course** | — | **82** | **82** | **82** | **82** | **82** | **82** | **82** | **82** | **656** |

### 2.3 Filter Criteria Evaluation
In any Python or automated audit pipeline, Tarih questions can be selected via three equivalent filters:
1. **Course Code Filter (`ders_kodu`):**
   ```python
   tarih_questions = [q for q in questions if q.get('ders_kodu') in [131, 132, 133, 134, 137, 138, 141, 142]]
   ```
2. **Subject String Filter (`ders`):**
   ```python
   tarih_questions = [q for q in questions if any(k in q.get('ders', '').upper() for k in ['TARİH', 'İNKILAP'])]
   ```
3. **Webapp Build Partition (`subject_id` in `build_webapp.py`):**
   - Courses with `'İNKILAP'` map to `'INK'` -> `data/subjects/INK.json` (164 questions).
   - Courses with `'TARİH'` map to `'TAR'` -> `data/subjects/TAR.json` (492 questions).
   - Sum: 492 + 164 = 656 questions.

### 2.4 Cross-File ID & Question Alignment
Independent verification was run against other data artifacts in `scripts/ciktilar/analiz/`:
- `tarih_sorulari_etiketli.json`: Contains all **656 questions** (legacy 1-level `konu` format). IDs match 100%.
- `tarih_analizli_sorular_temiz.json`: Contains exactly the **492 questions** of Tarih 1–6. IDs match 100%.
- `inkilap_analizli_sorular_temiz.json`: Contains exactly the **164 questions** of İnkılap Tarihi 1–2. IDs match 100%.
- Integer IDs range from `56` to `10936`, with 0 duplicates and 0 missing values.

---

## 3. Data Schema & Object Structure Analysis

### 3.1 Primary Schema in `tum_analizli_sorular_temiz.json`
Every question object in the master JSON conforms to the following strict 11-field schema:

```json
{
  "id": 56,
  "ders": "TARİH – 2",
  "ders_kodu": 132,
  "yil": "2023-2024",
  "donem": "1",
  "soru_no": 1,
  "soru_temiz": "Kök Türklere ait Orhun Kitabeleri’nde “Tanrı gibi gökte olmuş Türk Bilge Kağan’ı, bu zamanda oturdum...\",",
  "secenekler_temiz": {
    "A": "Ülke topraklarının hükümdara ait olduğu",
    "B": "Hanedanın en büyük üyesinin tahta geçtiği",
    "C": "Hükümdarın kut inancına dayanarak hüküm sürdüğü",
    "D": "Devletin boylar federasyonu şeklinde örgütlendiği"
  },
  "dogru_cevap": "C",
  "ana_konu": "2. Orta Çağ'da Dünya ve Türk Dünyası",
  "alt_konu": "2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları"
}
```

#### Field Specifications & Health Checks
- `id` (`int`): Unique numeric identifier (`min: 56`, `max: 10936`). No nulls.
- `ders` (`str`): Canonical course name string. No malformed strings.
- `ders_kodu` (`int`): Compulsory AÖL course code (131, 132, 133, 134, 137, 138, 141, 142).
- `yil` (`str`): Academic year string (`"2023-2024"`, `"2024-2025"`, `"2025-2026"`).
- `donem` (`str`): Term index (`"1"`, `"2"`, `"3"`).
- `soru_no` (`int`): Question index within exam paper (`1` to `11`).
- `soru_temiz` (`str`): Cleaned question stem. All non-empty (`len >= 56`).
- `secenekler_temiz` (`dict[str, str]`): Contains exactly keys `{"A", "B", "C", "D"}` with non-empty string values. Zero missing options.
- `dogru_cevap` (`str`): Correct answer key (`"A"`, `"B"`, `"C"`, `"D"`).
  - Distribution: `C: 168 (25.6%)`, `A: 165 (25.2%)`, `D: 164 (25.0%)`, `B: 159 (24.2%)` — perfectly balanced.
- `ana_konu` (`str`): Main topic title.
- `alt_konu` (`str`): Subtopic title.

### 3.2 Runtime Schema Transformation (`scripts/core/build_webapp.py`)
When `python3 scripts/core/build_webapp.py` runs, it transforms the master questions into runtime webapp objects stored in `data/subjects/TAR.json` and `data/subjects/INK.json`:
- `soru_temiz` is renamed to `soru`.
- `secenekler_temiz` is renamed to `secenekler`.
- Added runtime fields:
  - `kredi`: Assigned `2` for both TAR and INK.
  - `sinav_soru_sayisi`: Dynamic calculation (`10` or `11`).
  - `puan`: `round(kredi / sinav_soru_sayisi, 2)` (e.g. `0.20` or `0.18`).
  - `ipucu`: Topic hint string (empty string if undefined).
  - `sekilli`: Visual flag computed via regex. **All 656 Tarih/İnkılap questions evaluate to `sekilli: false`** (100% pure text questions).
  - Optional preserved fields: `soru_tr`, `soru_ar`, `soru_xray` (if present).

---

## 4. Topic & Subtopic Distribution Analysis

### 4.1 Macro Topic Distribution (`ana_konu`)
In `tum_analizli_sorular_temiz.json`, the 656 questions are currently grouped into 10 main topics:

| Rank | `ana_konu` | Count | % of Pool | Associated Primary Era |
| :---: | :--- | :---: | :---: | :--- |
| 1 | `1. Tarih Bilimi ve İlk Çağ Medeniyetleri` | 121 | 18.4% | Tarih 1 (Grade 9) |
| 2 | `9. Millî Mücadele ve T.C. İnkılap Tarihi` | 107 | 16.3% | İnkılap Tarihi 1 & 2 (Grade 12) |
| 3 | `2. Orta Çağ'da Dünya ve Türk Dünyası` | 87 | 13.3% | Tarih 2 (Grade 9) |
| 4 | `6. Dünya Gücü Osmanlı ve Osmanlı Medeniyeti` | 86 | 13.1% | Tarih 4 (Grade 10) |
| 5 | `8. En Uzun Yüzyıl (19. ve 20. Yüzyıl Başı Osmanlı)` | 57 | 8.7% | Tarih 6 (Grade 11) |
| 6 | `10. Çağdaş Türk ve Dünya Tarihi` | 50 | 7.6% | İnkılap Tarihi 2 (Grade 12) |
| 7 | `7. Arayış Yılları ve Değişen Dünya Dengeleri (17-18. Yüzyıl)` | 41 | 6.2% | Tarih 5 (Grade 11) |
| 8 | `5. Beylikten Devlete Osmanlı Siyaseti ve Teşkilatı` | 41 | 6.2% | Tarih 3 (Grade 10) |
| 9 | `3. İslam Medeniyeti ve Türk-İslam Devletleri` | 35 | 5.3% | Tarih 2 & 3 (Grade 9–10) |
| 10 | `4. Türkiye Selçukluları ve Anadolu Beylikleri` | 31 | 4.7% | Tarih 3 (Grade 10) |
| **TOTAL** | **10 Main Topics** | **656** | **100.0%** | |

### 4.2 Granular Subtopic Distribution (`alt_konu`)
Currently, only **13 subtopics** exist across all 656 questions in the master dataset:

| Rank | `alt_konu` | Count | % of Pool | Primary Parent `ana_konu` |
| :---: | :--- | :---: | :---: | :--- |
| 1 | `9.4 Atatürkçülük ve Türk İnkılabı (Siyasi, Hukuki, Eğitsel, Toplumsal, Ekonomik Alanda İnkılaplar)` | 107 | 16.3% | 9. Millî Mücadele |
| 2 | `1.4 Ege, Yunan, Doğu Akdeniz ve Roma Medeniyetleri` | 97 | 14.8% | 1. İlk Çağ Medeniyetleri |
| 3 | `2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları` | 87 | 13.3% | 2. Orta Çağ'da Dünya |
| 4 | `6.3 Osmanlı Toplum Yapısı, Eyalet Yönetimi, Millet Sistemi ve Vakıflar` | 86 | 13.1% | 6. Dünya Gücü Osmanlı |
| 5 | `10.4 Küreselleşen Dünya, İletişim Çağı ve 21. Yüzyılın Eşiğinde Türkiye ve Dünya` | 50 | 7.6% | 10. Çağdaş Türk ve Dünya |
| 6 | `8.1 Uluslararası İlişkilerde Denge Stratejisi (1774-1914) ve Islahatlar` | 50 | 7.6% | 8. En Uzun Yüzyıl |
| 7 | `7.1 17. Yüzyıl Osmanlı Savaşları, Antlaşmaları (Karlofça) ve Celali İsyanları` | 41 | 6.2% | 7. Arayış Yılları |
| 8 | `3.2 Karahanlı, Gazneli ve Büyük Selçuklu Devletleri` | 35 | 5.3% | 3. İslam Medeniyeti |
| 9 | `5.2 Osmanlı Askerî ve İdari Teşkilatı (Tımar & Kapıkulu Sistemleri)` | 31 | 4.7% | 5. Beylikten Devlete |
| 10 | `4.2 Kösedağ Savaşı, Moğol İstilası ve İkinci Anadolu Beylikleri` | 31 | 4.7% | 4. Türkiye Selçukluları |
| 11 | `1.1 Tarih Bilimine Giriş, Yöntem, Kaynaklar ve Takvimler` | 24 | 3.7% | 1. İlk Çağ Medeniyetleri |
| 12 | `5.1 Osmanlı Beyliği Kuruluş Siyaseti, Fetihler ve Siyasi Birlik` | 10 | 1.5% | 5. Beylikten Devlete |
| 13 | `8.3 20. Yüzyıl Başlarında Osmanlı Devleti, Trablusgarp ve Balkan Savaşları` | 7 | 1.1% | 8. En Uzun Yüzyıl |
| **TOTAL** | **13 Subtopics** | **656** | **100.0%** | |

### 4.3 Course vs Subtopic Cross-Tabulation
The cross-tabulation of each course against the 13 subtopics exposes the systemic misclassification problem:

```
Course 131 (TARİH – 1) [82 Q]:
  - 58 Q -> 1.4 Ege, Yunan, Doğu Akdeniz ve Roma Medeniyetleri
  - 15 Q -> 1.1 Tarih Bilimine Giriş, Yöntem, Kaynaklar ve Takvimler
  -  8 Q -> 2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları
  -  1 Q -> 3.2 Karahanlı, Gazneli ve Büyük Selçuklu Devletleri

Course 132 (TARİH – 2) [82 Q]:
  - 44 Q -> 2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları
  - 18 Q -> 3.2 Karahanlı, Gazneli ve Büyük Selçuklu Devletleri
  - 16 Q -> 1.4 Ege, Yunan, Doğu Akdeniz ve Roma Medeniyetleri
  -  4 Q -> 1.1 Tarih Bilimine Giriş, Yöntem, Kaynaklar ve Takvimler

Course 133 (TARİH – 3) [82 Q]:
  - 27 Q -> 4.2 Kösedağ Savaşı, Moğol İstilası ve İkinci Anadolu Beylikleri
  - 14 Q -> 3.2 Karahanlı, Gazneli ve Büyük Selçuklu Devletleri
  - 11 Q -> 5.2 Osmanlı Askerî ve İdari Teşkilatı (Tımar & Kapıkulu Sistemleri)
  -  9 Q -> 6.3 Osmanlı Toplum Yapısı, Eyalet Yönetimi, Millet Sistemi ve Vakıflar
  -  9 Q -> 2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları
  -  8 Q -> 5.1 Osmanlı Beyliği Kuruluş Siyaseti, Fetihler ve Siyasi Birlik
  -  2 Q -> 1.4 Ege, Yunan, Doğu Akdeniz ve Roma Medeniyetleri
  -  1 Q -> 1.1 Tarih Bilimine Giriş
  -  1 Q -> 7.1 17. Yüzyıl Osmanlı Savaşları

Course 134 (TARİH – 4) [82 Q]:
  - 50 Q -> 6.3 Osmanlı Toplum Yapısı, Eyalet Yönetimi, Millet Sistemi ve Vakıflar
  - 10 Q -> 2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları
  -  9 Q -> 5.2 Osmanlı Askerî ve İdari Teşkilatı
  -  5 Q -> 1.4 Ege, Yunan, Doğu Akdeniz ve Roma Medeniyetleri
  -  3 Q -> 4.2 Kösedağ Savaşı, Moğol İstilası
  -  2 Q -> 3.2 Karahanlı, Gazneli
  -  2 Q -> 5.1 Osmanlı Beyliği Kuruluş Siyaseti
  -  1 Q -> 1.1 Tarih Bilimine Giriş

Course 137 (TARİH – 5) [82 Q]:
  - 36 Q -> 7.1 17. Yüzyıl Osmanlı Savaşları, Antlaşmaları (Karlofça) ve Celali İsyanları
  - 16 Q -> 6.3 Osmanlı Toplum Yapısı, Eyalet Yönetimi, Millet Sistemi ve Vakıflar
  - 10 Q -> 5.2 Osmanlı Askerî ve İdari Teşkilatı
  - 10 Q -> 2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları
  -  5 Q -> 1.4 Ege, Yunan, Doğu Akdeniz ve Roma Medeniyetleri
  -  3 Q -> 1.1 Tarih Bilimine Giriş
  -  1 Q -> 4.2 Kösedağ Savaşı
  -  1 Q -> 8.1 Uluslararası İlişkilerde Denge Stratejisi

Course 138 (TARİH – 6) [82 Q]:
  - 49 Q -> 8.1 Uluslararası İlişkilerde Denge Stratejisi (1774-1914) ve Islahatlar
  - 11 Q -> 6.3 Osmanlı Toplum Yapısı, Eyalet Yönetimi
  - 11 Q -> 1.4 Ege, Yunan, Doğu Akdeniz ve Roma Medeniyetleri
  -  6 Q -> 2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları
  -  4 Q -> 7.1 17. Yüzyıl Osmanlı Savaşları
  -  1 Q -> 5.2 Osmanlı Askerî ve İdari Teşkilatı

Course 141 (İNKILAP – 1) [82 Q]:
  - 70 Q -> 9.4 Atatürkçülük ve Türk İnkılabı
  -  6 Q -> 10.4 Küreselleşen Dünya
  -  6 Q -> 8.3 20. Yüzyıl Başlarında Osmanlı Devleti, Trablusgarp ve Balkan Savaşları

Course 142 (İNKILAP – 2) [82 Q]:
  - 44 Q -> 10.4 Küreselleşen Dünya
  - 37 Q -> 9.4 Atatürkçülük ve Türk İnkılabı
  -  1 Q -> 8.3 20. Yüzyıl Başlarında Osmanlı Devleti
```

---

## 5. Fallback & Catch-All Misclassification Audit

### 5.1 The "Pseudo-Catch-All" Dustbin Pathology
While the codebase strict check `merge_all_courses.py` forbids literal `"Genel"` and `"Diğer"` labels, automated keyword scripts circumvented this check by creating monolithic fallback buckets:
- Top 5 subtopics contain **427 out of 656 questions (65.1%)**.
- **107 questions** in `9.4 Atatürkçülük ve Türk İnkılabı`
- **97 questions** in `1.4 Ege, Yunan, Doğu Akdeniz ve Roma Medeniyetleri`
- **87 questions** in `2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları`
- **86 questions** in `6.3 Osmanlı Toplum Yapısı, Eyalet Yönetimi, Millet Sistemi ve Vakıflar`
- **50 questions** in `10.4 Küreselleşen Dünya, İletişim Çağı...`

### 5.2 Forensic Breakdown of 5 Specific Systemic Pathologies

#### Pathology 1: Cross-Epoch Contamination in Tarih 6 (Dağılma Dönemi)
Tarih 6 covers the 19th and early 20th century Ottoman Empire (1789–1914). However, **17 questions** in Tarih 6 were misclassified into Ancient History or European Feudalism because of superficial keywords ("Yunan", "Rum", "Mısır"):
- **ID 1124 (`TARİH – 6`):** Question asks about the **Halepa Fermanı (1878)** giving privileges to **Girit Rumları**. Classified as `2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları`.
- **ID 1132 (`TARİH – 6`):** Question asks about Albania gaining independence during the **1912–1913 Balkan Wars**. Classified as `1.4 Ege, Yunan, Doğu Akdeniz ve Roma Medeniyetleri` (Ancient Greek/Roman history!).
- **ID 2642 (`TARİH – 6`):** Question asks about the migration of Turkish populations during the **93 Harbi (1877–1878)** due to Russian and Bulgarian massacres. Classified as `2.1 Orta Çağ Feodalite`.
- **ID 2644 (`TARİH – 6`):** Question asks about Russia triggering the **Kırım Savaşı (1853–1856)** using the **Kutsal Yerler Sorunu (Holy Places Issue)**. Classified as `1.4 Ege, Yunan, Roma Medeniyetleri`.
- **ID 5437 (`TARİH – 6`):** Question asks about **Napoleon's invasion of Ottoman Egypt in 1798**. Classified as `1.4 Ege, Yunan, Roma Medeniyetleri`.
- **ID 5438 (`TARİH – 6`):** Question asks about the **Mora İsyanı** and Ottoman appeal to **Kavalalı Mehmet Ali Paşa**. Classified as `1.4 Ege, Yunan, Roma Medeniyetleri`.
- **ID 10917 (`TARİH – 6`):** Question asks about the **Hünkar İskelesi Antlaşması (1833)** and the Straits Question. Classified as `1.4 Ege, Yunan, Roma Medeniyetleri`.
- **ID 10923 (`TARİH – 6`):** Question asks about the events following the declaration of the **II. Meşrutiyet (1908)** and the **31 Mart Vakası (1909)**. Classified as `1.4 Ege, Yunan, Roma Medeniyetleri`.

#### Pathology 2: Complete Eradication of Central Asian Turkish History (Tarih 2)
In the MEB curriculum, Tarih 2 focuses centrally on **"İlk ve Orta Çağlarda Türk Dünyası"** (Asya Hun, I. ve II. Kök Türk, Uygurlar, Orhun Yazıtları, Boy Teşkilatı, Kurultay, Kut Anlayışı).
- In the current dataset, **not a single subtopic exists** for Central Asian Turkish History!
- Consequently, **44 questions in Tarih 2** were dumped into `2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları`:
  - **ID 56 (`TARİH – 2`):** *"Kök Türklere ait Orhun Kitabeleri’nde 'Tanrı gibi gökte olmuş Türk Bilge Kağan’ı, bu zamanda oturdum...' ifadesi hangisini kanıtlar?"* (Concept of Kut). Classified as Feodalite.
  - **ID 57 (`TARİH – 2`):** Central Asian Turkish migrations political causes. Classified as Feodalite.
  - **ID 58 (`TARİH – 2`):** Onlu Teşkilat / Mete Han army system. Classified as Feodalite.
  - **ID 59 (`TARİH – 2`):** Kök Türk founder Bumin Kağan. Classified as Feodalite.

#### Pathology 3: Monolithic Compression of the National Struggle (İnkılap Tarihi 1)
In İnkılap Tarihi 1, **70 out of 82 questions (85.4%)** were stamped with `9.4 Atatürkçülük ve Türk İnkılabı`:
- **ID 595 (`İNKILAP – 1`):** *"Birinci Dünya Savaşı’nda taraf değiştirerek İtilaf Devletleri grubuna katılan devlet hangisidir?"* (Italy in WW1). Classified as Atatürk İnkılapları!
- **ID 596 (`İNKILAP – 1`):** Mustafa Kemal's schooling cities (Selanik, Manastır, İstanbul). Classified as Atatürk İnkılapları!
- Subtopics for **I. Dünya Savaşı ve Cepheler**, **Mondros ve Cemiyetler**, **Kongreler Dönemi (Amasya, Erzurum, Sivas)**, **I. TBMM**, **Kurtuluş Savaşı Muharebeleri (İnönü, Sakarya, Büyük Taarruz)**, and **Mudanya & Lozan** are completely absent, squashed under 9.4.

#### Pathology 4: Interwar & Totalitarian Regimes Dumped into 21st Century
- Questions addressing the 1929 Great Depression, Mussolini's Fascism in Italy (**ID 604**), and Atatürk era domestic economic measures (**ID 602**, Tasarruf ve Yerli Malı Haftası) are classified as `10.4 Küreselleşen Dünya, İletişim Çağı ve 21. Yüzyılın Eşiğinde Türkiye ve Dünya` (a topic intended for post-1990 global developments).

#### Pathology 5: Flattening of the Ancient World (Tarih 1)
- In Tarih 1, **58 out of 82 questions** were dumped into `1.4 Ege, Yunan, Doğu Akdeniz ve Roma Medeniyetleri`.
- Questions covering **Mezopotamya uygarlıkları** (Sümerler, Babiller, Asurlar), **Mısır** (Hiyeroglif, Papirüs, Firavunlar), and **Anadolu uygarlıkları** (Hititler, Frigler, Lidyalılar, Urartular) were all forced into 1.4 because no distinct subtopics existed for them.

---

## 6. Controlled 60-Question Batch Partitioning Plan

### 6.1 Partition Mathematics
- **Total Questions:** 656
- **Batch Size:** 60 questions
- **Calculation:** `656 / 60 = 10 full batches of 60 questions + 1 final batch of 56 questions = 11 batches`.

### 6.2 Comparison of Partitioning Strategies

| Feature | Strategy A: Curriculum-Chronological Order (Recommended) | Strategy B: Source Index / Array Order |
| :--- | :--- | :--- |
| **Ordering Key** | `(ders_kodu, yil, donem, soru_no)` | Array index in `tum_analizli_sorular_temiz.json` |
| **Pedagogical Coherence** | **High:** Each batch focuses on 1–2 sequential historical eras | **Low / Chaotic:** Each batch mixes 6–7 different centuries |
| **Cognitive Load on LLM** | **Minimal:** LLM auditor evaluates consistent topic taxonomies | **Severe:** LLM jumps from 2000 BC to 1945 AD repeatedly |
| **Misclassification Detection** | **Instant:** Obvious outlier questions stand out immediately | **Difficult:** Noise masks boundary errors |
| **Traceability to Source** | **100%:** Exact mapping via question `id` | **100%:** Exact mapping via array slice |

### 6.3 Comprehensive 11-Batch Audit Schedule (Strategy A: Curriculum-Aligned)

| Batch | Question Count | Primary Courses Covered | ID Range Sample | Historical Era & Curriculum Scope | Audit & Reclassification Focus |
| :---: | :---: | :--- | :---: | :--- | :--- |
| **B01** | 60 | **131: TARİH – 1** (Q1–Q60) | `562` .. `7694` | Tarih ve Zaman, Tarih Bilimi, İlk Çağ Medeniyetleri (Mezopotamya, Anadolu, Mısır) | Disentangle Mezopotamya and Anadolu from Ege/Roma; verify calendar and archaeology stems. |
| **B02** | 60 | **131: TARİH – 1** (Q61–Q82, 22Q)<br>**132: TARİH – 2** (Q1–Q38, 38Q) | `7695` .. `4472` | İlk Çağ Medeniyetleri Sonu + İlk ve Orta Çağlarda Türk Dünyası (Hunlar, Kök Türkler) | **Critical:** Extract Kök Türk, Kut, Orhun Kitabeleri questions out of European Feodalite! |
| **B03** | 60 | **132: TARİH – 2** (Q39–Q82, 44Q)<br>**133: TARİH – 3** (Q1–Q16, 16Q) | `4473` .. `2623` | Türk Dünyası Teşkilatı, İslam Medeniyeti (Dört Halife, Emevi, Abbasi), İlk Türk-İslam | Align İslam Medeniyeti and early Türk-İslam (Karahanlı, Gazneli, Büyük Selçuklu). |
| **B04** | 60 | **133: TARİH – 3** (Q17–Q76, 60Q) | `2624` .. `10900` | Türkiye Selçukluları, Anadolu Beylikleri, Beylikten Devlete Osmanlı Kuruluş Siyaseti | Differentiate Anadolu Selçuklu / Moğol İstilası from early Ottoman beylik expansion. |
| **B05** | 60 | **133: TARİH – 3** (Q77–Q82, 6Q)<br>**134: TARİH – 4** (Q1–Q54, 54Q) | `10901` .. `8168` | Osmanlı Kuruluş Sonu, İstanbul'un Fethi, Dünya Gücü Osmanlı (Fatih, Yavuz, Kanuni) | Establish granular subtopics for Klasik Dönem Osmanlı Siyaseti and Kültür/Medeniyet. |
| **B06** | 60 | **134: TARİH – 4** (Q55–Q82, 28Q)<br>**137: TARİH – 5** (Q1–Q32, 32Q) | `8169` .. `3576` | Klasik Dönem Teşkilatı, Değişen Dünya Dengeleri (17. Yüzyıl Osmanlı, Karlofça) | Separate 16th c. maritime/European wars from 17th c. Celali İsyanları & Karlofça. |
| **B07** | 60 | **137: TARİH – 5** (Q33–Q82, 50Q)<br>**138: TARİH – 6** (Q1–Q10, 10Q) | `4947` .. `1132` | 17-18. Yüzyıl Arayış Yılları, Lale Devri, Islahatlar, Dağılma Dönemi Giriş | Delineate 18th c. diplomacy (Pasarofça, Küçük Kaynarca) from 19th c. Tanzimat. |
| **B08** | 60 | **138: TARİH – 6** (Q11–Q70, 60Q) | `1133` .. `9554` | En Uzun Yüzyıl (19. Yüzyıl Osmanlı: Tanzimat, Islahat, Kırım Savaşı, 93 Harbi, Meşrutiyet) | **Major Audit:** Rescue 17 questions misclassified into Ancient Greek/Roma or Feodalite! |
| **B09** | 60 | **138: TARİH – 6** (Q71–Q82, 12Q)<br>**141: İNKILAP – 1** (Q1–Q48, 48Q) | `9555` .. `6342` | 20. Yy Başı (Trablusgarp, Balkan Savaşları), I. Dünya Savaşı, Millî Mücadele Hazırlık | Reclassify WW1 and Kongreler questions away from blanket Atatürk İnkılapları. |
| **B10** | 60 | **141: İNKILAP – 1** (Q49–Q82, 34Q)<br>**142: İNKILAP – 2** (Q1–Q26, 26Q) | `6343` .. `4070` | Kurtuluş Savaşı Muharebeleri (İnönü, Sakarya), Lozan, Siyasal/Hukuki İnkılaplar | Reclassify Batı Cephesi and Lozan treaties; isolate Atatürk İlkeleri & İnkılapları. |
| **B11** | 56 | **142: İNKILAP – 2** (Q27–Q82, 56Q) | `4071` .. `10936` | Atatürk Dış Politikası (Hatay, Montrö), II. Dünya Savaşı, Soğuk Savaş, Çağdaş Dünya | Distinguish Interwar totalitarian regimes from Cold War & modern 21st c. developments. |
| **TOTAL** | **656** | **8 Courses** | `56` .. `10936` | **Complete Historical Span: Prehistory to 21st Century** | **100% Comprehensive Audit** |

### 6.4 Direct Array Index Partitioning (Strategy B Reference)
For direct memory or array-slice manipulation of `tum_analizli_sorular_temiz.json`:
- **Batch 1:** Array indices `0..59` (IDs 56 to 1116)
- **Batch 2:** Array indices `60..119` (IDs 1117 to 2111)
- **Batch 3:** Array indices `120..179` (IDs 2112 to 3090)
- **Batch 4:** Array indices `180..239` (IDs 3091 to 4060)
- **Batch 5:** Array indices `240..299` (IDs 4061 to 5420)
- **Batch 6:** Array indices `300..359` (IDs 5421 to 6330)
- **Batch 7:** Array indices `360..419` (IDs 6331 to 7230)
- **Batch 8:** Array indices `420..479` (IDs 7231 to 8180)
- **Batch 9:** Array indices `480..539` (IDs 8181 to 9530)
- **Batch 10:** Array indices `540..599` (IDs 9531 to 10440)
- **Batch 11:** Array indices `600..655` (IDs 10441 to 10936) [56 questions]

---

## 7. Recommendations for the Reclassification Engine

1. **Establish a Formal MEB History Taxonomy (`scripts/tarih_taxonomy_map.json`):**
   Following the pattern of `scripts/tde_taxonomy_map.json`, create a strict JSON hierarchy covering all 8 courses with ~30 to 40 canonical subtopics. Crucially, add:
   - `İlk ve Orta Çağlarda Türk Dünyası` (Hun, Kök Türk, Uygur, Devlet Teşkilatı)
   - `Mezopotamya, Anadolu ve Mısır Medeniyetleri` (separated from Ege/Roma)
   - `I. Dünya Savaşı ve Millî Mücadele Hazırlık` (separated from İnkılaplar)
   - `Kurtuluş Savaşı Muharebeleri ve Antlaşmalar`
   - `İki Savaş Arası Dönem ve II. Dünya Savaşı` (separated from 21st c. globalization)
2. **Execute Audit via LLM Reasoning:**
   Never rely solely on regex keywords. As demonstrated in Section 5, keywords like "Mısır" in a 1798 Napoleon question or "Yunan" in a 1912 Balkan War question catastrophically corrupt keyword matchers. The LLM prompt must inspect the pedagogical stem, correct answer, and historical epoch.
3. **Automated Verification:**
   After reclassification of all 11 batches, run `python3 scripts/core/build_webapp.py`, followed by `npm run check` and `npm run build` to verify 0 errors before production deployment.
