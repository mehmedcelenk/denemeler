# Original User Request

## 2026-10-06T21:51:02Z

Comprehensive audit, curriculum mapping, and 60-by-60 batch reclassification of all AÖL Tarih (History 1-8 / İnkılap Tarihi) questions in the codebase, followed by automated verification and live Surge deployment.

Working directory: /home/mehmedbaykan/Homepage/codes/ortaklar

## Requirements

### R1. MEB AÖL Tarih Curriculum Taxonomy Mapping
Construct a complete, official MEB AÖL Tarih (Tarih 1..8 and İnkılap Tarihi 1..2) curriculum topic and subtopic taxonomy covering all historical periods from Ancient History to Contemporary Turkish and World History.

### R2. 60-by-60 Batch Audit & Reclassification
Audit all History questions in `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json` in controlled 60-question batches using full LLM reasoning (inspecting stems, options, and historical context) to eliminate fallback misclassifications and align every question precisely to its MEB subtopic.

### R3. Automated Verification & Production Build
Execute `python3 scripts/core/build_webapp.py` to regenerate `data/subjects/TARİH.json` and webapp assets, run full test checks (`npm run check`), build production bundle (`npm run build`), and deploy cleanly to Surge (`ortaklar-test.surge.sh`).

## Acceptance Criteria

### Curriculum Integrity & Verification
- [ ] 100% of Tarih/İnkılap questions audited across 60-question batches.
- [ ] Zero fallback catch-all misclassifications in Tarih questions.
- [ ] `npm run check` (Lint, TypeScript, Architecture, Data contracts) passes with 0 errors.
- [ ] `npm run build` succeeds and `npx surge dist ortaklar-test.surge.sh` completes cleanly.
