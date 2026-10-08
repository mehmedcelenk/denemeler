# Codebase Survey & Architecture Investigation Report

**Agent**: `teamwork_preview_explorer_survey_1` (Explorer 1)  
**Date**: 2026-10-06  
**Scope**: Data Pipeline, Build Scripts, Verification Suite, Architecture Rules, and Surge Deployment  
**Repository**: `/home/mehmedbaykan/Homepage/codes/ortaklar`

---

## 1. Executive Summary

This investigation surveys the build pipeline, data processing scripts, testing and verification suites, architectural invariants, and deployment infrastructure for the **AÖL Dijital Sınav Kitapçığı** web application.

Key findings include:
1. **Data Pipeline**: The central build script is `scripts/core/build_webapp.py` (invoked via `npm run data:build`). It ingests `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json` (4,716 questions across 12 subjects) and generates subject bundles in `data/subjects/` as well as metadata in `src/data/generated/`.
   - **Crucial Path Note**: The user request and dispatch prompt informally reference `data/subjects/TARİH.json`. In reality, the codebase uses subject IDs: History questions are written to **`data/subjects/TAR.json`** (492 questions across Tarih 1–6) and **`data/subjects/INK.json`** (164 questions across İnkılap Tarihi 1–2). Total History-related questions: **656 questions**.
   - The current data contains significant fallback clustering (e.g., 97 questions under "1.4 Ege, Yunan...", 107 questions under "9.4 Atatürkçülük..."), confirming the necessity of R2's 60-by-60 batch reclassification.
2. **Verification Suite**:
   - `npm run check`: Fully operational and passes 100% (29 tests pass, 0 errors). It runs ESLint, TypeScript (`tsc --noEmit`), an AST-based architectural linter (`scripts/check-architecture.js`), and Node.js unit/integration tests (`tests/*.test.ts`).
   - `npm run build`: Executes `npm run check` followed by `vite build`, bundling static assets and copying `data/`, `audio/`, and `CNAME` into `dist/`.
   - `npm run test:e2e`: Runs Playwright browser tests. In sandboxed runner execution, it failed due to loopback socket restrictions (`ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/`).
3. **Architecture Rules**: Strict layering enforced by AST checks and `AGENTS.md`. Python scripts may **only** touch `data/subjects/` and `src/data/generated/`, never UI code. `src/shared/` must remain pure (no DOM/window/storage references). 350-line file limit on source files.
4. **Surge Deployment**: Root `CNAME` contains `ortaklar-test.surge.sh`. `vite.config.js` automatically copies `CNAME` to `dist/CNAME`. Deploying is performed via `npx surge dist ortaklar-test.surge.sh`.

---

## 2. Data Pipeline Analysis (`scripts/core/build_webapp.py`)

### 2.1 Ingestion and Source Files
- **Primary Source File**: `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json`
  - Total records: **4,716** questions across 12 compulsory branches (58 individual course levels).
  - Schema per item:
    ```json
    {
      "id": 56,
      "ders": "TARİH – 2",
      "ders_kodu": 132,
      "yil": "2023-2024",
      "donem": "1",
      "soru_no": 1,
      "soru_temiz": "...",
      "secenekler_temiz": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "dogru_cevap": "C",
      "ana_konu": "2. Orta Çağ'da Dünya ve Türk Dünyası",
      "alt_konu": "2.1 Orta Çağ Siyasi Yapısı, Feodalite ve Ticaret Yolları"
    }
    ```
- **Optional Auxiliary Imports**:
  - `topic_hints_data.py` (falls back to `lambda q: ""` if missing)
  - `meb_traps_data.py` (falls back to `{}` if missing)
  - `meb_vocab_data.py` (falls back to `{}` if missing)
- **Preservation of Existing Extra Fields**:
  - `build_webapp.py` inspects any already-existing files in `data/subjects/*.json`.
  - If existing items have fields `soru`, `soru_tr`, `soru_ar`, or `soru_xray`, these extra fields are extracted and merged back into `cleaned_list` by question `id`.

