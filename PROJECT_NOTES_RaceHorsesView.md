# RaceHorsesView + race/raceday features — working summary (2025-08-10)

Purpose: concise, persistent note to resume work later. Focus on RaceHorsesView and related race/raceday flows.

Goals
- Solidify RaceHorsesView: parsing start info, enriching horses, advantages, ATG/AI comments, rankings, and navigation.
- Ensure services and helpers exist/are wired. Refresh rankings when all horses updated. Smooth prev/next race navigation.

Current state (done)
- Frontend RaceHorsesView.vue:
  - Parses propTexts → start method/handicap; computes showStartPositionColumn; race/track meta; spelformer (games).
  - Enriches horses: stats (wins/top3/avg placing), buckets per track/distance/method, preferred start method, driver ELO.
  - Advantages chips: Skobyte, favorite track, favorite start position, like-distance, like-autostart/voltstart; tooltip/overflow handling.
  - ATG comments and past race comments via atgExtendedRaw only (filtered, excludes qualifiers, max last 5, sorted desc).
  - AI horse summary via fetchHorseSummary with clear UI feedback and saved/new badges.
  - Rank table enrichment and plusPoints; Start List dynamic headers based on showStartPositionColumn and handicap.
  - Navigation UI for previous/next races present.
  - Watches/lifecycle: fetches data, track info, spelformer; updates rankings when all horses updated.
- Backend:
  - horse-ranking.js: favorites (start method/position/track), odds labels, placements, ELO linkage.
  - update-elo-ratings.js: recent races aggregation + processing pipeline.
  - raceday-model.js: horse fields include shoeOption/previousShoeOption, aiSummary, propTexts, earliestUpdatedHorseTimestamp.
  - raceday-service.js: updates horses then sets earliestUpdatedHorseTimestamp per race.

Gaps / pending
- Helpers to verify/import/implement in RaceHorsesView:
  - formatStartListShoe, startListShoeTooltip
  - formatShoe, shoeTooltip
  - getShoeById, getShoeTooltipById
  - formatElo (if not already available)
- Implement missing methods:
  - goToRace(raceId) used by prev/next buttons.
  - fetchUpdatedHorses to populate updatedHorses and drive allHorsesUpdated → ranking refresh.
- Verify services exist/imports are correct: RaceHorsesService, RacedayService, TrackService, HorseService.
- Confirm component contracts still align: RankedHorsesTable, StartListTable, HorseCommentBlock.
- Validate advantages builders (buildConditionAdvantages/buildPlusAdvantages/getAdvantages) cover edge cases and orderKeys matches emitted keys.
- AI summary: ensure persistence/sync of saved summaries; UI shows “sparad/ny” correctly.

Code map
- Frontend
  - frontend/src/views/race/RaceHorsesView.vue
  - frontend/src/views/race/store.js
  - frontend/src/views/race/components/StartListTable.vue
  - frontend/src/views/race/components/RankedHorsesTable.vue
  - frontend/src/views/race/components/RaceTabs.vue
  - frontend/src/views/race/components/HorseCommentBlock.vue
  - frontend/src/views/raceday/RacedayView.vue
  - frontend/src/views/raceday/components/RaceCardComponent.vue
  - frontend/src/views/raceday/services/RacedayService.js
  - frontend/src/views/race/services/RaceHorsesService.js
  - frontend/src/views/race/services/TrackService.js
  - frontend/src/views/race/services/HorseService.js
  - frontend/src/components/SpelformBadge.vue
  - frontend/src/views/raceday-input/RacedayInputView.vue
  - Note: there is also frontend/src/views/RaceHorses/RaceHorsesView.vue (potential duplicate/legacy)
- Backend
  - backend/src/horse/horse-ranking.js
  - backend/src/horse/update-elo-ratings.js
  - backend/src/horse/horse-model.js
  - backend/src/raceday/raceday-model.js
  - backend/src/raceday/raceday-service.js

Recent tool actions
- Searched the workspace for functions/strings across frontend and backend (helpers, advantage builders, ranking/ELO, AI summary flow).
- Listed directories to confirm race/raceday structure and component/service locations.

Next steps (short)
- Locate or add missing helpers; wire imports. Implement goToRace and fetchUpdatedHorses.
- Verify service methods exist and update call sites.
- Re-run rankings update flow; ensure allHorsesUpdated triggers ranking dispatch.
- Double-check StartList/Ranked tables for header/field alignment.
- Sanity-check AI summary save/load states.
