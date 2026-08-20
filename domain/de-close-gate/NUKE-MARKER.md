# NUKE-MARKER — de-close-gate

| Field | Value |
|---|---|
| Created  | 2026-08-21 |
| Session  | miya's DE audit directive: "audit DE, list non-critical steps and MAKE THEM CRITICAL" — after QA-276182 was worked all session (deployed to int-env) with NO active.txt block and NO qa_doc, invisible to both step 2b (model memory) and step 12.6 (only iterates existing blocks) |
| Files    | `domain/de-close-gate/` (check.hook.js + eval.js + log.jsonl + README.md + this file) · `.claude/settings.json` Stop entry `node "${CLAUDE_PROJECT_DIR}\\domain\\de-close-gate\\de-close-gate.check.hook.js"` · `system/registry.jsonl` line name="de-close-gate" · `Feature/Domain-Expansion/expansion-protocol.md` ENFORCED-note under Step 2b + version stamp 2026-08-21 |
| Rollback | `rm -rf domain/de-close-gate` · remove the settings.json Stop entry above · remove the registry.jsonl line · `git revert db2c0e3` (the birth commit) |
| Retire   | 2026-09-20 (creation + 30 days) — remove this file if the gate has fired ≥1× in `log.jsonl` AND no rollback |
