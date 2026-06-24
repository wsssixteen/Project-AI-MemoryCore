# Power: overview-steps

**UserPromptSubmit hook.** Injects the active ticket's OVERVIEW STEPS + % done every turn, so it's shown at every turn-end until complete.

- **State:** `state/<ticket>.json` = `{ ticket, steps: [ {n, label, status} ] }`, status ∈ `done|partial|todo`. % = (done + 0.5·partial)/total. Any state file with % < 100 is injected.
- **Update:** edit the state file's step statuses as work progresses.
- **Contract:** see `overview-tracker.trigger.hook.js` header.
- **Log:** `log.jsonl`. **Registered:** settings.json UserPromptSubmit.
- **Eval (2026-06-24):** PASS — injects "#239386 MPT (13% done)" + the 4 steps.
- **Robust to the active.txt revert** (reads state files directly, not active.txt).
