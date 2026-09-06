goal_status: draft (derived from registry on 2026-09-06; promote with node lib/goal-backfill.js promote awam-no-resit-gate)
symptom: #271721 2026-07-22: PRBB AWAM ticket ran Phase 0 through Apply and a full Test Scenario emit with no No Resit; CLAUDE.md carried the rule as PROSE only, ticket-gate.js row was parked and never built
goal: BLOCK the stop and require the No Resit to be derived from the DB and written into the Task notes file
goal_signal: the Stop fire produced: BLOCK the stop and require the No Resit to be derived from the DB and written in
retention: rotate monthly
# awam-no-resit-gate (hook-only Feature)

**Contract:** an AWAM ticket on a carian-rasmi urusan may not reach a test-data / hand-back emit without a **No Resit Carian Rasmi**. The Stop hook hard-blocks the turn otherwise.

| Piece | File | Role |
|---|---|---|
| Hook (check) | `awam-no-resit-gate.check.hook.js` | Stop — blocks when a no-resit urusan hand-back carries no receipt |
| Eval | `awam-no-resit-gate.eval.js` | 9 fixtures — 1 positive replay, 7 negative, 1 effect check |
| Log | `log.jsonl` | one line per fire |
| Nuke marker | `NUKE-MARKER.md` | rollback recipe (retire 2026-08-21) |
| Skill | — | none (hook-only; the procedure already lives in `TEST-PERMOHONAN-INDEX.md`) |

## The 5 urusan

Source of truth — `etanah-awam\src\main\java\my\gov\etanah\awam\consent\web\form\CarianRasmiHakmilikForm.java` `URUSAN_CARIAN_RASMI` static block **:107-119**:

| Consume a receipt (PLP) | Generate receipts (carian family) |
|---|---|
| `PLTP` `PSBS` `MCL` `PPTPB` `PRBB` | `CRHM` `CRHMR` `CRHS` `CRHMB` `CRHMSB` `CRHMT` `CRHMST` |

The gate watches the **left column only**. If that static block changes, update `NO_RESIT_URUSAN` in the hook.

## Fires when — all four must hold

1. Hand-back / test-scenario phrasing present
2. An AWAM signal present (`AWAM`, `portal awam`, `etanah-awam`, `borang permohonan`, `p_aplikasi_id`, `jana semula`)
3. Word-boundary match on one of the 5 urusan (so `PRZ` never matches `PRBB`)
4. **No** receipt pattern `\d{6}[A-Z]{2,6}\d{4,6}` anywhere in the text

**Exempt:** `[skip-no-resit: <reason>]` · `stop_hook_active` · replies under 200 chars.

## Verify

```
node domain/awam-no-resit-gate/awam-no-resit-gate.eval.js
```

**Result at ship (2026-07-22): 9/9 green** — including a fixture that reproduces the exact #271721 Test Scenario emit and confirms it now blocks.

## History

- 2026-07-22 — created per みや `/goal` item 4 after #271721. Replaces a rule that had lived as CLAUDE.md prose since 2026-07-20 with a parked (never-built) `ticket-gate.js` row. Born via `core/forge.js new check`.


## STATE-SCOPE (2026-09-04, multi-state audit)

state-scoped: **yes — keyed by state via lib/states.js** (system/states.json). No state literal remains in the hook; a new state is one registry row. Migration verified by this Feature's own eval (green) + 
ode lib/states.js check (this file no longer listed as UNROUTED). Spec-preservation (Rule 6 v1.2): every prior fixture kept and passing; the only behavioural change is that a non-Melaka state now resolves to ITS OWN folder/trunk instead of Melaka's.

