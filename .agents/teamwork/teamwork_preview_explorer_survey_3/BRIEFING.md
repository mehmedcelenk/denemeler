# BRIEFING — 2026-10-07T01:38:00Z

## Mission
Investigate the MEB AÖL Tarih curriculum, course codes, canonical topic/subtopic taxonomy across all periods, existing classification tools/scripts in the repo, and propose a strict schema/structure for batch reclassification.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_survey_3
- Original parent: 8a3cccd6-b467-493a-9354-4d97f7291f06
- Milestone: survey_3

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT modify source code or tests outside the agent directory
- Output comprehensive report to /home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_survey_3/report.md
- Produce handoff.md following 5-Component protocol
- Send message to parent agent when finished

## Current Parent
- Conversation ID: 8a3cccd6-b467-493a-9354-4d97f7291f06
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `scripts/docs/SAVED_CLASSIFIER_NOTES.md` (autopsy of old regex classifier failure modes)
  - `scripts/tde_taxonomy_map.json` (canonical model for hierarchical numbered taxonomy)
  - `scripts/core/build_webapp.py`, `scripts/core/merge_all_courses.py` (build pipelines)
  - `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json` (4,716 master questions, 656 history questions)
  - `scripts/ciktilar/analiz/tarih_analizli_sorular_temiz.json` (492 Tarih questions)
  - `scripts/ciktilar/analiz/inkilap_analizli_sorular_temiz.json` (164 İnkılap questions)
  - `scripts/ciktilar/dersler/` (course JSONs and codes: 131-138, 141-142, 195, 451, 611)
  - Git history of `process_tarih.py` and `process_inkilap.py`
- **Key findings**:
  - Exactly 656 History questions across 8 courses (each with 82 questions):
    * Tarih 1 (131), Tarih 2 (132), Tarih 3 (133), Tarih 4 (134)
    * Tarih 5 (137), Tarih 6 (138)
    * T.C. İnkılap Tarihi 1 (141), T.C. İnkılap Tarihi 2 (142)
  - "Tarih 7 & 8" correspond canonically to T.C. İnkılap Tarihi 1 & 2 in MEB curriculum; 135/136 are Elective History.
  - Previous regex classifiers caused egregious keyword misclassifications (e.g., 19th-c. Mehmet Ali Paşa to Ancient Egypt due to "Mısır").
  - Current working tree flattened all subtopics in units 2, 6, 9, 10 into single catch-all subtopics (100% of questions in those units).
  - Formulated canonical 10-Unit, 43-Subtopic MEB taxonomy covering all periods from Ancient History to 21st Century.
  - Formalized strict validation model (Python validator + JSON Schema) with course-to-topic pedagogical bounds, guaranteeing zero fallback catches.
  - Formulated 11-batch blueprint for 60-by-60 audit.
- **Unexplored areas**: None within the survey scope.

## Key Decisions Made
- Structured taxonomy into 10 numbered Units and 43 granular Subtopics matching `scripts/tde_taxonomy_map.json` design.
- Mapped 8 courses to strict bounding rules to eliminate out-of-period LLM hallucinations.
- Outlined 11 batches of 60 questions for full LLM reasoning reclassification.

## Artifact Index
- `/home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_survey_3/DISPATCH.md` — Dispatch log
- `/home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_survey_3/BRIEFING.md` — Situational awareness
- `/home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_survey_3/progress.md` — Liveness heartbeat
- `/home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_survey_3/report.md` — Comprehensive survey findings report
- `/home/mehmedbaykan/Homepage/codes/ortaklar/.agents/teamwork/teamwork_preview_explorer_survey_3/handoff.md` — 5-Component handoff report
