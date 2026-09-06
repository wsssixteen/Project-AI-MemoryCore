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

### M.2b — **M7 goal-lens: live self-assessment per feature run** (みや, 2026-09-04 17:50, verbatim intent)

> *"my kind of 'monitoring' is part of a FEATURE build where every time the feature runs, it will approach it in a 'lense' or 'goal' to check it LIVE whether this feature is fulfilling the true goal of that particular feature after it runs. It will straight away document it. What can be improved, optimized, refined, changed, updated, deleted, added in order to reach the original goal OR to surpass the original goal."*

This is the piece M1–M6 do not do: they record WHAT happened; M7 records whether the feature's **goal** was served by that run, judged at the moment it ran. Anchor = the Feature trinity's `README.md` already declares the contract ("what fires when"); M7 makes the README's **goal line** a runtime input, and the Forge trifecta's *Goal* (3G) becomes checkable instead of declared-once.

| Element | Design | Anchor |
|---|---|---|
| Goal declaration | every Feature README gains a machine-readable line `goal: <one sentence — the outcome this feature exists to produce>` + `goal_signal: <how a run knows it succeeded>` (e.g. patch-script-gate: goal = "no SQL ships to infra without `-- N rows` + Stage-Match"; signal = "the next assistant reply contains both") | Feature README (exists) · forge template adds the two lines at birth; `feature-census` flags features without them |
| Live check — deterministic half | at the feature's NEXT observable moment the harness can see (the following Stop for a block; the next boot for a SessionStart hook), the turn-ledger evaluates `goal_signal` mechanically and writes `goal_met: true/false/unknown` onto the feature's `log.jsonl` row for that fire | M3 turn-ledger (Stop) — it already parses the transcript tail; zero new hooks |
| Live check — judgment half | when `goal_signal` cannot be evaluated mechanically (`unknown`), the turn-ledger appends ONE line to the Stop context: `goal-lens: <feature> fired this turn — goal: <goal>. Met? gap? improve?` and I answer in ≤2 lines **inside that same turn** via `node core/goal-lens.js note <feature> --met y|n|partial --gap "<what fell short>" --improve "<change that would reach the goal>"` | new tiny CLI `core/goal-lens.js` (script, forge-born) writing `domain/<feature>/goal-log.jsonl`; bounded to features that actually FIRED this turn, so cost ≈ 1–3 lines per turn, never a sweep |
| Documentation "straight away" | the `goal-log.jsonl` row IS the documentation: `{ts, turn_id, feature, met, gap, improve, beyond?, evidence: <turn_id or file:line>}`; `lib/turn-report.js` (M6) rolls it up per feature: met-rate, top recurring `gap`, top recurring `improve` | Rule 5 — log is the optimization dataset |
| Consumption | a feature with met-rate < 70% over 20 fires, or the same `gap` 3× → auto-raised as a `proposal` row (weekly audit rules BUILD/DROP/DEFER — Q8 loop) | Q8 ruling loop |

**On "reach the original goal OR surpass it" — my answer: keep both, but as two fields with different rules.**
- `improve` (reach the goal) is **required** whenever `met ≠ y`. That is the corrective loop and it must never be optional.
- `beyond` (surpass the goal) is **optional and evidence-gated**: it may only be written when THIS run showed a concrete instance that the goal itself was too small (e.g. the gate blocked correctly but the block text was unusable — the goal "block" was met, the real outcome "miya gets the fix in one line" was not). Without a cited instance the field stays empty. Reason: an unbounded "how could this be even better" prompt on every fire produces wishful rows, and the 216-proposals-0-rulings rot shows what happens to unbounded idea streams. So: **yes, the second part is needed, but as a rare, evidenced field, not a per-run question.**

**Eval cases (added to M.5)**: E6 — patch-script-gate blocks a turn; next reply carries `-- N rows` → its log row gets `goal_met: true` with no model input. E7 — predicate-box fires on a turn with no edit; goal-lens prompt appears once; `goal-lens note predicate-box --met n --gap "fired with no edit" --improve "require Edit/Write tool call"` → row written, and turn-report shows predicate-box met-rate. E8 — a `beyond` note without an `evidence` field is rejected by the CLI.

