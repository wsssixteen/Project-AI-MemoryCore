# de-step11-verdict-gate — Feature

Stop-hook (BLOCKING). At Domain Expansion close, refuses the close if the
worktree still has uncommitted changes AND the reply gave no explicit
per-file disposition. Kills the "flagged for future boot" shortcut.

## Contract

| Field | Value |
|---|---|
| Layer | Hook only (R7 — no procedural skill needed) |
| Event | Stop |
| Verdict | `decision: "block"` on undisposed files |
| Bypass | `[skip-de-verdict: <reason>]` |
| Fail mode | fail-OPEN (git error / parse error → allow stop) |
| Log | `log.jsonl` (co-located) |
| Test hook | env var `DE_VERDICT_GATE_FAKE_STATUS` overrides live `git status --porcelain` for fixture runs |

## Trigger predicate

Fires when ALL:

1. Reply contains DE close banner (`Domain Expansion — closed` or `Barrier settles`)
2. No bypass token
3. `stop_hook_active` false
4. `git status --porcelain` returns ≥1 file
5. At least one uncommitted file has no matching disposition line in the reply

## Disposition line forms

Match at start of line (case-insensitive):

- `discard: <path>` — state marker / ephemeral, OK to lose
- `park: <path> — <reason>` — intentionally staying, reason stated
- `commit: <path>` — staged/committed this turn
- `keep-in-worktree: <path>` — deliberately in worktree

## Design consult

`/system-design` + `/system-rules` invoked this session (design-consult-gate satisfied).

| Rule | Verdict |
|---|---|
| R1 Inventory first | Existing DE Step 11 was prose-only + advisory. This is the promotion. |
| R4 Start simple | Hook-only, one predicate. |
| R6 Ship with eval | `eval.js` runs 6-case fixture before registration. |
| R7 Pick primitive | Hook-only (no skill — the check is deterministic). |
| R8 Trigger moment | Stop at close banner = leanest point where "done" is being claimed. |

## Rule-6-v1.2 pre-ship checks

- Spec preservation: n/a (new build)
- Fire check: `eval.js` fixture cases assert exit code + decision
- Effect check: `eval.js` fixture cases assert block message renders with undisposed-file list

## Running the eval

```
node domain/de-step11-verdict-gate/eval.js
```

## History

| Date | Version | Change |
|---|---|---|
| 2026-07-07 | v1 (BLOCKING) | Built after the frosty-elbakyan-007619 background session shipped DE with "flagged" as Step 11 verdict; harness archive dialog surfaced 2 uncommitted files the DE had ignored. みや: "Build it now and fucking commit push you fucking idiot. Don't waste my time." |
