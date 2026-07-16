# release-mlk-plp — Melaka Pelupusan release pipeline (Feature contract)

**One line**: branch `mlk/release/<ver>` off fresh `mlk/master`, merge ticket branches with
stop-on-conflict, verify every ticket's commits landed, push — then SSH build + deploy + Sheet log,
with 7 みや stop-points (V1-V7). PLP-only; duplicate as `release-<state>-<module>` for expansion.

| Piece | File | Fires |
|---|---|---|
| Orchestrator skill | `.claude/skills/release-mlk-plp/SKILL.md` | Skill tool — "prepare release" / BAQA message |
| Git mechanics script | `domain/release-mlk-plp/release-prep.js` | invoked by the skill, one subcommand per phase |
| Prompt trigger | `domain/release-mlk-plp-ask/*.check.hook.js` | UserPromptSubmit (advisory → invoke skill) |
| Push guard | `domain/release-mlk-plp-push-gate/*.check.hook.js` | PreToolUse Bash — blocks raw release pushes |
| Eval (script, e2e) | `domain/release-mlk-plp/eval.js` | scratch repo + planted conflict — 10 fixtures |
| Evals (hooks) | sibling folders' `*.eval.js` | 8 + 5 fixtures |
| State | `domain/release-mlk-plp/state/release-<ver>.json` | phase ledger: planned→branched→merged→verified→pushed |
| Log | `log.jsonl` (each folder) | per command / per hook fire |

**Hard guards**: PLP-only origin check · release regex `mlk/release/x.y[.z]` · clean-tree ·
ff-only baseline pull · all-ticket-branches-exist preflight · stop-on-conflict (never auto-resolve)
· verify-before-push (HEAD-pinned) · manual-push gate (fail-closed on missing state, bypass token
`RELEASE_GATE_BYPASS` visible in transcript) · SSH by key only — the password is never typed by Ruri.

Born 2026-07-16 via core/forge.js (nod: miya-2026-07-16-release-mlk-plp-shape-nod).
First live target: Pelupusan 1.0.9 (tickets #269802 · #269939 · #270952, stag).