### 2.2 Transformations
For each question `q` in `tum_analizli_sorular_temiz.json`:
1. **Dynamic Exam Question Count (`sinav_soru_sayisi`)**:
   - Counted dynamically per `(yil, str(donem), ders)` grouping. Typically 10 or 11 questions per exam session.
2. **Official MEB Course Credit (`kredi`)**:
   - Looked up in `COURSE_CREDITS` dictionary:
     - `MATEMATİK`: 6
     - `TÜRK DİLİ` / `EDEBİYAT`: 5
     - `İNGİLİZCE`: 4
     - `SAĞLIK`: 1
     - `TARİH`: 2
     - `İNKILAP`: 2
     - `COĞRAFYA`: 2, `FELSEFE`: 2, `FİZİK`: 2, `KİMYA`: 2, `BİYOLOJİ`: 2, `DİN KÜLTÜRÜ`: 2
     - Default: 2
3. **Question Point Value (`puan`)**:
   - `puan = round(kredi / sinav_soru_sayisi, 2)`
4. **Visual Question Detection (`sekilli`)**:
   - Evaluated using regex patterns against stem (`soru_temiz` or `soru`).
   - Positive indicators: `\bşekildeki\b`, `\bşekle göre\b`, `\bharitada\b`, `\bgrafikte\b`, `\bgörselde\b`, `\bkroki\b`, `\bdevre şeması\b`, etc.
   - Exclusion patterns: `\bgeometrik şekle\b`, `\bne şekilde\b`, `\bbir şekilde\b`, `Vinland Haritası`.
5. **Hint Generation (`ipucu`)**:
   - Evaluated via `get_hint_for_question(q)`.
6. **Key Normalization**:
   - `soru = q['soru_temiz']`
   - `secenekler = q['secenekler_temiz']`
   - `donem = str(q['donem'])`

### 2.3 Subject Filtering & File Generation
The function `subject_id_for_course(course_name)` maps course strings to standard subject IDs:
| Course Name Matching | Subject ID | Output File | Question Count | Course Count |
|---|---|---|---|---|
| `'COĞRAFYA'` | `COG` | `data/subjects/COG.json` | 328 | 4 |
| `'TÜRK DİLİ'` or `'EDEBİYAT'` | `TDE` | `data/subjects/TDE.json` | 656 | 8 |
| `'MATEMATİK'` | `MAT` | `data/subjects/MAT.json` | 328 | 4 |
| `'İNKILAP'` | `INK` | `data/subjects/INK.json` | 164 | 2 |
| `'TARİH'` (excluding İnkılap) | `TAR` | `data/subjects/TAR.json` | 492 | 6 |
| `'KİMYA'` | `KIM` | `data/subjects/KIM.json` | 328 | 4 |
| `'FİZİK'` | `FIZ` | `data/subjects/FIZ.json` | 328 | 4 |
| `'BİYOLOJİ'` | `BIO` | `data/subjects/BIO.json` | 328 | 4 |
| `'FELSEFE'` | `FEL` | `data/subjects/FEL.json` | 328 | 4 |
| `'DİN KÜLTÜRÜ'` | `DIN` | `data/subjects/DIN.json` | 616 | 8 |
| `'SAĞLIK'` | `SAG` | `data/subjects/SAG.json` | 164 | 2 |
| `'İNGİLİZCE'` | `ING` | `data/subjects/ING.json` | 656 | 8 |
| **Total** | | | **4,716** | **58** |

**Output Files Written**:
1. `data/subjects/{subject_id}.json` (minified JSON with `separators=(',', ':')`)
2. `src/data/generated/subjectManifest.json` (maps subject_id to `questionCount` and `courseCount`)
3. `src/data/generated/MEB_TRAPS_DICT.json`
4. `src/data/generated/MEB_VOCAB_DICT.json`

