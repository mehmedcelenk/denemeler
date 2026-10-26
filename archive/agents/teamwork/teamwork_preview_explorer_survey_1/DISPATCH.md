## Dispatch for teamwork_preview_explorer_survey_1
Role: Explorer 1 (Codebase Structure & Data Pipeline)
Target: Survey the build pipeline, scripts, npm test/check commands, data contracts, and build_webapp.py.
See ORIGINAL_REQUEST.md for requirements.

## 2026-10-06T21:53:49Z
Sender: 8a3cccd6-b467-493a-9354-4d97f7291f06
Content:
You are Explorer 1 (teamwork_preview_explorer_survey_1).
Your working directory is: /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_survey_1/
You must read the user request at: /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/ORIGINAL_REQUEST.md

Task:
Investigate the data pipeline, build scripts, webapp architecture, and verification commands in this repository.
Specifically explore:
1. `scripts/core/build_webapp.py` (or any related build scripts in `scripts/`): How does it process `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json` or other source files into `data/subjects/TARİH.json` and `src/data/generated/`? What are the input files, transformations, subject filters, and schema validations?
2. `package.json` and verification commands: inspect `npm run check`, `npm run build`, `npm run test:e2e`, and data check scripts. What do they validate? Are there schema checks or test suites for data?
3. Architecture rules from `docs/ARCHITECTURE.md` and `AGENTS.md` regarding data flow, subject files, and webapp bundling.
4. Deployment setup for Surge: check package scripts, deployment configs, and surge domain (`ortaklar-test.surge.sh`).

Output:
Write your comprehensive findings to `/home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_survey_1/report.md` and create `handoff.md` in your directory.
Send a message to caller (4df46860-67b1-4680-af3b-000a00820c3c or your parent orchestrator) when done.
