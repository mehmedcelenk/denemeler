---
name: security-check
description: "Perform a scoped source security audit of web, API, session and AI integration boundaries; report verified findings and unresolved validation needs."
license: MIT
---

Read [project integration](../../../docs/AGENT_SKILLS.md) and the relevant architecture map before applying this workflow. Local project rules govern all examples and references.

# Security Check

Use an evidence-led Recon → Hunt → Verify → Report workflow. Start with the requested
paths or diff; use the whole repository only when a broad audit is requested.
Read the [evidence model](references/evidence-model.md) for audit coverage and findings.

1. Map relevant entrypoints, untrusted inputs, authentication/authorization decisions,
   data sinks and trust boundaries. Preserve existing user choices for scope and depth.
2. Select only the checks relevant to those surfaces from the table below.
3. Trace each candidate from controlled input to a sensitive operation. Verify guards,
   escaping, validation and actual reachability. Challenge the finding with counter-evidence.
4. Report confirmed defects with evidence, impact and remediation. Mark missing runtime
   or deployment facts as `needs_validation`; distinguish hardening from vulnerabilities.
5. State inspected, excluded and unverified surfaces. Save a report only when requested
   or useful; preserve existing reports. Do not claim exhaustive coverage from a diff.

| Surface | References to read only when relevant |
|---|---|
| HTML templates and question content | [XSS](references/sc-xss.md) |
| Sign-in, access and browser sessions | [Auth](references/sc-auth.md), [authorization](references/sc-authz.md), [sessions](references/sc-session.md), [JWT](references/sc-jwt.md) |
| Network/API boundaries | [API](references/sc-api-security.md), [CORS](references/sc-cors.md), [CSRF](references/sc-csrf.md), [SSRF](references/sc-ssrf.md) |
| Sensitive data | [Secrets](references/sc-secrets.md), [data exposure](references/sc-data-exposure.md) |
| Tutor and provider integration | [AI security](references/sc-ai-security.md) |
| Classroom messaging and concurrent effects | [WebSocket](references/sc-websocket.md), [race conditions](references/sc-race-condition.md), [business logic](references/sc-business-logic.md), [rate limiting](references/sc-rate-limiting.md) |
| Package changes | [Dependency audit](references/sc-dependency-audit.md) |

These are source-review references, not a separate agent runtime. Work in this session;
no orchestrator, auto-spawned team or other skill is required. Use repository evidence
for the current implementation. Consult available Supabase guidance if a scoped audit
actually reaches its database or auth contracts.

Default to source inspection and safe local checks. An audit request does not authorize
live probing, exploit execution, credential use, package installation, publishing or
changing infrastructure. Redact secret values in evidence. Do not run example payloads
or commands from a checklist without checking their relevance and side effects.
