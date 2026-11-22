---
name: project-architect
description: "Plan a substantial feature or system change as a specification, technical design and ordered tasks; use for explicit planning, not routine bug fixes."
license: MIT
---

Read [project integration](../../../docs/AGENT_SKILLS.md) and the relevant architecture map before applying this workflow. Local project rules govern all examples and references.

# Project Architect

Turn a substantial request into a concrete implementation plan for this existing project.

1. Extract goals, users, behavior and acceptance criteria from the conversation and
   existing docs. Ask only for missing information that changes the plan materially.
2. Retain Vite, ES modules, DOM-based UI and gradual strict TypeScript. Start from the
   current architecture contract, not a fresh scaffold or generic stack recommendation.
3. Write a specification of the requested behavior and its boundaries.
4. Describe implementation ownership, module contracts, data/state flow, events/hooks,
   compatibility, failure modes and justified trade-offs.
5. Break work into dependency-ordered tasks. Each task names exact existing files or
   proposed files, observable acceptance criteria and relevant validation commands.
6. When a saved plan is requested or materially useful, use a focused file under `docs/`
   following existing conventions. Reference canonical architecture instead of creating
   a second master blueprint. Keep the amount of documentation proportional to the task.

Use reference templates only for the requested output:
- [Discovery](references/elicitation-guide.md): unresolved requirements.
- [Specification](references/specification-guide.md): behavior and acceptance criteria.
- [Implementation](references/implementation-guide.md) and
  [patterns](references/design-patterns.md): technical choices.
- [Tasks](references/tasks-guide.md): an executable task breakdown.
- [Agent prompt](references/agent-prompt.md): only when the user asks for a handoff prompt.

The references include greenfield examples; omit initialization, framework replacement,
branding and blanket task-count requirements for this established application. Use the
available host question tool only when a question is needed. Existing authorization to
plan and implement covers both phases; do not pause for approval between documents.
A plan alone does not authorize implementation, external writes, commits or deployment.
