# 🏛️ Milestone 1 Specification Mining Report: MEB AÖL Tarih Taxonomy & Validation Engine

**Agent:** `teamwork_preview_spec_miner_m1_1` (Milestone 1 Spec Miner)  
**Date:** 2026-10-07  
**Working Directory:** `/home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_spec_miner_m1_1/`  
**Milestone:** M1 — Taxonomy Definition & Validation Engine  
**Target Files:**
1. `scripts/tarih_taxonomy_map.json`
2. `scripts/validate_tarih_taxonomy.py`

---

## 1. Executive Summary

This report defines the complete, authoritative specification and implementation contract for Milestone 1.

### Primary Objectives:
1. Mine the canonical MEB AÖL Tarih curriculum hierarchy to construct **`scripts/tarih_taxonomy_map.json`** (mirroring the established design pattern of `scripts/tde_taxonomy_map.json`). It encompasses exactly **10 Units** and **45 Subtopics**, covering the full continuum of Turkish and World History across all 8 compulsory high school semesters (Grades 9 through 12).
2. Specify the strict validation engine **`scripts/validate_tarih_taxonomy.py`**. The engine guarantees **zero fallback catch-all misclassifications**, enforces **pedagogical course boundary constraints**, validates taxonomy map schema, provides reusable dataclasses, offers comprehensive CLI options, and outputs actionable diagnostic reports with standardized exit codes (`0`, `1`, `2`).
3. Define an exact, unambiguous Worker Contract for the implementation phase, ensuring 100% testability, architectural compliance with `AGENTS.md`, and seamless integration into the upcoming Milestone 2 (60-by-60 Batch Reclassification).

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Taxonomy Map | 10-Unit Chronological Hierarchy | Top-level JSON dictionary containing 10 numbered units covering Ancient History to the 21st Century | None (static schema) | JSON Object with 10 keys | Schema violation if key count != 10 or keys deviate from pattern `^(?:[1-9]\|10)\. .+$` | Survey 3, TTKB MEB Curriculum, `tum_analizli_sorular_temiz.json` |
| 2 | Taxonomy Map | 45 Distinct MEB Subtopics | Granular subtopics categorized under their parent unit with strict hierarchical numbering `^(?:[1-9]\|10)\.[1-6] .+$` | Parent unit key | Array of string subtopics (min 2 items per unit) | Schema violation if array length < 2 or subtopic prefix mismatches unit number | Survey 3, `tde_taxonomy_map.json` model |
| 3 | Taxonomy Map | Zero Fallback Ban | Absolute prohibition of catch-all labels (`Genel`, `Diğer`, `Saptanamadı`, `Fallback`, `Muhtelif`, `Çeşitli`) | Topic string | Validated string | Validation failure if any forbidden term is present | Survey 1, Survey 2, Survey 3, `SAVED_CLASSIFIER_NOTES.md` |
| 4 | Validator Engine | Map Schema Self-Validation | Validates `scripts/tarih_taxonomy_map.json` against structural rules, key patterns, value array lengths, and prefix consistency | `--check-map-only` or map path | Exit code 0 on valid schema, exit code 1 with error list | Fails with exit code 1 if map is malformed; exit code 2 on missing file / parse error | Survey 3 §6.1, `merge_all_courses.py` pattern |
| 5 | Validator Engine | HistoryClassificationResult Dataclass | Immutable frozen dataclass modeling a single audited question's classification metadata | `id`, `ders`, `ders_kodu`, `ana_konu`, `alt_konu`, optional `gerekce` | Validated dataclass instance | Raises `TaxonomyValidationError` or records `ValidationError` on rule breach | Survey 3 §6.2 |
| 6 | Validator Engine | Strict Course Boundary Verification | Enforces pedagogical bounds per course code (e.g. Tarih 6 cannot contain Ancient Greece; İnkılap 2 cannot contain Seljuk) | Question course code and `ana_konu` | Boolean pass/fail per question | Records `COURSE_BOUND_VIOLATION` error | Survey 2 §5, Survey 3 §5, empirical course audit |
| 7 | Validator Engine | Parent-Child Hierarchy Enforcement | Enforces that every `alt_konu` belongs to its exact declared `ana_konu` in the taxonomy map | Question `ana_konu` and `alt_konu` | Boolean pass/fail | Records `HIERARCHY_MISMATCH` or `UNKNOWN_SUBTOPIC` error | Survey 3 §6.2, `src/shared/topic.ts` |
| 8 | Validator Engine | Batch & Dataset File Validation | Validates any input JSON file (master dataset or single batch file) containing question dictionaries | `--data-path` or `--batch-path` | `ValidationSummary` with counts, error tables, and distribution metrics | Exit code 1 if errors found, exit code 0 if 100% clean | Survey 1, Survey 2 §6, CLI ergonomics |
| 9 | Validator Engine | Single-Bucket Collapse Guard (Entropy Warning) | Diagnostic check warning if any subtopic absorbs > 35% of all questions in a unit when unit has >= 30 questions | Dataset questions | Console warning with subtopic skew details | Logs warning (does not fail validation if all items are structurally valid) | Survey 2 §5.1, Survey 3 §2.2 |
| 10 | Webapp Pipeline Integration | Dual Subject Export (`TAR` and `INK`) | `build_webapp.py` consumes valid questions to regenerate `data/subjects/TAR.json` (492 Q) and `data/subjects/INK.json` (164 Q) | `tum_analizli_sorular_temiz.json` | Webapp subject JSONs & `subjectManifest.json` | `npm run check` fails if manifests or schemas mismatch | `build_webapp.py`, `tests/data.test.ts` |

