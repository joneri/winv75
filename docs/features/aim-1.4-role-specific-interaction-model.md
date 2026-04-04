# AIM 1.4 role-specific interaction model

## Purpose
Define the visible interaction contract for AIM so each role and step has a distinct purpose, clearer wording, and more precise approval semantics.

## Interaction principles
- one step, one purpose
- approvals must mean something specific
- Dev and Reviewer are informational by default
- post-review `TDO` is the demo, test, and feedback checkpoint
- post-increment `PO` is the Epic continuation or closure checkpoint
- use only the text the current step actually needs

## Role and step map

### `PO` at Gate A
Purpose:
- frame the Epic and the value boundary

Must make clear:
- why this Epic exists
- what is in scope and out of scope
- what the user is approving now
- what happens next if the Epic is approved

Typical CTA:
- approve Epic
- request Epic changes

### `TDO` before development at Gate B
Purpose:
- define the next single Done Increment

Must make clear:
- why this increment is the right slice now
- how the increment can be demonstrated end to end
- what the user is approving now
- what happens next if the increment is approved

Typical CTA:
- approve increment
- adjust increment

### `Dev` at Gate C
Purpose:
- report implementation progress and evidence

Must make clear:
- what changed
- what was verified already
- whether there is an escalation or blocker

Default CTA:
- none

Exception CTA:
- request scope decision
- request clarification

### `Reviewer` at Gate D
Purpose:
- report verification, risk, and readiness

Must make clear:
- what was reviewed
- whether there are blocking findings
- what user testing still matters, if any

Default CTA:
- none

Exception CTA:
- escalate blocker

### `TDO` after review
Purpose:
- turn the increment into a practical demo, test, and feedback checkpoint

Must make clear:
- what changed in practical terms
- what has already been verified
- how the user can test or demo the increment
- what kind of feedback is useful now
- whether the user should accept the increment or request adjustment

Typical CTA:
- accept increment
- request adjustment
- test now

### `PO` after accepted increment
Purpose:
- make the Epic-level product decision

Must make clear:
- what part of the Epic is now fulfilled
- whether another increment is still needed
- whether extra requested scope belongs in this Epic or a new one

Typical CTA:
- continue Epic
- close Epic
- capture new scope separately

## Approval semantics

Approval terms must match the actual decision:
- `approve Epic`:
  - confirms Epic framing and scope
- `approve increment`:
  - confirms the next single Done Increment plan
- `accept increment`:
  - confirms the demonstrated increment is acceptable after review, demo, test, and feedback
- `continue Epic` or `close Epic`:
  - confirms the Epic-level product decision after an accepted increment

Avoid using one generic `approve` label when the actual decision is more specific.

## CTA model

Preferred CTA patterns:
- `approve Epic`
- `request Epic changes`
- `approve increment`
- `adjust increment`
- `accept increment`
- `request adjustment`
- `test now`
- `continue Epic`
- `close Epic`
- `capture new scope separately`

The visible CTA should match the current step and should not be more generic than necessary.

## Transport controls versus visible CTAs

Short control inputs such as `approve` and `change:` may still exist at hard gates for speed.

Those inputs are transport helpers.
They are not the visible interaction contract.

The visible wording should still match the real decision at the current checkpoint:
- `approve Epic`
- `adjust increment`
- `accept increment`
- `continue Epic`
- `close Epic`

## Next-step wording

AIM does not need to show a visible `handoff` label at every checkpoint.

Preferred rule:
- use a short next-step sentence when that is clearer
- use a labeled `handoff` only when it adds clarity for the current step

## Language policy

Reduce ambiguity in visible text:
- prefer explicit actors:
  - `the user`
  - `PO`
  - `TDO`
  - `Dev`
  - `Reviewer`
  - `the next step`
- avoid unclear `you` when the actor could be the user, the role, or AIM
- remove boilerplate that does not help the current step

## Auto-mode prompting

Auto mode should be offered or clarified:
- early in a new Epic if the mode is not already explicit
- on resume only when the stored mode is unclear or needs confirmation

Auto mode explanation should be practical:
- `Strict`:
  - pause at meaningful approval points
- `Auto`:
  - continue through increments automatically unless escalation occurs
  - still pause for final full review before Epic completion

## Epic-level completion markers

Epic-level checkboxes or similar outcome markers are `PO`-owned.

Rules:
- update them only when the corresponding outcome is demonstrably fulfilled
- do not treat increment completion as automatic proof that an Epic-level marker is complete
- update them after accepted increments when the evidence is visible in the repo docs, runtime artifacts, or delivered behavior

## Example response expectations

Good `Dev` shape:
- `Role: Dev`
- short implementation summary
- verification evidence
- blocker only if needed

Good post-review `TDO` shape:
- `Role: TDO`
- plain-language summary of the increment
- what was already verified
- how to test now
- clear next decision: accept increment or request adjustment

Bad generic shape:
- repeated `what you decided / what will change / files / acceptance checks / reply approve or change`
- no explanation of who is speaking or why this role is speaking now
- same CTA wording for Epic approval, increment planning, and increment acceptance

## Related files
- AGENTS.md
- docs/workflow/agile-iteration-method.md
- .github/agents/aim.agent.md
- .github/agents/aim-planner.agent.md
- .github/agents/aim-builder.agent.md
- .github/agents/aim-reviewer.agent.md
