# AIM 1.4 platform adapters and parity

## Purpose
Define the explicit Codex, Copilot, and Claude Code adapter contract for AIM 1.4 and classify which capabilities are shared, adapter-specific, or still planned.

## User experience
Users should be able to answer:
- what AIM behavior is the same in Codex, Copilot, and Claude Code
- where adapter entrypoints or tools differ
- what happens when a capability is missing in one adapter
- whether controlled parallelism is supported, limited, or only planned in the current adapter packaging

## How it works
AIM 1.4 keeps one runtime contract and lets adapters differ only at the interface and tool-binding layer.

### Adapter responsibilities
- Codex adapter:
  - uses repository instructions plus the available Codex tool/runtime surface
  - treats the repository as the canonical AIM contract
  - can expose `/aim` through the AIM skill or another compatible runtime adapter
  - can expose Codex-specific tools such as MCP integrations where available
  - must still preserve shared `.aim`, gate, and ownership semantics
- Copilot adapter:
  - uses `.github/agents/aim*.agent.md` and `.github/prompts/` as interface packaging
  - can expose slash commands, prompt files, and agent handoff UI
  - must still preserve the same runtime contract rather than inventing a second policy model
- Claude Code adapter:
  - uses `AGENTS.md` as the canonical AIM repo contract and `CLAUDE.md` as the Claude bridge
  - can expose repository-defined entrypoints through `.claude/commands/` and AIM-aligned helpers through `.claude/agents/`
  - may use Claude helper agents for bounded analysis, discovery, verification, and option generation only
  - must still preserve the same runtime contract rather than inventing a second policy model

### Parity labels
- `shared`
  - same conceptual behavior and same runtime contract across supported adapters
- `shared_with_adapter_differences`
  - same runtime contract, but different commands, tools, packaging, or UX surfaces
- `codex_only`
  - currently documented only in Codex
- `copilot_only`
  - currently documented only in Copilot
- `claude_code_only`
  - currently documented only in Claude Code
- `planned`
  - intentionally not yet treated as supported shared behavior

### Release support boundary

For AIM 1.4 production use:
- `shared` and `shared_with_adapter_differences` are release-supported
- `codex_only`, `copilot_only`, and `claude_code_only` are adapter-specific and must be presented as such
- `planned` is not part of the current release contract

### Fallback rule
If a capability is unavailable in one adapter:
- keep the intended repo-aware policy
- document the limitation explicitly
- fall back safely
- never redefine gate semantics or shared-state ownership just to simulate parity

## Capability matrix

| Capability | Classification | Codex adapter | Copilot adapter | Claude Code adapter | Fallback / notes |
| --- | --- | --- | --- | --- | --- |
| Start AIM session | shared_with_adapter_differences | `/aim start "EPIC: ..."` when the skill is installed, or explicit AIM prompt against the repo contract when it is not | Slash command, natural-language start, or custom-agent entry | Explicit `EPIC: ...` start or repo-defined command in `.claude/commands/` | Same bootstrap sequence must apply |
| Resume active Epic | shared_with_adapter_differences | Resume from `.aim/state.json` in the main thread | `/aim continue` and checkpoint-based resume | Resume from `.aim/state.json` through the main Claude AIM thread | Must not silently start a parallel Epic |
| `/aim` command surface | shared_with_adapter_differences | Exposed by the AIM skill or a compatible Codex runtime adapter | Exposed through the Copilot `aim` agent layer | Exposed only when the repo ships matching Claude commands | If missing, fall back to explicit AIM prompts without changing authority |
| Create `.aim` | shared | AIM-in-Codex creates `.aim` if missing | Copilot-layer AIM creates `.aim` if missing | Claude Code AIM creates `.aim` if missing | Same runtime contract |
| Read `.aim` | shared | Reads official runtime workspace directly | Reads the same workspace through Copilot layer | Reads the same workspace through `CLAUDE.md`-guided flow | Helper artifacts stay secondary |
| Update increment state | shared_with_adapter_differences | Main AIM thread updates shared state directly | Main AIM thread updates shared state through Copilot orchestration | Main AIM thread updates shared state through Claude Code execution | Only main thread may write authoritative state |
| Reviewer tool selection | shared_with_adapter_differences | Uses normalized repo-aware context plus available Codex tools | Uses normalized repo-aware context plus Copilot-layer tool routing | Uses normalized repo-aware context plus Claude Code's available tools and helper agents | Preserve repo policy even if tools differ |
| Playwright CLI execution | shared_with_adapter_differences | Can run through terminal or repo-defined verifier flow | Can run through `runInTerminal` if repo policy allows | Can run through terminal or repo-defined verifier flow when Claude Code exposes it | If unavailable, fall back to documented manual verification |
| Playwright MCP execution | codex_only | Available where Codex runtime exposes MCP browser tools | Not packaged in this repo's Copilot layer | Not part of the documented Claude Code adapter contract here | Preserve verification intent and use CLI/manual fallback |
| Deployment orchestration | planned | Not treated as shared default AIM adapter capability | Not treated as shared default AIM adapter capability | Not treated as shared default AIM adapter capability | Repo policy and explicit escalation still govern |
| Database migration orchestration | planned | Not treated as shared default AIM adapter capability | Not treated as shared default AIM adapter capability | Not treated as shared default AIM adapter capability | Sequential, explicit, repo-gated handling only |
| Validation / quick check | shared_with_adapter_differences | Runtime-facing integrity check can be run in Codex flow | Copilot can surface the same check through its layer | Claude Code can surface the same check through `CLAUDE.md` and repo helper commands | Same result classes must apply |
| Template rendering | shared_with_adapter_differences | Can use local docs, skill assets, and repo files | Can use prompt files and repo agent packaging | Can use `CLAUDE.md`, `.claude/commands/`, `.claude/agents/`, and repo files | Output must still match shared AIM semantics |
| Bounded helper agents | shared_with_adapter_differences | Supported when Codex runtime exposes bounded helpers or subagents | Packaged role agents and handoff UI can assist without owning shared state | `.claude/agents/` and Claude helpers can assist with bounded analysis, discovery, verification, and option generation | Main AIM thread keeps ownership of `.aim/state.json`, gates, and acceptance |
| Parallel verification subagents | planned | Not yet a stable shared adapter contract | Not yet a stable shared adapter contract | Not yet a stable shared adapter contract | Sequential verification remains the safe default |

