# NUKE-MARKER — alter-ticket-gate

| Field | Value |
|---|---|
| Created  | 2026-09-04 |
| Session  | #275847 (Perak, "alter to SPI Semakan Permohonan") — みや: build a deterministic alter-ticket format, state-aware, JIT-loaded into Quest when the ask/solution is a flowable alter |
| Files    | domain\alter-ticket-gate\alter-ticket-gate.check.hook.js · domain\alter-ticket-gate\alter-ticket-gate.eval.js · README.md · NUKE-MARKER.md · log.jsonl · settings.json UserPromptSubmit entry · system/registry.jsonl line · (knowledge, untracked: etanah-knowledge/ALTER-TICKET-PLAYBOOK.md · etanah-knowledge/perak/FLOWABLE-ALTER.md · melaka/FLOWABLE-KNOWLEDGE.md §6 pointer line) |
| Rollback | `rm -rf domain/alter-ticket-gate` · remove the settings.json UserPromptSubmit entry `node "${CLAUDE_PROJECT_DIR}\\domain\\alter-ticket-gate\\alter-ticket-gate.check.hook.js"` · remove the registry.jsonl line for "alter-ticket-gate" · `git revert <birth-SHA>` (knowledge files may stay — they are reference, not enforcement) |
| Retire   | 2026-10-04 — remove this file if the Feature fired >=1x in log.jsonl AND no rollback |
