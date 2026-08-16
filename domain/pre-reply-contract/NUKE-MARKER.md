# NUKE-MARKER — pre-reply-contract

| Field | Value |
|---|---|
| Created  | 2026-08-16 |
| Session  | Weekend-audit Scope D1: みや's double-emit complaint (/i-have-adhd invoke) — "you output double unnecessary into conversation" + "make /i-have-adhd permanent" |
| Files    | `domain/pre-reply-contract/` (pre-reply-contract.check.hook.js · pre-reply-contract.eval.js · NUKE-MARKER.md · README.md · log.jsonl) + settings.json UserPromptSubmit entry + system/registry.jsonl birth line + reply-shape-spec.md §ADHD-permanent section |
| Rollback | `rm -rf domain/pre-reply-contract` · remove settings.json UserPromptSubmit entry `node "${CLAUDE_PROJECT_DIR}\domain\pre-reply-contract\pre-reply-contract.check.hook.js"` · remove registry.jsonl line for "pre-reply-contract" · revert reply-shape-spec.md §ADHD-permanent · `git revert <ship SHA>` |
| Retire   | 2026-09-15 (creation + 30 days) — remove this file if fired ≥1× in window AND no rollback |
