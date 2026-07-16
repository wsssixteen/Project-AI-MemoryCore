# NUKE-MARKER — release-mlk-plp (covers the whole Feature family: script + 2 sibling checks + skill)

| Field | Value |
|---|---|
| Created  | 2026-07-16 |
| Session  | みや asked for an automated PLP release-prep pipeline (Deploy Pelupusan 1.0.9, BAQA message) — worktree pelupusan-release-script-861710 |
| Files    | `domain/release-mlk-plp/` (release-prep.js · eval.js · README.md · this file · servers.local.json[.example] · state/ · log.jsonl) + `domain/release-mlk-plp-ask/` (check hook + eval) + `domain/release-mlk-plp-push-gate/` (check hook + eval) + `domain/release-mlk-plp-scope-gate/` (check hook + eval) + `.claude/skills/release-mlk-plp/SKILL.md` + settings.json: 1 UserPromptSubmit entry (release-mlk-plp-ask) + 1 PreToolUse/Bash entry (release-mlk-plp-push-gate) + 1 PreToolUse/Edit\|Write entry (release-mlk-plp-scope-gate) + 4 meta/registry.jsonl rows + 2 .gitignore lines |
| Rollback | `Remove-Item -Recurse -Force domain/release-mlk-plp, domain/release-mlk-plp-ask, domain/release-mlk-plp-push-gate, domain/release-mlk-plp-scope-gate, .claude/skills/release-mlk-plp` · remove the 3 settings.json hook entries named above · remove the 4 registry.jsonl rows (release-mlk-plp, release-mlk-plp-ask, release-mlk-plp-push-gate, release-mlk-plp-scope-gate) · remove the 2 `.gitignore` lines (servers.local.json · state/) · `git revert <feature commit SHA>` |
| ⚠️ If the scope-gate blocks wrong | Fastest unblock WITHOUT a nuke: `node domain/release-mlk-plp/release-prep.js status --release <ver>` then delete the stale `domain/release-mlk-plp/state/release-<ver>.json` — the gate stands down the moment no state file is in flight. Per-edit escape: `[skip-release-scope: <reason>]`. |
| Retire   | 2026-08-15 — remove this file if the pipeline has run ≥1 real release AND no rollback |