**Adversarial additions (M.6)**: 23 — goal-lens prompt appears for 10 features in one turn → cap at 3 per turn (highest-cost features first), rest deferred to DE batch. 24 — I answer `--met y` reflexively → weekly audit samples 5 `met y` rows against the transcript; disagreement rate is itself a metric. 25 — README has no `goal:` line → feature listed as "goal-less" in census; no prompt, no false verdicts.

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
4. ~~**`states.json`** registry (proposal 09-04 A2, todo Q1 multi-state row): one registry resolved by every hook — kills the Melaka-hardcoded blocks seen on #275847.~~ ✅ **BUILT 2026-09-04 S3** (`4d0785a`) — see §6; what remains is the 52-file bulk migration + the root-orphan retire, both listed there.
5. **Weekly audit as a script** (`lib/weekly-audit.js`): proposals ≥7d · hooks with 0 blocks/30d · stale dashboards · overdue watches → one ruling table.
6. **Low-effort tier policy**: catalogue every Agent/Workflow call-site with model + effort; retrieval defaults to `sonnet` + `low`, judgment stays on the session model.

**Why not `/deep-research` now**: no such workflow exists locally; the 2026-07-19 named run cost 105 Fable agents / 4.08 M tokens. Everything in §1 came from three CLI reads of our own ledgers for ~0 tokens. If a fan-out is wanted for Part 2: 3 sonnet low-effort agents over `hook-fires.jsonl` + `slips.jsonl` + the 26 assessments, schema-forced to one ranked table, ≤300k tokens.

---

## 4. etanah-knowledge banks from today's sweep

| Fact | Home | Status |
|---|---|---|
| MLPS renewal copies the lesen land row: `E:\Projects\Melaka\etanah-pelupusan\src\main\java\my\gov\etanah\pelupusan\service\impl\PelupusanSpocService.java` `populateAppPermohonanTanahFromInduk():1051` → `:1073 setNamaKawasanTerlibat(mtpl.getTempat())`, `:1089 setTempat(mtpl.getTempat())`; migrated `tempat='PT '||no_lot` = 48 lesen rows (`MIGRATOR_KTPN_LMS_JASIN`) | BUG-BESTIARY.md (new pattern) · ADHOC-REGISTER A14 (row updated ✓) | ✅ banked 2026-09-04 |
| Batal a mistakenly-created UPS_PLP = 3-table shape (umm_aplikasi Tamat/Batal/Tamat + hubungan NULL · umm_a_tgsn flag_aktif N / Selesai / trkh_tetap · DELETE umm_tgsn_semasa); precedents #276229, #275922, #277442; Utiliti Batal has no UPS_PLP flag (`MlkUtilitiPembatalanPermohonanForm.xhtml:22-38`) | DATABASE.md §cancel-shape · FLOW-TRACES.md | ✅ banked 2026-09-04 |
| `AppTugasan.tarikhTamat` ↔ `umm_a_tgsn.trkh_tetap` (completion instant), NOT `trkh_luput`; engine close = `E:\Projects\Melaka\etanah-common\src\main\java\my\gov\etanah\common\repository\common\AppTugasanRepository.java:31` | DATABASE.md §6.1 | ✅ banked 2026-09-04 |
| Senarai Tugasan = `umm_tgsn_semasa`, read by `E:\Projects\Melaka\etanah-common\src\main\java\my\gov\etanah\common\notification\service\impl\DashboardService.java:165` with NO status filter → a Tamat app keeps its row until deleted | DATABASE.md §6.3 | ✅ banked 2026-09-04 |
| Melaka PROD `etprdmlk` is EDB Advanced Server (Oracle-compat): `SYSDATE` valid | DATABASE.md §env | ✅ banked 2026-09-04 |
| `tempat` convention: app default NULL (17/24 user rows); "-" is a stored value (66 migrated + 1 officer-typed); L1e renders blank as "-" (`PelupusanReportMethodConstant.populateTempat():818`) | DATABASE.md value-conventions | ✅ banked 2026-09-04 |

---

## 5. Sequence

**RULING (みや, 2026-09-04)**: §M ok · Q1–Q10 ALL BUILD — condition: every item ships only after (a) its eval runs green AND (b) a BEFORE/AFTER comparison from the telemetry proves it works (Rule 5). Concretely each commit cites: the 30d baseline number from §1 (before) → the same query after ≥3 sessions (after). No before/after row = not done.

