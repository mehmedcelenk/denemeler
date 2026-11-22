---
name: codebase-design
description: "Design cohesive modules and small interfaces when changing module responsibilities, dependency boundaries, test seams, or feature extension points."
license: MIT
---

Read [project integration](../../../docs/AGENT_SKILLS.md) and the relevant architecture map before applying this workflow. Local project rules govern all examples and references.

# Codebase Design

Design modules that hide meaningful complexity behind a small, stable interface.
Depth means useful behavior per fact a caller must learn; it is not a line-count ratio.
Use the project's vocabulary for features, core, plugins, events and hooks.

1. Locate the concept's owner, callers and implementation using the feature map.
2. Describe the actual interface: types, invariants, ordering, errors and side effects.
3. Apply the deletion test: would removing this module eliminate needless indirection,
   or scatter necessary complexity across callers? Preserve boundaries that enforce
   storage, validation or plugin isolation even when the adapter is small.
4. Keep decisions that change together in one module. A cohesive module may have
   multiple internal files to respect the project's 300-line limit.
5. Introduce an adapter or hook only for an actual consumer or demonstrated variation.
   Keep shared helpers pure and feature rules with their owner.
6. Compare alternative interfaces when the trade-off matters. Assess caller effort,
   change locality, dependency direction and behavior-level testability.

Return a recommended interface, its consumers, hidden implementation details and
validation plan. Implement only within the user's requested scope.
