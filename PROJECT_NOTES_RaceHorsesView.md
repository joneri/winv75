# RaceHorsesView + race/raceday flows — working summary (2025-08-15)

Purpose: concise, persistent note to resume work on RaceHorsesView and related race/raceday flows.

Essential requirements (scope)
- Start info parsing from propTexts → start method/code + handicap; dynamic columns via showStartPositionColumn.
- Horse enrichment: stats/buckets, preferred start method, driver ELO, short-horizon form rating.
- Advantages: Skobyte, Favoritbana, Favoritspår, like-distance (±100m), like-autostart/voltstart (⭐ when preferred).
- Comments/past performances: ATG comments and unified past lines across feed shapes.
- AI: per-horse AI summary with saved/new badges; race AI insights banner + tier chips/prob bars.
- Rankings: refresh when all horses updated.
- Navigation: prev/next race and go to raceday.
- Track meta and spelformer display.

Implemented (done)
- Start info and meta
  - Parse propTexts → { method, code, handicap }; computed raceStartMethod, raceStartMethodCode, hasHandicap.
  - showStartPositionColumn detects Voltstart or any horse whose (actual) start position ≠ program number.
  - Race info display strings: displayStartMethod, displayDistance, displayPrizeMoney → raceMetaString.
  - Track meta (length, open stretch, fav start pos, record) → trackMetaString; spelformer with badges per race leg.
- Start List UI
  - Start cell: program number + highlight star; start pos text varies by Autostart/Voltstart; distance line with Handicap/Försprång badge when actualDistance ≠ race distance.
  - Dynamic headers include AI, #/Start, Häst och info, Form Elo, Kusk, Stats, Fördelar, Skor.
  - Shoe helpers: shoeMap + getShoeById/getShoeTooltipById; formatShoe/shoeTooltip; formatStartListShoe/startListShoeTooltip showing changes (e.g., “Bf r.o. → Skor”).
- Horse enrichment
  - Fetch + merge: fetchRaceFromRaceId, fetchHorseScores, fetchDriverRatings, HorseService.getHorseById.
  - Stats from results: win/top3, average placing, formScore on latest starts; buckets by distance; method stats; best track/distance; preferredStartMethod; favorite driver.
  - Derived fields: statsFormatted, bestTrack, preferredDistance, autostartStats, voltstartStats, driverElo, formRating (short-horizon), recentResultsCore (last 5, normalized/deduped).
- Unified past performances and comments
  - Extract ATG comments (robust; filters qualifiers), fallback to saved past comments when ATG extended missing.
  - buildUnifiedPastDisplay merges core entries with ATG/saved comments by raceKey/date; rendered per horse.
- AI features
  - Per-horse AI summary: builds rich context (ELO, field ELO avg/median/percentile, start, distance, track meta, conditions, unified past) → backend persists summary + meta; UI shows saved “sparad” vs “ny”.
  - Race AI insights: fetchRaceAiList populates aiInsights; banner shows wide-open/spik-allowed/even + A-coverage; per-horse A/B tier chip with tooltip (prob/z/composite), prob bar, highlight star.
- Advantages chips
  - buildPlusAdvantages (Skobyte; Favoritbana; Favoritspår) and buildConditionAdvantages (like-distance; like-auto/volt with ⭐ when preferred).
  - orderKeys define priority; dedup by category; maxAdvChips with overflow tooltip.
- Rankings and refresh
  - updatedHorses via checkIfUpdatedRecently; when allHorsesUpdated, dispatch rankHorses; rankedHorsesEnriched adds plusPoints.
- Navigation
  - Prev/next race buttons using racedayDetails.raceList; goToRace implemented; navigateToRaceDay helper.
- Lifecycle/watchers
  - On mount and on route changes: fetch race, track meta, spelformer, AI insights; preload saved AI summaries and past comments; restore scroll.
- Styling
  - Theme-aware styling for AI banner, AI cells, past performances; dark-mode overrides.

Pending (sanity/integration/UX)
- Sanity-check Start List header/field alignment across scenarios.
- Recheck advantages ordering and dedup in edge cases.
- Confirm AI summary save/load on route changes and offline fallback.
- Integration checks: ensure service methods exist/signatures match (RaceHorsesService: fetchRaceFromRaceId/fetchHorseScores/fetchDriverRatings/checkIfUpdatedRecently/fetchRaceAiList; RacedayService: fetchRacedayDetails/fetchSpelformer; TrackService.getTrackByCode; HorseService.getHorseById).
- Validate component contracts; note legacy components (StartListTable, HorseCommentBlock, RaceTabs) appear unused; RankedHorsesTable present.
- Minor UX: consider “#/Start” header vs potential future split; verify Swedish labels/copy.

Code locations
- Frontend
  - frontend/src/views/race/RaceHorsesView.vue
  - frontend/src/views/race/store.js
  - frontend/src/views/race/components/RankedHorsesTable.vue (present)
  - frontend/src/views/race/components/StartListTable.vue (legacy)
  - frontend/src/views/race/components/RaceTabs.vue (legacy)
  - frontend/src/views/race/components/HorseCommentBlock.vue (legacy)
  - frontend/src/views/raceday/RacedayView.vue
  - frontend/src/views/raceday/components/RaceCardComponent.vue
  - frontend/src/views/raceday/services/RacedayService.js
  - frontend/src/views/race/services/RaceHorsesService.js
  - frontend/src/views/race/services/TrackService.js
  - frontend/src/views/race/services/HorseService.js
  - frontend/src/components/SpelformBadge.vue
  - frontend/src/ai/horseSummaryClient.js
  - frontend/src/views/RaceHorses/RaceHorsesView.vue (legacy/duplicate)
- Backend
  - backend/src/horse/horse-model.js
  - backend/src/horse/horse-ranking.js
  - backend/src/horse/update-elo-ratings.js
  - backend/src/raceday/raceday-model.js
  - backend/src/raceday/raceday-service.js
  - backend/src/race/race-insights.js
  - backend/src/race/race-routes.js
  - backend/src/ai-horse-summary.js

Investigative actions (workspace tooling)
- Searched workspace for key identifiers (start parsing, shoe helpers, advantages, AI summary/insights, rankings) to locate implementations and contracts.
- Read/validated key frontend/back-end files to confirm data flow (RaceHorsesView.vue, store, services; horse-ranking, race-insights, ai-horse-summary, race-routes).
- Listed directories and searched by glob to map components/services and spot legacy/duplicate files.
