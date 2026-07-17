# release-mlk-plp — Melaka Pelupusan release pipeline (Feature contract)

**One line**: Redmine-recon every ticket → branch `mlk/release/<ver>` off fresh `mlk/master` →
merge with stop-on-conflict → verify → bump common+module version → push → hand みや a reminder
card. **Baseline PREPARES; みや runs build/deploy/sheet** (scope-locked 2026-07-16 — no SSH,
no keys). Stop-points V1-V3. PLP-only; duplicate as `release-<state>-<module>` for expansion.

| Piece | File | Fires |
|---|---|---|
| Orchestrator skill | `.claude/skills/release-mlk-plp/SKILL.md` | Skill tool — "prepare release" / "baseline" / BAQA message |
| **Evidence recon script** | `domain/release-mlk-plp/redmine-recon.js` | Phase A step 3 (MANDATORY) — reads every Redmine channel + git, verdicts each ticket, emits the Ask-BA table |
| Git mechanics script | `domain/release-mlk-plp/release-prep.js` | invoked by the skill, one subcommand per phase |
| Prompt trigger | `domain/release-mlk-plp-ask/*.check.hook.js` | UserPromptSubmit (advisory → invoke skill) |
| Push guard | `domain/release-mlk-plp-push-gate/*.check.hook.js` | PreToolUse Bash — blocks raw release pushes |
| **Scope counter-rail** | `domain/release-mlk-plp-scope-gate/*.check.hook.js` | PreToolUse Edit\|Write — blocks ANY etanah-pelupusan edit while a release is in flight |
| Eval (script, e2e) | `domain/release-mlk-plp/eval.js` | scratch repo + planted conflict + counter-rail — 15 fixtures |
| Eval (recon) | `domain/release-mlk-plp/eval-recon.js` | offline verdict matrix + the 2 real 2026-07-16 misses — 17 fixtures |
| Evals (hooks) | sibling folders' `*.eval.js` | 8 (push) + 6 (ask) + 11 (scope) fixtures |
| Config (gitignored) | `servers.local.json` · `redmine.local.json` | infra endpoints + API key — `.example` twins are committed |
| State | `domain/release-mlk-plp/state/release-<ver>.json` | phase ledger: planned→branched→merged→verified→pushed |
| Log | `log.jsonl` (each folder) | per command / per hook fire |

**Hard guards (DOs side)**: PLP-only origin check · release regex `mlk/release/x.y[.z]` · clean-tree ·
ff-only baseline pull · all-ticket-branches-exist preflight · stop-on-conflict (never auto-resolve)
· verify-before-push (HEAD-pinned) · manual-push gate (fail-closed on missing state, bypass token
`RELEASE_GATE_BYPASS` visible in transcript). Build/deploy/sheet are みや's — Ruri never ssh's,
so the server password is needed nowhere and stored nowhere.

**Counter-rail (DON'Ts side, みや 2026-07-16 — "DO NOTHING EXCEPT WHAT WE'VE ESTABLISHED")**:
a release ASSEMBLES branches; it never authors or fixes code. Three enforcement layers —
1. `SKILL.md §DON'Ts` — the 12-row table + the scope test ("is this exact action written in Phase A-E?").
2. `release-prep.js bump-version` — refuses on a dirty tree; asserts the produced diff is exactly
   1 file (`pom.xml`) / 1 removed / 1 added line, both the `etanah-pelupusan` `<version>` line;
   auto-reverts and exits 2 otherwise. Parent/plugin/dependency versions can't be touched.
3. `release-mlk-plp-scope-gate` — PreToolUse hook; while any state file sits at phase
   `branched|merging|merged|verified|bumped`, every Edit/Write into `etanah-pelupusan` is BLOCKED
   (bypass `[skip-release-scope: <reason>]`, transcript-visible). Stands down at `planned`/`pushed`
   and when no release is in flight, so ordinary Quest work is untouched (eval F7).

Born 2026-07-16 via core/forge.js (nod: miya-2026-07-16-release-mlk-plp-shape-nod).
First live target: Pelupusan 1.0.9 (tickets #269802 · #269939 · #270952, stag).
