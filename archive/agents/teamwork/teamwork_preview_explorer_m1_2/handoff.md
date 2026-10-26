# 📋 Handoff Report: Test Suite Integration for Tarih Taxonomy

**Agent:** Explorer 2 (`teamwork_preview_explorer_m1_2`)  
**Mission:** Investigate test suite integration for the new Tarih taxonomy across TypeScript (`node:test`) and Python validation pipelines.  
**Target Recipient:** Orchestrator (`8a3cccd6-b467-493a-9354-4d97f7291f06`) / Worker  

---

## 1. Observation

1. **Test Infrastructure & Command Chain:**
   - In `package.json:11`:
     ```json
     "check": "npm run lint && npm run typecheck && node scripts/check-architecture.js && node --import tsx --test tests/*.test.ts"
     ```
   - In `package.json:8`:
     ```json
     "build": "npm run check && vite build"
     ```
   - Test runner is Node.js built-in `node:test` + `node:assert/strict` with `tsx` dynamic import (`node --import tsx --test tests/*.test.ts`).
   - Running `npm run check` currently executes 29 tests across 8 test files in 1.3 seconds with 0 errors.
   - Any new `.test.ts` file created directly inside `tests/` is automatically matched by the glob `tests/*.test.ts` without needing changes to `package.json`.

2. **Scope of Existing Test Files:**
   - `tests/data.test.ts:9-21`: Tests manifest question/course counts and parser schema compliance via `parseQuestions()` from `src/data/question.ts`. It does **not** assert `ana_konu` or `alt_konu` presence or validate them against subject taxonomy maps. File is 40 lines.
   - `tests/pipeline.test.ts:8-27`: Spawns `python3 scripts/core/build_webapp.py` via `node:child_process.spawnSync` in a temporary sandbox directory, verifying exit code 0 and interface file protection. File is 28 lines.
   - `tests/tde-features.test.ts:1-115`: Dedicated test file for Turkish Language & Literature (TDE) domain features, glossaries, and dictionaries (115 lines), keeping `data.test.ts` modular and focused.

3. **Existing Question Data Breakdown:**
   - Direct execution check on `data/subjects/TAR.json` and `data/subjects/INK.json`:
     - `TAR.json`: Exactly 492 questions across 6 courses (`TARİH – 1`..`TARİH – 6`, 82 questions each), with only 10 unique topic pairs. All 87 questions in Unit 2 collapsed into `2.1`; all 86 questions in Unit 6 collapsed into `6.3`.
     - `INK.json`: Exactly 164 questions across 2 courses (`İNKILAP – 1`..`İNKILAP – 2`, 82 questions each), with only 3 unique topic pairs.
     - Master dataset `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json`: History questions have course codes `131`, `132`, `133`, `134`, `137`, `138`, `141`, `142` (82 questions each = 656 total).
     - Every question in `TAR.json` and `INK.json` retains `ders_kodu` and `ders` fields.

4. **Data Generation Pipeline:**
   - `scripts/core/build_webapp.py:150-151`: Default values fallback to `'Genel'` (`q.get('ana_konu', 'Genel')`, `q.get('alt_konu', 'Genel')`).
   - `scripts/core/build_webapp.py:166-167`: Maps course names containing `'TARİH'` to `data/subjects/TAR.json` and `'İNKILAP'` to `data/subjects/INK.json`.
   - `scripts/core/merge_all_courses.py:88-89`: Rejects `'Genel'`, but does not enforce a curriculum taxonomy or pedagogical course boundaries.

5. **Architecture and File Length Constraints (`AGENTS.md`):**
   - Maximum JS/TS/CSS file size: 350 lines.
   - Clean layer separation: data contracts in `src/data/`, pure utilities in `src/shared/`.

---

## 2. Logic Chain

1. **Modularity over Bloat:**
   - *Observation 2* shows `tests/data.test.ts` is only 40 lines and handles general multi-subject data contracts.
   - Adding 100+ lines of Tarih-specific taxonomy rules, regex matches, and course boundary matrices to `data.test.ts` would violate single-responsibility principles and bloat a generic test.
   - *Observation 2* shows that TDE features are cleanly isolated in `tests/tde-features.test.ts` (115 lines).
   - *Inference:* Tarih taxonomy tests must be isolated in a dedicated file: `tests/tarih-taxonomy.test.ts`.

2. **Automatic Test Runner Execution:**
   - *Observation 1* shows `npm run check` runs `node --import tsx --test tests/*.test.ts`.
   - *Inference:* Placing `tests/tarih-taxonomy.test.ts` into `tests/` guarantees immediate, zero-config execution in both `npm run check` and `npm run build`.

