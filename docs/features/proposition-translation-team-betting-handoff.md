# Team Betting Handoff For Proposition Translation

## Goal
Use the exported proposition-translation bundle to let Team Betting add deterministic translated proposition text in the Kotlin BFF without depending on the WinV75 laptop environment.

For the larger delivery model and ownership boundaries, read the bundled Epic document `team-betting-translation-epic.md` together with this shorter handoff note.

## What to consume first
Use these files in this order:

1. `proposition-translation-bundle.json`
This is the easiest starting point. It contains the complete handoff snapshot in one file.

2. `rules.json`
This is the canonical explicit-rule catalog. It defines variables, templates, and render strings for `sv`, `fi`, and `en`.

3. `golden-cases.json`
This is the acceptance contract. Each case contains source text, proposition type, and expected output plus quality for each language.

4. `raceday-samples-fi.json` and `raceday-samples-en.json`
These show the runtime payload shape that the frontend already consumes.

5. `overview-fi.json` and `overview-en.json`
These show how coverage, rule-match, fallback-match, and proposition-level reporting currently work.

## Recommended Kotlin/BFF rollout
### Phase 1
Do not port the matcher yet.
Load bundle data and use it as a reference contract while the BFF calls WinV75 translation output or consumes exported snapshots during early integration.

### Phase 2
If local Kotlin execution is needed, implement the pipeline in this order:

1. Normalize source sentence to a template.
2. Extract variables from the source sentence.
3. Match the normalized template against `rules.json` for the relevant proposition type.
4. Render target language text from the matched rule.
5. Verify against `golden-cases.json`.

### Phase 3
Only after explicit-rule parity is stable should fallback behavior be ported.
Fallback logic is not fully represented by `rules.json` alone. The sample payloads and golden cases show the current runtime behavior, but the authoritative runtime implementation still lives in WinV75 backend code.

## What each file is for
### `rules.json`
Use for explicit template matching and rendering.
Trust this file as the source of truth for rule ids, variables, and language render strings.

### `golden-cases.json`
Use for automated tests in Kotlin.
Every Kotlin implementation should assert both translated text and quality, for example `rule-match`.

### `raceday-samples-*.json`
Use to shape BFF response payloads sent to the frontend.
They show `displayText`, `sourceText`, and `translation` metadata in the same structure already used by WinV75 UI.

### `overview-*.json`
Use for monitoring and validation tooling.
They show how proposition coverage and quality should be summarized at page and proposition level.

## Important constraints
1. `rules.json` is necessary but not sufficient for full parity.
The Kotlin team should not assume that matching `rules.json` alone reproduces all current runtime behavior.

2. Swedish source text must remain available.
The BFF should preserve `sourceText` and add `displayText` rather than overwrite the source.

3. Quality must be preserved.
Expose whether a row is `rule-match`, `fallback-match`, `hybrid-match`, or `unmatched`.

4. Rule version must be tracked.
Whenever a new bundle is delivered, persist and log the included `ruleVersion`.

## Suggested Kotlin tests
1. Parse `golden-cases.json` and assert exact translated text for `fi` and `en`.
2. Assert expected quality for each language.
3. Assert that BFF raceday payloads match the structure shown in `raceday-samples-*.json`.
4. Assert that bundle `ruleVersion` is logged and surfaced in diagnostics.

## Practical integration options
1. Short term: consume exported bundle files and keep translation generation in WinV75.
2. Medium term: implement explicit-rule matching in Kotlin using `rules.json` and validate with `golden-cases.json`.
3. Long term: port fallback behavior only if Team Betting really needs full local ownership.