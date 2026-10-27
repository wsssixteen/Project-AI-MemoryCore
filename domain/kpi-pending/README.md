# kpi-pending

symptom: 2026-10-23 miya (#262027 Datuk salutation): 'add this into session start to always check & will only be removed after you confirmed the ticket has been verified and no mention of our particular change on this (meaning it passes)'
goal: no pending KPI row is forgotten: each one is confirmed or dropped once its condition is known
goal_signal: every pending row ends with a confirm or drop event; none sits past 30 days without one (kpi.js audit WARN)
retention: rotate yearly (central hook telemetry); the rows themselves live in `main/kpi-moments.jsonl` (keep, owned by `domain/kpi/`)
footprint: per-session: 1 node process about 0.2 s at session start, prints nothing when no pending row
self_audit: `kpi.js pending --boot` re-reads the ledger on every run (never a cached list); the eval pins silent with none, the row with its condition when pending, silent again after confirm, no crash on a broken ledger
state-scoped: no, state-agnostic (one ledger per person)

**What fires when**: SessionStart — prints each open pending KPI row from `main/kpi-moments.jsonl` (a row whose condition has not been confirmed or dropped), its condition and the confirm / drop commands. Prints nothing when there is none.

**Layer choice (Rule 7)**: hook-only. The procedure (what a pending row is, when to confirm or drop) lives in the `kpi` skill; this hook only makes sure the reminder appears at every start, which a skill cannot guarantee.

**Trigger moment (Rule 8)**: SessionStart, because miya asked for "session start to always check". It costs one node process and is silent when the pending list is empty, so normal boots add no text.

**Observability**: runs through `lib/hook-runtime.js`, which writes one central telemetry row per fire (fired or not, duration). The `kpi.js` call also writes a `pending-boot` row to `domain/kpi/log.jsonl` with the count.

| Part | File |
|---|---|
| Hook | `domain/kpi-pending/kpi-pending.check.hook.js` (registered in `.claude/settings.json` SessionStart by forge) |
| Eval | `domain/kpi-pending/kpi-pending.eval.js` (6 fixtures) |
| Data + commands | `domain/kpi/kpi.js` `pending add` · `pending --boot` · `confirm <id>` · `drop <id>` |
