# Handoff Report — Codebase & Data Pipeline Survey

**Agent**: `teamwork_preview_explorer_survey_1` (Explorer 1)  
**Parent / Caller**: `8a3cccd6-b467-493a-9354-4d97f7291f06`  
**Date**: 2026-10-06  
**Type**: Hard Handoff (Investigation Complete)

---

## 1. Observation

1. **Build Script & Data Target Paths**:
   - `scripts/core/build_webapp.py`:
     - Reads `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json` (line 16).
     - Maps course names via `subject_id_for_course(course_name)`:
       - Line 166: `if 'İNKILAP' in course_name: return 'INK'`
       - Line 167: `if 'TARİH' in course_name: return 'TAR'`
     - Generates output files at line 186: `data/subjects/{subject_id}.json`.
     - Specifically, History questions are written to `data/subjects/TAR.json` and `data/subjects/INK.json` (not `data/subjects/TARİH.json`).
     - Generates metadata at lines 193–202 in `src/data/generated/`: `subjectManifest.json`, `MEB_TRAPS_DICT.json`, `MEB_VOCAB_DICT.json`.
     - Preserves existing extra fields (`soru`, `soru_tr`, `soru_ar`, `soru_xray`) from existing `data/subjects/*.json` (lines 121–127).
2. **Question Counts & Distribution**:
   - `tum_analizli_sorular_temiz.json` has 4,716 questions total.
   - History domain: exactly 656 questions:
     - `TAR` (Tarih 1–6): 492 questions (82 per course level across 6 courses).
     - `INK` (İnkılap 1–2): 164 questions (82 per course level across 2 courses).
   - Significant fallback misclassification observed in `tum_analizli_sorular_temiz.json`:
     - Tarih: 97 questions under "1.4 Ege, Yunan...", 87 under "2.1 Orta Çağ Siyasi Yapısı...", 86 under "6.3 Osmanlı Toplum Yapısı...".
     - İnkılap: 107 questions under "9.4 Atatürkçülük ve Türk İnkılabı...", 50 under "10.4 Küreselleşen Dünya...", 7 under "8.3 20. Yüzyıl Başlarında...".
3. **Verification Commands (`package.json`)**:
   - `npm run check`: Executes:
     `npm run lint && npm run typecheck && node scripts/check-architecture.js && node --import tsx --test tests/*.test.ts`
     - Command output: `✅ Mimari denetim GEÇTİ: 65 modül incelendi, 0 Hata, 17 Uyarı.` and `ℹ pass 29 ℹ fail 0` (100% passing).
   - `npm run build`: Executes `npm run check && vite build`.
     - Command output: Compiles cleanly; produces `dist/assets/styles.css` (91.62 kB), `dist/assets/app.js` (383.06 kB), copies `dist/data/`, `dist/CNAME`, and `dist/index.html`.
   - `npm run test:e2e`: Runs `playwright test`.
     - Command output in sandboxed subagent: `Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:4173/` due to sandbox networking restrictions preventing browser connection to Vite preview server.
4. **Surge Deployment Infrastructure**:
   - Root file `CNAME`: Line 1 is `ortaklar-test.surge.sh`.
   - `vite.config.js`: Lines 48–52 copy `CNAME` into `dist/CNAME` during `closeBundle()`.
   - Verified that `dist/CNAME` exists and contains `ortaklar-test.surge.sh`.

---

## 2. Logic Chain

1. **Subject File Identity**:
   - Observation 1 shows that `build_webapp.py` uses `subject_id_for_course` which maps Tarih to `TAR` and İnkılap to `INK`.
   - Observation 1 shows lines 185–187 dump data to `data/subjects/{subject_id}.json`.
   - Therefore, the prompt's reference to `data/subjects/TARİH.json` corresponds in code to `data/subjects/TAR.json` (and `data/subjects/INK.json`), and the webapp specifically loads `${cleanBase}data/subjects/${subj}.json` with `subj === 'TAR'` and `'INK'` (as confirmed in `src/data/questions.js:20`).
