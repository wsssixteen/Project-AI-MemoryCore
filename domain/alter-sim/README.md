symptom: 2026-10-28 QA-262027: miya asked why the alter went through the Pelupusan Flowable Alter Page when the Flowable schema is readable on staging and internal; an alter is engine Java plus our own task listener, so a SQL-only copy is unsafe and nothing showed what an alter would do before it was done
goal: before a real alter on stg1, stg2 or mlit, the new live tugasan row (kod, holder, peranan) and its engine task are known from a run of the real code that left no row behind
goal_signal: an ALTER-SIM line with PREVIEW OK and rollback proven, then an ALTER-SIM COMPARE line with MATCH after the real alter
goal_signal_regex: ALTER-SIM( COMPARE)?: (PREVIEW OK|MATCH)
retention: rotate monthly
footprint: on-demand: 1 java process about 1.1 to 2 GB (heap cap 2 GB) for about 2 minutes per preview, 3 database connections held only during the call; 0 processes when not used
self_audit: every preview reads its own alter-sim.json back: rollbackProven must be true, an exit-0 preview must carry at least one new live umm_a_tgsn row and each row must name a live engine task; FAIL turns the exit non-zero and is logged
diagram: domain/alter-sim/diagram.png (source diagram.html)
state-scoped: yes, keyed by the env allow-list in E:\Dev\scripts\AlterSim\src\altersim\Guard.java (Melaka stg1, stg2, mlit: server, main, sistem and engine schema) and LIVE in alter-sim.js; another state adds its own rows there, nothing else is Melaka-only

# alter-sim — see an alter's result before it happens

An alter is not SQL. `PelupusanFlowableService.alterFlow` moves the engine token, the BPMN task listener `receiveUserTask` runs, and `CommonAsyncService.handleAssignationAsync` (`@Async`, `REQUIRES_NEW`) writes `umm_a_tgsn` and picks the holder in its own transaction. alter-sim runs that same code on the real data and throws the result away.

## How it stays safe

| Risk | What stops it |
|---|---|
| PROD | allow-list, not deny-list: `alter-sim.js`, `as.ps1` and `Guard.java` each refuse any env but stg1, stg2, mlit; Guard checks every JDBC URL (server, database, schema) before a connection opens |
| a commit | `SwallowDataSource`: one physical connection per datasource, autocommit off; `commit()` from any code does nothing; the run ends with a real rollback |
| `REQUIRES_NEW` / `@Async` commit on their own | the same physical connection is handed out every time, and the async executors are replaced by a caller-thread executor, so the listener's write lands in the one open transaction |
| a hung or killed JVM holding staging locks | server limits on each connection: `idle_in_transaction_session_timeout` 120 s, `lock_timeout` 10 s, `statement_timeout` 120 s |
| calls that leave the JVM (other modules, report server, mail) | wrapped: the call throws and is listed; the preview exits 5 (BLOCKED) |
| Flowable job executor picking up staging jobs, schedulers | executor off, Quartz and `@Scheduled` processing removed |
| "it rolled back" taken on trust | after the rollback a fresh read-only connection re-reads every row and must equal the BEFORE read; else exit 7 |
| code that rolls back inside the run | counted; the preview exits 6 (not reliable) and names where |

## Pieces

