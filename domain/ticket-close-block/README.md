goal_status: draft (derived from nuke-marker on 2026-09-06; promote with node lib/goal-backfill.js promote ticket-close-block)
symptom: miya ask (#276436): auto-emit the git commit-reference block at ticket close, module-aware branch vs int-env, in his plain sentence style
goal: every ticket-close text (git commit block, BA pass note, done-alter / patch+alter note, patch-done note) comes out of this script in miya's shape, so no step types it by hand and the shape has one home
goal_signal: the note pasted on Redmine equals this script's stdout for the same inputs; `ticket-close-block.eval.js` pins that stdout byte for byte (`--alter` F1/F2, `--patch` P1-P10) and exits 0
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

## Patch-done note: `--patch` (2026-11-11, 288974)

`node domain/ticket-close-block/ticket-close-block.js --patch --ticket <num> --ba "<BA name>" [--sql <num>.sql] [--file "<Dokumen name>=<new file>"]… [--was "[<ID Permohonan>|]<column>=<value in the BEFORE check>"]… [--tugasan "<tugasan>"] [--user <login>] [--id <ID>]`

Reads the patch itself and prints one line per thing changed, grouped per ID Permohonan: `UPDATE` columns in BA words with `before -> after` (before = the `WHERE` literal of the same column, or `--was`), `DELETE` and `INSERT` rows, replaced files. It lists what changed only and never says "not changed". The plain-word maps (`KEY` · `SCOPE` · `ROW` · `COL`) at the top of the script are the one home of BA wording; a column or table not in them is printed by its raw name with a `warn:` on stderr, never dropped. A link column set to NULL with no `--was` prints `Link to another permohonan: removed` and a warn asking for the ID. `--alter … --sql <num>.sql` puts the same lines under the ID of a patch + alter note. Why: the 288974 note was typed from memory and said the linked permohonan was not changed after the script had removed its link. Eval P1-P11 (fixtures = the shipped 288974, 288963 and 283980 scripts).

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
| 21 | `--patch`: the script nulls a column that points at another permohonan | fixture-added (P1, P1c) — the link line is always printed; no `--was` = a warn asking for the ID |
| 22 | `--patch`: a note claiming another permohonan is "not changed" | fixture-added (P1b) — the generator has no such sentence |
| 23 | `--patch`: two permohonan in one statement (`IN (…)`) | fixture-added (P3) — one group each, `--was` per ID |
| 24 | `--patch`: a statement keyed by something else (No. Lesen) in a one-permohonan script | fixture-added (P2) — goes under that permohonan, its key is a header line |
| 25 | `--patch`: same value written to two tables | fixture-added (P2) — one line, both scopes named |
| 26 | `--patch`: document replace + PDF reset | fixture-added (P4, P4b) — the `--file` line; a reset with no `--file` warns |
| 27 | `--patch`: file-only replace, no script | fixture-added (P4c) — `--id` heads the note |
| 28 | `--patch`: an INSERT | fixture-added (P5) — row listed with its values; ids and audit columns left out |
| 29 | `--patch`: a column with no plain word | fixture-added (P6) — raw name + warn |
| 30 | `--patch`: reference-table patch, no permohonan | fixture-added (P7) — the row key heads the lines |
| 31 | `--patch`: script with no DML, or `--ba` missing | fixture-added (P8, P8b) — exit 1, nothing printed |
| 32 | `--patch`: a comma, `;` or `--` inside a quoted value | fixture-added (P5 value `R, 1`) — quotes and brackets are masked before splitting |
| 33 | `--patch`: a column set back to the value it already had (`--was` equals the new value) | handled — no line (P3, the never-linked permohonan) |
| 34 | `--patch`: `INSERT … SELECT` or a multi-row `VALUES` | handled — the row line is printed with a warn to add the values by hand |
| 35 | `--patch`: a `SET` value that is a subquery with its own `WHERE` | handled — the top-level `WHERE` is found on the masked text |
| 36 | `--patch`: the script was edited after it ran | accepted-risk: the generator reads the file it is given; quest 6c keeps one `<num>.sql`, the same file that is attached |
| 37 | `--patch`: the UPDATE matched 0 rows on PROD | accepted-risk: the script cannot see the DB; the `-- N rows` check at run time owns that |
| 38 | `--alter` with no patch flags after this change | fixture-added (P10) — byte for byte F1 |
| 39 | patch + alter | fixture-added (P9) — patched lines under the ID, above Tugasan and User ID |
| 40 | `--patch` across several permohonan with `--file` | handled — the file line goes under `--id`, else the first with a warn |
