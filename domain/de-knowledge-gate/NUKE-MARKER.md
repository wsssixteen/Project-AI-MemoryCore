# NUKE-MARKER — de-knowledge-gate

| Field | Value |
|---|---|
| Created  | 2026-08-20 |
| Session  | みや: "why doesn't Domain Expansion auto-detect valuable info for etanah-knowledge?" — Step 7 sweep was model-judgment, silently skippable → session knowledge lost → next session re-derives = wasted usage. |
| Files    | `domain/de-knowledge-gate/de-knowledge-gate.check.hook.js` · `domain/de-knowledge-gate/de-knowledge-gate.eval.js` · `domain/de-knowledge-gate/README.md` · `domain/de-knowledge-gate/log.jsonl` · `.claude/settings.json` Stop-array entry · `core/registry.jsonl` line · one-line pointer in `Feature/Domain-Expansion/expansion-protocol.md` Step 7 |
| Rollback | `rm -rf domain/de-knowledge-gate` + remove the `de-knowledge-gate.check.hook.js` command object from `.claude/settings.json` Stop array + remove its `core/registry.jsonl` line + drop the Step-7 pointer sentence in `expansion-protocol.md` + `git revert <SHA>` |
| Retire   | 2026-09-19 (creation + 30 days) — remove this file if the gate fired ≥1× in the window AND no rollback happened |
