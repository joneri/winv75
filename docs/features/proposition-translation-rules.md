# Proposition translation rules

## Purpose
Let WinV75 translate proposition text predictably with predefined rules and variables instead of paying for runtime AI translation of every race proposition.

## How it works
The audit reads every MongoDB `winv75.racedays.raceList.propTexts` entry. Each source sentence is normalized into a template by replacing recurring values such as distance, start method, runner count, prize ladders, minimum prize, total prize cap, driver rules, priority rules, honorary prizes, half-row notices, and handicap allowance segments with named variables.

Matched templates are rendered through `docs/proposition-translation/rules.json`, which stores Swedish, Finnish, and English render strings. Swedish remains the default source language; Finnish and English are deterministic renderings from the same variables.

When an explicit rule is missing, the backend now applies deterministic fallback translation for recurring unmatched sentence families such as eligibility notices, title fragments, priority clauses, draw/selection instructions, fee notices, and common series notes before leaving the source text untouched. This includes mixed eligibility clauses that combine earnings/points ranges with licence-holder requirements, stakes-payment suffixes such as `som kvarstår efter fjärde insatsen`, non-winner suffixes such as `som ej segrat`, recurring title fragments such as series rounds and presented-by labels, recurring semifinal/final administration sentences such as final distance, queue/priority order, clarification notices, and mandatory scratchings, plus the remaining standalone `EX` series one-liners for score scales, driving-offence deductions, point-allocation clauses, gift-card rewards, membership notices, and short hospitality/info notes. High-frequency wildcard authority clauses, UET specialty sentences, and world-record clauses are now primarily handled through explicit rules in `rules.json` instead of relying on fallback translation. The most frequent `V` clauses now also have explicit generic rule templates for short eligibility subjects, pure breed-only subject rows such as `Svenska och norska kallblodiga.`, rider/driver birth constraints including monté-limited rider variants, bare exact-age earnings ranges, widened age-range min/max/range clauses such as `3-4-åriga lägst ...` and `5-6-åriga svenska och norska kallblodiga lägst ...`, generic non-winner, victory-limit, completed-totalizator, and licence-holder suffix families on max/range/min clauses including single-letter `A-` and `K-` licence-holder variants, explicit trainer-activity limits such as `Hos tränare som gjort högst 150 starter under 2024.`, uninterrupted `I oavbruten B-träning fr.o.m. {date}.` date clauses, the common compound `... kr samt ... kr.` range family, compound `range samt range` variants where the second clause carries points/training or licence-holder suffixes, compound `range samt ... lägst ...` variants, and the small malformed joined driver-limit artifacts where source data omits a space after a period. Common `V` rows like `2-åriga svenska (ej mockinländare).`, `4-åriga och äldre.`, `Svenska och norska kallblodiga.`, `3-åriga 1.500 - 125.000 kr.`, `3-åriga högst 50.000 kr.`, `3-åriga och äldre högst 20.000 kr som har högst 1 seger.`, `3-4-åriga lägst 50.001 kr.`, `5-6-åriga svenska och norska kallblodiga lägst 225.001 kr.`, `Hos tränare som gjort högst 150 starter under 2024.`, `Ryttare födda 070529 eller tidigare med högst 30 montélopp under 2024.`, `4-åriga och äldre 75.001 - 225.000 kr, körda av A- licensinnehavare.`, `3-åriga och äldre lägst 50.001 kr som har fullföljt minst 1 totalisatorlopp fr.o.m. 18 augusti 2025.`, `Körsvenner födda 070113 eller tidigare.680.001-880.000 kr körsvenner med högst 10 sulkylopp under 2024.`, `I oavbruten B-träning fr.o.m. 260310.`, `3-åriga och äldre 100.001 - 325.000 kr, körda av B- eller K- licensinnehavare anställd av A/B-tränare.`, `3-åriga och äldre hingstar och valacker 75.001 - 220.000 kr samt 3-åriga och äldre ston 75.001 - 320.000 kr.`, and `Ryttare födda ... eller tidigare.` no longer sit only in the fallback layer.

