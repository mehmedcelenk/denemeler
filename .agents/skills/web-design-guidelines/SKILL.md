---
name: web-design-guidelines
description: "Audit UI/UX code against web interface standards, accessibility (WCAG), mobile ergonomics, focus visibility, motion, touch targets, and dark mode."
license: MIT
---

Read [project integration](../../../docs/AGENT_SKILLS.md) and the relevant architecture map before applying this workflow. Local project rules govern all examples and references.

# Web Design Guidelines

Audit front-end markup and CSS for usability, accessibility, mobile ergonomics, and visual polish. Use the local checklist in [web interface rules](references/web-interface-rules.md).

1. Scope the review to modified HTML/CSS/JS view templates and style files.
2. Audit accessibility:
   - Icon-only buttons must have `aria-label` and `type="button"`.
   - Semantic tags (`<button>`, `<a>`, `<label>`) over clickable `<div>`s.
   - Visible keyboard focus via `:focus-visible` (never bare `outline: none`).
   - Appropriate `aria-live="polite"` on async toasts or dynamic status updates.
3. Audit touch and mobile ergonomics:
   - Touch targets at least 44x44px; `touch-action: manipulation` for rapid tap response.
   - Full-bleed layouts respect `env(safe-area-inset-*)` (bottom nav, drawers).
   - Prevent horizontal overflow (`overflow-x: hidden` on viewport roots).
4. Audit typography, motion, and theming:
   - `tabular-nums` for timers, question indices, and scores.
   - Respect `prefers-reduced-motion`; animate only `transform` and `opacity`.
   - Contrast ratios and `color-scheme` consistency across dark/light and high-contrast modes.
5. Audit multi-device constraints: mobile bottom nav, desktop multi-column, classroom board, and `@media print`.

Output findings in concise `file:line` format with defect, impact, and concrete fix.
