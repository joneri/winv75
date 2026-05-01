# Race Profile KPIs

## Purpose

Race profile KPIs make each race easier to read before betting. The view highlights whether the model favorite is a real spike candidate, whether handicap distance changes the picture, and whether start position history gives any active signal.

The race view must show the same model score that the profile talks about. `Modell Elo` is the user-facing name for `effectiveElo`; it is separate from `Class Elo` and `Form Elo`.

The start list is card-based rather than table-based. Each horse gets a full information surface where long result text can use horizontal space while Class Elo, Form Elo, Modell Elo, driver, stats, advantages, and shoes are grouped as compact metric sections.

## How It Works

`GET /api/race/profile/:id` loads the same enriched race data as the race view and builds a race-level profile from the horses' prediction debug data. The profile includes a short narrative, KPI values, distance tiers, lane-bias signals, and handicap penalties.

The race narrative now also includes track lane context from track metadata: fastest winning start position and favorite starting position when available.

Handicap distance is also part of `effectiveElo` / `Modell Elo`: a horse starting longer than the base race distance gets a conservative Elo penalty, while a shorter actual distance gets a smaller capped bonus. Betting suggestions that rely on `effectiveElo` or `modelProbability` therefore inherit the same signal.

## Key Decisions

- The profile explains model signals already used by the race ranking instead of inventing a separate betting model.
- Handicap distance is capped so a 20-100 meter addition matters without overwhelming form, career Elo, driver, track, and lane history.
- Lane history is only presented when the lane-bias model reports an active signal or non-zero delta.
- Horse rows are composed as cards because recent-result text needs width and the old table made related horse facts harder to scan.

## Inputs And Outputs

Input:
- Race id from the race view route.
- Enriched race data from `getRaceWithRatings`.
- Horse `actualDistance`, race `distance`, start position, prediction debug, and rating data.

Output:
- `narrative`
- `topHorse` with `modelElo`, `classElo`, and `formElo`
- `kpis`
- `distanceTiers`
- `laneSignals`
- `handicapPenalties`
- `modelSignalsUsed`

## Edge Cases

- If all active horses use the base distance, the profile shows no handicap.
- If lane history has too little support, the view says that no clear active lane signal exists.
- Withdrawn horses are excluded from the race profile calculations.
- Missing distance data disables the handicap distance adjustment for that horse.

## Debugging

Check `prediction.debug.effectiveEloBreakdown.handicapDistanceDelta` on a horse in a handicap race. A horse with `actualDistance > race.distance` should have a negative delta.

## Related Files

- `backend/src/race/race-profile-service.js`
- `backend/src/race/race-routes.js`
- `backend/src/rating/horse-elo-prediction.js`
- `frontend/src/views/race/RaceHorsesView.vue`
- `frontend/src/views/race/services/RaceHorsesService.js`
