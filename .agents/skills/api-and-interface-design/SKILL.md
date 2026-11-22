---
name: api-and-interface-design
description: "Design typed module contracts, event payloads, card hooks and API boundaries; assess compatibility and validation when those interfaces change."
license: MIT
---

Read [project integration](../../../docs/AGENT_SKILLS.md) and the relevant architecture map before applying this workflow. Local project rules govern all examples and references.

# API and Interface Design

Treat observable behavior as a contract: types alone do not describe timing, ordering,
errors, persistence or retry behavior.

1. Find the existing contract and every relevant consumer before changing it.
2. Specify inputs, outputs, invariants, errors and side effects in strict TypeScript.
   Use discriminated unions when variants have genuinely different valid states.
3. Validate untrusted inputs and remote results at the owning boundary. Browser storage
   and JSON responses still require runtime checks even when TypeScript types exist.
4. Preserve state/store, storage gateway, action registry and card-hook ownership.
   Never add a data-to-app import or expose feature behavior through a shared helper.
5. Assess compatibility for saved answers, question IDs, storage keys, existing callers
   and open browser sessions. Add a migration plan when persisted contracts change.
6. For network endpoints, specify consistent error semantics and timeouts. Address
   idempotency, atomicity and unknown outcomes only where retries can repeat effects.
7. Cover changed boundary behavior with meaningful tests, including invalid data and
   affected existing consumers. Use current project test commands.

Return the contract, ownership, caller impact, compatibility decision and validation.
Do not introduce REST conventions, branding of IDs, pagination, new libraries or extra
abstraction unless the actual interface requires them.