### 2.4 Breakdown of History & İnkılap Questions
- **TAR (Tarih 1–6)**:
  - `TARİH – 1`: 82 questions
  - `TARİH – 2`: 82 questions
  - `TARİH – 3`: 82 questions
  - `TARİH – 4`: 82 questions
  - `TARİH – 5`: 82 questions
  - `TARİH – 6`: 82 questions
  - **Subtotal**: **492** questions
- **INK (T.C. İnkılap Tarihi ve Atatürkçülük 1–2)**:
  - `T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 1`: 82 questions
  - `T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 2`: 82 questions
  - **Subtotal**: **164** questions
- **Grand Total for History Domain**: **656** questions.
  - Matches the figure in `scripts/ciktilar/analiz/TARIH_ORTAK_KONULAR_RAPORU.md`.

---

## 3. Verification Commands & Test Suites

The repository specifies verification commands in `package.json`:

```json
{
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "npm run check && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "lint": "eslint src scripts/check-architecture.js *.config.js tests/browser",
    "check": "npm run lint && npm run typecheck && node scripts/check-architecture.js && node --import tsx --test tests/*.test.ts",
    "data:build": "python3 scripts/core/build_webapp.py",
    "typecheck": "tsc --noEmit",
    "test:e2e": "playwright test"
  }
}
```

### 3.1 `npm run check` (Comprehensive Code & Data Check)
Runs 4 distinct check phases:

1. **`npm run lint`**:
   - Executes ESLint on `src`, `scripts/check-architecture.js`, config files, and browser tests.
   - Ensures no undefined variables, invalid syntax, or formatting issues.
2. **`npm run typecheck`**:
   - Runs `tsc --noEmit` under strict TypeScript mode (`typescript: 5.9`).
   - Validates all TypeScript types across `src/` and `tests/`.
3. **`node scripts/check-architecture.js`**:
   - Parses all JS/TS/CSS files in `src/` into TypeScript ASTs and builds a dependency graph.
   - **Enforced Errors (Build Failure)**:
     - Circular imports (`döngüsel bağımlılık`).
     - Missing relative imports.
     - Purity of `src/shared/`: No references to `window`, `document`, `localStorage`, or `sessionStorage`.
     - Layer boundaries: `shared` cannot import `features` or `app`; `data` cannot import `features`.
     - Shell hygiene: `index.html` cannot contain inline `<style>` or non-src `<script>` tags.
   - **Monitored Warnings**:
     - Files exceeding 350 lines.
     - Feature cross-coupling (e.g. `library` directly referencing `booklet`).
     - More than 8 direct dependencies per module.
     - Global namespace polluting: > 20 functions attached to `window` in `src/app/events.js`.
4. **`node --import tsx --test tests/*.test.ts` (Node Test Runner)**:
   - 29 tests execute synchronously via Node's native test runner (`node:test`).
   - **`tests/data.test.ts`**:
     - Iterates over all files in `data/subjects/*.json`.
     - Verifies each file against `src/data/generated/subjectManifest.json`: `questions.length === manifest[id].questionCount` and `unique courses === manifest[id].courseCount`.
     - Verifies global ID uniqueness: every question across all subjects must have a unique numeric ID.
     - Tests rejection of invalid data contracts via `parseQuestions()` in `src/data/question.ts` (invalid options, invalid correct answers, non-finite points, duplicate IDs).
     - Validates Turkish search normalization (`trNormalize`) and `questionMatchesSearch`.
   - **`tests/pipeline.test.ts`**:
     - Spawns `python3 scripts/core/build_webapp.py` in a temporary directory sandbox.
     - Verifies exit code is 0.
     - Invariant assertion: Python build does NOT modify UI source files (`index.html`, `src/main.js`).
     - Verifies manifest question counts are positive.
   - **Feature Tests**:
     - `tests/calculator.test.ts`: 4-op arithmetic, division by zero, square root, percent, undo.
     - `tests/confidence-streak.test.ts`: Streak scoring, rematch bucket assignment.
     - `tests/library.test.ts`: Starred questions, rematch basket, game mode filtering.
     - `tests/math-features.test.ts`: KaTeX formula rendering, formula retrieval, difficulty ranking.
     - `tests/regressions.test.ts`: Corrupt localStorage recovery, topic preservation.
     - `tests/tde-features.test.ts`: MEB author/work dictionaries, sentence X-ray parsing.

