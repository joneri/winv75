# AIM 1.4 installation, status, and configuration

## Purpose
Explain how AIM is installed and activated, how users inspect runtime state, and how effective runtime configuration is derived without confusing shared runtime behavior with adapter-specific entrypoints.

## User experience
Users should be able to answer:
- what is the minimum viable AIM setup
- where AIM runtime guidance lives
- where repo-local AIM state lives
- how to inspect current status
- how to inspect effective runtime configuration
- how to validate and upgrade AIM safely

## How it works
There is one shared mental model:
- AIM core defines the method
- AIM runtime defines state, resume, validation, and `.aim`
- repo-aware policy defines repository-specific constraints
- platform adapters expose the user-facing entrypoints

The installation surface depends on adapter:
- Codex:
  - repo-aware AIM requires the repository AIM docs and shared instruction-layer files
  - the AIM skill is required only for the `/aim` command surface and other Codex convenience commands
  - without the skill, Codex can still start repo-aware AIM from an explicit AIM prompt when the repo contract is present
- Copilot:
  - requires the repository AIM docs plus `.github/agents/aim*.agent.md`
  - may add `.github/prompts/*.prompt.md` for packaged Copilot command entrypoints
- Claude Code:
  - requires the repository AIM docs plus `.github/agents/aim*.agent.md` and `CLAUDE.md`
  - may add `.claude/agents/` and `.claude/commands/` as helper packaging
  - in this repository, a minimal Claude starter layer is shipped for discoverability and onboarding

Repo-local runtime state lives in:
- `.aim/`

The shared runtime contract lives in repository docs, primarily:
- `AGENTS.md`
- `docs/workflow/agile-iteration-method.md`
- AIM 1.4 runtime feature docs

### Status model
`/aim status` should show:
- current Epic
- current active Done Increment
- current role
- current mode
- current gate or last passed gate
- runtime adapter
- key repo-aware decisions
- controlled parallel support availability and enablement

### Effective configuration model
`/aim config` should explain configuration from four sources:
1. AIM core behavior
2. AIM runtime checkpoint and mode from `.aim/state.json`
3. repository policy from `AGENTS.md` and `.github/agents/aim*.agent.md`
4. adapter-specific capabilities and limitations from `.github/prompts/`, `CLAUDE.md`, and `.claude/`

Configuration guidance must remain explanatory, not magical.
If a behavior comes from repo policy or adapter limits, AIM should say so explicitly.

### Installation model
Minimum viable setup:
- AIM docs and repo policy files present in the repository
- `.github/agents/aim*.agent.md` present as shared AIM instruction-layer files
- `.aim/` created automatically on first valid start or resume when missing

Codex command-surface layer:
- the `agile-iteration-method` skill, or another compatible Codex AIM runtime adapter, exposes `/aim`
- that layer is optional for repo-aware AIM itself
- that layer is required for `/aim`, `/aim help`, `/aim status`, `/aim config`, `/aim validate`, and `/aim upgrade 1.2-to-1.4` in Codex

Adapter entrypoints:
- Codex:
  - `/aim ...` when the skill is installed and enabled
  - explicit AIM prompt when the repo contract is present but the skill is absent
- Copilot:
  - custom `aim` agent, with prompt files optional
- Claude Code:
  - explicit start prompt or repository command helper

### Upgrade model
`/aim upgrade 1.2-to-1.4` should point users to the shared migration workflow and explain:
- version compatibility
- `.aim` normalization
- runtime contract changes
- command-surface changes
- adapter packaging differences

## Inputs and outputs
- Inputs:
  - selected adapter
  - repository policy
  - `.aim/state.json`
  - current AIM version and migration need
- Outputs:
  - installation checklist
  - status summary
  - effective configuration summary
  - validator entrypoint
  - upgrade path

## Key decisions
- prefer one shared runtime mental model with adapter-specific entrypoints
- make `.aim/` the explicit repo-local state location
- keep status terse by default but structurally complete
- treat effective configuration as derived from repo policy plus runtime state, not hidden defaults

## Edge cases
- if the adapter lacks a packaged helper prompt, the conceptual command still exists and the fallback must be explained explicitly
- if `/aim` is missing in Codex, the likely cause is that the skill is missing or disabled
- if `.aim/state.json` exists but is contradictory, status should direct the user to validation and repair instead of pretending the session is healthy
- if repo-aware policy requests a capability the adapter cannot execute, config should preserve the intended rule and show the fallback

## Debugging
The single best check to verify behavior:
- compare `docs/workflow/install-aim-1.4.md`, `docs/workflow/quick-start-aim-1.4.md`, `docs/features/aim-1.4-command-surface-and-onboarding.md`, and `.github/agents/aim.agent.md`

What "good" looks like:
- install steps match actual repo packaging
- Codex docs say clearly that the skill exposes `/aim` but does not replace repo authority
- `.github/agents/aim*.agent.md` are treated as required AIM instruction-layer files rather than Copilot-only decoration
- `.github/prompts/` are treated as optional Copilot helpers
- status and config explain the same state model used by runtime docs
- upgrade guidance points to the official AIM 1.4 migration path
- the Claude Code path names concrete shipped helper files instead of only abstract helper directories

What "bad" looks like:
- install docs imply a packaged command that does not exist here
- config is described as hidden adapter behavior
- status omits gate, role, or adapter context

## Related files
- AGENTS.md
- CLAUDE.md
- .claude/commands/start-aim.md
- .claude/commands/install-aim.md
- .claude/commands/continue-aim.md
- .claude/agents/aim.md
- .github/agents/aim.agent.md
- .github/prompts/install-aim.prompt.md
- .github/prompts/help-aim.prompt.md
- .github/prompts/upgrade-aim-1.2-to-1.4.prompt.md
- docs/workflow/install-aim-1.4.md
- docs/workflow/migrate-aim-1.2-to-1.4.md
- docs/workflow/copilot-layer.md
