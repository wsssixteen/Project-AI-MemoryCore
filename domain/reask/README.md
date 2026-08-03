# reask — Feature contract

**Purpose**: Detect when みや re-asks for information Ruri already gave, and prompt Ruri to log the reply-clarity slip.

**Fires when**: `UserPromptSubmit` — user's prompt matches one of 6 reask regex patterns. Predicate-narrowed per `/system-design` Rule 8 — not every-turn bloat, only turns where the message shape signals a re-ask.

**Layer**: hook-only (check) per `/system-design` Rule 7 — regex-deterministic detection = hook, no skill needed.

**Behavior**: ADVISORY, not blocking. Emits an `additionalContext` reminder to (a) fix reply structure this turn and (b) log via `node core/slips.js add --category reask/<axis>`.

## Categories (`reask/<axis>` convention)

| Category | Signal | Fix direction |
|---|---|---|
| `reask/verbose` | "in one sentence" / "one line" / "briefly" / "just answer" / "simple yes or no" | Answer FIRST, one sentence, no lead-up |
| `reask/rambling` | "why are you rambling" / "blabbering" / "essays" / "long-winding" / "wall of text" | Table/diagram > prose, cut scaffolding |
| `reask/hallucination` | "hallucinat" / "making that up" / "bullshit" / "you're wrong" | Verify before claim, retract explicitly |
| `reask/buried-answer` | "answer my question" / "you didn't answer" / "still no answer" | Lede = answer, put it in the first sentence |
| `reask/redundant` | "I already asked" / "I already told you" / "I've said this" | Read prior context before replying |
| `reask/rephrase-check` | "wait so..." / "so is it..." / "so basically..." | Reply was ambiguous — confirm/deny sharper |

## Store

- Hook writes fires to `domain/reask/log.jsonl` (audit trail per `/system-rules` Rule 5).
- Slips logged via `node core/slips.js add --category reask/<axis>` land in `system/slips.jsonl` alongside all other slips (single-store per `/system-rules` Rule 1 — inventory first).
- Dashboard view: filter `system/slip-dashboard.md` for `reask/*` categories (or extend `core/slips.js` with `--group reask` filter later — deferred Phase-2 enhancement).

## NOT this Feature

- `auto-skill-on-mistake` handles BEHAVIOR/CORRECTNESS failures (missed rule, wrong hypothesis, protocol violation). Reask is separate: reply CLARITY failure — the answer was IN the reply but みや still had to ask.
- If a message triggers BOTH, both hooks fire — that's correct (different failure axes).

## Verify

`node domain/reask/reask.eval.js` — 10 fixtures (F1 empty · F2 compound · F3-F8 per category · F9-F10 clean-silent).

Ship-verified 2026-07-14: 10/10 PASS.

## Rollback

See `NUKE-MARKER.md`.

## Born via

`node core/forge.js new check reask --event UserPromptSubmit ...` on 2026-07-14. Registry entry in `system/registry.jsonl`.
