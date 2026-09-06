goal_status: draft (derived from hook-header on 2026-09-06; promote with node lib/goal-backfill.js promote overview-steps)
symptom: not recorded at birth (pre-Rule-13 feature)
goal: overview-tracker.trigger.hook.js — UserPromptSubmit hook Power: domain/overview-steps/ PURPOSE (みや 2026-06-24): inject the active ticket's OVERVIEW STEPS + % done every
goal_signal: a fire on: its trigger
retention: rotate monthly
# Power: overview-steps

**UserPromptSubmit hook.** Injects the active ticket's OVERVIEW STEPS + % done every turn, so it's shown at every turn-end until complete.

- **State:** `state/<ticket>.json` = `{ ticket, steps: [ {n, label, status} ] }`, status ∈ `done|partial|todo`. % = (done + 0.5·partial)/total. Any state file with % < 100 is injected.
- **Update:** edit the state file's step statuses as work progresses.
- **Contract:** see `overview-tracker.trigger.hook.js` header.
- **Log:** `log.jsonl`. **Registered:** settings.json UserPromptSubmit.
- **Eval (2026-06-24):** PASS — injects "#239386 MPT (13% done)" + the 4 steps.
- **Robust to the active.txt revert** (reads state files directly, not active.txt).