---

## 3. Edge Cases Discovered

| # | Feature | Input | Observed Behavior | Handling in Specification |
|---|---------|-------|-------------------|---------------------------|
| 1 | Course 132 Cumulative Exam Questions | Questions ID 4467, 4468, 7227, 7228, 8587, 9957 in `TARİH – 2` asking about Ancient Egypt, Mesopotamia, Urartu, Kings Road | MEB Grade 9 semester 2 exams include cumulative review questions from semester 1 (Unit 1: Mezopotamya/Mısır/Anadolu) | `ALLOWED_COURSE_TOPICS[132]` MUST include `1. Tarih Bilimi ve İlk Çağ Medeniyetleri` alongside Units 2 and 3. Prohibiting Unit 1 in 132 would falsely reject legitimate MEB exam questions. |
| 2 | Course 133 Pre-Ottoman & Seljuk Review Questions | Questions ID 8157, 8159, 8161, 9529, 9531 in `TARİH – 3` asking about Pasinler Ovası, Karahanlılar, Kaşgarlı Mahmud, Kutadgu Bilig | Grade 10 semester 1 exams test Büyük Selçuklu and early Türk-İslam states (Unit 3) alongside Anadolu Selçuklu (Unit 4) and Beylikten Devlete (Unit 5) | `ALLOWED_COURSE_TOPICS[133]` MUST include `3. İslam Medeniyeti ve Türk-İslam Devletleri`, `4. Türkiye Selçukluları ve Anadolu Beylikleri`, and `5. Beylikten Devlete Osmanlı Siyaseti ve Teşkilatı`. |
| 3 | Course 134 Early Modern Explorations | Questions ID 1117, 2634 in `TARİH – 4` asking about Magellan, Del Cano, and Coğrafi Keşifler | Klasik Osmanlı era (16th c.) exams contain questions on European maritime discoveries occurring concurrently | `ALLOWED_COURSE_TOPICS[134]` includes `5. Beylikten Devlete...`, `6. Dünya Gücü Osmanlı...`, and `7. Arayış Yılları ve Değişen Dünya Dengeleri (17-18. Yüzyıl)` (which contains 7.4 Keşifler). |
| 4 | Course 137 Transition to 19th Century | Questions ID 2110, 2111 in `TARİH – 5` asking about 1827 Navarin Raid and late 19th c. institutions (Darülaceze) | Grade 11 semester 1 exams conclude with late 18th/early 19th c. transitions | `ALLOWED_COURSE_TOPICS[137]` includes `6. Dünya Gücü Osmanlı...`, `7. Arayış Yılları...`, and `8. En Uzun Yüzyıl...`. |
| 5 | Course 141 Totalitarian Regimes & Interwar Pacts | Questions ID 604, 9086 in `T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 1` asking about Mussolini's Fascism and the 1929 Briand-Kellogg Pact | Exam session #10 questions reach the interwar diplomacy and totalitarian developments | `ALLOWED_COURSE_TOPICS[141]` includes `8. En Uzun Yüzyıl...`, `9. Millî Mücadele ve T.C. İnkılap Tarihi`, and `10. Çağdaş Türk ve Dünya Tarihi`. |
| 6 | Course 138 False Keyword Trap | Questions ID 1124, 1132, 2642, 2643, 2644, 5437 mentioning "Mısır", "Yunan", "Rum", "Girit", "Kırım" | Legacy classifiers assigned them to Unit 1 (Ancient Greece/Egypt) or Unit 2 (European Feudalism). They are 100% 19th c. Ottoman (Unit 8) questions. | Course 138 explicitly FORBIDS Unit 1 and Unit 2. Validator flags any assignment of Course 138 to Units 1..6 as fatal `COURSE_BOUND_VIOLATION`. |
| 7 | Typographical Apostrophe Variance | Single quotes in topics: straight `'` (ASCII 0x27) vs typographic curly `’` (U+2019) | `tde_taxonomy_map.json` uses straight `'` exclusively. In master dataset, Unit 2 uses `"2. Orta Çağ'da Dünya ve Türk Dünyası"`. | Canonical taxonomy map MUST use ASCII straight single quotes (`'`). Validator normalizes or accepts canonical straight single quote strings. |
| 8 | Empty or Generic Gerekçe | Batch processing where `gerekce` is omitted or empty | `gerekce` is valuable documentation during batch audit but must be optional in data dictionaries | In `HistoryClassificationResult`, `gerekce: str = ""` defaults to empty string. |
| 9 | Execution on Pre-Reclassified Master Dataset | Running `validate_tarih_taxonomy.py` on `tum_analizli_sorular_temiz.json` prior to Milestone 2 reclassification | Current dataset still contains collapsed/outdated topics (e.g. 87 Q in 2.1 Feodalite, topics with old naming like 3.2 Karahanlı) | Validator correctly reports these mismatches and exits with code 1. When `--check-map-only` is provided, it validates the map only and exits 0. |

