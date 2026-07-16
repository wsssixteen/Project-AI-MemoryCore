# NUKE-MARKER — release-mlk-plp (covers the whole Feature family: script + 2 sibling checks + skill)

| Field | Value |
|---|---|
| Created  | 2026-07-16 |
| Session  | みや asked for an automated PLP release-prep pipeline (Deploy Pelupusan 1.0.9, BAQA message) — worktree pelupusan-release-script-861710 |
| Files    | `domain/release-mlk-plp/` (release-prep.js · eval.js · README.md · this file · state/ · log.jsonl) + `domain/release-mlk-plp-ask/` (check hook + eval) + `domain/release-mlk-plp-push-gate/` (check hook + eval) + `.claude/skills/release-mlk-plp/SKILL.md` + settings.json: 1 UserPromptSubmit entry (release-mlk-plp-ask) + 1 PreToolUse/Bash entry (release-mlk-plp-push-gate) + 3 meta/registry.jsonl rows |
| Rollback | `Remove-Item -Recurse -Force domain/release-mlk-plp, domain/release-mlk-plp-ask, domain/release-mlk-plp-push-gate, .claude/skills/release-mlk-plp` · remove the 2 settings.json hook entries named above · remove the 3 registry.jsonl rows (release-mlk-plp, release-mlk-plp-ask, release-mlk-plp-push-gate) · `git revert <feature commit SHA>` |
| Retire   | 2026-08-15 — remove this file if the pipeline has run ≥1 real release AND no rollback |
