goal_status: draft (derived from hook-header on 2026-09-06; promote with node lib/goal-backfill.js promote full-address-trace-gate)
symptom: not recorded at birth (pre-Rule-13 feature)
goal: full-address-trace-gate.discipline.hook.js — Stop hook (BLOCKING) Feature: domain/full-address-trace-gate/ PURPOSE: every code reference in a trace / class chain must be GREPPABLE by
goal_signal: a fire on: its trigger
retention: rotate monthly
# full-address-trace-gate — Feature

Stop-hook (BLOCKING) that rejects a reply whose class-chain / trace contains
un-greppable code references. Every code reference must carry its full address:

- **files** → `<repo>\<full\path>\<File>.<ext>:<line>` — name which repo
  (pelupusan / common / awam / etc.); a bare `File.ext:line` sends みや hunting
- **methods** → `<ClassName>.<method>():<line>` — NEVER a bare `method():line`

## Contract

| Field | Value |
|---|---|
| Layer | Hook only (Rule 7 — pre-emit skill would be duplicated ceremony) |
| Event | Stop |
| Verdict | `decision: "block"` on offenders |
| Bypass | `[skip-full-address: <reason>]` |
| Fail mode | fail-OPEN (any parse error → allow stop) |
| Log | `log.jsonl` (co-located) |

## Trigger predicate

Fires when ALL:

1. Reply length ≥ 400 chars
2. No exempt token (bypass · ═══ · るり結界 · Domain Expansion)
3. `stop_hook_active` false (avoids infinite loop)
4. Reply looks like a trace: ≥2 refs with `:<line>` **AND** (arrows `↓` `→` OR the words "class chain" / "trace")
5. `findOffenders()` returns ≥1 bare filename OR bare method

## History

| Date | Version | Change |
|---|---|---|
| 2026-07-01 | v1 (advisory) | Original at `.claude/hooks/full-address-trace-gate.js`, `additionalContext` reminder. QA-267976. |
| 2026-07-06 | v2 (BLOCKING) | Promoted advisory → `decision:block` after 6+ fires/day on same slip class (QA-268883). Relocated to Feature folder. Added `[skip-full-address:]` bypass token. Added `stop_hook_active` guard. Extracted `evaluate()` for eval.js re-use. Design routed through /system-design + /system-rules. |

## Rule-6-v1.2 pre-ship checks

- **(a) Spec preservation** — the v1 offender-detection regexes (file A + method B) preserved byte-for-byte. Trigger heuristic (`refCount ≥ 2 && (arrows | "class chain" | "trace")`) preserved. Log format preserved. **New** specs added: `[skip-full-address:]` bypass · `stop_hook_active` guard · length-floor 400 · `decision:block` exit path.
- **(b) Fire check** — `eval.js` fixture cases assert exit code + decision (see `eval.js`).
- **(c) Effect check** — `eval.js` fixture cases assert the block message renders with expected fields (⛔, hint lines, offender list, bypass hint).

## Design consult

Routed 2026-07-06 through `/system-design` + `/system-rules`. Verdict:

| Rule | Verdict |
|---|---|
| R1 Inventory first | Hook existed — REFINE, not new. |
| R2 Merge in place | Extend the existing regex + exit path. |
| R3 Assess | Log-fire count 0 in worktree (log absent), but slip surface 6+/day/session in main. Signal-to-noise clearly worth blocking. |
| R4 Start simple | Hook-only, no new skill. |
| R5 Audit logging | `log.jsonl` co-located. |
| R6 Ship with eval | `eval.js` runs before registration change. |
| R7 Pick primitive | Hook-only (no skill — pre-emit skill would duplicate what block already achieves). |
| R8 Trigger moment | Stop = last chance before みや reads. Correct. |

## Running the eval

```bash
node domain/full-address-trace-gate/eval.js
```

Exits 0 on PASS · 1 on FAIL. See `eval.js` for fixture cases + compliance
scorer over recent session transcripts.