2. **Reclassification Source File**:
   - Observation 1 shows `build_webapp.py` consumes `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json` as its master input.
   - Observation 2 shows that 656 questions (492 TAR + 164 INK) reside within `tum_analizli_sorular_temiz.json`.
   - Therefore, auditing and reclassifying History questions must update `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json` directly. Running `python3 scripts/core/build_webapp.py` propagates these changes into `data/subjects/TAR.json`, `data/subjects/INK.json`, and `src/data/generated/subjectManifest.json`.
3. **Automated Verification Pipeline**:
   - Observation 3 shows `tests/data.test.ts` validates that question counts in each `data/subjects/*.json` match `src/data/generated/subjectManifest.json`, course counts match, question IDs are strictly unique, and fields satisfy `parseQuestions()`.
   - Observation 3 shows `tests/pipeline.test.ts` confirms `build_webapp.py` leaves UI files intact.
   - Therefore, running `python3 scripts/core/build_webapp.py` followed by `npm run check` provides complete automated validation of data contracts, schema compliance, and architecture invariants.
4. **Production Build & Surge Deployment**:
   - Observation 3 shows `npm run build` runs `npm run check` and builds `dist/`.
   - Observation 4 shows `dist/CNAME` contains `ortaklar-test.surge.sh`.
   - Therefore, executing `npx surge dist ortaklar-test.surge.sh` deploys the verified bundle to production without needing additional configuration files.

---

## 3. Caveats

1. **`npm run test:e2e` in Sandbox**:
   - Playwright end-to-end tests failed with `ERR_CONNECTION_REFUSED` due to sandbox restrictions on local loopback port binding (`http://127.0.0.1:4173/`). Running e2e tests requires an unsandboxed terminal (`BypassSandbox: true`) or direct host execution.
2. **Tarih Course Naming vs MEB Curriculum**:
   - `tum_analizli_sorular_temiz.json` contains `TARİH – 1` through `TARİH – 6` and `T.C. İNKILAP TARİHİ VE ATATÜRKÇÜLÜK – 1` and `– 2`. It does not contain `TARİH – 7` or `TARİH – 8` (these are elective in AÖL or covered by İnkılap Tarihi in 12th grade).
3. **Surge CLI**:
   - Surge is executed via `npx surge dist ortaklar-test.surge.sh`. Authentication tokens for Surge (`SURGE_LOGIN`, `SURGE_TOKEN`) or an active session on the host machine are assumed to be configured by the environment for deployment.

---

## 4. Conclusion

1. The data pipeline and verification workflow are fully operational, strictly decoupled, and ready for the Tarih reclassification task.
2. The exact workflow for downstream agents is:
   - Audit and reclassify the 656 Tarih / İnkılap questions in `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json` in 60-question batches.
   - Run `python3 scripts/core/build_webapp.py` to regenerate `data/subjects/TAR.json`, `data/subjects/INK.json`, and `src/data/generated/subjectManifest.json`.
   - Run `npm run check` to verify data contracts, architecture rules, and unit tests (all 29 tests must pass).
   - Run `npm run build` to compile the production bundle into `dist/`.
   - Run `npx surge dist ortaklar-test.surge.sh` to deploy the verified bundle live.

---

## 5. Verification Method

To independently verify the survey findings:

1. **Verify Data Build**:
   ```bash
   python3 scripts/core/build_webapp.py
   ```
   *Expected result*: Prints `✅ 4716 soru, 12 ders grubu güncellendi.` Outputs exist in `data/subjects/TAR.json` (492 questions) and `data/subjects/INK.json` (164 questions).
2. **Verify Check Suite**:
   ```bash
   npm run check
   ```
   *Expected result*: 0 lint errors, 0 type errors, 0 architecture errors, 29 passing tests.
3. **Verify Production Bundle**:
   ```bash
   npm run build
   ```
   *Expected result*: Exit code 0, `dist/index.html`, `dist/assets/`, `dist/data/subjects/TAR.json`, and `dist/CNAME` generated.
4. **Inspect Generated Files**:
   - Inspect `data/subjects/TAR.json`: Verify valid JSON array of 492 items.
   - Inspect `data/subjects/INK.json`: Verify valid JSON array of 164 items.
   - Inspect `dist/CNAME`: Verify contents are `ortaklar-test.surge.sh`.
