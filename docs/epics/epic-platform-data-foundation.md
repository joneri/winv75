# Epic: Platform data foundation v1
(Read more in docs/features/raceday-ingestion-and-listing.md)

Kickoff contract:
- PO owns this Epic and defines desired outcome.
- TDO derives the next Done Increment from this Epic.

## purpose
Build a reliable, scalable data foundation for all ATG races with Svensk Travsport ingestion and first-class historical continuity from existing MongoDB.

## non-goals
- Final modeling logic for tip generation.
- Frontend UX implementation.

## user experience
- normal case: all ATG races are available with stable, normalized data contracts.
- edge case: missing provider fields are handled by deterministic fallbacks.
- failure / stale / uncertain data: stale windows are surfaced and downstream predictors degrade safely.

## trust rules
- Historical data lineage must be preserved from current MongoDB collections.
- Race/horse/driver identifiers must be stable and traceable across old and new schemas.

## key kpis
- primary kpi: successful ingestion and normalization coverage for all ATG races.
- secondary kpis: migration completeness of historical collections; schema validation pass rate.
- never-a-kpi: ingest speed without correctness guarantees.

## data sources and truth
- source of truth: Svensk Travsport + ATG race metadata + current Mongo historical collections.
- fallbacks: existing raw payload snapshots in Mongo when provider retries fail.
- freshness rules: ingestion freshness SLA defined per race-day and per race update phase.

## acceptance criteria
- [ ] Canonical data model defined for race, horse, driver, track, result, and odds entities.
- [ ] Migration strategy documented for current MongoDB historical data to new schema.
- [ ] Idempotent ingestion strategy defined with replay safety.
- [ ] Data quality checks (nullability, ID consistency, time sanity) are specified.

## debug and verification
- how to reproduce: run ingestion simulation and compare canonical records against source payload snapshots.
- expected logs (only if needed): ingestion job id, source timestamp, normalization summary.
- manual checks: compare selected races old-vs-new for entity integrity.
- automated checks: schema and referential integrity test suite.

## risks
- risk: schema drift across providers breaks mapping.
- mitigation: versioned adapters and contract tests.

## dependencies
- prerequisites: none.
- downstream: all other rewrite epics.

## files likely involved
- docs/epics/new-app-portfolio.md
- docs/epics/epic-platform-data-foundation.md

## documentation update rule
Before starting:
- read: docs/features/raceday-ingestion-and-listing.md

After finishing:
- update the same file with:
  - behaviour changes
  - new endpoints / flags / fallbacks
  - edge cases and the best debug step

## change log
- 2026-02-27: Initial epic draft.
