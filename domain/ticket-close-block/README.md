goal_status: draft (derived from nuke-marker on 2026-09-06; promote with node lib/goal-backfill.js promote ticket-close-block)
symptom: miya ask (#276436): auto-emit the git commit-reference block at ticket close, module-aware branch vs int-env, in his plain sentence style
goal: every ticket-close text (git commit block, BA pass note, done-alter / patch+alter note) comes out of this script in miya's shape, so no step types it by hand and the shape has one home
goal_signal: the note pasted on Redmine equals this script's stdout for the same inputs; for `--alter`, `ticket-close-block.eval.js` F1/F2 pin that stdout byte for byte and exit 0
retention: rotate monthly
footprint: on-demand: 1 node process per call, under 1 s, nothing running otherwise
self_audit: each `--alter` run checks its required inputs before printing (a missing or empty `--ticket --ba --id --tugasan --user` = exit 1, nothing printed), warns on a BA with no short name, and writes a log row (ts · ticket · mode · patched · outcome); `node domain/ticket-close-block/ticket-close-block.eval.js` re-pins the exact note at every refine
boundary: covers the inputs it is given, local git reads of the repo it is pointed at, `ba-names.json`, the quest block via `quest/active-cli.js read` and its own `log.jsonl` · never posts to Redmine, never writes git, never edits a Task folder or quest file · stops at the printed note on stdout (exit 3 when the falsifier ledger refuses a `--ba` pass note); miya or the prefill step pastes it
diagram: `domain/ticket-close-block/diagram.png` (source `diagram.html`)
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

The prose close-message uses miya's plain sentence voice — see `feedback_ticket_writing_style.md`. **v1.1 (2026-09-29, #282061)**: `--ba <first name> [--envs "internal & staging"]` prints miya's BA pass note around the git block (`Salam <BA>, have deployed fixes to <envs>. Please help to verify.` · `Issues resolved:` · `1. ` · git block · `Thank you.`), so the shape comes from the tool, not from a memory file. Without `--ba` the output is unchanged (smoke-tested both ways). Only the numbered list is written by hand. Style converges over time from miya's amendments (the improvement dimension of this feature).

## Done-alter note: `--alter` (2026-11-05, 288533)

`node domain/ticket-close-block/ticket-close-block.js --alter --ticket <num> --ba "<BA name>" --id <ID> --tugasan "<tugasan>" --user <login from the AFTER check> [--resit "<no1>, <no2>"] [--patched] [--prod-script <num>.sql]`

Prints the Melaka done-alter note (alter alone) or the patch+alter note (`--patched`). No repo needed. This script is the note's one home: `ALTER-TICKET-PLAYBOOK.md` §5.1, quest step 6c, `redmine-phase1-prefill` Step 4 and `alter-ticket-gate` A6 point here and never restate the shape. `--resit` adds a `No. Resit:` line under the ID; `--prod-script` adds the attached-script line (file name only). Missing or empty required flag = exit 1, nothing printed. Unknown BA = greeted as given + a stderr warning. Eval: `ticket-close-block.eval.js` (alter only · patch+alter with resit and script · unknown BA · missing args · empty flag · log rows).

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

## Falsifier ledger refusal (2026-10-04, #244600)

With `--ba` on OUR fix (commit author is us), the tool first runs `domain/falsifier-ran-check/check.js`. An OPEN falsifier row or `local_test_confirmed` not true → exit 3, nothing printed to stdout, the reasons on stderr. No flag skips it. A colleague's fix and a ticket with no quest block are not checked. Fixtures: `domain/falsifier-ran-check/check.eval.js` 44, 45.

| 13 | BA pass note asked while a falsifier is unrun | fixture-added — refused, exit 3 |
| 14 | `--alter` with a required flag missing | fixture-added (eval F4) — exit 1, flags named, nothing printed |
| 15 | `--alter --user` given with no value | fixture-added (eval F5) — counted as missing, exit 1 |
| 16 | `--alter` BA not in `ba-names.json` | fixture-added (eval F3) — greeted as given + stderr warning |
| 17 | `--prod-script` given as a full Windows path | fixture-added (eval F2) — only the file name is printed |
| 18 | BA name typed in a different case | fixture-added (eval F2) — matched case-insensitively |
| 19 | User ID taken from the BA's message instead of the AFTER check | accepted-risk: the script cannot see the DB; the flag help and the playbook name the AFTER check as the source |
| 20 | Eval run writes test rows into the real log | handled — the eval runs a copy in a temp folder |
