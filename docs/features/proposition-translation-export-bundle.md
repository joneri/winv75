# Proposition Translation Export Bundle

## Purpose
Make the proposition-translation work shareable outside the local WinV75 laptop environment by exporting rules, audit output, sample payloads, and portable acceptance cases into one reproducible bundle.

## How it works
Run `cd backend && npm run export-proposition-translation-bundle`.

The same bundle can also be downloaded from the GUI on `/propositioner/oversattning` via two buttons:
- `Ladda ner JSON-bundle`
- `Ladda ner ZIP-paket`

The export script reads the merged rule catalog through the shared loader. The editable rule source lives in `docs/proposition-translation/rules/`, while the exported bundle still emits the same merged `rules.json` contract together with the latest full-corpus audit from `docs/proposition-translation/audit-report.json` and the local MongoDB raceday corpus. It then writes a shareable bundle under `docs/proposition-translation/export-bundle/latest/`.

The bundle includes:
- `proposition-translation-bundle.json`: one single-file export that contains everything below in one downloadable JSON payload
- `proposition-translation-bundle-package.zip`: one downloadable archive that contains the single-file bundle plus all split artifacts below
- `rules.json`: the explicit rule contract
- `audit-report.json`: the current coverage snapshot
- `overview-fi.json` and `overview-en.json`: sample overview API payloads
- `raceday-samples-fi.json` and `raceday-samples-en.json`: sample translated raceday payloads in the same shape as the frontend consumes
- `golden-cases.json`: portable expected outputs and quality flags for a curated set of proposition texts across `sv`, `fi`, and `en`
- `README-team-betting.md`: a short start-here note in the ZIP root that points Team Betting to the Epic, the implementation handoff, and the acceptance cases
- `team-betting-handoff.md`: a short implementation note for the Kotlin/BFF team
- `team-betting-translation-epic.md`: a higher-level Team Betting Epic that explains ownership, rollout stages, and acceptance boundaries for translation work
- `manifest.json`: bundle metadata, file descriptions, and consumer guidance

## Key decisions
- Keep `rules.json` as the exported explicit-rule contract while allowing the repository source to live in smaller rule shards under `docs/proposition-translation/rules/`.
- Provide one single downloadable JSON file for handoff to external teams that do not have access to the local laptop environment.
- Provide one ZIP package that combines the single-file bundle and the split artifacts in one deliverable.
- Export both contract data and runtime-shaped sample payloads so downstream teams do not need to reverse-engineer frontend expectations.
- Include `golden-cases.json` so another stack, such as a Kotlin BFF, can validate a reimplementation against the same acceptance examples.
- Include a short ZIP-root README so the receiving team has one obvious “start here” file.
- Include a short `team-betting-handoff.md` file inside the package so the receiving team gets usage guidance together with the data.
- Include a separate Team Betting Epic inside the package so the receiving team gets a durable operating model, not just file-by-file implementation notes.
- Keep the export reproducible from local data rather than hand-curated ZIP files.

## Inputs/outputs
- Inputs:
  - local MongoDB `winv75` data
  - `docs/proposition-translation/rules/`
  - generated `docs/proposition-translation/rules.json`
  - `docs/proposition-translation/audit-report.json`
- Output directory:
  - `docs/proposition-translation/export-bundle/latest/`
- Runtime download endpoint:
  - `GET /api/proposition-translations/export-bundle?format=json|zip`

## Edge cases
- The bundle reflects the data available on the machine that generated it. If local MongoDB is stale, the samples will also be stale.
- The bundle is designed for handoff and prototyping, not as a low-latency production integration format.
- `rules.json` alone is not sufficient to reproduce full runtime behavior; normalization, explicit matching, and fallback behavior are also represented indirectly through sample payloads and golden cases.

## Debugging
- Primary command: `cd backend && npm run export-proposition-translation-bundle`
- GUI path: `/propositioner/oversattning` -> `Ladda ner JSON-bundle` or `Ladda ner ZIP-paket`
- What good looks like: the command prints the output directory and generated file list, and `manifest.json` reports the expected rule version.
- What bad looks like: MongoDB connection failure, missing audit file, or empty sample payload files.

## Related files
- `scripts/export-proposition-translation-bundle.mjs`
- `backend/src/proposition/proposition-translation-rules-loader.js`
- `docs/proposition-translation/rules/`
- `docs/proposition-translation/rules.json`
- `docs/proposition-translation/audit-report.json`
- `backend/src/proposition/proposition-translation-service.js`
- `backend/src/proposition/proposition-translation-export-service.js`
- `docs/features/proposition-translation-team-betting-handoff.md`
- `backend/src/proposition/proposition-translation-routes.js`
- `backend/src/raceday/raceday-core-routes.js`
- `frontend/src/views/proposition-translation/PropositionTranslationOverview.vue`