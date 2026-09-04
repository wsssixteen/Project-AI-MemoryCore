# Speed Optimization Plan — 2026-09-04 (planning phase, per みや's /goal)

> Goal: make the quest workflow, the agentic layer and the system itself FASTER, surgically, from the data
> the observe-and-monitor layer has already collected. Part 1 (quest workflow) this session; Part 2 (whole
> system) in a fresh session after this plan is nodded. Every proposal carries the measurement that justifies
> it (system-rules Rule 5: the log is the optimization dataset) and the eval case that would prove it.
> Design discipline: system-rules Rule 1 (inventory first — every row refines an EXISTING component) ·
> system-design Rule 3 decay matrix (fire-rate × effectiveness) · Rule 8 (leanest trigger moment).

---

## 0. Is observability collecting? — YES, with 3 rots

| Source | State (measured 2026-09-04) | Verdict |
|---|---|---|
| `system/telemetry/hook-fires.jsonl` (written by `lib/hook-runtime.js` + `lib/dispatch-hooks.js`) | 75,519 rows · 10.5 MB · 17,871 rows in last 30d · fields `ts hook event mode exit blocked bypassed dur_ms` | ✅ collecting every fire, with block + bypass + duration |
| `domain/*/log.jsonl` (41 features) | rows dated up to today; biggest: quest-objective-anchor 413, pre-code-check 279, checklist-reactivate 130, predicate-box 124 | ✅ collecting |
| `system/slips.jsonl` + `slip-dashboard.md` | 586 rows; 38 slips last 14d, 36 みや-caught; 216 `proposal` rows, 52 `upgrade` rows | ✅ collecting |
| `lib/liveness-report.js` | 212 components · 189 fired in 30d · 1 registered-but-silent (`deploy-guard.check.hook`, PreToolUse, born 2026-08-14) | ✅ works |
| `lib/feature-census.js` | 245 components · 116 PROPER · 129 with gaps (all "no eval") · 0 ghosts | ✅ works |
| `lib/watch.js` (change-watch) | 1 overdue observation (`wmsvzl99k`, pre-code-check v1.5, since 08-16) | ⚠️ works, nobody resolves |
| 🚨 ROT 1 | **No ruling loop.** 216 proposals logged, `core/slips.js` has NO `rule` command, 0 ruling rows exist. 42 proposals from 08-21 → 09-04 unruled; the dashboard's own rule ("a proposal >14d unruled is itself a finding") is violated 30+ times. | collected, never consumed |
| 🚨 ROT 2 | 26 files `system/agentic-ticket-workflow-assessment-*.md` (08-05 → 09-04), never consolidated into a fix list. | same |
| 🚨 ROT 3 | `system/liveness-dashboard.md` last regenerated 2026-08-17 (18 days); the CLI works, no step refreshes the file. | stale artifact |

**Conclusion**: the data exists. What is missing is CONSUMPTION — a deterministic step that turns ledgers into rulings.

### 0b. Is MONITORING collecting? — NO. It was never built as a layer

みや's distinction (2026-09-04): observability = liveness ("did it fire / block / how long"); monitoring = the extra
CONTEXT ("why, on which quest and phase, was the block true or false, what did the turn cost, how did みや react").

| Candidate found | Records | Verdict |
|---|---|---|
| `lib/watch.js` change-watch (his 2026-08-16 "observe what we touched") | target · what to observe · rollback SHA · sessions-left | 6 watches ever, all 2026-08-16; 5 resolved ok; 0 added since → **built, then abandoned** |
| `.claude/hooks/reply-log.js` (Stop, 2.9 s/turn) | `ts · qa_active · phase · status · gap_since_prev_minutes` | rhythm only, no context |
| `Feature/Observation-System/observation-log.md` | T1–T4 human observations | tombstoned 2026-05-31 |
| `domain/quest-objective-anchor/log.jsonl` (413 rows) | every open quest's scope + verbatim counts (all 0) | context-free |
| `system/telemetry/hook-fires.jsonl` | `hook · event · mode · exit · blocked · bypassed · dur_ms` (bypass only in native mode) | no reason · no quest · no turn id · no true/false verdict |

Proof of the gap: §1d below had to be reconstructed by hand from this session; nothing in any ledger can answer
"how many of today's blocks were false positives" or "what did Phase 0 of #278304 cost".

---

