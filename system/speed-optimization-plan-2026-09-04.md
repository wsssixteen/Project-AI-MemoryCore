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

1. みや rules on §2 rows (BUILD / DROP / DEFER each).
2. This session: bank §4 (mechanical, ~6 edits), then Q3 + Q5 (small, deterministic, eval-guarded, each with its ≥20-scenario table per system-design Rule 12).
3. Fresh session: Q1/Q2/Q4/Q6/Q7/Q8/Q9/Q10 + Part 2, one commit per item, before/after telemetry rows cited in each commit.
