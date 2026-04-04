# Epic: Global search and discovery v1
(Read more in docs/features/global-search.md)

Kickoff contract:
- PO owns this Epic and defines desired outcome.
- TDO derives the next Done Increment from this Epic.

## purpose
Provide fast, trustworthy discovery across horses, drivers, races, tracks, and race days in the new app.

## non-goals
- Race prediction model internals.
- Admin tuning workflows.

## user experience
- normal case: users get high-relevance, low-latency cross-entity results.
- edge case: ambiguous short queries return safe minimal response.
- failure / stale / uncertain data: endpoint returns stable empty-structure fallback contract.

## trust rules
- Search ranking should prioritize relevance over noisy recall.
- Cross-entity links must always resolve to canonical entity ids.

## key kpis
- primary kpi: relevant-result precision at top positions.
- secondary kpis: latency and query success rate.
- never-a-kpi: broad recall with broken links.

## data sources and truth
- source of truth: canonical new-app entities derived from migrated data.
- fallbacks: stable empty response structure on internal failures.
- freshness rules: search index sync schedule aligned to ingest updates.

## acceptance criteria
- [ ] Global search contract covers horses, drivers, races, racedays, results, tracks.
- [ ] Relevance strategy and fallback behavior are documented.
- [ ] Query guardrails for short/invalid input are explicit.
- [ ] Link resolution rules to canonical routes/entities are specified.

## debug and verification
- how to reproduce: run fixed query suite and evaluate relevance ordering.
- expected logs (only if needed): query id, category hit counts, latency.
- manual checks: inspect top results for Swedish diacritic and name matching behavior.
- automated checks: contract/fallback and relevance regression tests.

## risks
- risk: search index drift from primary datastore.
- mitigation: synchronization checks and index freshness monitoring.

## dependencies
- prerequisites: `epic-platform-data-foundation.md`, `epic-horse-and-driver-intelligence.md`.
- downstream: none.

## files likely involved
- docs/epics/epic-global-search-and-discovery.md
- docs/features/global-search.md

## documentation update rule
Before starting:
- read: docs/features/global-search.md

After finishing:
- update the same file with:
  - behaviour changes
  - new endpoints / flags / fallbacks
  - edge cases and the best debug step

## change log
- 2026-02-27: Initial epic draft.
