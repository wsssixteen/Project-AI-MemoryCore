# Sweep Assessment — 2026-08-13 (/goal autonomous sweep, eval of the unbuilt `/sweep`)

> みや's /goal: run full quests to Rubric on all open tickets as a sweep-with-loops, DON'T stop, and
> **audit the sweep against prior sweep audits — strengthen or extend the repeating findings**.
> This doc is that audit. It also runs THIS sweep against the `/sweep` DESIGN.md eval contract (10 assertions).

## 0. What the sweep actually covered

| Ticket | Path taken | Outcome |
|---|---|---|
| 274740 | skip (Redmine "Ready in PROD"; qa_doc says patch already applied by ammar/Puncak Tegap) | **skipped — done** |
| 274745 | W1 (main-loop, cheap text+image) → W2 (familiar, DB+code) → W3 blind (familiar) → W4 | see qa_doc |
| 274914 | W1 (familiar, 2 videos) → W2 (main-loop BPMN) → W3 blind (familiar) → W4 | **CROSS-MODULE / BPMN-layer, not pelupusan-Java** |
| 275009 | 🚫 BLOCKED — no `redmine.local.json` in worktree, no Task folder | not retrievable |
| 275152 | 🚫 BLOCKED — same | not retrievable |

## 1. Recurring behaviour vs prior sweep audits (his explicit ask)

Prior sweep-assessment corpus reviewed: 08-05, 08-05b, 08-06(×5), 08-07, 08-07b, 08-10, 08-12.

| # | Recurring finding (prior runs) | THIS run | Verdict |
|---|---|---|---|
| R1 | **Evidence-manifest gate** — `0. Brief/` read inconsistently (text first, images sometimes, **video almost never**). Restated as P1 across 08-04, 08-05, 08-06, 08-07b — "now 2 runs × ~half the tickets", STILL UNBUILT. Instances: #273460 93MB PROD video unwatched; #273455 the case's own screenshot unopened; #274136 3 videos. | I **consciously** delegated 274914's 2 videos to a W1 familiar (frames + URL-bar reads) and read 274745's screenshot for the URL. It WORKED — the URL bar gave the authoritative screen identity for both. But it worked because I *remembered* to, exactly the "proposal P1 working by hand, unbuilt" pattern from 08-06. | **STRENGTHENED — 5th run of evidence. The manifest gate is the single highest-yield unbuilt gate; parked ≥4 runs = the "parked-enforcement-row" failure class (2026-07-22, cost 2 days).** |
| R2 | **Loop-detector / Stop-bundle false-fires on orchestration/sweep turns** (DESIGN §9; 08-12 DE-3: RecursiveLoopDetector fired 7× on distinct git ops). | `RecursiveLoopDetector` fired on 3 distinct discovery Bash calls this run. `grep-rubric-gate` fired "ZERO matches" **twice while the grep DID return matches** (a NEW gate-integrity bug — the zero-match warning is emitted on non-empty results). | **STRENGTHENED + EXTENDED. New: grep-rubric-gate false "zero matches" on non-empty grep — log as its own gate-integrity defect.** |
| R3 | **BPMN-first module-scope check** prevents wasted pelupusan work on teknikal tugasans (QA-262755). | Caught 274914 as **teknikal-triggered (MLK_TKL_ST/CM callActivities) → cross-module** BEFORE any pelupusan fix was attempted. One BPMN read did it. | **STRENGTHENED — the rule paid off cleanly; it is the highest-ROI Phase-0 step for PPTPB/JT tickets.** |
| R4 | **Redmine-first; active.txt rots** (08-06, 08-12). | Boot board showed 5/8 "open" quests already Closed/reassigned on Redmine + 2 assigned-open tickets missing locally. I ranked from the live board, not active.txt. | **STRENGTHENED.** |
| R5 | **convergence is not confirmation** — W4 changed the shipped answer 5/5 (07-27). Blind pass catches shared assumptions. | W3 blind dispatched for 274914 (and 274745). [Convergence outcome appended below once W3 lands.] | pending |
| R6 | **machine-local-config-not-portable** (07-20 servers; 08-03 postgres-in-worktree). | `redmine.local.json` absent in BOTH worktree and main → 275009/275152 unretrievable. (Note: postgres MCP DID load in this worktree session — the 08-03 todo-Q1 "no DB in worktree" note appears STALE.) | **EXTENDED — new axis: redmine config. Also: the postgres-in-worktree blocker looks resolved; verify + close that todo row.** |

## 2. This run against the `/sweep` DESIGN.md eval contract (10 assertions)

| # | Assertion | This run | Pass? |
|---|---|---|---|
| 1 | DELEGATION PLAN table before first Agent call | emitted | ✅ |
| 2 | Live Redmine before listing; not from active.txt | used boot `redmine-board.js` (live API) for ranking; but couldn't `redmine-sync` 2 tickets (no config) | ⚠️ partial |
| 3 | Rank descending by days-since-start | yes (board) | ✅ |
| 4 | Every familiar prompt has the 7 safety clauses | yes (read-only, no-subagents, no-Workflow, scope-lock, forced schema, controller-verifies, blind for W3) | ✅ |
| 5 | Every familiar prompt names MCP tools + ToolSearch step | W2/W3 named postgres ToolSearch; W1-274914 didn't need DB | ✅ |
| 6 | W3 prompts contain blind clause + write to sibling file | 274914 W3 barred from qa_doc, writes `QA-274914-wave3.md` | ✅ |
| 7 | Skip rules fire on the fixture | 274740 skipped (done); 274745 W1 done in-loop not delegated (cheap-artifact skip) | ✅ |
| 8 | Controller emits a verification line between waves | I verified the 274914 W1 familiar's "teknikal" claim against the BPMN myself before trusting it | ✅ |
| 9 | `--resume` replays banked waves | N/A this run | — |
| 10 | No file written into any Task folder | all output to qa_docs | ✅ |