3. **Subprocess Python Validation Integration:**
   - *Observation 2* shows `tests/pipeline.test.ts` successfully uses `spawnSync('python3', ...)` to test Python scripts.
   - *Inference:* `tests/tarih-taxonomy.test.ts` can execute `python3 scripts/validate_tarih_taxonomy.py --map-only` (and `--subjects`) directly via `spawnSync`, bridging TypeScript test suites with the Python validation engine.

4. **Milestone Phasing & Preventing Broken Builds:**
   - *Observation 3* proves that `TAR.json` and `INK.json` currently contain the legacy collapsed subtopics (only 10 and 3 subtopics respectively).
   - In Milestone 1, `scripts/tarih_taxonomy_map.json` and `scripts/validate_tarih_taxonomy.py` are created; the 656 questions are only reclassified in Milestone 2 and regenerated in Milestone 3.
   - If `tests/tarih-taxonomy.test.ts` strictly asserted 43 subtopics and zero legacy collapse on `TAR.json` in Milestone 1, `npm run check` would fail, violating Milestone 1 completion criteria.
   - *Inference:* The dataset compliance test in `tests/tarih-taxonomy.test.ts` must use Node's native `t.skip()` when detecting the pre-reclassification legacy dataset (`tarSubCount <= 10`). In Milestone 3, once `build_webapp.py` runs, the test automatically un-skips and strictly enforces 100% taxonomy compliance.

5. **Defense-in-Depth Pipeline Integration:**
   - *Observation 4* shows `build_webapp.py` writes `TAR.json` and `INK.json`.
   - *Inference:* In addition to TypeScript tests, `build_webapp.py` should import and run `validate_tarih_questions()` as a guard. If any Tarih question violates the taxonomy, `data:build` aborts, preventing broken data from ever entering `data/subjects/` or production.

---

## 3. Caveats

1. **Subtopic Total Count Exact Value:**
   - Survey Report 3 references "10 Ünite, 43 Alt Konu" in text, but lists 45 numbered subtopics in its detailed specification (5+3+4+4+4+5+6+4+6+4 = 45).
   - Peer Explorer 1 (`teamwork_preview_explorer_m1_1`) is currently finalizing the exact canonical subtopic count.
   - The test assertions should dynamically evaluate the keys and values of `scripts/tarih_taxonomy_map.json` and assert a range of 40–46 subtopics rather than hardcoding a brittle single integer.
2. **Read-Only Investigation Boundary:**
   - Per Explorer persona rules, no code changes to repository source/tests were executed during this turn. Complete, production-ready code proposals have been drafted in `report.md`.

---

## 4. Conclusion

1. **Create `tests/tarih-taxonomy.test.ts`**:
   - Contains 3 dedicated test suites:
     - **Suite 1:** Schema & integrity of `scripts/tarih_taxonomy_map.json` (10 units, numbered regex format, min 2 subtopics per unit, no duplicates, zero fallback terms).
     - **Suite 2:** Python CLI validator execution test via `spawnSync('python3', ['scripts/validate_tarih_taxonomy.py', '--map-only'])`.
     - **Suite 3:** Staged dataset verification for `TAR.json` (492 Q) and `INK.json` (164 Q), asserting 100% whitelist taxonomy adherence, zero fallback terms, pedagogical course boundary enforcement (131->Unit 1-2, 132->Unit 2-3, 133->Unit 4-5, 134->Unit 6, 137->Unit 7, 138->Unit 8, 141->Unit 8-9, 142->Unit 9-10), and anti-collapse dispersion. Uses `t.skip()` during M1/M2 preparatory phase.
2. **CLI & Build Automation**:
   - Add `"validate:tarih": "python3 scripts/validate_tarih_taxonomy.py --strict"` to `package.json`.
   - Insert validation assertion guard inside `scripts/core/build_webapp.py` before writing subject files.

---

## 5. Verification Method

To independently verify this analysis:

1. **Verify Test Runner Auto-Discovery:**
   - Run `npm run check` in terminal:
     ```bash
     npm run check
     ```
   - Confirm command runs `node --import tsx --test tests/*.test.ts` and passes with 0 errors.
2. **Verify Python Execution Capability:**
   - Run existing pipeline test:
     ```bash
     node --import tsx --test tests/pipeline.test.ts
     ```
   - Confirm `spawnSync` executes Python seamlessly without runtime dependencies.
3. **Verify Data State Baseline:**
   - Check current subtopic count in `data/subjects/TAR.json`:
     ```bash
     python3 -c "import json; data=json.load(open('data/subjects/TAR.json')); print('Distinct subtopics:', len(set(q['alt_konu'] for q in data)))"
     ```
   - Confirms only 10 subtopics exist in TAR.json, validating the necessity of `t.skip()` gating during M1.
4. **Inspect Proposed Implementation Files:**
   - View `/home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_m1_2/report.md` for full implementation code and architectural blueprints.