### 3.2 `npm run build` (Production Bundling)
- Runs `npm run check` first. If any check fails, build halts immediately.
- Executes `vite build`.
- Bundles `src/main.js` and `src/styles/index.css` into `dist/assets/`.
- In Vite plugin `closeBundle()`:
  - Recursively copies `data/` to `dist/data/` (making all `data/subjects/*.json` available in production).
  - Recursively copies `audio/` to `dist/audio/` (if present).
  - Copies `CNAME` to `dist/CNAME`.
  - Rewrites stylesheet and script asset URLs in `index.html` and writes to `dist/index.html`.

### 3.3 `npm run test:e2e` (Playwright Browser Tests)
- Configured in `playwright.config.js`.
- Spawns preview server `npm run preview -- --port 4173 --strictPort` serving `dist/`.
- Runs tests in `tests/browser/app.spec.js` and `regressions.spec.js`.
- **Sandbox Limitation**: In sandboxed execution environments, loopback port binding/socket connections to port 4173 can be refused (`net::ERR_CONNECTION_REFUSED`). As required by `AGENTS.md` ("Kontrol çalışamıyorsa bunu sonuçta açıkça belirt; çalışmış gibi yazma"), this should be noted: e2e testing requires direct socket access or host execution.

---

## 4. Architecture Rules & Data Flow Governance

### 4.1 Data Flow Lifecycle
```
[MEB Exam PDFs]
       │
       ▼
[scripts/core/batch_parser.py]
       │
       ▼
[scripts/ciktilar/dersler/*.json]
       │
       ▼
[scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json] (Master cleaned questions)
       │
       ▼
[scripts/core/build_webapp.py] (npm run data:build)
       ├──► data/subjects/{COG, TDE, MAT, TAR, INK, KIM, FIZ, BIO, FEL, DIN, SAG, ING}.json
       └──► src/data/generated/{subjectManifest, MEB_TRAPS_DICT, MEB_VOCAB_DICT}.json
       │
       ▼
[vite build] (npm run build)
       └──► dist/data/subjects/*.json + dist/index.html + dist/assets/
```

### 4.2 Webapp Runtime Ingestion
1. `index.html` loads `src/main.js`, triggering `startApp()`.
2. Initial subject data is requested via `loadSubjectData(subj)` in `src/data/questions.js`.
3. The data is fetched asynchronously from `data/subjects/${subj}.json`.
4. The payload is passed through `parseQuestions(questions)` in `src/data/question.ts` for strict runtime schema validation:
   - Must be an array of records.
   - `id` must be a safe integer and unique within the payload.
   - `ders` and `soru` must be non-empty strings.
   - `secenekler` must contain keys `'A'`, `'B'`, `'C'`, `'D'` as strings.
   - `dogru_cevap` must be one of `'A'`, `'B'`, `'C'`, `'D'`.
   - Optional fields (`ana_konu`, `alt_konu`, `puan`, `kredi`, `zorluk`, etc.) are validated for expected types.
5. Parsed questions are pushed into `state.allData` in `src/app/state.ts`.
6. Subsequent subjects are lazy-loaded when the user switches tabs, with deduplication via `subjectLoadPromises`.