1. ~~みや rules on §2 rows~~ — ruled above.
2. This session: bank §4 (mechanical, ~6 edits), then Q3 + Q5 (small, deterministic, eval-guarded, each with its ≥20-scenario table per system-design Rule 12).
3. **Fresh session, FIRST item: build §M (turn-ledger) via forge** — M1/M2 refinements, M3 born, M4 token-map seeded, M5 de-close C5, M6 report; evals E1–E5 green before registration. Reason it goes first: every later ruling (Q6 gate yield, Q8 proposals, Part 2 hook pass) is decided from `true_blocks` and per-phase cost, which only exist once §M is collecting.
4. Same fresh session after §M: Q1/Q2/Q4/Q6/Q7/Q8/Q9/Q10, one commit per item, before/after telemetry rows cited in each commit.
5. Part 2 (§3) after 14 days of §M rows, so the whole-system ruling pass reads measured yield, not fire counts.
6. **Multi-state + folder-structure (§6) rides Part 2's house-cleaning, not a separate track** — the orphan retire waits for みや's row-by-row nod; the 52-file literal migration is done category by category, each pass eval-green, and can start any session (no §M dependency).

**RE-SEQUENCED 2026-09-06 (みや: nothing is struck by hand; everything runs → measured → audited; Ruri owns the audit because he is blind to most features — memory `user_miya_blind_to_features`)**

