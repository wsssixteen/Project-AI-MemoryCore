goal_status: draft (derived from nuke-marker on 2026-09-06; promote with node lib/goal-backfill.js promote ticket-close-block)
symptom: miya ask (#276436): auto-emit the git commit-reference block at ticket close, module-aware branch vs int-env, in his plain sentence style
goal: resolve: miya ask (#276436): auto-emit the git commit-reference block at ticket close, module-aware branch vs int-env, in his plain sentence style
goal_signal: unknown — needs a read of the code
retention: rotate monthly
# ticket-close-block

Generates the git commit-reference block miya pastes at the end of a ticket, in the exact `<pre>` shape.

## What it does

`node domain/ticket-close-block/ticket-close-block.js --repo <path> --ticket <num> --module <pelupusan|awam> [--branch <name>] [--intenv-sha <sha>] [--cherrypick]`

Reads git (branch + commit + int-env merge) and prints the block. Deterministic — same inputs, same output.

## Trigger moment

Invoke at ticket **close** / miya says **"test passed"** / after a **confirmed push** — not every turn. Runs on demand; folds into the close flow (`close-phase` / `feedback_commit_deploy_runbook`).

## Module rule (branch vs merge)

| Module | Block shows |
|---|---|
| AWAM (`etanah-awam`) | **Branch only** — another team does the PROD merge and refers to the branch |
| Pelupusan (`etanah-pelupusan`) | Branch **+ merged to mlk/int-env** — we deploy PROD; BA tests on int-env |
| Either, cherry-picked | `--cherrypick` → "cherry-picked to mlk/int-env" (usually only when merging) |

## Wording style

The prose close-message uses miya's plain sentence voice — see `feedback_ticket_writing_style.md`. This script produces only the git block; the surrounding message follows that style. Style converges over time from miya's amendments (the improvement dimension of this feature).

state-scoped: no, state-agnostic — module + repo are parameters; works for any state (Melaka now, Perak later) with no path change.

log: `domain/ticket-close-block/log.jsonl` (ts + ticket + module + branch + commit + intenv + outcome).

## Adversarial scenarios (Rule 12)

| # | Scenario | Verdict |
|---|---|---|
| 1 | Ticket has no branch yet (not committed) | handled — branch "(not found)", no commit line |
| 2 | Multiple branches (rework v2/v3) | handled — suffix regex `/<num>(vN)?$` prefers the exact one |
| 3 | AWAM ticket | fixture-added — int-env omitted (tested) |
| 4 | Pelupusan cherry-pick not merge | handled — `--cherrypick` flag changes the wording |
| 5 | Num appears in an unrelated branch | handled — env branches filtered; suffix regex narrows · accepted-risk: a stray branch ending in the num |
| 6 | Wrong/non-git repo path | handled — git throws, commit=null, block still emits |
| 7 | Commit subject has newlines/special chars | handled — subject re-joined |
| 8 | int-env not deployed yet (pelupusan) | handled — intenv=null, no merge note |
| 9 | Branch only on origin, not local | handled — `origin/` prefix stripped |
| 10 | Two sessions write log.jsonl | accepted-risk — appendFileSync is per-line atomic; rows may interleave, none corrupt |
| 11 | Num is a substring of a longer number | handled — `git branch --list *<num>*` will not match a longer number as a whole |
| 12 | miya passes explicit `--branch`/`--intenv-sha` | handled — explicit args override auto-detection |
