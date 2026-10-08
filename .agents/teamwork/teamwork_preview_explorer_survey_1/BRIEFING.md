# BRIEFING — 2026-10-06T22:33:00Z

## Mission
Survey codebase data pipeline, build scripts, webapp architecture, and verification/deployment commands.

## 🔒 My Identity
- Archetype: Explorer
- Roles: Codebase & Data Pipeline Survey
- Working directory: /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_survey_1
- Original parent: 8a3cccd6-b467-493a-9354-4d97f7291f06
- Milestone: Survey & Investigation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT modify application source code, tests, or data
- Write only inside working directory

## Current Parent
- Conversation ID: 8a3cccd6-b467-493a-9354-4d97f7291f06
- Updated: 2026-10-06T22:33:00Z

## Investigation State
- **Explored paths**:
  - `scripts/core/build_webapp.py`, `scripts/core/merge_all_courses.py`, `scripts/core/batch_parser.py`
  - `package.json`, `vite.config.js`, `playwright.config.js`
  - `scripts/check-architecture.js`, `tests/*.test.ts`, `tests/browser/*.spec.js`
  - `docs/ARCHITECTURE.md`, `AGENTS.md`, `README.md`, `CNAME`
  - `data/subjects/TAR.json`, `data/subjects/INK.json`, `src/data/generated/subjectManifest.json`
  - `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json`
- **Key findings**:
  - History data is generated as `data/subjects/TAR.json` (492 questions) and `data/subjects/INK.json` (164 questions), total 656 questions.
  - Source data file is `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json`.
  - Significant fallback clustering confirmed in Tarih and İnkılap questions.
  - `npm run check` passes 100% (29 tests, 0 errors).
  - `npm run build` compiles Vite bundle into `dist/`, copies `CNAME` and `data/` to `dist/`.
  - Surge domain `ortaklar-test.surge.sh` configured in root `CNAME` and copied to `dist/CNAME`.
  - `npm run test:e2e` fails in sandbox due to loopback network isolation.
- **Unexplored areas**: None within the survey scope.

## Key Decisions Made
- Fully documented all 4 target exploration areas in `report.md` and created 5-component `handoff.md`.

## Artifact Index
- report.md — comprehensive survey report
- handoff.md — standard 5-component handoff report
- progress.md — liveness heartbeat