---

## 4. Authoritative Specification: `scripts/tarih_taxonomy_map.json`

### 4.1 Structural Invariants
1. **File Path:** `scripts/tarih_taxonomy_map.json`
2. **Encoding & Formatting:** UTF-8, 2 spaces indentation (`indent=2`), trailing newline (`\n`), no trailing commas.
3. **Root Structure:** Standard JSON object (`{ ... }`) with exactly **10 keys**.
4. **Key Format:** `"<Unit_Number>. <Unit Title>"` where Unit Number is 1 through 10.
5. **Value Format:** Array of non-empty strings. Each string formatted as `"<Unit_Number>.<Sub_Number> <Subtopic Title>"`.
6. **Total Subtopic Count:** Exactly **45 subtopics** across the 10 units.
7. **Punctuation:** Standard ASCII straight apostrophes (`'`).

### 4.2 Exact Verbatim JSON Content

```json
{
  "1. Tarih Bilimi ve İlk Çağ Medeniyetleri": [
    "1.1 Tarih Bilimine Giriş, Yöntem, Kaynaklar ve Takvimler",
    "1.2 İnsanlığın İlk Dönemleri, Tarih Öncesi Çağlar ve Arkeolojik Merkezler",
    "1.3 Mezopotamya ve Mısır Medeniyetleri",
    "1.4 Anadolu Medeniyetleri (Hitit, Frig, Lidya, Urartu, İyon)",
    "1.5 Ege, Yunan, Doğu Akdeniz ve Roma Medeniyetleri"
  ],
  "2. Orta Çağ'da Dünya ve Türk Dünyası": [
    "2.1 Orta Çağ Siyasi ve Sosyal Yapısı, Feodalite ve Ticaret Yolları",
    "2.2 İlk Türk Devletleri ve Orta Asya Bozkır Kültürü (Hunlar ve Diğer Boylar)",
    "2.3 Kök Türkler, Uygurlar ve Türk Devlet Teşkilatı (Kut, Töre, Orhun Yazıtları)"
  ],
  "3. İslam Medeniyeti ve Türk-İslam Devletleri": [
    "3.1 İslamiyet'in Doğuşu, Hz. Muhammed ve Dört Halife Dönemi",
    "3.2 Emeviler, Abbasiler ve İslam Kültür Medeniyeti",
    "3.3 Türklerin İslamiyet'i Kabulü ve İlk Türk-İslam Devletleri (Karahanlı, Gazneli)",
    "3.4 Büyük Selçuklu Devleti, Teşkilatı ve Kültür Medeniyeti"
  ],
  "4. Türkiye Selçukluları ve Anadolu Beylikleri": [
    "4.1 Malazgirt Sonrası Anadolu ve I. Dönem Türk Beylikleri",
    "4.2 Türkiye Selçuklu Devleti Siyaseti ve Haçlı Seferleri",
    "4.3 Kösedağ Savaşı, Moğol İstilası ve II. Dönem Anadolu Beylikleri",
    "4.4 Anadolu Selçuklu Medeniyeti, Ahilik ve Kültürel Hayat"
  ],
  "5. Beylikten Devlete Osmanlı Siyaseti ve Teşkilatı": [
    "5.1 Kuruluş Dönemi Siyaseti ve Balkan Fetihleri (1302-1453)",
    "5.2 Anadolu'da Türk Siyasi Birliği, Ankara Savaşı ve Fetret Devri",
    "5.3 Osmanlı Askerî ve İdari Teşkilatı (Tımar ve Kapıkulu Sistemleri)",
    "5.4 Kuruluş Dönemi Osmanlı Toplumu, Kültürü ve Kurumları"
  ],
  "6. Dünya Gücü Osmanlı ve Osmanlı Medeniyeti": [
    "6.1 Fatih Sultan Mehmed Dönemi ve İstanbul'un Fethi",
    "6.2 II. Bayezid ve Yavuz Sultan Selim Dönemi (Doğu Siyaseti ve Halifelik)",
    "6.3 Kanuni Sultan Süleyman Dönemi, Seferler ve Denizler Hakimiyeti",
    "6.4 Klasik Çağda Osmanlı Devlet Yönetimi, Saray ve Divan Teşkilatı",
    "6.5 Klasik Dönem Osmanlı Toplum Yapısı, Hukuk, Vakıflar ve Şehir Hayatı"
  ],
  "7. Arayış Yılları ve Değişen Dünya Dengeleri (17-18. Yüzyıl)": [
    "7.1 17. Yüzyıl Osmanlı Savaşları ve Antlaşmaları (Habsburglar, Safeviler, Lehistan, Rusya)",
    "7.2 II. Viyana Kuşatması, Kutsal İttifak ve Karlofça Antlaşması",
    "7.3 17. Yüzyıl İç İsyanları ve Islahat Çabaları (Celali İsyanları, Köprülüler)",
    "7.4 Avrupa'daki Gelişmeler (Keşifler, Rönesans, Reform, Aydınlanma, Westphalia)",
    "7.5 18. Yüzyıl Osmanlı Siyaseti ve Antlaşmaları (Kayıpları Telafi, Küçük Kaynarca, Yaş)",
    "7.6 18. Yüzyıl Islahatları, Lale Devri ve Nizam-ı Cedit"
  ],
  "8. En Uzun Yüzyıl (19. ve 20. Yüzyıl Başı Osmanlı)": [
    "8.1 Uluslararası İlişkilerde Denge Stratejisi, Milliyetçilik İsyanları ve Şark Meselesi",
    "8.2 19. Yüzyıl Demokratikleşme Hareketleri ve Islahatlar (Sened-i İttifak'tan Meşrutiyet'e)",
    "8.3 Dağılmayı Önleme Fikir Akımları ve 19. Yüzyıl Kültürel Hayatı",
    "8.4 20. Yüzyıl Başlarında Osmanlı Devleti, Trablusgarp ve Balkan Savaşları"
  ],
  "9. Millî Mücadele ve T.C. İnkılap Tarihi": [
    "9.1 Mustafa Kemal'in Hayatı, I. Dünya Savaşı ve Mondros Ateşkesi",
    "9.2 Millî Mücadele'nin Hazırlık Dönemi, Kongreler ve I. TBMM'nin Açılışı",
    "9.3 Millî Mücadele Muharebeler Dönemi, Antlaşmalar ve Lozan Barış Antlaşması",
    "9.4 Atatürkçülük ve Türk İnkılabı (Siyasal, Hukuki, Eğitsel, Toplumsal, Ekonomik)",
    "9.5 Atatürk İlkeleri ve Bütünleyici İlkeler",
    "9.6 Atatürk Dönemi Türk Dış Politikası (1923-1938)"
  ],
  "10. Çağdaş Türk ve Dünya Tarihi": [
    "10.1 İki Savaş Arası Dönem ve II. Dünya Savaşı (1918-1945)",
    "10.2 Soğuk Savaş Dönemi ve Türkiye (1945-1960)",
    "10.3 Yumuşama (Detant) Dönemi ve Bölgesel Çatışmalar (1960-1990)",
    "10.4 Küreselleşen Dünya, İletişim Çağı ve 21. Yüzyılın Eşiğinde Türkiye ve Dünya"
  ]
}
```

