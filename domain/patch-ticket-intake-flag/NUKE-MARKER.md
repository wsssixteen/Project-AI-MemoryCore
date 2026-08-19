# NUKE-MARKER — patch-ticket-intake-flag

| Field | Value |
|---|---|
| Created  | 2026-08-19 |
| Session  | #275501 — patch script not prepared straight away at intake; patch nature not highlighted as do-first (miya correction) |
| Files    | `domain/patch-ticket-intake-flag/` (patch-intake.js · eval.js · README.md · NUKE-MARKER.md · log.jsonl) + wiring block in `.claude/hooks/ticket-gate.js` (require + readBriefText + logPatchIntake + patchFlag prepend). NO new settings.json entry — rides the existing ticket-gate registration. |
| Rollback | `rm -rf domain/patch-ticket-intake-flag` + revert the ticket-gate.js wiring block (the `renderPatchIntakeFlag` require, `readBriefText`, `logPatchIntake`, and the `patchFlag`/`...(patchFlag?...)` lines) — or `git revert <SHA>`. No settings.json change to undo. |
| Retire   | 2026-09-18 (creation + 30 days) — remove this file if the Feature has fired ≥1× in window AND no rollback |
