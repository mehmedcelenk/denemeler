## 2026-10-07T03:55:44Z
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You are the Worker for Milestone 1 (teamwork_preview_worker_m1_1).
Your working directory is: /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_worker_m1_1/

You MUST read these specifications before starting work:
1. /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/ORIGINAL_REQUEST.md
2. /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/orchestrator_1/PROJECT.md
3. Spec Miner report: /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_spec_miner_m1_1/report.md
4. Test Explorer report: /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_m1_2/report.md
5. Alignment Explorer report: /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_m1_1/report.md

Task:
Implement Milestone 1 artifacts:
1. `scripts/tarih_taxonomy_map.json`: Create the canonical 10-Unit, 45-Subtopic taxonomy map exactly following the specification in `spec_miner_m1_1/report.md`. Use clean ASCII straight single quotes (`'`) and 2-space indentation mirroring `scripts/tde_taxonomy_map.json`.
2. `scripts/validate_tarih_taxonomy.py`: Implement the complete Python CLI and importable validator class as specified in `spec_miner_m1_1/report.md`. Must support:
   - `--check-map-only`: validates the taxonomy map JSON and exits 0.
   - `--data-path`: validates a question JSON file against the taxonomy with course boundary checks.
   - `--batch-path`: validates an audited batch JSON file.
   - Classes: `HistoryClassificationResult`, `HistoryTaxonomyValidator`, `ValidationError`, `ValidationSummary`.
   - Rejects any "Genel", "Diğer", "Saptanamadı", or fallback terms.
   - Enforces empirical course bounds (allowing valid semester reviews while strictly forbidding cross-epoch contamination).
3. `tests/tarih-taxonomy.test.ts`: Implement the TypeScript test suite as specified in `explorer_m1_2/report.md`. Contains:
   - Taxonomy map schema integrity test.
   - Python CLI self-test execution via `spawnSync`.
   - Staged dataset test using `t.skip()` for legacy unreclassified data until M3.
4. `package.json`: Add `"validate:tarih": "python3 scripts/validate_tarih_taxonomy.py --check-map-only"` under scripts.

Verification:
- Run `python3 scripts/validate_tarih_taxonomy.py --check-map-only` (must exit 0).
- Run `npm run check` (must pass 100%, 0 lint/type/arch errors, all tests pass).
- Document commands and outputs in your report.

Output:
Write your implementation report to `/home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_worker_m1_1/report.md` and complete 5-component `handoff.md`.
Send message to caller when done.