## M. Monitoring layer design — `turn-ledger` (designed 2026-09-04; BUILD next session via forge)

### M.1 Anchor + best practice, reconciled

| Our system design (the ANCHOR) | Industry practice adopted | How it lands here |
|---|---|---|
| system-rules Rule 1 inventory-first · Rule 5 "log is the optimization dataset (ts + outcome + duration)" | **Wide-event / canonical log line**: ONE rich row per unit of work instead of many narrow rows (Stripe, Honeycomb) | unit of work = the TURN (user prompt → my reply). One wide row per turn in `system/telemetry/turns.jsonl` |
| system-design Rule 7 pick the primitive · Rule 8 leanest trigger | **Correlation id + context propagation** (trace id set at request entry, stamped on every child span) | `turn_id` minted ONCE per turn by the existing UserPromptSubmit dispatcher, propagated via a 1-line file `system/telemetry/current-turn.json`; every hook-fire row stamps it. **Zero new hook registrations.** |
| Rule 9 NUKE-MARKER · forge birth (README · eval · log.jsonl · registry row) | structured logging, schema-versioned rows (`v:1`), low-cardinality fields, bounded strings | all rows JSONL; free text truncated to 160 chars; enums for verdicts |
| Rule 11 state-agnostic | — | `qa` is data; no state literal anywhere |
| Rule 12 ≥20 adversarial scenarios | fail-open telemetry (a monitor must never break the monitored) | every writer swallows its own errors, same as `appendTelemetry` today |
| Rule 3 decay matrix (fire-rate × effectiveness) | **SLO-style yield metric**: true-positive rate per gate, not fire count | `true_blocks = blocks − fp_bypasses` becomes the gate-ruling axis (Q6) |
| File-ownership (no invented folders) | log rotation / retention | `hook-fires.jsonl` (10.5 MB) rotates monthly into `hook-fires-YYYY-MM.jsonl`; readers union the last 2 files |

### M.2 Primitive: **hook + script** (no skill). Components — 2 refined, 1 born, 0 new registrations

