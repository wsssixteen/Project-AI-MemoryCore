# NUKE-MARKER — falsifier-ran-check (ledger check, 2026-10-04)

| Field | Value |
|---|---|
| Created  | 2026-10-04 |
| Session  | #244600: a written falsifier was never run, the fix shipped with local_test_confirmed=false, BA failed it. miya asked for a deterministic check so a falsifier cannot be skipped silently |
| Files    | domain/falsifier-ran-check/ (check.js · check.eval.js · README.md · NUKE-MARKER.md · log.jsonl · overrides.jsonl) · the "Falsifier ledger" block in domain/compile-gate/compile-gate.check.hook.js · the refusal block in domain/ticket-close-block/ticket-close-block.js · .claude/skills/quest/SKILL.md (Falsifier ledger bullet, Straight to Apply bullet, Rubric row e clause) · .claude/skills/quest/QA-NNN-template.md (ledger section) · .claude/skills/close-phase/SKILL.md (Phase 1 step 1) · a "## Falsifier ledger" section appended to 5 quest docs. No settings.json entry |
| Rollback | `git revert <SHA of the 2026-10-04 falsifier ledger commit>` — or, by hand: delete check.js + check.eval.js, remove the two marked blocks in compile-gate and ticket-close-block, restore the three skill files from git |
| Retire   | 2026-11-03 (creation + 30 days) — remove this file if log.jsonl shows 1 or more commit-context rows AND no rollback |
