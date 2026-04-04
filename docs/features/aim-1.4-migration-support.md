# AIM 1.4 migration support

## Purpose
Define a practical migration path so repositories already using AIM 1.2 can adopt AIM 1.4 runtime contracts without losing workflow continuity.

## User experience
Users migrating an existing repository should be able to answer:
- whether the repo can start AIM 1.4 immediately
- which legacy artifacts may stay temporarily
- which artifacts must become authoritative in AIM 1.4
- whether startup, resume, or validator behavior will stop and ask during migration

## How it works
Migration to AIM 1.4 reuses the accepted runtime contracts rather than inventing a separate upgrade mode.

### Supported scenarios
- no `.aim` exists:
  - create the official `.aim` workspace during AIM 1.4 startup
  - initialize `.aim/epic.md` and `.aim/state.json` from the active Epic context
- informal `.aim` exists:
  - retain useful helper artifacts temporarily
  - move authoritative runtime state into the official AIM 1.4 workspace contract
- Codex-only repo:
  - adopt the AIM 1.4 runtime model without requiring the optional Copilot layer
- Copilot-layer repo:
  - keep `.github/agents/aim*.agent.md` if needed, but align them to the shared runtime model instead of adapter-specific assumptions

### Upgrade checklist
- confirm repo-aware context still loads through the accepted layer order
- create or normalize `.aim`
- make `state.json` the durable runtime checkpoint
- update docs to distinguish core, runtime, repo-aware policy, and adapters
- keep startup, resume, and validator behavior aligned with accepted AIM 1.4 runtime rules

### Legacy artifact policy
- tolerated temporarily:
  - helper artifacts such as `.aim/plan.md`
  - adapter helper files that remain secondary to the official runtime contract
- migrated:
  - active Epic context into `.aim/epic.md`
  - active runtime checkpoint into `.aim/state.json`
  - AIM 1.2-only runtime wording into AIM 1.4 terminology
- archived:
  - stale logs, analysis notes, and superseded helper artifacts after their decision value is preserved elsewhere
- removed or replaced:
  - legacy files that claim authoritative gate, role, increment, or acceptance ownership outside `state.json`
  - stale repo instructions that contradict accepted AIM 1.4 bootstrap, ownership, or validator behavior

## Inputs and outputs
- Inputs:
  - existing AIM 1.2 repo docs
  - current `.aim` artifacts, if any
  - repository profile and adapter guidance
  - active runtime checkpoint and validator results
- Outputs:
  - one AIM 1.4-aligned repository profile
  - one official `.aim` workspace contract
  - one explicit classification of legacy artifacts
  - one documented upgrade checklist

## Key decisions
- keep AIM core unchanged and focus migration on runtime explicitness
- tolerate useful legacy helper artifacts temporarily instead of forcing destructive cleanup
- make the official AIM 1.4 checkpoint authoritative as early as possible
- treat migration contradictions as runtime-trust issues, not formatting issues

## Defaults and fallbacks
- if `.aim` is missing, create it during startup
- if legacy artifacts are useful but non-authoritative, keep them temporarily
- if legacy artifacts contradict `state.json` or repo policy, stop and escalate
- if the platform lacks some optional capability, migrate to the same runtime contract with sequential fallback

## Edge cases
- a repo may already have `.aim/plan.md` or similar helper files; these do not block migration if they stay secondary
- a Codex-only repo may migrate without adding new Copilot-layer files
- a Copilot-layer repo may keep adapter helper files, but they must not redefine the shared runtime contract
- validator results may be `recoverable` during migration when required artifacts can be created without trust loss

## Data correctness and trust
Must remain true:
- migration does not create a second authoritative state source
- startup and resume still rely on the official runtime checkpoint
- validator checks during migration use the same result classes as normal runtime operation
- only the main AIM thread may repair shared state during migration

## Debugging
The single best check to verify behavior:
- compare the migrated `.aim/state.json`, `.aim/epic.md`, repo docs, and any retained legacy helper artifacts and confirm there is only one authoritative runtime checkpoint

What "good" looks like:
- a repo can explain how AIM 1.4 starts and resumes after migration
- legacy helper artifacts are clearly secondary
- validator results cleanly separate recoverable gaps from contradictions

What "bad" looks like:
- old helper files appear to own the current gate or acceptance state
- startup or resume depends on guessing between multiple candidate checkpoints
- migration guidance silently requires optional adapter features

## Related files
- AGENTS.md
- docs/workflow/agile-iteration-method.md
- docs/workflow/migrate-aim-1.2-to-1.4.md
- docs/features/aim-1.4-runtime-workspace.md
- docs/features/aim-1.4-bootstrap-and-resume.md
- docs/features/aim-1.4-validator-support.md
- docs/epics/aim-1.3-unified-runtime.md

## Change log
- 2026-03-28: Created AIM 1.4 migration support contract covering migration scenarios, upgrade checklist, legacy artifact policy, and validator/startup/resume alignment.
