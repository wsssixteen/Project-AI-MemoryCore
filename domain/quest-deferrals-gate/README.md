goal_status: draft (derived from hook-header on 2026-09-06; promote with node lib/goal-backfill.js promote quest-deferrals-gate)
symptom: not recorded at birth (pre-Rule-13 feature)
goal: quest-deferrals-gate.discipline.hook.js — Stop hook Power: domain/quest-deferrals-gate/ PURPOSE (per みや 2026-07-06, QA-268415 Phase 2 rule-add): at a Phase-2 close-out
goal_signal: a fire on: its trigger
retention: rotate monthly
# quest-deferrals-gate

**Stop hook** — at a Phase-2 close-out signal, verify the referenced `QA-<n>.md` holds a `## Deferred to follow-up` section with every row's Home cell filled. Prevents silent-drop of quest-time deferrals (out-of-BA-scope bonuses, known future gaps, learning asks, protocol edits).

**Rule body**: `quest/quest-protocol.md` Phase 2 → "🚨 Rule — Quest's todo / deferrals-capture" (added 2026-07-06 per みや, QA-268415).

## Triggers

Fires when the last assistant text contains BOTH:
- A Phase-2 close-out signal: `/quest-bounty`, `phase 2 close/archive/harvest`, `archive hygiene`, `active-cli.js update ... status=archived`, `/close-phase`, `harvest quest`
- A ticket reference: `QA-<num>`, `Ref-<num>`, `INTERNAL ISSUE #<num>`, `ESOKONGAN #<num>` (4-7 digits)

## Decision

| Case | Action |
|---|---|
| Phase-2 signal absent · no ticket ref · qa_doc absent on disk | **skip** (silent) |
| qa_doc has `## Deferred to follow-up` + `_none this quest_` sentinel | **pass** |
| qa_doc has valid table (all rows have Home ≥5 chars, no TBD/placeholder) | **pass** |
| qa_doc missing § Deferred section | **BLOCK** |
| qa_doc § Deferred table row has empty / TBD / placeholder Home | **BLOCK** |

## Bypass

`[skip-deferrals-gate: <reason>]` anywhere in the reply.

## Files

- `quest-deferrals-gate.discipline.hook.js` — the hook
- `eval.js` — fixture-driven smoke test (9 cases, target 9/9 pass before registration)
- `log.jsonl` — fire log (auto-created)

## Registration

Not yet in `.claude/settings.json` Stop array — pending みや nod after eval passes.
Register path (main-repo, not worktree): `${CLAUDE_PROJECT_DIR}\\domain\\quest-deferrals-gate\\quest-deferrals-gate.discipline.hook.js`.

Created 2026-07-06 per みや (QA-268415 Phase 1 close-out).
