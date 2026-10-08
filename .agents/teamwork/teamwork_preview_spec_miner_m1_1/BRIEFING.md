# BRIEFING — 2026-10-07T06:09:00Z

## Mission
Mine exact specifications and worker implementation contract for `scripts/tarih_taxonomy_map.json` and `scripts/validate_tarih_taxonomy.py` for Milestone 1.

## 🔒 My Identity
- Archetype: specification_miner
- Roles: Specification Miner, Teamwork specialist
- Working directory: /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_spec_miner_m1_1
- Original parent: 8a3cccd6-b467-493a-9354-4d97f7291f06
- Milestone: Milestone 1

## 🔒 Key Constraints
- Read-only on codebase: do NOT implement source code, tests or data files.
- Write only to working directory: /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_spec_miner_m1_1/
- Never place source code, tests, or data files in `.agents/teamwork/`.
- Never name a file `AGENTS.md` or `GEMINI.md`.
- Mine exact specifications for `scripts/tarih_taxonomy_map.json` and `scripts/validate_tarih_taxonomy.py`.
- Define precise contract for Worker to implement these two files with 100% adherence and zero ambiguities.
- Output analysis to `report.md` and `handoff.md`.
- Send message to caller when done.

## Current Parent
- Conversation ID: 8a3cccd6-b467-493a-9354-4d97f7291f06
- Updated: not yet

## Task Summary
- **What to build**: Full spec and implementation contract for Tarih taxonomy map and Tarih taxonomy validator.
- **Success criteria**: Complete, unambiguous spec covering taxonomy map schema/rules/formatting and validator CLI args, dataclasses, validation logic, error reporting, exit codes, and functions.
- **Interface contracts**: `scripts/tde_taxonomy_map.json`, `PROJECT.md`, `survey report`.
- **Code layout**: Scripts in `scripts/`, agent metadata in `.agents/teamwork/teamwork_preview_spec_miner_m1_1/`.

## Key Decisions Made
- Canonical Taxonomy Map: 10 Units and 45 Subtopics (Unit 1: 5, Unit 2: 3, Unit 3: 4, Unit 4: 4, Unit 5: 4, Unit 6: 5, Unit 7: 6, Unit 8: 4, Unit 9: 6, Unit 10: 4).
- Standard ASCII straight quotes (`'`) enforced across all taxonomy strings.
- Discovered and resolved empirical course boundary edge cases in MEB exams (Course 132 includes Unit 1 cumulative questions, Course 133 includes Unit 3 Büyük Selçuklu questions, Course 141 includes Unit 10 interwar questions).
- Defined complete CLI interface, dataclasses (`HistoryClassificationResult`, `ValidationError`, `ValidationSummary`), exit codes (0, 1, 2), and validation logic in `report.md`.
- Completed 5-component handoff report in `handoff.md`.

## Artifact Index
- report.md — Complete specification mining report
- handoff.md — 5-component handoff report
- DISPATCH.md — Log of incoming instructions
- progress.md — Liveness heartbeat and milestone progress
