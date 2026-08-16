# NUKE-MARKER — bug-db

| Field | Value |
|---|---|
| Created  | 2026-08-17 |
| Session  | miya: "build like a database of bugs as it grows... so you start debugging with the right understanding" — replaces manual past-ticket re-reads with mechanical Phase-0 injection |
| Files    | domain/bug-db/{bug-db.check.hook.js, bug-db.eval.js, build-index.js, lookup.js, log.jsonl, NUKE-MARKER.md} · settings.json UserPromptSubmit entry · registry.jsonl row "bug-db" · index at etanah-knowledge/melaka/bug-db-index.jsonl (untracked, regenerable) |
| Rollback | rm -rf domain/bug-db · unregister settings.json UserPromptSubmit bug-db line · remove registry.jsonl row "bug-db" · del etanah-knowledge/melaka/bug-db-index.jsonl · git revert <this commit> |
| Retire   | 2026-09-16 — remove this file if log.jsonl shows >=1 injected fire AND no rollback |
