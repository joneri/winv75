# Epic: Weights, presets, and analyst workbench v1
(Read more in docs/features/weight-studio-presets-and-sessions.md)

Kickoff contract:
- PO owns this Epic and defines desired outcome.
- TDO derives the next Done Increment from this Epic.

## purpose
Enable analysts to safely tune strategy knobs, manage profile/preset variants, and measure effect before changes impact production tips.

## non-goals
- End-user public UI polish.
- Core ingestion pipeline internals.

## user experience
- normal case: analyst can test weight/profile variants, persist presets, and inspect effect summaries.
- edge case: unauthorized scope access is blocked with clear feedback.
- failure / stale / uncertain data: workbench avoids applying uncertain presets to production defaults.

## trust rules
- Analyst changes require full traceability and version metadata.
- Scope governance (system/team/personal) must be enforced.

## key kpis
- primary kpi: safe experiment-to-production workflow quality.
- secondary kpis: session trace completeness and rollback speed.
- never-a-kpi: number of presets without evaluation evidence.

## data sources and truth
- source of truth: modeled signal outputs + analyst session logs + profile configs.
- fallbacks: default baseline profile when custom presets unavailable.
- freshness rules: profile activation effects timestamped and versioned.

## acceptance criteria
- [ ] Workbench capability boundaries (weights, presets, profile preview/history) are documented.
- [ ] RBAC and scope governance rules are explicit.
- [ ] Session telemetry contract is defined for post-analysis audit.
- [ ] Activation and rollback process is documented.

## debug and verification
- how to reproduce: execute sample analyst session and verify persisted telemetry + profile history.
- expected logs (only if needed): session id, actor scope, profile version.
- manual checks: confirm scope restrictions for system/team presets.
- automated checks: permission and persistence tests.

## risks
- risk: analyst settings leak into production without validation.
- mitigation: gated activation flow with mandatory preview evidence.

## dependencies
- prerequisites: `epic-modeling-elo-and-form-elo.md`, `epic-race-prediction-and-tips-engine.md`.
- downstream: `epic-observability-ops-and-governance.md`.

## files likely involved
- docs/epics/epic-weights-presets-and-analyst-workbench.md
- docs/features/weight-studio-presets-and-sessions.md
- docs/features/ai-profiles-and-preview.md

## documentation update rule
Before starting:
- read: docs/features/weight-studio-presets-and-sessions.md

After finishing:
- update the same file with:
  - behaviour changes
  - new endpoints / flags / fallbacks
  - edge cases and the best debug step

## change log
- 2026-02-27: Initial epic draft.
