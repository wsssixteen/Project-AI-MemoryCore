goal_status: draft (derived from hook-header on 2026-09-06; promote with node lib/goal-backfill.js promote batch-ask)
symptom: not recorded at birth (pre-Rule-13 feature)
goal: batch-ask.trigger.hook.js — UserPromptSubmit hook Power: domain/batch-ask/ PURPOSE: when みや's prompt signals extensive / sweep / thorough / in-one-go
goal_signal: a fire on: its trigger
retention: rotate monthly
# batch-ask — force AskUserQuestion when extensive-intent detected

## Power purpose

When みや's prompt signals extensive / sweep / thorough / in-one-go intent, force all clarifying questions for that turn through the **AskUserQuestion** popup tool. Bans chat-written "should I X?" / "what about Y?" stalling that wastes round-trips.

## Pieces

| Piece | File | Role |
|---|---|---|
| Trigger hook | `batch-ask.trigger.hook.js` | UserPromptSubmit · regex matches extensive-intent phrases · injects mandate to use AskUserQuestion |
| Skill | none | Hook-only Power (per /system-design Rule 7 "pick the primitive") |
| Discipline hook | none | Trigger reminder sufficient for v1 |
| Eval | deferred | Add if slip-log shows trigger misses |
| Log | `log.jsonl` | Per /system-rules Rule 5 |

## Trigger phrases (~40, 7 families)

| Family | Phrases |
|---|---|
| Extensive | extensive · extensively · exhaustive · exhaustively |
| Thoroughly | thoroughly · comprehensive · comprehensively · in depth |
| Sweep | full sweep · sweep everything · sweep · all the X · every X |
| Batch | in one go · in one shot · all at once · batch · together |
| Speed | save time · don't waste time · be quick · quickly · fast |
| Debug-specific | extensive logging · extensive loggers · debug everything |

## Adding triggers later

Per /system-design trigger-reliability discipline: ≥2 observed misses in slip-log OR みや explicit ask + documented rationale + みや nod.

*Created 2026-06-02 per みや — pattern named "wastes time when asked many written questions one at a time during extensive work".*
