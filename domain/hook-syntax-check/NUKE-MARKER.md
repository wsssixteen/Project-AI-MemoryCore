# NUKE-MARKER — hook-syntax-check

| Field | Value |
|---|---|
| Created  | 2026-10-04 (INSTALLED from `.claude/hooks/hook-syntax-check.js`, not newly built) |
| Session  | 2026-06-20: silent-claim-drift-gate.js was a syntax ghost for about 3 weeks. It was registered but threw on every run, and system-audit only checks registration, never syntax. |
| Files    | domain/hook-syntax-check/hook-syntax-check.hook.js · domain/hook-syntax-check/hook-syntax-check.eval.js · README.md · 1 settings.json entry |
| Rollback | move `domain/hook-syntax-check/hook-syntax-check.hook.js` back to `.claude/hooks/hook-syntax-check.js` · re-point the settings.json command(s) at the old path · `rm -rf domain/hook-syntax-check` · or `git revert <install-SHA>` |
| Retire   | 2026-11-03 — remove this file if the Feature fired >=1x since install AND no rollback |