---

## 5. Authoritative Specification: `scripts/validate_tarih_taxonomy.py`

### 5.1 Architecture & Module Interface
- **File Path:** `scripts/validate_tarih_taxonomy.py`
- **Interpreter:** Python 3 (`#!/usr/bin/env python3`, `# -*- coding: utf-8 -*-`)
- **Dependencies:** Standard library only (`argparse`, `dataclasses`, `json`, `sys`, `re`, `pathlib`, `typing`, `collections`).

### 5.2 Dataclasses & Custom Types

```python
from dataclasses import dataclass, field
from typing import Dict, List, Set, Any, Optional

class TaxonomyValidationError(Exception):
    """Raised when taxonomy map or question classification fails validation rules."""
    pass

@dataclass(frozen=True)
class HistoryClassificationResult:
    """Represents a validated or classified history question."""
    id: int
    ders: str
    ders_kodu: int
    ana_konu: str
    alt_konu: str
    gerekce: str = ""

@dataclass
class ValidationError:
    """Detailed error object recorded for any invalid question or mapping."""
    question_id: int
    error_type: str
    message: str
    details: Dict[str, Any] = field(default_factory=dict)

@dataclass
class ValidationSummary:
    """Aggregate statistics and audit report output."""
    total_questions: int = 0
    passed_questions: int = 0
    failed_questions: int = 0
    errors: List[ValidationError] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    topic_distribution: Dict[str, int] = field(default_factory=dict)
    subtopic_distribution: Dict[str, int] = field(default_factory=dict)
    course_distribution: Dict[str, int] = field(default_factory=dict)

    @property
    def is_valid(self) -> bool:
        return len(self.errors) == 0
```

