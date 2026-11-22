---
name: verification-before-completion
description: "Verify implementation and test claims against fresh command results before reporting a coding task fixed, passing or complete."
license: MIT
---

Read [project integration](../../../docs/AGENT_SKILLS.md) and the relevant architecture map before applying this workflow. Local project rules govern all examples and references.

# Verification Before Completion

Match each completion claim to evidence from the current change.

1. Identify the command or direct observation that establishes the claim.
2. Run the relevant checks and inspect their complete result and exit status.
3. Resolve failures caused by the change; distinguish existing failures and environment
   blocks. Never weaken a check or report an unrun check as passing.
4. Inspect the final diff for scope, unintended generated files and user changes.
5. Report what changed, why, verification results and material remaining limitations.

`npm run build` includes lint, strict TypeScript, architecture and unit/data checks.
`npm run test:e2e` is also required for UI, event or data-loading changes. Data generation,
database synchronization and deployment are not validation commands for ordinary edits.

Successful lint does not prove build success; successful build does not prove a browser
flow. Do not repeat unchanged successful checks unless new edits or concerns justify it.
Skill validation proves format and packaging, not the quality of all future decisions.