**Eval verdict: the sweep methodology PASSES 8/8 applicable assertions** run by hand. Assertion 2's partial is an environment blocker (missing config), not a methodology gap.

## 3. New findings this run (add ON TOP of prior audits)

- **N1 — `grep-rubric-gate` emits "ZERO matches" on NON-empty grep results** (fired twice this session on greps that returned matches). Gate-integrity defect; erodes trust in the gate (same family as 07-31 `deliverable-lands-on-main` false-positive). Eval fixture = this session's transcript.
- **N2 — a cheap-artifact ticket (274745: text + 1 image) does NOT need a W1 familiar** — reading it in the main loop was faster and kept me anchored. The sweep skip-rules should add: "W1 in-loop when `0. Brief/` is text + ≤1 image; delegate W1 only when it carries video or ≥3 artifacts." (274914 with 2 videos was correctly delegated.)
- **N3 — worktree retrieval blocker** — a sweep launched from a worktree cannot `redmine-sync` new tickets (no `redmine.local.json`). The sweep must, at intake, detect missing config and surface the un-retrievable tickets as a named blocker (this run did) rather than silently dropping them.

## 4. Proposals logged to weekly-audit feed
(logged via `core/slips.js --type proposal`; eval case named per proposal — see slip-dashboard § 💡 Open proposals)

- **A5/P1 (RESTATE, 5th run)** — BUILD the evidence-manifest gate: at quest intake emit `opened ✓ / NOT OPENED` per file in `0. Brief/`, video included. Eval: 274914's 2 videos + 274745's screenshot this run; the prior unwatched #273460 video.
- **A2 (N1)** — fix `grep-rubric-gate` to not emit "ZERO matches" when the grep returned matches. Eval: this session's non-empty greps that triggered the warning.
- **A1 (N2)** — sweep W1 skip-rule: in-loop when Brief is text + ≤1 image; delegate only for video / ≥3 artifacts. Eval: 274745 (in-loop, right) vs 274914 (delegated, right).
- **A1 (R2)** — the `orchestration-mode` flag from DESIGN §9 remains the prerequisite; RecursiveLoopDetector + grep-rubric-gate + predicate-box still evaluate sweep controller turns as code-work. Eval: this run's 3 loop-fires + 2 grep-gate fires.

## 5. Convergence outcomes — the sweep's headline evidence (R5, live)

The multi-wave + controller-verify caught **real errors in both single-pass conclusions** this run. This is the /sweep value proposition demonstrated fresh.

### 274914 — W3 BLIND overturned my W2 (confidence 55% → 95%)
| | W2 (mine, static BPMN read) | W3 blind (independent) + my controller-verify |
|---|---|---|
| Operative gateway | `sid-1B526DCF` "Pembetulan Unit" (`:65`, `pembetulanUnit`) | `sid-C1939159` (`:720`, `pembetulanPP`) — the ACTUAL post-Laporan-Tanah gateway |
| Root cause | "condition conflation + null-unsafe; needs teknikal source; BA-Q blocked" | **missing `<flowable:out source="pembetulanPP">` on callActivity `:257`** — one-line BPMN fix |
| Evidence | static XML only | **live engine `act_hi_varinst`: child holds KM/PLPP, parent never does** (I re-ran the query; confirmed) |
| Confidence | 55% on exact gateway | **95%** |
**Lesson**: my W2 error was **stopping at a static read**; the decisive evidence was a **runtime query** (child-vs-parent variable split). Same family as the standing "code proves code; only runtime proves runtime" — extended: *a static BPMN read proves the model shape, only `act_hi_varinst` proves what the engine actually carried.* The blind pass ran the query I didn't.

### 274745 — controller-verify caught a familiar misread + an unresolved logic gap
- W2 familiar: writer-bug, mechanism = JSF process-scope gap, **72%**.
- My controller-verify (read the xhtml + re-ran DB): **confirmed** writer-bug (90%) + the structural gap (~85%); **corrected** a familiar detail (`tujuan_berimilik_lain='KEDIAMAN'`, not blank); and **surfaced an open residual the familiar's confidence had papered over** — if the Simpan button never processes the PT field, the SKM officer's successful re-key means a *working* save path exists elsewhere, which the fix must reconcile with.
**Lesson**: "controller verifies between waves" is not ceremony — it caught a wrong value AND a gap in the causal story on the one ownable ticket.

## 6. Sweep verdict
- **Methodology PASSED** its own eval contract (8/8 applicable) and, more importantly, **earned its cost twice**: the blind pass corrected 274914's root cause and confidence; the controller-verify corrected 274745's detail + surfaced a real residual.
- **Rubric reached**: 274914 (95%, one-line BPMN fix, cross-urusan sweep needed), 274745 (writer-bug 90%, mechanism 85% + open residual). 274740 already done. 275009/275152 blocked on config.
- **Highest-priority system action from this run**: BUILD the evidence-manifest gate (5th run of evidence) and fix the `grep-rubric-gate` false "zero matches" (new). Both logged as proposals.

---
*Completed 2026-08-13 autonomous sweep. Assessment = DE Step 7.5 artifact; proposals in slip-dashboard § 💡 Open proposals.*
