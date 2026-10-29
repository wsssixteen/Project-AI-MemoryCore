# NUKE-MARKER — sweep

| Field | Value |
|---|---|
| Created  | 2026-08-16 · refined 2026-10-29 (audit Tool + audit-and-refine step) |
| Session  | 2026-08-16 miya: "JUST BUILD THE SWEEP" · 2026-10-29 miya: audit every run and refine straight away, accuracy first |
| Files    | .claude/skills/sweep/{SKILL.md, diagram.html, diagram.png} · domain/sweep/{README.md, eval.js, audit.js, audit.eval.js, diagram.html, diagram.png, log.jsonl, NUKE-MARKER.md} · system/tools.json row "sweep-audit" · forge registry.jsonl row "sweep" · ORCH_SUPPRESS blocks in lib/hook-runtime.js + lib/dispatch-hooks.js (shared prerequisite, shipped 7c6cc28) |
| Rollback | 2026-10-29 refinement only: `git revert <its commit>` (restores the hand-typed ledger step; log.jsonl rows stay). Whole Feature: rm -rf domain/sweep .claude/skills/sweep · remove "sweep" from system/registry.jsonl and "sweep-audit" from system/tools.json · git revert; orchestration-mode blocks stay (independently evaled 4/4) |
| Retire   | 2026-11-28 — remove this file if audit.js has written ≥1 run row (not a fixture) AND no rollback |
