# Project: AÖL Tarih Curriculum Taxonomy Mapping & Batch Reclassification

## Architecture
- Master Dataset: `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json` (4,716 questions total, 656 History questions).
- History Course Codes:
  - Tarih 1 (131, 82 Q)
  - Tarih 2 (132, 82 Q)
  - Tarih 3 (133, 82 Q)
  - Tarih 4 (134, 82 Q)
  - Tarih 5 (137, 82 Q)
  - Tarih 6 (138, 82 Q)
  - T.C. İnkılap Tarihi ve Atatürkçülük 1 (141, 82 Q)
  - T.C. İnkılap Tarihi ve Atatürkçülük 2 (142, 82 Q)
- Webapp Generator: `scripts/core/build_webapp.py` -> produces `data/subjects/TAR.json` (492 Q), `data/subjects/INK.json` (164 Q), and `src/data/generated/subjectManifest.json`.
- Webapp Consumer: `src/data/questions.js` loads `TAR.json` and `INK.json`.
- Verification Suite: `npm run check` (TypeScript, ESLint, architecture checks, tests).
- Production Build & Deployment: `npm run build` -> `dist/` with `dist/CNAME` (`ortaklar-test.surge.sh`) deployed via Surge.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | MEB AÖL Tarih Taxonomy | 10-Unit, 43-Subtopic canonical MEB curriculum taxonomy mapping without fallbacks | M1 | Survey |
| 2 | Taxonomy Validation Engine | Python validation script checking course-level pedagogical bounds, zero fallbacks | M1 | Survey |
| 3 | 60-by-60 Batch Audit & Reclassification | Complete audit of all 656 Tarih/İnkılap questions across 11 batches with full LLM reasoning | M2 | Survey |
| 4 | Clean Master Dataset Integration | Update `tum_analizli_sorular_temiz.json` with reclassified history questions | M2 | Survey |
| 5 | Webapp Subject Regeneration | Execute `build_webapp.py` to regenerate `TAR.json`, `INK.json`, and manifests | M3 | Survey |
| 6 | Automated Verification Pass | Run `npm run check` to verify data contracts, types, and architecture rules | M3 | Survey |
| 7 | Production Build & Surge Deployment | Run `npm run build` and deploy bundle to `ortaklar-test.surge.sh` via Surge | M3 | Survey |
| 8 | E2E Data & Taxonomy Verification | Independent opaque-box test suite verifying 656 questions and curriculum integrity | E2E | Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Taxonomy Definition & Validation Engine | `scripts/tarih_taxonomy_map.json` and validation script | Survey complete | IN_PROGRESS |
| M2 | 60-by-60 Batch Reclassification | Reclassify 656 questions across 11 batches in master dataset | M1 | PLANNED |
| M3 | Verification, Build & Surge Deployment | `build_webapp.py`, `npm run check`, `npm run build`, Surge | M2, E2E | PLANNED |
| E2E | E2E Testing Track | Independent opaque-box validation tests for History questions & taxonomy | M1 | IN_PROGRESS |

## Code Layout
- Taxonomy configuration: `scripts/tarih_taxonomy_map.json`
- Taxonomy validator: `scripts/validate_tarih_taxonomy.py`
- Reclassification script & batch processor: `scripts/reclassify_tarih_batches.py`
- Master dataset: `scripts/ciktilar/analiz/tum_analizli_sorular_temiz.json`
- Generated subject data: `data/subjects/TAR.json`, `data/subjects/INK.json`
- Generated manifests: `src/data/generated/subjectManifest.json`
- Webapp build script: `scripts/core/build_webapp.py`
- Tests: `tests/tarih_taxonomy.test.ts` or Python verification tests
