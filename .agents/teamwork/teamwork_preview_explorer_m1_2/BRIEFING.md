# BRIEFING — 2026-10-06T22:45:00Z

## Mission
Investigate test suite integration for the new Tarih taxonomy across TypeScript tests (Vitest/Node test runner) and Python pipeline validation.

## 🔒 My Identity
- Archetype: explorer
- Roles: Investigation, Synthesis
- Working directory: /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_m1_2
- Original parent: 8a3cccd6-b467-493a-9354-4d97f7291f06
- Milestone: Milestone 1

## 🔒 Key Constraints
- Read-only investigation — do NOT implement changes in repository code/tests directly
- Write only to /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_m1_2/
- Follow Handoff Protocol (5-component handoff report)
- No source code or tests in .agents/teamwork/

## Current Parent
- Conversation ID: 8a3cccd6-b467-493a-9354-4d97f7291f06
- Updated: 2026-10-06T22:45:00Z

## Investigation State
- **Explored paths**:
  - `package.json` (`npm run check`, `npm run build`, `data:build`)
  - `tests/data.test.ts`, `tests/pipeline.test.ts`, `tests/tde-features.test.ts`
  - `src/data/question.ts`, `src/features/subjects/topics.js`, `src/shared/topic.ts`
  - `data/subjects/TAR.json`, `data/subjects/INK.json`
  - `scripts/core/build_webapp.py`, `scripts/core/merge_all_courses.py`
  - `scripts/check-architecture.js`
- **Key findings**:
  - Test runner is Node.js built-in (`node:test` + `tsx`) running `tests/*.test.ts`. Any new `.test.ts` file in `tests/` is auto-discovered without config edits.
  - Dedicated `tests/tarih-taxonomy.test.ts` is recommended over modifying `tests/data.test.ts` to preserve single-responsibility and the 350-line file limit.
  - TAR.json currently has 10 subtopics (collapsed) and INK.json has 3 subtopics (collapsed).
  - Milestone phasing: in M1, dataset checks must use `t.skip()` when detecting pre-reclassification data to prevent breaking `npm run check`. In M3, it automatically un-skips and strictly verifies 100% compliance across 656 questions.
  - Four-layer automation for `scripts/validate_tarih_taxonomy.py`: `npm run validate:tarih`, `spawnSync` in `tests/tarih-taxonomy.test.ts`, guard in `build_webapp.py`, and guard in `merge_all_courses.py`.
- **Unexplored areas**: None for M1 test integration scope.

## Key Decisions Made
- Recommending creation of `tests/tarih-taxonomy.test.ts` with 3 test suites:
  1. Taxonomy map JSON schema and integrity (10 units, numbered prefixes, min 2 subtopics/unit, 0 fallbacks).
  2. Python CLI validator execution and negative error detection.
  3. Staged subject data verification (`TAR.json` & `INK.json` with course boundary matrix & anti-collapse checks).
- Recommending `"validate:tarih"` script in `package.json`.
- Recommending pipeline guard in `build_webapp.py`.

## Artifact Index
- /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_m1_2/DISPATCH.md — Incoming dispatches
- /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_m1_2/BRIEFING.md — Persistent context & state
- /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_m1_2/progress.md — Liveness & heartbeat
- /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_m1_2/report.md — Comprehensive technical analysis report
- /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_m1_2/handoff.md — 5-component handoff report
