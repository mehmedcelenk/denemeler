---
name: code-review-and-quality
description: "Review a diff, PR or working changes for correctness, architectural fit, security, readability and performance with actionable evidence."
license: MIT
---

Read [project integration](../../../docs/AGENT_SKILLS.md) and the relevant architecture map before applying this workflow. Local project rules govern all examples and references.

# Code Review and Quality

Review the requested change against user intent and the repository's actual contracts.

1. Identify the diff scope and expected behavior. Include working-tree changes only
   when they belong to the review; preserve unrelated user edits.
2. Inspect affected callers and tests. Evaluate correctness, readability, architecture,
   security and performance according to the change's real risk.
3. Check feature ownership, core/plugin isolation, dependency direction, state/storage
   gateways, event compatibility, scoped question-card queries and the 300-line limit.
4. Trace any suspected defect to a reachable scenario. Seek counter-evidence before
   reporting it. Separate pre-existing defects from introduced regressions.
5. Check that tests assert behavior and that reported commands really ran. Use isolated
   copies for any mutation experiment; review does not require changing the worktree.

Report high-confidence findings first with severity, file/line, trigger, consequence
and a practical fix. Zero findings is valid. Cosmetic preferences are optional.
Do not invent timing estimates, require a different model, create issues, change code,
commit, merge or publish merely because a review workflow mentions those actions.

For a security-focused review, read [security-check](../security-check/SKILL.md).
For a specific performance concern, consult the relevant section of
[performance checks](references/performance-checklist.md); profiling examples must be
adapted to the existing Vite and Node tooling. Do not install tools automatically.
