# Epic: Observability, ops, and governance v1
(Read more in docs/features/admin-operations-and-observability.md)

Kickoff contract:
- PO owns this Epic and defines desired outcome.
- TDO derives the next Done Increment from this Epic.

## purpose
Ensure the new platform is measurable, operable, governable, and safe for continuous model/tipping improvement.

## non-goals
- Core prediction algorithm design.
- End-user search/race view UX.

## user experience
- normal case: operators can monitor model/data health and run maintenance workflows confidently.
- edge case: failing subsystems trigger clear status and rollback instructions.
- failure / stale / uncertain data: operator tooling exposes failure early and enforces safe-mode behavior.

## trust rules
- Operational changes must be auditable.
- Critical metrics and alarms must reflect true system health.

## key kpis
- primary kpi: operational reliability and mean time to detect/resolve issues.
- secondary kpis: data freshness SLA adherence and model drift alert quality.
- never-a-kpi: admin action count without outcome validation.

## data sources and truth
- source of truth: runtime metrics, model evaluation outputs, data quality checks, job states.
- fallbacks: degraded-safe operation with read-only diagnostics.
- freshness rules: metrics and health checks must have explicit update intervals.

## acceptance criteria
- [ ] Ops/metrics/alerting contract is documented.
- [ ] Governance policy for model/version rollout and rollback is documented.
- [ ] Admin maintenance flows are defined with safety checks.
- [ ] Data/model quality guardrails and escalation paths are explicit.

## debug and verification
- how to reproduce: run simulated failure scenarios and verify alert + safe-mode behavior.
- expected logs (only if needed): job id, model version, severity, remediation path.
- manual checks: validate dashboard/alert interpretation against known incidents.
- automated checks: health endpoint and alert rule tests.

## risks
- risk: hidden model drift causes silent quality degradation.
- mitigation: mandatory periodic backtest checks and alert thresholds.

## dependencies
- prerequisites: all model and prediction epics.
- downstream: none.

## files likely involved
- docs/epics/epic-observability-ops-and-governance.md
- docs/features/admin-operations-and-observability.md

## documentation update rule
Before starting:
- read: docs/features/admin-operations-and-observability.md

After finishing:
- update the same file with:
  - behaviour changes
  - new endpoints / flags / fallbacks
  - edge cases and the best debug step

## change log
- 2026-02-27: Initial epic draft.