### 5.3 Course Code & Boundary Matrix

```python
# 8 Official MEB AÖL Tarih / İnkılap Courses
VALID_COURSES: Dict[int, str] = {
    131: "TARİH – 1",
    132: "TARİH – 2",
    133: "TARİH – 3",
    134: "TARİH – 4",
    137: "TARİH – 5",
    138: "TARİH – 6",
    141: "T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 1",
    142: "T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 2"
}

# Forbidden Fallback / Dustbin terms (case-insensitive substring match)
FORBIDDEN_FALLBACK_TERMS: Set[str] = {
    "genel", "saptanamadı", "diğer", "fallback", "muhtelif", "çeşitli"
}

# Allowed Pedagogical Course Topics Matrix
ALLOWED_COURSE_TOPICS: Dict[int, Set[str]] = {
    131: {
        "1. Tarih Bilimi ve İlk Çağ Medeniyetleri",
        "2. Orta Çağ'da Dünya ve Türk Dünyası"
    },
    132: {
        "1. Tarih Bilimi ve İlk Çağ Medeniyetleri",
        "2. Orta Çağ'da Dünya ve Türk Dünyası",
        "3. İslam Medeniyeti ve Türk-İslam Devletleri"
    },
    133: {
        "3. İslam Medeniyeti ve Türk-İslam Devletleri",
        "4. Türkiye Selçukluları ve Anadolu Beylikleri",
        "5. Beylikten Devlete Osmanlı Siyaseti ve Teşkilatı"
    },
    134: {
        "5. Beylikten Devlete Osmanlı Siyaseti ve Teşkilatı",
        "6. Dünya Gücü Osmanlı ve Osmanlı Medeniyeti",
        "7. Arayış Yılları ve Değişen Dünya Dengeleri (17-18. Yüzyıl)"
    },
    137: {
        "6. Dünya Gücü Osmanlı ve Osmanlı Medeniyeti",
        "7. Arayış Yılları ve Değişen Dünya Dengeleri (17-18. Yüzyıl)",
        "8. En Uzun Yüzyıl (19. ve 20. Yüzyıl Başı Osmanlı)"
    },
    138: {
        "7. Arayış Yılları ve Değişen Dünya Dengeleri (17-18. Yüzyıl)",
        "8. En Uzun Yüzyıl (19. ve 20. Yüzyıl Başı Osmanlı)"
    },
    141: {
        "8. En Uzun Yüzyıl (19. ve 20. Yüzyıl Başı Osmanlı)",
        "9. Millî Mücadele ve T.C. İnkılap Tarihi",
        "10. Çağdaş Türk ve Dünya Tarihi"
    },
    142: {
        "9. Millî Mücadele ve T.C. İnkılap Tarihi",
        "10. Çağdaş Türk ve Dünya Tarihi"
    }
}
```