| Piece | Role |
|---|---|
| `alter-sim.js` | Runner: env allow-list, calls the tool, prints the `ALTER-SIM:` line, self-audit, log row; `compare` reads the real AFTER rows through `alter.js liveState` and prints MATCH or MISMATCH per field |
| `alter-sim.eval.js` | Fixtures: argument guards, PROD refusal at all three layers, summary line, self-audit, compare, README keys, NUKE-MARKER |
| `log.jsonl` | One row per preview or compare (ts, env, id, exit, summary, goal_met, self_audit, dur_ms). Gitignored; only the main checkout's copy is used |
| `E:\Dev\scripts\AlterSim\` | The tool: `as.ps1` + `src\altersim\*.java`. Reuses the doc-sim boot `E:\Dev\scripts\EtanahTemplateGen\src\tg\Boot.java` through three additive hooks (`Boot.maker`, `-Dtg.ds.<name>`, `-Dtg.extraBeans`, `-Dtg.noDms`); doc-sim's default path is unchanged (doc-sim eval 52/52) |
| `E:\Dev\scripts\FlowableAlter\alter.js live` | The fast read (no page, no login): app rows + engine tasks, variables, history; each live `umm_a_tgsn.id_bpm_task` must match a live `act_ru_task.id_` |

## Use

```
node domain/alter-sim/alter-sim.js preview --env stg1 --from-log E:\Dev\scripts\FlowableAlter\logs\<date>\<dry-run>.json
node domain/alter-sim/alter-sim.js preview --env stg1 --id PTMLK/02/L/PSBS/2026/1 --target KKMMKN
node domain/alter-sim/alter-sim.js compare E:\Dev\scripts\AlterSim\out\<run>\alter-sim.json
```

`--from-log` is the exact copy: the page's own task, target label and variable table, as alter.js recorded them at the dry-run. Without it the variables are the live process variables, which can miss the model defaults the page adds for unset variables (the run says so).

## Trigger moment

On purpose only: before a real alter on stg1, stg2 or mlit. Nothing runs at boot, per prompt or per tool.

## Out-of-spec scenarios considered

| # | Scenario | Verdict |
|---|---|---|
| 1 | `--env prod` | fixture: refused by alter-sim.js (3), as.ps1 (3), Guard.java |
| 2 | standalone.xml datasource repointed at a PROD host | handled: Guard.check refuses the URL before a connection |
| 3 | FLOWABLE_URL2 points at another engine schema | handled: Guard.check engine allow-list |
| 4 | engine bean not on the never-committing connection | handled: Guards BPP stops the boot |
| 5 | application code calls commit | handled: counted, ignored |
| 6 | code asks for an inner rollback | handled: exit 6 with the frames |
| 7 | `@Async` runs on another thread | handled: SyncTaskExecutor for both executors |
| 8 | `REQUIRES_NEW` opens a new connection | handled: same physical connection |
| 9 | target is a callActivity into etanah-teknikal | handled: the module call is blocked, exit 5 |
| 10 | JVM killed mid-run | handled: server ends the session after 120 s idle in transaction, rolls back |
| 11 | a real user edits the same rows during the preview | accepted-risk: lock_timeout 10 s; the rollback proof then says NOT proven (exit 7) instead of hiding it |
| 12 | ID with 0 or 2 umm_aplikasi rows | handled: exit 4 |
| 13 | 0 or 2+ live engine tasks, no --task | handled: exit 4, lists them |
| 14 | --task not a live task of this ID | handled: exit 4 |
| 15 | target KOD on two nodes (twins) | handled: exit 4, lists both |
| 16 | target not found | handled: exit 4 |
| 17 | hostile --id / --target text | fixture |
| 18 | --from-log of a migrate or initiate run | handled: refused, alter-flow only |
| 19 | --from-log plus --id | fixture |
| 20 | worktree copy writes its own log | handled: MAIN_HOME |
| 21 | preview variables differ from the page's | handled: --from-log copies the page; without it the run prints that variables are the live ones |
| 22 | sequence numbers consumed by the preview | accepted-risk: sequences are outside transactions; ids skip a few numbers, no row stays |
| 23 | audit columns (created_by, dates, version) differ from the real run | handled: left out of the change table and the compare |
| 24 | preview exit 0 with no new row | fixture: self-audit FAIL |
| 25 | compare when the real alter made more rows than the preview | fixture: MISMATCH, real-only row listed |
| 26 | doc-sim's default path changed by the Boot hooks | handled: hooks are no-ops unless set; doc-sim eval 52/52 |
| 27 | report server / mail touched | handled: wrapped, exit 5 |
| 28 | stg1 and stg2 share et_flowable17 | handled: snapshot and locks are per process instance; Guard accepts et_flowable17 for both |
| 29 | PostgreSQL refuses setReadOnly / isolation mid-transaction | handled: those calls are ignored on the one transaction |

## Rollback

See `NUKE-MARKER.md`.
