---
name: systematic-debugging
description: "Investigate reproducible bugs, failed tests and unexpected runtime behavior by tracing the root cause before making a focused fix."
license: MIT
---

Read [project integration](../../../docs/AGENT_SKILLS.md) and the relevant architecture map before applying this workflow. Local project rules govern all examples and references.

# Systematic Debugging

Find evidence for the cause before applying a fix.

1. Reproduce the exact symptom. Capture the command, error, environment and failing
   behavior. Inspect recent relevant changes without reverting user work.
2. Trace inputs through the affected feature, actions, state, persistence and rendering.
   Compare a working path. Log only the minimum diagnostic data; never log credentials,
   full environment variables or private payloads.
3. State a specific hypothesis and test the smallest change that can disprove it.
   Do not stack speculative fixes or swallow errors to make a test pass.
4. Fix the verified cause within the owning module. For a behavior defect add or update
   a meaningful regression test; for a simple documentation typo use direct inspection.
5. Run the relevant check and required build. Run E2E when UI/events/loading changed.
   Report environmental limitations separately from product defects.

If repeated fixes fail, revisit assumptions, shared state and coupling before making
another change. Continue evidence gathering within the authorized scope; ask only when
missing user information or a consequential scope decision prevents progress.

For deep stack failures see [root-cause tracing](references/root-cause-tracing.md).
For timing failures see [condition-based waiting](references/condition-based-waiting.md).
For validation boundaries see [defense in depth](references/defense-in-depth.md), applying
checks at actual trust boundaries rather than duplicating every internal type check.
