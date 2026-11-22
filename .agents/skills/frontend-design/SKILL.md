---
name: frontend-design
description: "Direct distinctive, intentional UI/UX design choices; establish deliberate typography, color palettes and layouts without falling into generic AI aesthetic defaults."
license: Apache-2.0
---

Read [project integration](../../../docs/AGENT_SKILLS.md) and the relevant architecture map before applying this workflow. Local project rules govern all examples and references.

# Frontend Design

Give every feature and view an intentional, cohesive visual identity grounded in educational publishing and classroom use. Reject generic "AI-generated" defaults: identical rounded cards, decorative purple gradients, arbitrary uppercase eyebrows, and repetitive pill badges.

1. Ground the design in the subject and user context: AÖL students on mobile phones, teachers on large interactive whiteboards (Akıllı Tahta), or printed booklet outputs.
2. Define a deliberate palette and typography hierarchy using existing CSS custom properties (`base.css`, appearance themes) before adding new styles.
3. Structure visual hierarchy around content semantics: questions, choices, explanations and actions have distinct weights. Spend visual boldness in one focal area; keep surrounding controls quiet.
4. Keep micro-interactions and motion purposeful: animate only `transform` and `opacity` in response to user actions (selecting, revealing, expanding). Avoid unsolicited bouncing or staggered scroll fades.
5. Respect modular CSS rules: keep styles under `src/styles/`, observe the 300-line file limit using component imports, and ensure dark/light theme tokens and print styles stay intact.
6. Review with the project's [web-design-guidelines](../web-design-guidelines/SKILL.md) before finalizing.

Deliverables: concise design rationale, token mappings (colors, spacing, typography), affected CSS files, and responsive/whiteboard layout considerations.
