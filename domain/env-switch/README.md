# env-switch — local environment switch + local test prep

Two scripts, one concern: miya's local JBoss must match the test that is about to run.

| Script | Does | Eval |
|---|---|---|
| `quest/env-switch.js` | reports / switches the active local datasource (`etanahDS`) and `cas.url` | `domain/env-switch/eval.js` |
| `quest/local-test-prep.js` | one run before any test hand-back: switch to the schema that holds the test data, place the ticket branch's changed files uncommitted on miya's repo, say whether JBoss must restart, write a log row | `domain/env-switch/prep.eval.js` |

symptom: 2026-10-04, #282442 — a test row named an MLIT permohonan while the local app read et_main_stg2 and the local repo held none of the ticket's fixes; miya started JBoss and found nothing. Per miya: "make sure to run in the background when I decide to run a local test ... every single time".
goal: no test hand-back reaches miya unless his local machine already reads the schema holding the test data and already holds the ticket's fix files.
goal_signal: the reply that carries a test table also carries a `LOCAL-TEST-PREP:` line, and `node quest/local-test-prep.js --check --permohonan "<id>"` exits 0.
goal_signal_regex: LOCAL-TEST-PREP: #\d+ · env et_main_\w+ · fixes \d+/\d+
retention: rotate monthly — `domain/env-switch/prep-log.jsonl` (audit copy); the row the gate reads lives at `%TEMP%\claude\local-test-prep\log.jsonl` and is regenerate-class (safe to delete, a fresh prep rewrites it).
footprint: on-demand: 1 node per prep run (spawns env-switch.js, git, one powershell for the JBoss check); the gate half adds no process, it runs inside the existing `test-scenario-login-gate` Stop hook.
state-scoped: yes — Melaka paths (`E:\Projects\Melaka\<repo>`, `E:\Dev\etanah-work\<repo>`, the Melaka JBoss `standalone.xml`). Another state passes `LTP_REPO` / `LTP_SRC` / `ENV_SWITCH_STANDALONE`; trunk is derived from the ticket branch prefix (`<prefix>/master`) or `--trunk`.

## How it is enforced

`domain/test-scenario-login-gate/test-scenario-login-gate.check.hook.js` v3 (Stop): a reply with a test hand-back (test scenario words, a test table with Login + Do/Expect/Env, or deploy steps) that names a permohonan id is blocked unless the last prep run is under 45 minutes old, finished clean, covers every id, and is still true on the machine (active schema unchanged, fix files still equal to the branch tip). Bypass with the skip-local-prep token and a real reason (miya said hold · module not runnable locally).

## Known limits (2026-10-04)

- The prep cannot check that the permohonan exists in the schema; the caller confirms that by a DB query and passes `--env`.
- It does not yet verify that the COMPILED and DEPLOYED class carries the fix. On #282442 a file copy kept an old modified time, Eclipse did not rebuild, and the old class ran. The script now writes the files itself (fresh time), which removes that cause, but the class check is not built.
- `quest/env-switch.js` cannot see a datasource whose `pool-name` differs from its jndi name; the prep names that typo when the switch fails.

## Adversarial scenarios (system-design Rule 12) — verdicts

| # | Scenario | Verdict |
|---|---|---|
| 1 | no prep ever ran, test row sent | fixture P01, P02 |
| 2 | dry run counted as a prep | fixture P03, P04 |
| 3 | machine switched back after the prep | fixture P13 |
| 4 | fix file reverted after the prep | fixture P14 |
| 5 | prep row stale | fixture P15 |
| 6 | local edit on a fix file | fixture P16 (left untouched, NOT READY) |
| 7 | gate after a NOT READY prep | fixture P17 |
| 8 | datasource hidden by a pool-name typo | fixture P18 |
| 9 | ticket branch missing | fixture P19 |
| 10 | quest unknown, no branch given (silent 0/0) | fixture P28 |
| 11 | branch read from the quest block | fixture P29 |
| 12 | no fix exists yet | fixture P20 (`--no-branch`) |
| 13 | CRLF copy of the fix already present | fixture P30 |
| 14 | placing onto a CRLF file | fixture P31 |
| 15 | real bypass reason | fixture P21 |
| 16 | the gate's own help text quoted back | fixture P22 (token with `<` rejected) |
| 17 | stop_hook_active loop | fixture P23 |
| 18 | permohonan id in a non-test reply | fixture P24 |
| 19 | malformed stdin | fixture P25 |
| 20 | scenario with login, no id (old behaviour) | fixture P26 |
| 21 | missing arguments | fixture P27 |
| 22 | an id not covered by the prep | fixture P12 |
| 23 | file deleted on the branch | fixture P06 (ignored) |
| 24 | gate runs from another checkout than the prep | handled: the row lives at one machine-wide path |
| 25 | two sessions prep different quests within 45 minutes | accepted-risk: last row wins; the id-coverage check blocks the other session's hand-back until it re-runs |
| 26 | permohonan absent from the chosen schema | accepted-risk: not checkable without a DB client in node; caller's query is the control |
| 27 | Eclipse does not rebuild a placed Java file | accepted-risk: fresh write time removes the known cause; deployed-class check not built |