### 5.4 Class Structure & Methods

```python
class HistoryTaxonomyValidator:
    def __init__(self, map_path: str = "scripts/tarih_taxonomy_map.json"):
        ...
    def validate_taxonomy_map(self) -> List[str]:
        """Validates structure, types, formatting, sequential order, and zero fallback terms in map file."""
        ...
    def validate_classification(self, result: HistoryClassificationResult, strict_bounds: bool = True) -> List[str]:
        """Validates a single HistoryClassificationResult instance. Returns list of error messages."""
        ...
    def validate_question_dict(self, q: Dict[str, Any], strict_bounds: bool = True) -> List[str]:
        """Extracts fields and validates raw dictionary representation of a question."""
        ...
    def validate_questions(self, questions: List[Dict[str, Any]], strict_bounds: bool = True) -> ValidationSummary:
        """Validates a list of questions, compiles errors, distributions, and entropy warnings."""
        ...
    def print_summary(self, summary: ValidationSummary, verbose: bool = False, quiet: bool = False) -> None:
        """Prints formatted console report with emoji banners and breakdown tables."""
        ...
```

### 5.5 CLI Interface & Exit Codes

```
usage: validate_tarih_taxonomy.py [-h] [--map-path MAP_PATH]
                                  [--data-path DATA_PATH]
                                  [--batch-path BATCH_PATH]
                                  [--check-map-only]
                                  [--lenient-bounds]
                                  [--verbose] [--quiet]

Validate AÖL Tarih curriculum taxonomy map and question classifications.

options:
  -h, --help            show this help message and exit
  --map-path MAP_PATH, -m MAP_PATH
                        Path to tarih_taxonomy_map.json (default: scripts/tarih_taxonomy_map.json)
  --data-path DATA_PATH, -d DATA_PATH
                        Path to questions master JSON (default: scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json)
  --batch-path BATCH_PATH, -b BATCH_PATH
                        Path to a specific batch JSON file to validate
  --check-map-only      Validate taxonomy map schema only and exit
  --lenient-bounds      Disable strict pedagogical course boundary checks
  --verbose, -v         Print full error details and per-course distributions
  --quiet, -q           Minimal output (errors and final summary only)
```