| Phase | What | Removes anything? | Gate to next phase |
|---|---|---|---|
| P0 | §M turn-ledger (M1–M6) + M7 goal-lens + M8 rules (Rule 13, forge `--symptom --goal --signal`) via forge | no | evals E1–E10 green · smoke-fire · first `turns.jsonl` row exists |
| P0 **BUILT 2026-09-06** | M1/M2 `lib/turn-context.js` (lock-file mutex; 6 parallel hooks → 1 turn_id, verified live) + `hook-runtime.js`/`dispatch-hooks.js` rows carry `turn_id · session_id · qa · phase · fired · reason` · M3/M4/M7 `domain/turn-ledger/` (forge-born, eval 21/21, `token-map.json` 67 tokens, `reply-log.js` Stop registration removed — file kept) · M5 `de-close-gate` C5 (eval +3) · M6 `lib/turn-report.js` → `system/monitoring-dashboard.md` (true_blocks column live) · M7 `lib/goal-lens.js` (note/pending/rate; --improve required when met≠y; --beyond needs --evidence) · M8 system-design Rules 13+14, system-rules Rule 6, forge `--symptom --goal --signal --retention` (eval 12/12), birth-gate README check (eval 8/8), census `goal-less`/`no retention` gaps · Rule 6 `lib/housekeeping.js` (dry-run verified) · DE 12.5 row. Deviations from design: goal-lens prompt is Stop ADVISORY context answered at the next turn (a Stop cannot re-enter the same turn without blocking); scripts live in `lib/` (forge placement), not `core/`; rotation runs at DE/audit (Rule 6), not SessionStart. | no — reply-log unregistered only; restore line in `domain/turn-ledger/README.md` | ≥3 sessions of `turns.jsonl` rows, then audit run 2 (P1) |
| P1 | **FULL FEATURE AUDIT** (みや's weekend ask): every registered hook (117 entries) + every `domain/` feature + skill → one row: goal (README or backfilled from NUKE-MARKER/slip origin) · fires/blocks/ms 30d · slip recurrence · last fire · duplicate-of · verdict KEEP/MERGE/REFINE/RETIRE + one-line reason | no — proposals only; obvious RETIREs (0 fires 30d + no goal + duplicate) tombstoned, not deleted | table delivered; みや nods RETIRE rows only |
| P0 **eval battery 2026-09-06** | `node lib/eval-battery.js`: 95/100 green · 3 quarantined (classified) · 5 FAILING — `bpmn-check` (hard-coded other-machine path `C:\Users\Ridhwan\…MLK_PLP_MLPS.bpmn20.xml`) · `cross-module-intake` (QA-274318 replay no longer flags) · `deploy-merge-surface` F3 · `live-action-safety-gate` · `release-mlk-plp/eval-merge-scenarios`. Baseline check in a temp worktree at `56926c9` (pre-P0): the first FOUR were already red BEFORE P0 (exit 1 each); the fifth (`release-mlk-plp/eval-merge-scenarios`) HANGS >9 min at 56926c9 too (stopped by hand) — a pre-existing hang, not a P0 regression; battery marks it FAIL by timeout. The battery had NOT run since 2026-08-16 (64 evals then, 100 now) — eval rot is real and invisible without the cadence; Q-row for the battery at DE 12.5 stays. Repairs are P2 work, one eval per pass, none caused by P0. | no | each repaired eval green + battery row |
| P1 **RUN 1 — 2026-09-06** (miya: "audit first, then GO") | `system/feature-audit-2026-09-06.md` — 164 rows from 30d telemetry (5,241 rows) + settings + READMEs. Counts: KEEP 119 · REFINE 8 (4 boot hooks = 7,489 s/30d; 4 gates with ≥50% bypass) · RETIRE? 2 (`deploy-guard`, `prod-db-confirm` — 0 fires, rare-by-design candidates) · DEAD-DIR? 19 (unregistered domain dirs, per-row check needed) · SKILL 10 · CONTAINER 5 · goal-less READMEs 53 · no-retention READMEs 53. **Data limits found**: Stop-bundle members are under-counted (17 fires vs 222 turns — bundle dispatch logs the manifest, not each member) and there is no true/false-block column → both are exactly what §M fixes; run 2 after §M | no | run 2 after ≥3 sessions of §M rows |
| P2 | Q3 · Q5 · Q7 (deterministic, add-only, cache-only) | no | each: eval green + before/after telemetry after ≥3 sessions |
| P3 | Q1 · Q2 · Q4 · Q8 · Q9 · Q10 | Q9 moves files (git mv); Q4 narrows 4 triggers | same |
| P4 | §7 STRUCTURE-SCHEMA + checker v2 + fix-plan (system level, then project level) | moves after nod | boot line shows 0 misnamed at each level |
| P5 | Q6 gate rulings + 6a orphan delete + P1 MERGE/RETIRE execution — from `true_blocks` + `goal_met` after ≥3 sessions of §M rows | YES — only here | numbers + goal shown per row; みや nods; tombstone one cycle; git-recoverable |

---

## 9. Autonomous-upgrade asks (みや 2026-09-06 evening) — designed here, built in P3 after §M rows exist

| Row | Ask (verbatim intent) | Design (Rule 1 refine-first) | Gate |
|---|---|---|---|
| 9a **Wrong-fix capture in Phase 1** | "make it mandatory to SEARCH & SAVE when you found the wrong fix within a quest, it gets saved into that ticket's or adhoc's quest MD" | `quest/notes.js wrong-fix <QA> --was "<the fix that was wrong>" --why "<how it was refuted>" --learned "<the rule/fact>"` appends a row to the qa_doc `## Wrong fixes` table + `domain/quest-bounty/log.jsonl`. Trigger = any REFUTED / reverted / "not the cause" verdict in Recon or Apply (quest-phase-gate already sees those words) → advisory: "wrong-fix row required". | `quest-phase-gate` advisory → hard block at Phase-1 close if the transcript carries a refute verdict and the qa_doc has no row |
| 9b **Phase 2 mandatory upgrade search** | "During Phase 2, make it MANDATORY to search that mistake … improve our workflow: etanah knowledge, quest phrases, Features, or combination. HIGHLIGHT THIS CLEARLY" | `close-phase` Phase-2 step **"🔧 WORKFLOW UPGRADE"** (visible table): for every wrong-fix row + every slip with `qa=<QA>` → verdict per row: `knowledge:<file>` / `phrase:<skill or protocol line>` / `feature:<forge name>` / `none:<why>`; each non-none verdict is DONE in the same close (edit / forge), not proposed. | `de-close-gate`/`close-phase` C6: Phase 2 cannot close while any wrong-fix row has no verdict |
| 9c **Phase 2 rarely runs right away (みや's clash note)** | "might clash though since we do not usually do phase 2 straight away" | The upgrade search also runs at DE for every quest whose Redmine status is Closed but whose block is still `active` (redmine-reconcile already lists them). So the learning lands the same day, Phase-2 archive hygiene can still lag. | DE 12.5 row |
| 9d **`/system-audit` briefing skill** | "like session boot … display all the necessary info OVERVIEW … SHORT … things NOT WORKING, or OPTIMIZATIONS … critical or high-return" | Skill `system-audit` (forge skill, user-invoked): runs `lib/turn-report.js` + `lib/feature-census.js` + `lib/eval-battery.js --last` + `core/slips.js dashboard` then prints ONE screen in 4 fixed blocks: **NOT WORKING** (dead/ghost hooks · failing evals · silent blocks · overdue watches) · **TOO SLOW** (top 5 hooks by total s · top 3 turns by hook_ms · boot s) · **MISTAKES** (slips 7d by category · wrong-fix rows since last audit · fp bypasses by gate · goal-lens met-rate < 70%) · **HIGH-RETURN OPTIMIZATIONS** (top 3 with the number each would save). Everything else stays in the dashboard files. Ends with the P1/Q6 ruling rows that need みや. | eval: fixture ledgers → the 4 blocks render; an empty block prints "none" not silence |
| 9e **Known blind spots (みや: "I believe you still have blind spots")** | — | Still NOT collected: skill invocations (no Skill-tool PostToolUse logger) · model token usage per turn (present in transcript `usage` rows — turn-ledger can read it; add `tokens_in/out` in M3 v1.1) · Agent/Workflow subagent cost · MCP query counts · みや's reaction beyond reask/correction/nod. Listed so the audit says "unknown", never "fine". | census row |
| 9f **Goal backfill for 53 goal-less features** | "what is your solution? … I do not have time" | `lib/goal-backfill.js --draft`: derives `goal:` + `goal_signal:` + `retention:` from the best source per feature — forge registry `trigger/action` (20 features) → NUKE-MARKER `Session` (31) → the hook file's own TRIGGER/ACTION header (the remaining 19) — writes them marked `goal_status: draft`; census counts `draft` separately from `declared`; Ruri promotes 20 drafts per session to `declared` after reading the code; みや never touches it. | eval: 3 fixtures (one per source); no draft on a README that already has `goal:` |
| 9g **Adhoc auto-archive** | "adhoc that goes unknown will be archived automatically after a week and a half I suppose" | TODAY: `adhoc-lifecycle` weekly sweep PROPOSES archiving rows already in a terminal status; promote-on-ticket-match exists (Door A). There is NO time-based rule for unmatched rows. Add: sweep also proposes rows with no ticket match after 10 days → still propose-only (みや nods), never auto-move. | adhoc-lifecycle eval +1 |
| 9h **Quest attribution (finding 2)** | turn rows say `qa: ADHOC-PT-2026-3 · hold` for work on other things | `lib/turn-context.js`: qa = ticket id named in the prompt or in this turn's tool paths (same regex as de-close-gate C1) → else top block with `status=active` → else null. | turn-context eval +2 |

---

## 6. Multi-state + folder-structure — MERGED 2026-09-04 S3 (was todo Q1 "🏛️ Multi-state"; みや: "merge or add into it … the Quest workflow improvements … rely on one another")

**Built (commit `4d0785a`, all evals green)**

| Piece | What it is | Proof |
|---|---|---|
| `system/states.json` + `system/states.local.json` (gitignored) | THE state registry — 6 states, disk-verified (WP Task folder = `Putrajaya`, not `WP`) · `work_scope` active/scaffold/excluded (TRG) · trunk per module · DB MCPs · BPMN prefix · alter file; hosts only in the overlay | `node lib/states.js validate` → 6/6 ✓ |
| `lib/states.js` | resolve cascade (explicit → `ETANAH_STATE` → active.txt → path segment → `PT<STATE>/` → UNKNOWN, never silent) · `validate · check · add · remove` | `lib/states.eval.js` 40/40 |
| `system/FOLDER-STRUCTURE.md` + `lib/folder-structure.js` | root allow-list (a row is the nod) + 9-row orphan table pending みや | eval 6/6; boot CHECK 8 |
| `system-audit.js` CHECK 7 + 8 | state-literal drift count (`node lib/states.js check`) + root orphans | boot line |
| 16 components migrated | ticket-gate · knowledge-first-gate v3 · branch-guard v2 · alter-ticket-gate v1.1 · adhoc-register · latent-bugs-gate · adhoc-lifecycle · awam-no-resit-gate · notes-on-test-data · pre-action-check-gate · quest-resume-preflight · quest-knowledge-save-gate · test-data-db · bug-db · knowledge-schema-audit · quest SKILL.md | each Feature's own eval green |

**Remaining — where it sits in THIS plan**

| Item | Depends on / feeds | Sequence |
|---|---|---|
| 6a. Root-orphan retire (9 rows in FOLDER-STRUCTURE.md: delete `library/`, `plugins/ruri-skills/`, `Project Resources/`, `salvage/`, `outputs-temp/`; move `growth/`, `RURI-GROWTH.md`; move-or-delete `tools/docx/`; port-then-delete root `etanah-knowledge/`) | みや's row verdicts; the Observability row's rule (delete only with liveness evidence — all 9 have 0 live readers per the 2026-09-04 reference grep) | any session after the nod; pairs with Part 2 item 1 house-cleaning |
| 6b. Bulk-migrate the 52 UNROUTED files (`node lib/states.js check`) — task-folder scripts → repo-root scripts → redmine-project (`redmine-board`, `urusan-tickets`) → skills; Melaka-only-by-design tools (`release-mlk-plp*`, `deploy`, `env-check`/`env-switch`, `staging-schema-*`, `patch-mlk-doc`, `local-deploy-gate`) get a `state-scoped: yes, melaka-only by design` header instead | feeds **Q3** (intake tools: `redmine-sync`/`redmine-board` match by id AND by state project) and **Q7** (`worktree-cleanup-boot`, `open-quest-surfacer` read Task folders per state) — do 6b before or with those rows so they are not rewritten twice | one category per pass, eval-green each; no §M dependency |
| 6c. Verify `_unverified` registry facts (wp/selangor/kedah/terengganu permohonan prefixes; Perak Redmine project identifier) | one DB read per state + one Redmine API read | first session that touches that state |
| 6d. Quest-workflow overlap (みや's point): **Q1 precedent fast-path** now reads the resolved state's registers (adhoc-register/latent-bugs read per state since S3); **Q2 `quest-phase0` tiering** must take `knowledgeDir` + `dbMcp` from `node lib/states.js show <state>` (SKILL.md already says so) — encode it when Q2 is built; **Q4 Stop false positives** — `alter-ticket-gate` firing on "alter to" is the same false-trigger class, now state-routed, predicate still to narrow | Q1/Q2/Q4 rows | build those rows state-aware from the start; a Melaka literal in a new row is a Rule 11 violation |

---

## M.8 Goal-lens lands in the DESIGN RULES, not only in the ledger (みや 2026-09-06 verbatim: "integrate this into system design and system rules SO THAT EVERY SINGLE TIME YOU CREATE A NEW FEATURE YOU WILL BE AWARE WHY, WHY, WHY WE BUILT THAT SO THAT WE CAN OPTIMIZE IN THE FUTURE")

Gap found 2026-09-06: §M.2b puts `goal:` / `goal_signal:` in the README and in the forge template, but NO design rule requires them, so a hand-designed feature can still be born without its why. Today `core/forge.js` `nukeMarkerTemplate()` writes `Session: TODO(forge): one-line root symptom …` — the why is a placeholder the builder may leave blank.

| Piece | Refines (Rule 1) | Change |
|---|---|---|
| `system-rules` Rule 5 | existing "log is the optimization dataset" | + clause: a log without the feature's declared GOAL cannot be optimized against — every component ships `goal:` + `goal_signal:` in its README, and `goal_met` is a log-row field |
| `system-design` **Rule 13 — WHY-chain at birth** (new, additive) | Rule 9 NUKE-MARKER `Session` field · Rule 10 REQUIREMENTS table | every Feature birth/refinement DISPLAYS a 3-line why-chain before build: `symptom:` (the slip/ask, verbatim + date) → `goal:` (outcome the feature exists to produce) → `goal_signal:` (how one run knows it succeeded, mechanical when possible). Banned: `TODO` in any of the three; a goal that restates the trigger ("fires on X") instead of the outcome |
| `core/forge.js` | `readmeTemplate()` / `nukeMarkerTemplate()` | `forge new` REQUIRES `--symptom --goal --signal`; refuses to scaffold with any missing (no TODO placeholders); README + NUKE-MARKER `Session` filled from them |
| `domain/component-birth-gate` | existing birth gate | + check: README lacks `goal:`/`goal_signal:` → block (same tier as missing eval) |
| `system/feature-census.md` | existing census | + column `goal` (`declared` / `goal-less`); DE 12.5 lists goal-less features for backfill (259 components today; backfill is a Part 2 pass, 20/session) |
| **Housekeeping (みや 2026-09-06: "a garbage collector … some data are kept, some data are cleaned up")** — `system-rules` **Rule 6 Data lifecycle** (SHIPPED v1.2 same day) | Rule 5 (every feature writes) | every README carries `retention: keep \| rotate <period> \| consume <into> \| regenerate`; forge requires `--retention`; birth-gate blocks a log without it; `lib/housekeeping.js` (born) runs ONLY at DE 12.5 (rotate + regenerate + archive consumed) and at the system audit (retire what Rule 3 ruled); prints what it moved. 53 existing READMEs have no retention line today → backfilled in the same 20/session pass as `goal:` |

Eval: E8 — `forge new x --goal ""` exits non-zero with the missing-field name · E9 — a README without `goal:` trips component-birth-gate on a fixture · E10 — census counts one seeded goal-less feature.

---

## 7. Structure + naming SPEC — every level ordered the same way (みや 2026-09-06: "audit the system design & rule so that IT WILL follow a certain set of folder structure and file naming — at least at system level; project level is an even greater win")

**Inventory (Rule 1) — what already orders things, and where it stops**

| Level | Ordering that exists | Enforced by | Gap |
|---|---|---|---|
| Root | allow-list + 4 naming rules (`system/FOLDER-STRUCTURE.md` §Naming) | `lib/folder-structure.js` · boot CHECK 8 | names only; says nothing about what goes INSIDE `system/` `main/` `lib/` `core/` `quest/` |
| `domain/<feature>/` | trinity shape: `README.md` · `<name>.check.hook.js` · `eval.js` · `log.jsonl` · `NUKE-MARKER.md` | `core/forge.js` + `component-birth-gate` | strongest level; hand-made siblings still drift (`*.gate.hook.js` vs `*.check.hook.js`) |
| `etanah-knowledge/<state>/` | `KNOWLEDGE-SCHEMA.json` (14 required files, layout rules) | `domain/knowledge-schema-audit` at boot | the model to copy — a schema file + an audit hook |
| `system/` | none | — | 26 loose `agentic-ticket-workflow-assessment-*.md` + 3 assessment variants + `research-proposals/` — the proof (Q9 is one symptom) |
| `main/` · `quest/` · `lib/` · `core/` · `.claude/hooks/` · `.claude/skills/` | none written | — | skills = one shape by Claude Code itself; hooks: `*.js` flat, some Features live here instead of `domain/` |
| `projects/coding-projects/{active,archive}/<KEY>/` | quest doc `<KEY>.md` by convention (quest-protocol) | `quest/archive-quest.js` moves whole folders | side-projects (`etanah-organize-alpha`, `etanah-codemap`, `multi-ticket-sweep`) each invent their own inside shape |

**Design (Rule 7 primitive = script + boot check, no skill): ONE schema per level, same mechanism as KNOWLEDGE-SCHEMA**

| Piece | Refines | Content |
|---|---|---|
| `system/STRUCTURE-SCHEMA.json` (born) | `KNOWLEDGE-SCHEMA.json` pattern · FOLDER-STRUCTURE allow-list moves INTO it as the `root` level | per level: `allow` (files/folders that may exist) · `pattern` (filename regex, e.g. `system/`: `^[a-z0-9-]+\.(md\|json\|jsonl\|js)$`, dated series go to `system/<series>/<date>.md`, never `<series>-<date>.md` at the top) · `required` (what every child MUST have, e.g. `domain/*`: README + eval + log + NUKE-MARKER) · `retire` rule |
| `lib/folder-structure.js` v2 | existing root checker | walks every level in the schema; reports `orphan` / `misnamed` / `missing-required` per level; `--fix-plan` prints the move/rename table for みや's nod (never moves on its own) |
| `system-audit.js` CHECK 8 | existing | counts per level, one boot line: `structure: root 0 · system 29 misnamed · domain 3 missing-required · projects 2` |
| `system-design` Rule 13 (see M.8) + **Rule 14 — placement at birth**: before creating ANY file, name its level + the schema row that allows it; no row = propose the row first (a row is the nod, same as FOLDER-STRUCTURE today) | Rules 9/10 | the human half the checker cannot do |
| `core/forge.js` | existing | refuses a path outside the schema's `domain/` row; `forge new --level system` scaffolds a dated-series folder correctly |

**Project level (the greater win)**: `projects/coding-projects/STRUCTURE-SCHEMA.json` — quest folders: `<KEY>.md` + `0-brief/` `1-simulate/` `2-fix/` mirrors of the Task folder + `handoff-<date>.md`; side-projects: `PROJECT.md` + `handoff-<date>-<phase>.md` + `runs/` banned (File Ownership row). Same checker, same boot line. Migration is a `--fix-plan` table per folder, ruled by みや, executed one folder per pass with git mv.

**Sequence**: 7a schema written from the inventory above (one session, no dependency) → 7b checker v2 + boot line (eval: seeded misnamed file caught; clean tree = silent) → 7c `--fix-plan` for `system/` (the 26+3 assessment files fold under Q9 anyway) → 7d みや rules the plan rows → 7e project level.
Adversarial floor (Rule 12, 20 rows) at 7b build time, displayed in that reply.

---

## 8. Expected gain — what the data supports, and what it cannot yet (みや 2026-09-06: "how much of an improvement based on accuracy (deterministic) + speed")

Numbers below come from §1 (30-day telemetry) and §1d (one measured session). They are BEFORE figures with the AFTER target each row's eval asserts; the real AFTER is read from `turns.jsonl` after ≥3 sessions (§5 ruling condition).

| Axis | Row | Before (measured) | After (target) | Gain | Confidence |
|---|---|---|---|---|---|
| Speed — boot | Q7 | 45 s/boot × ~224 boots = 2.8 h/30d (52% of all hook time) | ≤10 s/boot when nothing changed | ~2.2 h/30d, ~35 s felt at every boot | HIGH — file-mtime caching is deterministic |
| Speed — Stop gates | Q6 | 5,238 s/30d in Stop hooks, ~25 of them 0–1 blocks | retire/redesign ~half after みや's ruling | ~0.7 h/30d + fewer false blocks | MEDIUM — depends on ruling |
| Speed — tokens on precedent tickets | Q1 | 2.43 M tokens / 26 min bought 0 decisions (#278304 + #277442) | ≤300k tokens, ≤15 tool calls | ~85–90% on that ticket class (patch-only with a closed precedent) | HIGH on that class; 0% on novel tickets |
| Speed — tokens on novel tickets | Q2 | 22 agents on session model, 1 death | ≤40% tokens, same verdict | ~60% on quest-phase0 runs | MEDIUM — one scratchpad rerun proved it once |
| Accuracy — false blocks | Q4 | 7 of 12 blocks in one session false or repeats (58%) | 0 on the fixture set, true 5 untouched | fewer re-emits = fewer `reask/rambling` slips | MEDIUM — fixture-proven, not yet live-measured |
| Accuracy — SQL verify | Q5 | 12 refs, 5 impossible (42% noise) | 7 refs, 0 false | deterministic | HIGH — parser change |
| Accuracy — intake | Q3 | 3 workarounds + 2 false "not miya's work" in one session | 0 | deterministic | HIGH |
| Optimization loop | §M + Q8 + M.8 | 234 proposals, 0 rulings; no row can say "was this block true" | every gate has `true_blocks`; every feature has `goal_met` | this is the row that makes every future gain MEASURABLE instead of asserted | — |

Honest limits: (1) "accuracy" today is fixture-based — a live false-positive rate exists only once §M writes `fp:` bypasses per turn; (2) the 30d numbers are one machine, one user; (3) no row claims a gain on the judgment work (Recon, Rubric) — those improve only through the goal-lens loop over many runs. The handover from 2026-09-04 IS enough to build §M and Q3/Q4/Q5/Q7/Q8/Q9/Q10 without re-asking (file-level specs + eval cases exist); Q1/Q2/Q6 need one design pass each at build time (Rule 12 tables not yet written).
