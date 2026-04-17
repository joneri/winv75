# Epic: Team Betting Ownership Model For Proposition Translation

## Epic outcome
Team Betting can deliver translated proposition text in the Kotlin BFF with deterministic behavior, explicit rollout gates, and a shared acceptance contract with WinV75, without creating a parallel interpretation of the translation rules.

## Why this matters
Today the proposition translation capability is implemented and verified in WinV75. Team Betting needs a delivery model that avoids two common failure modes:

1. The BFF copies only `rules.json` and underestimates the runtime logic around normalization, variable extraction, matching, quality flags, and fallback behavior.
2. The teams hand off bundle files ad hoc without a stable working agreement for versioning, acceptance, and incident ownership.

This Epic exists to make translation work operationally safe, not just technically possible.

## Product value
- Betting surfaces can show translated proposition text without depending on local laptop-only workflows.
- Team Betting gets a clear path from consumer to owner instead of an all-at-once rewrite.
- WinV75 and Team Betting can discuss regressions against one shared contract instead of debating screenshots or one-off examples.
- Release risk drops because every change can be validated against the same bundle snapshot, rule version, and golden cases.

## Users and stakeholders
- Team Betting backend engineers implementing or operating the Kotlin BFF.
- WinV75 maintainers who currently own the runtime translation behavior.
- Product and QA stakeholders who need predictable multilingual proposition display.

## Problem statement
Team Betting should not treat proposition translation as a plain dictionary lookup problem. It is a contract made up of:
- explicit rules in `rules.json`
- runtime normalization and template extraction
- quality signalling such as `rule-match`, `fallback-match`, `hybrid-match`, and `unmatched`
- payload shape expectations in overview and raceday responses
- a moving audit baseline and versioned handoff bundle

Without an explicit operating model, Team Betting risks shipping partial parity that looks correct in happy cases but silently regresses exact notices, variable families, quality states, or payload semantics.

## Desired way of working
Team Betting should adopt the translation capability in four controlled stages.

### Stage 1: Consume, do not reinterpret
Team Betting starts by consuming the exported bundle and, where needed, WinV75 runtime output. At this stage the goal is not ownership of translation logic. The goal is contract familiarity and payload-safe integration.

Definition of done:
- Team Betting can ingest the latest bundle.
- Rule version and bundle timestamp are logged in BFF diagnostics.
- `sourceText`, `displayText`, and translation metadata survive intact through the BFF.

### Stage 2: Validate against the shared contract
Team Betting adds automated verification before attempting local execution.

Definition of done:
- `golden-cases.json` is executed in Kotlin tests.
- BFF-level tests assert payload shape using `raceday-samples-*.json` and `overview-*.json`.
- Differences against WinV75 output are treated as contract failures, not “close enough” translations.

### Stage 3: Own explicit-rule execution only
If Team Betting needs local execution, the first owned scope is explicit-rule matching only. This means local Kotlin support for normalization, variable extraction, rule lookup, rendering, and quality mapping for rule-backed cases.

Definition of done:
- Kotlin output matches WinV75 for the explicit-rule corpus represented by the delivered bundle.
- Rule-backed rows preserve the same quality semantics as WinV75.
- Team Betting can prove parity for the current bundle version before enabling local execution in production.

### Stage 4: Decide deliberately on fallback ownership
Fallback behavior is a separate decision, not a hidden extension of Stage 3. If Team Betting needs full local ownership, fallback behavior must be ported and verified as an explicit follow-on increment.

Definition of done:
- There is an explicit decision on whether fallback remains remote or becomes local.
- If local, the Kotlin fallback layer is validated against WinV75 behavior with dedicated acceptance evidence.
- If remote, the BFF keeps a clear delegation boundary and observability for fallback-served rows.

## Scope boundaries
### In scope
- Bundle-driven team workflow and ownership model.
- Versioned handoff between WinV75 and Team Betting.
- Acceptance criteria for consuming, validating, and optionally porting explicit-rule execution.
- Operational expectations for diagnostics, regressions, and rollout gates.

### Not in scope
- A full immediate rewrite of all translation behavior in Kotlin.
- Replacing WinV75 as the canonical rule-authoring environment.
- Changing frontend payload semantics.
- Treating fallback parity as implied by explicit-rule parity.

## Delivery principles
1. One canonical contract.
WinV75 remains the source of truth for bundle generation and rule evolution until a deliberate ownership transfer says otherwise.

2. Prove parity before widening ownership.
Team Betting should not port fallback logic, new rule authoring, or payload reshaping before explicit-rule parity is demonstrated.

3. Preserve diagnostics.
Every bundle integration must surface bundle timestamp, rule version, and quality distribution so regressions can be traced to a concrete handoff.

4. Fail visibly.
Unknown or unsupported cases must remain visible through quality flags or diagnostics instead of being silently rewritten.

## Acceptance criteria
- The generated export bundle contains a Team Betting Epic artifact that explains the ownership model and rollout gates.
- The generated export bundle still contains the shorter implementation handoff for day-to-day engineering use.
- Team Betting can identify, from the bundle alone, what to consume first, what not to port yet, and how parity must be proven.
- The artifact is specific enough to guide backlog creation, ownership discussions, and regression triage.

## Success signals
- Team Betting plans work in stages instead of one large translation rewrite.
- Bundle version and rule version are part of normal debugging conversations.
- Regressions are discussed against golden cases and sample payloads, not screenshots and informal expectations.
- Ownership boundaries between WinV75 runtime and Team Betting BFF are explicit at every release stage.

## Recommended first backlog for Team Betting
1. Add bundle ingestion and diagnostics in the Kotlin BFF.
2. Add golden-case test execution in Kotlin CI.
3. Add response-shape tests using raceday and overview sample payloads.
4. Decide whether Stage 3 local explicit-rule execution is actually needed.
5. If yes, implement only explicit-rule parity before discussing fallback ownership.

## Related artifacts in the export bundle
- `proposition-translation-bundle.json`
- `rules.json`
- `golden-cases.json`
- `overview-fi.json`
- `overview-en.json`
- `raceday-samples-fi.json`
- `raceday-samples-en.json`
- `team-betting-handoff.md`