#### Exit Codes:
- `0`: Validation passed cleanly with 0 errors.
- `1`: One or more validation errors found (invalid schema, nonexistent topic, forbidden fallback term, course boundary violation, missing field).
- `2`: Fatal execution error (file not found, invalid JSON syntax, unhandled CLI arguments).

---

## 6. Worker Implementation Contract (Milestone 1)

The Worker assigned to Milestone 1 must adhere strictly to the following contract:

### 6.1 Artifact Deliverables
1. **`scripts/tarih_taxonomy_map.json`**:
   - Must match the exact 10 keys and 45 subtopics in Section 4.2 verbatim.
   - Indentation: 2 spaces. Encoding: UTF-8. No trailing commas. Trailing newline at EOF.
2. **`scripts/validate_tarih_taxonomy.py`**:
   - Must contain the dataclasses (`HistoryClassificationResult`, `ValidationError`, `ValidationSummary`).
   - Must implement `HistoryTaxonomyValidator` with all methods in Section 5.4.
   - Must implement full CLI support conforming to Section 5.5.
   - Must return exit code `0` when running `python3 scripts/validate_tarih_taxonomy.py --check-map-only`.
   - File length rule: Must remain within clean, maintainable boundaries (< 350 lines).

### 6.2 Acceptance Checklist for Worker
- [ ] `scripts/tarih_taxonomy_map.json` created and valid JSON.
- [ ] Exactly 10 main topics, exactly 45 subtopics.
- [ ] No occurrences of `"Genel"`, `"Diğer"`, `"Saptanamadı"`, or `"fallback"`.
- [ ] `python3 scripts/validate_tarih_taxonomy.py --check-map-only` executes and exits with code `0`.
- [ ] Running validator with synthetic test invalid question (e.g. course 138 with Ancient Greece) exits with code `1` and descriptive error.
- [ ] `npm run check` continues to pass 100% (0 errors, 29 tests pass).

---

## 7. Verification Methods for Reviewer

Run the following commands to verify Worker's output:
```bash
# 1. Verify JSON validity and schema of taxonomy map
python3 -c "
import json
with open('scripts/tarih_taxonomy_map.json', 'r', encoding='utf-8') as f:
    m = json.load(f)
assert len(m) == 10, f'Expected 10 units, got {len(m)}'
subs = sum(len(v) for v in m.values())
assert subs == 45, f'Expected 45 subtopics, got {subs}'
print('Taxonomy map JSON verification PASSED: 10 units, 45 subtopics.')
"

# 2. Run validator in self-check mode
python3 scripts/validate_tarih_taxonomy.py --check-map-only
# Expected exit code: 0

# 3. Verify validator importability and unit behavior
python3 -c "
from scripts.validate_tarih_taxonomy import HistoryTaxonomyValidator, HistoryClassificationResult

v = HistoryTaxonomyValidator('scripts/tarih_taxonomy_map.json')
# Valid test
res_valid = HistoryClassificationResult(
    id=1132,
    ders='TARİH – 6',
    ders_kodu=138,
    ana_konu='8. En Uzun Yüzyıl (19. ve 20. Yüzyıl Başı Osmanlı)',
    alt_konu='8.4 20. Yüzyıl Başlarında Osmanlı Devleti, Trablusgarp ve Balkan Savaşları',
    gerekce='1912 Balkan Savaşları'
)
errors = v.validate_classification(res_valid)
assert len(errors) == 0, f'Unexpected errors: {errors}'

# Invalid test: Fallback / Course violation
res_invalid = HistoryClassificationResult(
    id=1132,
    ders='TARİH – 6',
    ders_kodu=138,
    ana_konu='1. Tarih Bilimi ve İlk Çağ Medeniyetleri',
    alt_konu='1.4 Ege, Yunan, Doğu Akdeniz ve Roma Medeniyetleri',
    gerekce='Keyword error'
)
errs = v.validate_classification(res_invalid)
assert len(errs) > 0, 'Validator failed to catch course boundary violation!'
print('Validator class unit verification PASSED.')
"

# 4. Verify existing repo integrity
npm run check
```