### 4.3 Key Architectural Invariants
- **No Direct Source Editing by Python**: `build_webapp.py` must strictly emit JSON files in `data/subjects/` and `src/data/generated/`. It must never alter HTML, CSS, or JS/TS code.
- **Layer Cleanliness**:
  - `src/shared/`: Pure helper functions. Zero DOM dependencies (`window`, `document`, `localStorage`).
  - `src/data/`: Data loading and TypeScript schemas. Must not import from `src/features/`.
  - `src/features/`: UI feature implementations.
  - `src/app/state.ts`: Single shared state container. No scattered global variables.
  - `src/app/events.js`: Restricted compatibility layer for legacy inline HTML events; new features must use `addEventListener`.
- **File Length Limit**: Any source JS/TS/CSS file must not exceed 350 lines.

---

## 5. Deployment Setup for Surge

1. **Domain**: `ortaklar-test.surge.sh`
2. **Configuration**:
   - Root file `CNAME` contains:
     ```text
     ortaklar-test.surge.sh
     ```
   - In `vite.config.js`:
     ```javascript
     closeBundle() {
       for (const name of ['data', 'audio', 'CNAME']) {
         if (existsSync(`${root}${name}`)) {
           cpSync(`${root}${name}`, `${root}dist/${name}`, { recursive: true });
         }
       }
       // ...
     }
     ```
   - When `npm run build` runs, `CNAME` is copied to `dist/CNAME`.
3. **Deploy Target**:
   - Production bundle is placed in `dist/`.
   - The deployment command is:
     ```bash
     npx surge dist ortaklar-test.surge.sh
     ```
   - Alternatively, since `dist/CNAME` is present, `npx surge dist` targets `ortaklar-test.surge.sh` automatically.
4. **Policy Constraint**:
   - Per `AGENTS.md`: "Yayın çıktısı `dist/` klasörüdür. Kullanıcı yayın istemedikçe deploy etme."
   - The user explicitly requested deployment to `ortaklar-test.surge.sh` in Requirement R3 / Acceptance Criteria.

---

## 6. Synthesis & Recommendations for Tarih Reclassification

### 6.1 Understanding the Reclassification Scope
- The History scope consists of **656 questions** in `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json`:
  - 492 questions for `TARİH – 1` through `TARİH – 6` (output file: `data/subjects/TAR.json`).
  - 164 questions for `T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 1` and `– 2` (output file: `data/subjects/INK.json`).
- In `tum_analizli_sorular_temiz.json`, these questions are currently heavily misclassified into generic catch-all buckets:
  - Tarih: 97 questions in "1.4 Ege, Yunan, Doğu Akdeniz...", 87 in "2.1 Orta Çağ Siyasi Yapısı...", 86 in "6.3 Osmanlı Toplum Yapısı...".
  - İnkılap: 107 questions in "9.4 Atatürkçülük ve Türk İnkılabı...", 50 in "10.4 Küreselleşen Dünya...", 7 in "8.3 20. Yüzyıl Başlarında...".

### 6.2 Recommended Execution Workflow for Reclassification
1. **Taxonomy Map**: Construct a comprehensive MEB AÖL Tarih curriculum taxonomy (similar to `scripts/tde_taxonomy_map.json`) mapping standard units (Tarih 1..6 and İnkılap 1..2) to distinct `ana_konu` and `alt_konu` pairs.
2. **Batch Audit**: Reclassify the 656 questions in controlled 60-question batches in `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json`, setting precise `ana_konu` and `alt_konu` values and eliminating generic catch-alls.
3. **Regenerate Webapp Data**:
   ```bash
   python3 scripts/core/build_webapp.py
   ```
   This will update `data/subjects/TAR.json`, `data/subjects/INK.json`, and `src/data/generated/subjectManifest.json`.
4. **Automated Verification**:
   ```bash
   npm run check
   ```
   Ensures linting, typechecking, AST architecture, and data tests (`data.test.ts` and `pipeline.test.ts`) pass with 0 errors.
5. **Production Build**:
   ```bash
   npm run build
   ```
   Ensures clean Vite compilation into `dist/` with `dist/CNAME` and updated `dist/data/subjects/`.
6. **Deploy to Surge**:
   ```bash
   npx surge dist ortaklar-test.surge.sh
   ```