| Piece | Kind | What changes |
|---|---|---|
| **M1 context on every fire** — `lib/hook-runtime.js` (wrap + native) and `lib/dispatch-hooks.js` (bundle children) | refine existing | each telemetry row gains `turn_id · session_id · qa · phase · reason` (`reason` = first 160 chars of the block/deny text or the advisory's first line; empty on pass). Read from `current-turn.json` (≈0.1 ms). Bundle mode also gains `bypassed` by scanning the child's own stdout for its bypass-token echo (today only native mode records bypass). |
| **M2 turn-open stamp** — `lib/dispatch-hooks.js` when `--event UserPromptSubmit` | refine existing | before running children: write `current-turn.json` = `{ turn_id: <session_id>-<n>, session_id, opened_ts, qa, phase, status }` (qa/phase = top active.txt block, the exact read `reply-log.js` does today). `n` = count of prior user turns in `transcript_path` (one cheap line scan) |
| **M3 turn row writer** — `domain/turn-ledger/turn-ledger.check.hook.js` (Stop, forge-born; REPLACES `.claude/hooks/reply-log.js`, whose fields it absorbs) | born via forge | at Stop: parse transcript tail once → `tool_calls · tool_names(counted) · reply_chars · assistant_msgs`; read `hook-fires.jsonl` rows with this `turn_id` → `hooks_fired · hook_ms · blocks[] (hook,reason) · bypasses[] (token,reason,fp)`; read `domain/reask/log.jsonl` + `domain/auto-skill-trigger` rows inside `[opened_ts, now]` → `user_signal ∈ {none, reask, correction, nod}`; carry `gap_since_prev_minutes`. Append ONE row to `system/telemetry/turns.jsonl`. |
| **M4 false-positive convention** | rule + parser | a bypass token whose reason starts with `fp:` (e.g. `[skip-predicate-box: fp: no .java edited]`) is a FALSE POSITIVE; any other reason is a legitimate override. M3 parses tokens from the last assistant message with `/\[(skip-[a-z0-9-]+|verified-blocked)[^:\]]*:\s*([^\]]*)\]/g`, sets `fp=true` when the reason matches `/^fp:/i`, and resolves token→hook through a small map in `domain/turn-ledger/token-map.json` (seeded from the existing bypass strings in each hook's source; unknown token → `hook:"?"`, never dropped). |
| **M5 watch discipline** — `domain/de-close-gate` gains C5 | refine existing | block DE close when a file under `domain/`, `lib/`, `.claude/hooks/`, `core/` was Edit/Write-touched this session (transcript tool calls) and `system/claude-md-watchlist.jsonl` has no `watch` row for it this session. Makes the abandoned 08-16 tool fire by construction. |
| **M6 consumer** — `lib/turn-report.js` | born (script) | reads `turns.jsonl` + `hook-fires*.jsonl` (30d): (a) gate yield table: hook · fires · blocks · fp · **true_blocks** · avg ms · verdict per decay matrix; (b) cost by quest phase: turns · tool_calls · hook_ms · blocks; (c) reask rate per session; (d) overdue watches. Output = `system/monitoring-dashboard.md` (generated, never hand-edited) + the Q6/Q8 ruling table. DE step 12.5 runs it; `lib/weekly-audit.js` (Part 2) consumes it. |

### M.3 Row schemas (v1)

`hook-fires.jsonl` (existing + M1 fields): `{ v:1, ts, hook, event, mode, exit, blocked, bypassed, bypass_token?, dur_ms, error?, turn_id, session_id, qa, phase, reason? }`

`turns.jsonl` (new): `{ v:1, turn_id, session_id, opened_ts, closed_ts, qa, phase, status, tool_calls, tool_names:{Read:n,…}, assistant_msgs, reply_chars, hooks_fired, hook_ms, blocks:[{hook,reason}], bypasses:[{token,hook,fp,reason}], user_signal, gap_since_prev_minutes }`

`current-turn.json` (ephemeral, overwritten per turn): `{ turn_id, session_id, opened_ts, qa, phase, status }`

### M.4 Trigger moments (Rule 8)

| Moment | Already fires? | Added cost |
|---|---|---|
| UserPromptSubmit bundle start | yes (34 commands run anyway) | 1 file write + 1 transcript line-count |
| every hook fire | yes | 1 small file read per fire (~0.1 ms × ~116) |
| Stop bundle | yes (39 commands; ~6 already parse the transcript) | 1 transcript tail parse + 1 append; reply-log's 2.9 s disappears (its work is absorbed) |

### M.5 Eval cases (Rule 6 — must pass before registration)

| # | Fixture | Assert |
|---|---|---|
| E1 | synthetic transcript: 3 user turns, 2nd turn has 5 tool_use blocks + an assistant message with `[skip-predicate-box: fp: no edit]` and `[skip-patch-gate: script already stamped]`; telemetry rows for that turn_id incl. 2 blocked | turns.jsonl row 2: `tool_calls=5`, `blocks.length=2`, `bypasses=[{fp:true},{fp:false}]` |
| E2 | current-turn.json missing | hook-fires row still written, `turn_id:null`, no crash, exit code unchanged |
| E3 | replay TODAY's session (transcript at hand) | turn-report reproduces §1d: 12 blocks, 7 fp, per-hook |
| E4 | de-close C5: transcript with an Edit on `lib/x.js`, no watch row | DE close blocked with the file named; with a watch row → pass |
| E5 | rotation: hook-fires.jsonl >8 MB at SessionStart | renamed to `hook-fires-YYYY-MM.jsonl`, liveness 30d counts unchanged |

### M.6 Adversarial scenarios (Rule 12 — 20, each with a verdict)

| # | Scenario | Verdict |
|---|---|---|
| 1 | `current-turn.json` written by session A, read by concurrent session B (two sessions, one repo) | fixture-added: key the file by `session_id` (`current-turn-<sid>.json`); hook reads the one matching its stdin `session_id` |
| 2 | Hook fires with no stdin `session_id` (eval sandbox, manual run) | handled: `turn_id:null`, row still written |
| 3 | Stop fires with `stop_hook_active=true` (anti-loop re-entry) | handled: M3 exits 0 without writing (same guard every Stop gate uses) |
| 4 | Transcript is huge (multi-MB) | handled: read tail only (last 200 KB) for the turn window; line-count for `n` cached in current-turn.json |
| 5 | Transcript path missing / plain text | handled: `tool_calls:null`, row still written |
| 6 | A bypass token appears inside a QUOTED gate message in my reply (the 2026-08-21 self-disarm class) | fixture-added: only tokens in the LAST assistant message count, and only outside fenced code blocks |
| 7 | Reason text contains `]` or newlines | handled: regex stops at first `]`; reason truncated 160 chars; newlines collapsed |
| 8 | I write `fp:` on a bypass that was actually a true block (gaming my own metric) | accepted-risk with control: fp bypasses are listed by name in the weekly table for みや; an fp on a gate that then produced a みや-caught slip flips to `fp_disputed` |
| 9 | Unknown bypass token (new gate not in token-map) | handled: `hook:"?"`, counted, surfaced in report as "unmapped token" |
| 10 | Bundle child blocks via exit 2 with empty stderr | handled: `reason:""`; report flags "silent block" (that is itself a defect to fix) |
| 11 | active.txt has no active block (no quest) | handled: `qa:null, phase:null`; cost still attributed to session |
| 12 | Two turns close within the same second (fast auto-turns) | handled: `turn_id` uses counter `n`, not ts |
| 13 | Worktree session: `CLAUDE_PROJECT_DIR` ≠ main repo; telemetry lands in the worktree copy | accepted-risk (existing behaviour of hook-fires today); DE step 10 pushes the worktree; readers union both paths |
| 14 | OneDrive sync conflict duplicates `turns.jsonl` (`turns-<machine>.jsonl`, seen already for slips/watchlist) | handled: readers glob `turns*.jsonl`, dedupe on `turn_id` |
| 15 | Disk full / file locked | handled: fail-open, swallow, exit unchanged |
| 16 | `reply-log.js` still registered after M3 ships → double rows | fixture-added: forge birth removes the legacy registration; liveness flags a still-firing `reply-log` as duplicate |
| 17 | Orchestration mode (sweep) suppresses gates | handled: suppressed rows already carry `mode:orch-suppressed`; turn row counts them as `suppressed`, not blocks |
| 18 | Rotation happens mid-turn | handled: rotation only at SessionStart; readers union last 2 files |
| 19 | User's prompt is a /command (goal, quest) with no reply text | handled: `reply_chars:0`, row written |
| 20 | Someone hand-edits `turns.jsonl` | handled: `v` field + generated dashboard header "never hand-edit"; report tolerates bad lines |
| 21 | M5 blocks DE for an edit to `lib/` that was a pure revert | accepted-risk: add the watch anyway (`--observe "revert holds"`); cost 1 command |
| 22 | The `fp:` convention forgotten by me | fixture-added: M3 logs `bypass_reason_unclassified` count; report shows it; a rising count is a slip |

### M.7 Success measure (Rule 5 — proven from logs, never asserted)

After 14 days of rows: (a) the Q6 gate ruling is made from `true_blocks`, not `blocks`; (b) "today's 7 false blocks" is a one-line query, not a hand reconstruction; (c) cost per quest phase is visible per ticket; (d) zero `domain/`/`lib/` edits without a watch row.

**STATE-SCOPE**: no, state-agnostic. **NUKE-MARKER**: `domain/turn-ledger/NUKE-MARKER.md` at birth (rollback = remove Stop registration, restore `reply-log.js` registration, delete folder; hook-runtime/dispatch-hooks changes are additive fields and can stay).

---

## 1. What the data says (30-day hook telemetry)

### 1a. Where wall-time goes — 19,801 s (5.5 h) of hook execution in 30d

| Event | Fires | Seconds | Note |
|---|---|---|---|
| SessionStart | 2,137 | **10,303** | 52% of all hook time. Per boot (~224 boots): `worktree-cleanup-boot` 23.3 s · `hook-syntax-check` 8.5 s · `open-quest-surfacer` 8.4 s · `unmerged-release-boot` 5.1 s ≈ **45 s per boot** |
| Stop | 3,779 | 5,238 | 39 hook commands per Stop; slowest: `quest-doc-freshness` 3.1 s · `quest-context-load-gate` 3.0 s · `reply-log` 2.9 s · `codemap-recon-consult.discipline` 2.4 s · `predicate-box` 2.1 s · `quest-resume-preflight` 2.1 s |
| UserPromptSubmit | 2,297 | 2,189 | 34 hook commands per prompt |
| PreToolUse | 7,568 | 1,607 | 25 commands; `branch-guard` 836 fires |
| PostToolUse | 2,006 | 460 | `RecursiveLoopDetector` 759 fires |

### 1b. Which gates earn their slot (blocks ÷ fires)

| Hook | Fires | Blocked | Bypassed | Read |
|---|---|---|---|---|
| pre-code-check | 401 | 129 (32%) | 0 | highest-yield gate in the estate — KEEP |
| release-mlk-plp-scope-gate | 362 | 96 | 12 | high yield — KEEP |
| knowledge-first-gate | 970 | 54 (5.6%) | 0 | fires on every etanah read; KEEP, cost is low (68 ms) |
| release-mlk-plp-push-gate | 353 | 18 | 6 | KEEP |
| de-close-gate | 128 | 16 | 0 | KEEP |
| agent-spend-gate | 49 | 14 | 0 | 29% — but both of today's blocks were friction (name-launch ban + CRLF rejection), not saved spend |
| commit-subject-gate · awam-no-resit-gate | 100 · 137 | 12 · 12 | | KEEP |
| ~25 other Stop gates | 83 each | 0–7 | | each fires 83× per 30d for ≤7 blocks; ~20 of them blocked 0–1 times → decay-matrix LOW-fire/LOW-effect candidates |

Totals: 419 blocks / 17,871 fires = **2.3% block rate**; 29 bypass tokens.

### 1c. Quest throughput (`quest/active-archive.txt`, 48 blocks with both dates)

| Type | n | Avg days start→closed |
|---|---|---|
| bug | 41 | **1.9** (median 1) |
| data-patch / rework / enhancement | 1 each | 0 |
| cr · patch · adhoc · requirement | 1 each | 8 · 9 · 5 · 32 |

Quests are already short in calendar terms. The speed loss is per-turn (gate interruptions, boot cost, re-verification), not per-quest.

### 1d. Today's two-ticket sweep as a data point (#278304 + #277442)

| Measure | Value |
|---|---|
| Manual engine (Scout→Recon→Rubric by hand) | ~40 tool calls; both scripts written, PROD-verified, stamped; both matched a closed precedent (A14/#275587, #276229) |
| `quest-phase0` workflow as second opinion, 2 runs | **2.43 M subagent tokens · 26 min · 22 agents** · verdict: upheld both scripts, added 2 copier line cites, 0 new decisions; 1 agent died after 5 schema retries (`confidence` missing); one verifier claimed `SYSDATE` fails on Postgres (wrong: PROD is EDB, works), corrected by the synthesizer |
| Stop-hook interruptions this session | 12: attachment-ledger ×1 · sql-schema-verify ×1 (emitter cross-products columns onto every table) · full-address-trace ×3 · predicate-box ×1 (**false: no .java edited**) · ba-understanding-table ×3 (**false: not intake turns**) · patch-script-gate ×2 (re-pasted already-stamped script) · silent-claim-drift ×1 |
| UserPromptSubmit false triggers | alter-ticket-gate (fired on "alter to" about a ticket みや said to ignore) · domain-expansion-trigger (fired on the words "new session") · redmine-divergence "not miya's work" ×2 (assignee IS Ridhwan; checker matches by name, not id 1311) |
| Tool defects hit | `redmine-sync.js <num>` ignores the number · `notes.js` cannot parse an `II #NNN` folder (needs `--qa`) · `agent-spend-gate` bans name-launch and the harness then rejects a CRLF scriptPath copy · `quest-phase0` has no model/effort tiering |

---

## 2. Part 1 — Quest workflow: surgical changes (ranked by measured payoff × safety)

Every row refines an existing component (Rule 1). **Safety** = what breaks if wrong. **Eval** = the case that proves it.

| # | Change (existing component refined) | Evidence | Safety | Eval case |
|---|---|---|---|---|
| Q1 | **Precedent fast-path in Phase 0** (`quest` SKILL + `ticket-gate` row): when ad-hoc/latent register or Redmine search yields a CLOSED same-class ticket with a user-verified script → Scout(precedent) → live-DB verify → script; `quest-phase0` NOT run; optional `--second-opinion` = 3 sonnet verifiers only | today: 2.43 M tokens / 26 min bought 0 decisions on 2 precedent-matched patches | none — A14 rule already says start from the register; this makes it the default path | replay #278304: fast-path emits script in ≤15 tool calls; second-opinion ≤300k tokens |
| Q2 | **Tier `quest-phase0` by default** (`.claude/workflows/quest-phase0.js`): discovery/knowledge/notes/5 recon dims → `sonnet` + `low`; root-cause/verify/synthesis → session model; FINDING_SCHEMA gets a default `confidence` so an agent cannot die on 5 retries | 22 agents all on session model today; 1 death | none — the tiered scratchpad copy already ran and produced the same verdicts | rerun today's runs: ≤40% tokens, same synthesis verdict |
| Q3 | **Intake tools fixed**: `quest/redmine-sync.js <num>` honours the number (any assignee, `--create` builds the folder); `quest/notes.js` derives the ticket from `II #NNN` / `AH` / any type-code prefix; `quest/active-cli.js` + `redmine-board.js` match "mine" by user id 1311, not display name | today: 3 workarounds, 1 hand-built folder, 2 false "not miya's work" | none | `redmine-sync.js 277442 --create` on an Aaron ticket → folder-181 shape; `notes.js` on folder 179 without `--qa` → correct file; divergence line silent for id 1311 |
| Q4 | **Stop-bundle false positives closed** (`domain/predicate-box`, `domain/ba-understanding-table`, `domain/patch-script-gate`, `full-address-trace-gate`): predicate-box requires an Edit/Write on `.java/.xhtml` THIS turn; ba-table fires only on the turn a ticket is first synced/opened; patch-gate skips SQL whose hash matches an already-stamped `.sql`; full-address whitelists addresses given in full earlier this session | 7 of 12 blocks today were false or repeats | trigger predicates narrow; true-positive paths untouched | fixture transcripts: today's 7 false blocks → 0; the 5 true ones still fire |
| Q5 | **`domain/sql-schema-verify` emitter: table-scoped columns** (parse `FROM/UPDATE <table>` per statement instead of cross-producting) | today's emit: 12 refs, 5 impossible (`umm_aplikasi.tempat`) | none | 278304.sql emit → 7 refs, 0 false |
| Q6 | **Gate-yield ruling table** (decay matrix, Rule 3): the ~25 Stop hooks with 0–1 blocks in 30d listed with fires · blocks · avg ms · founding slip category → みや rules KEEP / REDESIGN / RETIRE per row; RETIRE = unregister from `settings.json`, file + NUKE-MARKER kept | Stop = 5,238 s / 30d, mostly in hooks that never block | ruling is みや's; unregister is one settings line, reversible | after ruling: Stop time per turn drops by the retired hooks' avg ms; 0 new slips in their categories over 14d |
| Q7 | **Boot cost** (`worktree-cleanup-boot` 23 s · `hook-syntax-check` 8.5 s · `open-quest-surfacer` 8.4 s · `unmerged-release-boot` 5.1 s): syntax-check only files changed since last boot; cleanup only when `.claude/worktrees` mtime changed; surfacer serves a cached board unless >6 h old or `--refresh` | 45 s × ~224 boots = 2.8 h / 30d | stale cache → 6 h TTL + boot line says "cached" | boot ≤10 s when nothing changed; a changed worktree still triggers cleanup |
| Q8 | **Ruling loop built** (`core/slips.js rule <id> BUILD|DROP|DEFER <date> --note`) + `de-close-gate` C5: DE cannot close while any proposal >14d is unruled; dashboard gains a "Ruled" section | 216 proposals, 0 rulings, 42 pending | I prepare the table, みや rules; nothing auto-decides | dashboard "Open proposals" all ≤14d after the next weekly audit |
| Q9 | **Assessment consolidation**: fold the 26 `agentic-ticket-workflow-assessment-*.md` into one rolling `system/workflow-assessment.md` (per-axis dated rows); DE step 7.5 appends rows, never files | 26 files, 0 consolidation | none; git keeps the originals | file count 1; every instance row preserved |
| Q10 | **Regenerate + resolve at DE 12.5**: write `liveness-dashboard.md` and `feature-census.md` every DE; overdue `watch.js` observations must be resolved or escalated | dashboard 18 days stale; watch overdue since 08-16 | none | dashboard mtime = last DE; 0 overdue watches at close |

**Not proposed — the data says keep**: `pre-code-check` (32% yield), `knowledge-first-gate` (54 real blocks, 68 ms), the `release-*` gates, `de-close-gate`, `commit-subject-gate`, `awam-no-resit-gate`.

---

## 3. Part 2 — Whole system (fresh session, after §2 is nodded)

1. **Hook-yield ruling pass** (Q6 method) across all 116 registered hook commands, all events.
2. **Eval backfill** for the 129 no-eval components — or an explicit `eval: not-applicable` ruling so the census stops flagging them.
3. **`deploy-guard.check.hook`** silent since birth (08-14): fixture-replay, then keep or retire.
4. **`states.json`** registry (proposal 09-04 A2, todo Q1 multi-state row): one registry resolved by every hook — kills the Melaka-hardcoded blocks seen on #275847.
5. **Weekly audit as a script** (`lib/weekly-audit.js`): proposals ≥7d · hooks with 0 blocks/30d · stale dashboards · overdue watches → one ruling table.
6. **Low-effort tier policy**: catalogue every Agent/Workflow call-site with model + effort; retrieval defaults to `sonnet` + `low`, judgment stays on the session model.

**Why not `/deep-research` now**: no such workflow exists locally; the 2026-07-19 named run cost 105 Fable agents / 4.08 M tokens. Everything in §1 came from three CLI reads of our own ledgers for ~0 tokens. If a fan-out is wanted for Part 2: 3 sonnet low-effort agents over `hook-fires.jsonl` + `slips.jsonl` + the 26 assessments, schema-forced to one ranked table, ≤300k tokens.

---

## 4. etanah-knowledge banks from today's sweep

| Fact | Home | Status |
|---|---|---|
| MLPS renewal copies the lesen land row: `E:\Projects\Melaka\etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\service\impl\PelupusanSpocService.java` `populateAppPermohonanTanahFromInduk():1051` → `:1073 setNamaKawasanTerlibat(mtpl.getTempat())`, `:1089 setTempat(mtpl.getTempat())`; migrated `tempat='PT '||no_lot` = 48 lesen rows (`MIGRATOR_KTPN_LMS_JASIN`) | BUG-BESTIARY.md (new pattern) · ADHOC-REGISTER A14 (row updated ✓) | queued |
| Batal a mistakenly-created UPS_PLP = 3-table shape (umm_aplikasi Tamat/Batal/Tamat + hubungan NULL · umm_a_tgsn flag_aktif N / Selesai / trkh_tetap · DELETE umm_tgsn_semasa); precedents #276229, #275922, #277442; Utiliti Batal has no UPS_PLP flag (`MlkUtilitiPembatalanPermohonanForm.xhtml:22-38`) | DATABASE.md §cancel-shape · FLOW-TRACES.md | queued |
| `AppTugasan.tarikhTamat` ↔ `umm_a_tgsn.trkh_tetap` (completion instant), NOT `trkh_luput`; engine close = `E:\Projects\Melaka\etanah-common\src\main\java\my\gov\etanah\common\repository\common\AppTugasanRepository.java:31` | DATABASE.md §6.1 | queued |
| Senarai Tugasan = `umm_tgsn_semasa`, read by `E:\Projects\Melaka\etanah-common\src\main\java\my\gov\etanah\common\notification\service\impl\DashboardService.java:165` with NO status filter → a Tamat app keeps its row until deleted | DATABASE.md §6.3 | queued |
| Melaka PROD `etprdmlk` is EDB Advanced Server (Oracle-compat): `SYSDATE` valid | DATABASE.md §env | queued |
| `tempat` convention: app default NULL (17/24 user rows); "-" is a stored value (66 migrated + 1 officer-typed); L1e renders blank as "-" (`PelupusanReportMethodConstant.populateTempat():818`) | DATABASE.md value-conventions | queued |

---

## 5. Sequence

1. みや rules on §2 rows (BUILD / DROP / DEFER each) + confirms §M as designed.
2. This session: bank §4 (mechanical, ~6 edits), then Q3 + Q5 (small, deterministic, eval-guarded, each with its ≥20-scenario table per system-design Rule 12).
3. **Fresh session, FIRST item: build §M (turn-ledger) via forge** — M1/M2 refinements, M3 born, M4 token-map seeded, M5 de-close C5, M6 report; evals E1–E5 green before registration. Reason it goes first: every later ruling (Q6 gate yield, Q8 proposals, Part 2 hook pass) is decided from `true_blocks` and per-phase cost, which only exist once §M is collecting.
4. Same fresh session after §M: Q1/Q2/Q4/Q6/Q7/Q8/Q9/Q10, one commit per item, before/after telemetry rows cited in each commit.
5. Part 2 (§3) after 14 days of §M rows, so the whole-system ruling pass reads measured yield, not fire counts.