The backend exposes both explicit-rule coverage and runtime translated coverage through `GET /api/proposition-translations/overview?propLanguage=sv|fi|en`. The frontend overview page at `/propositioner/oversattning` keeps the audit panels rule-only, while per-proposition rows show both audit rule coverage and runtime display coverage so fallback-translated rows are no longer presented as if they lacked translation entirely. Raceday details accept `propLanguage=sv|fi|en`; non-Swedish responses keep source text and add translated display text for supported proposition rows.

Allowance rules are parsed into structured segments before rendering:
- earnings thresholds, for example `20 m vid vunna 110.001 kr`
- points thresholds, for example `20 m vid 501 poäng`
- category allowances, for example `20 m för hingstar och valacker`
- combined runner-count and no-track-reservation notes

## Key decisions
- Keep MongoDB proposition data unchanged.
- Treat rule coverage as measurable audit output before shipping UI language switching.
- Store the first rule contract as JSON so it can later be consumed by backend endpoints or frontend tooling.
- Keep Finnish and English strings reviewable rather than hidden inside code.
- Keep the raceday language switch read-only and reversible; Swedish source text remains available in every translated `propText`.

## Inputs/outputs
- Input: stored raceday documents from MongoDB collection `racedays`.
- Included proposition types: all stored `propTexts` types, currently `U`, `L`, `V`, `FX`, `T`, `P`, `EX`, and `H`.
- Rule input: `docs/proposition-translation/rules.json`.
- Generated output: `docs/proposition-translation/audit-report.json` and `docs/proposition-translation/audit-report.md`.
- API output: `GET /api/proposition-translations/overview?propLanguage=fi` returns audit summary, language labels, per-race proposition coverage, translated `displayText` rows, and separate `ruleCoveragePct` / `translatedCoveragePct` plus fallback-aware quality states.
- Raceday output: `GET /api/raceday/:id?propLanguage=fi` or `en` adds `displayText`, `sourceText`, and `translation` metadata to translated proposition text rows.

## Edge cases
- Unmatched templates remain visible in the audit until a rule is added, but runtime display coverage can still reach 100% for a proposition when deterministic fallback translation covers the remaining missing-rule families.
- Free-text-heavy types such as `V`, `EX`, `L`, and `FX` can still show lower explicit-rule coverage than runtime display coverage because some clauses are handled by fallback translation instead of a stored audit rule, although the audited `V` corpus is now fully explicit-rule covered at the sentence level, including monté rider race-limit clauses, single-letter A/K licence-holder variants, completed-totalizator suffixes, trainer-start-limit clauses, uninterrupted `B`-training date clauses, the generic V non-winner and victory-limit families, the common `samt`-joined V compound range families including secondary-suffix and secondary-minimum variants, and the small malformed joined driver-limit artifacts. Mixed-language residue now primarily comes from long series free text, recurring one-line series administration snippets, or title fragments and should be fixed in the runtime fallback layer when no reusable audit rule exists yet.
- Prize ladders keep the original formatting, including parenthesized lower prizes, to avoid accidental money changes.
- Finnish and English wording should still be human-reviewed before being labeled production quality, even though the current audited corpus now resolves through explicit rules plus deterministic fallback translation.

## Debugging
Run `node scripts/audit-proposition-translations.js` from the repository root to refresh explicit-rule coverage. A good run prints coverage counts and updates both audit reports. Run `cd backend && npm test` to verify the deterministic fallback translation layer.

## Related files
- `scripts/audit-proposition-translations.js`
- `backend/src/proposition/proposition-translation-service.js`
- `backend/src/proposition/proposition-translation-routes.js`
- `backend/tests/proposition-translation-service.test.js`
- `docs/proposition-translation/rules.json`
- `docs/proposition-translation/audit-report.json`
- `docs/proposition-translation/audit-report.md`
- `frontend/src/views/proposition-translation/PropositionTranslationOverview.vue`
- `frontend/src/views/raceday/RacedayView.vue`
- `docs/features/raceday-overview-and-game-context.md`