## Inputs and outputs
- Inputs:
  - shared AIM runtime contract
  - normalized repo-aware context
  - adapter packaging and tool surface
  - current platform capability availability
- Outputs:
  - explicit adapter behavior for Codex, Copilot, and Claude Code
  - one parity classification per capability
  - one fallback rule for unsupported or uneven capability areas

## Key decisions
- prefer shared behavior first and document differences explicitly
- keep the parity matrix descriptive of supported behavior, not marketing language
- treat adapter packaging gaps as explicit limitations, not silent exceptions
- keep parallel capability subordinate to runtime ownership rules

## Defaults and fallbacks
- if supported adapters can share the runtime contract, classify the capability as `shared` or `shared_with_adapter_differences`
- if only one adapter currently documents the capability, classify it as adapter-specific
- if support is not stable enough to rely on, classify it as `planned`
- if parity is impossible in the current environment, keep the same runtime contract and degrade safely

## Edge cases
- a repo can have Copilot prompt-file coverage that lags behind the shared runtime docs; this is a packaging gap, not a change to AIM core
- Codex can expose MCP-backed capabilities that do not map to the Copilot layer; these stay adapter-specific until parity exists
- a Codex repo can be fully repo-aware even when the skill is absent; that changes the start surface, not the canonical AIM contract
- Claude Code can add bridge files or helper commands that improve entry UX without changing the shared runtime contract
- bounded parallel capability can exist in one adapter without changing who owns `state.json`, gates, or acceptance

## Data correctness and trust
Must remain true:
- adapters do not redefine AIM core semantics
- `.aim/state.json` remains authoritative regardless of adapter
- unsupported capability preserves policy intent instead of erasing it
- parallel work never transfers ownership of gate progression or acceptance

## Debugging
The single best check to verify behavior:
- compare the adapter docs, the parity matrix, and the active repo packaging and confirm that every documented difference is an adapter-level difference rather than a conflicting runtime rule

What "good" looks like:
- a user can tell what is shared and what differs before starting AIM
- adapter-specific tools are documented without changing the runtime contract
- unsupported features have explicit fallback behavior
- planned features are visibly outside the release contract

What "bad" looks like:
- Copilot, Claude Code, and Codex docs claim different gate or ownership semantics
- a capability is treated as shared even though one adapter only has a planned or manual fallback
- parallel features imply shared-state ownership outside the main thread

## Related files
- AGENTS.md
- CLAUDE.md
- docs/workflow/agile-iteration-method.md
- docs/workflow/copilot-layer.md
- docs/features/aim-1.4-bootstrap-and-resume.md
- docs/features/aim-1.4-repo-aware-runtime-context.md
- docs/features/aim-1.4-validator-support.md
- docs/epics/aim-1.3-unified-runtime.md

## Change log
- 2026-03-28: Created AIM 1.4 adapter and parity contract covering Codex and Copilot responsibilities, parity labels, capability matrix, and fallback rules.
- 2026-04-02: Expanded the adapter contract to include Claude Code, its bridge/helper layer, and bounded-helper ownership limits.
