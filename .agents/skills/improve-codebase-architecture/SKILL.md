---
name: improve-codebase-architecture
description: "Review existing architecture for coupling, fragmented ownership and shallow modules; propose focused, evidence-backed refactoring plans."
license: MIT
---

Read [project integration](../../../docs/AGENT_SKILLS.md) and the relevant architecture map before applying this workflow. Local project rules govern all examples and references.

# Improve Codebase Architecture

Find structural changes that reduce the cost of real work in this repository.
Use [codebase design](../codebase-design/SKILL.md) when comparing module interfaces.

1. Bound the review to the requested feature or architectural concern. For a broad
   review, use recent diffs and repeated maintenance pain to choose starting points.
2. Read the current contract in `docs/MASTER_MIMARI_BLUEPRINT.md`, then inspect its
   actual implementation. Historical phases and archived reports are not new tasks.
3. Trace the affected feature's entrypoint, state changes, data loading, persistence,
   actions, hooks and consumers. Identify where each concept has authority.
4. Look for rules duplicated across owners, dependencies pointing the wrong way,
   plugin coupling, excessive knowledge required by callers and broad change surfaces.
   File length alone does not establish an architectural defect.
5. Challenge every candidate with callers, tests and documented reasons. Distinguish
   confirmed problems from intentional compromises and unverified hypotheses.
6. Recommend the smallest useful change. Preserve the composition role of bootstrap,
   core/plugin separation, pure shared functions and centralized state/storage.

For each finding give file evidence, the concrete maintenance problem, proposed owner
or interface, affected consumers, migration risk and meaningful validation.
Order recommendations by impact and confidence. Use a small diagram when it clarifies
relationships. HTML reports and a new domain glossary are optional, not prerequisites.

A review request produces findings; it does not authorize a rewrite. If implementation
is already requested, continue through the scoped refactor and project checks without
introducing an extra approval loop. Alternative designs can be compared in this session.
