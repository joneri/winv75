# Epic: Horse and driver intelligence v1
(Read more in docs/features/horse-catalog-and-detail.md)

Kickoff contract:
- PO owns this Epic and defines desired outcome.
- TDO derives the next Done Increment from this Epic.

## purpose
Rebuild horse and driver intelligence surfaces with stronger profiles, richer history context, and more actionable insight for players.

## non-goals
- Core race tip generation algorithms.
- Ticket-composition logic.

## user experience
- normal case: users can search and open horse/driver profiles with meaningful performance context.
- edge case: sparse entities still show safe baseline insight.
- failure / stale / uncertain data: stale indicators are visible and avoid over-interpretation.

## trust rules
- Profile stats must reconcile with canonical historical records.
- Derived metrics must be reproducible from source events.

## key kpis
- primary kpi: profile usefulness for pre-race decision support.
- secondary kpis: query responsiveness and data freshness clarity.
- never-a-kpi: adding unsupported profile fields.

## data sources and truth
- source of truth: canonical horse/driver histories in new platform model.
- fallbacks: reduced detail mode for incomplete records.
- freshness rules: profile freshness timestamp included in responses.

## acceptance criteria
- [ ] Horse and driver profile contracts are defined for new app.
- [ ] Search/list/detail behavior is specified with pagination semantics.
- [ ] Derived metrics and freshness indicators are documented.
- [ ] Linkage between race, horse, and driver entities is explicit.

## debug and verification
- how to reproduce: query sample horse/driver entities and validate linked race history.
- expected logs (only if needed): entity id, history count, freshness timestamp.
- manual checks: verify profile metrics against raw race history.
- automated checks: pagination and aggregation correctness tests.

## risks
- risk: inconsistent entity identity across old/new datasets.
- mitigation: strict identity reconciliation rules and migration checks.

## dependencies
- prerequisites: `epic-platform-data-foundation.md`, `epic-modeling-elo-and-form-elo.md`.
- downstream: `epic-global-search-and-discovery.md`.

## files likely involved
- docs/epics/epic-horse-and-driver-intelligence.md
- docs/features/horse-catalog-and-detail.md
- docs/features/driver-catalog-and-detail.md

## documentation update rule
Before starting:
- read: docs/features/horse-catalog-and-detail.md

After finishing:
- update the same file with:
  - behaviour changes
  - new endpoints / flags / fallbacks
  - edge cases and the best debug step

## change log
- 2026-02-27: Initial epic draft.
