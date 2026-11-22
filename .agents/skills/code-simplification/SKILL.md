---
name: code-simplification
description: "Simplify a working function or module while preserving behavior, side-effect ordering and public contracts; use for scoped cleanup or refactoring."
license: MIT
---

Read [project integration](../../../docs/AGENT_SKILLS.md) and the relevant architecture map before applying this workflow. Local project rules govern all examples and references.

# Code Simplification

Reduce the amount a maintainer must understand without changing observable behavior.

1. Understand why the code exists, who calls it and which invariants it protects.
   Consult history only when the reason is unclear.
2. Scope work to the requested code. Find needless nesting, repeated policy, dead
   branches or pass-through abstractions with no ownership or isolation value.
3. Preserve outputs, errors, mutation order, listener order, async loading/cache behavior,
   persisted values and HTML escaping. Do not remove validation to shorten code.
4. Use the existing canonical helper before adding another. Keep feature rules in the
   feature, shared helpers pure and state/storage mutations behind their gateways.
5. Make cohesive, reviewable changes. Split responsibilities to respect 300 lines;
   neither compressed code nor merging across core/plugin boundaries is simplification.
6. Verify the changed behavior with existing tests, adding a regression case only for
   a meaningful gap. Preserve tests rather than deleting checks to obtain a green run.

Explain what complexity disappeared, why behavior remains equivalent and which checks
ran. Separate unrelated cleanup from feature work; do not require new commits or PRs
when the user only asked for an implementation in the current workspace.
