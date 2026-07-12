# External-Audit Work-Order Ledger — approvals + landings

> One row per item. Every DONE row carries artifact evidence (commit SHA / file:line / eval output) — never a bare ✓.
> Approval basis: みや 2026-07-12 — item-by-item popups for P0.1/P0.2, then blanket "do ALL of it, I approve" with conditions:
> (1) explanations = story diagrams + tables ONLY · (2) eval results shown at every landing · (3) parity check (nothing-lost) for every move out of CLAUDE.md.

## Verification pass (pre-engagement)

| Artifact | Result |
|---|---|
| Blind measurement workflow `wf_f64a5e6a-279` | 7/7 agents, 643,741 tok — audit claims: 22 CONFIRMED · 6 PARTIAL · 2 UNVERIFIED · 2 WRONG · 2 out-of-reach |
| Corrections to auditor | phantom-skills WRONG (ruri-skills plugin live-fired this session) · "158 command entries" wrong (=79) · hook-count drift has a 4th number (66) · slip-counts.jsonl is a 3-line stub |

## Phase 0 — DONE 2026-07-12

| Item | Verdict | Landing | Evidence |
|---|---|---|---|
| P0.1 sync-hook-catalog `${CLAUDE_PROJECT_DIR}` existsSync bug | ACCEPT | `de25818` | §3.0 regenerated: 79/79 false 🚨 MISSING → 79 ✓; post-regen grep = 0 MISSING rows |
| P0.2 boot slip-surface re-point | ACCEPT-MODIFIED | `439386d` (CLAUDE.md v1.63) | slip-counts.jsonl REJECTED as source (3-line stub — truth loss); boot now reads top ~83 lines of slip-log only (~64k → ~2k tokens) |
| P0.3 master-memory boot removal | ACCEPT-MODIFIED (move-then-tombstone) | this commit (CLAUDE.md v1.64) | Parity map in changelog v1.64: commands → save-commands.md · plugin install → new-machine-setup.md Step 2 (gap the audit missed) · recall triggers already canonical in main-memory · boot-load-verification.js updated + smoke-fired clean (+ sanctioned amendments-drop) |
| P0.4 new-guard freeze declared | ACCEPT | this commit | `main/current-session.md` Standing Flag 🧊; carry-forward rule at every DE rewrite until Phase 1 green |

## Operator parameters (みや, 2026-07-12 — binding, supersede earlier pacing caution)

| Parameter | Value |
|---|---|
| Pacing | **Dedicated sprint 3–5 days**, tickets paused; Day 1: P0 + runtime+telemetry · Day 2: forge + eval-runner + fixtures · Days 3–4: boot diet + merges + CLAUDE.md shrink (shadow boot) · Day 5: SchemaCrawler pilot + §4.2 status table |
| Forge autonomy | echo + nod ALWAYS (create AND refine); no auto-apply; revisit after 30d clean telemetry |
| North star (30d) | ticket throughput — prefer latency/boot/debug-time cuts; defer pgvector, miyazaki sync, full skill-fixture coverage to post-sprint |
| Naming | "Power" → "Feature" from now; registry uses Feature day one |

## Phase 1 — IN PROGRESS (sprint Day 1 done)

| Item | Status | Evidence |
|---|---|---|
| K6 telemetry + K3 runtime (`lib/hook-runtime.js`, wrap + native modes, fail-open) | ✅ built + eval green | `lib/hook-runtime.eval.js` **10/10 PASS** (pass/block/crash/missing fixtures); settings.json re-validated as JSON |
| Pilot migration (3 noisiest Stop gates wrapped: stop-point-summary · show-gate · terse-gate) | ✅ wired | settings.json :235/:287/:303; smoke: wrapped show-gate exit 0, 107ms, telemetry row appended |
| `meta/telemetry/hook-fires.jsonl` | ✅ **first real entries ever** | replaces the tombstoned hook-fire-log.md graveyard |
| K7 forge scaffolder (echo+nod, refine-first, routing questionnaire) | ⬜ Day 2 | binding: before any other component |
| R2 eval-runner + replay fixtures (🚨 classes + 7 eval-less block-capable) | ⬜ Day 2 | quest-machinery fixtures = みや's priority |
| Telemetry report (on-demand + session-close + weekly) + lifecycle policy | ⬜ Day 2–3 | needs a day of real entries first |
| Remaining hook migration onto runtime (75 wraps) | ⬜ incremental | generated settings.json comes with K4 registry |

## Phase 2+ — approved, gated

| Gate before Phase 2 | Status |
|---|---|
| Phase 0/1 exit criteria green with artifact evidence per row (addendum §4.2 status table) | pending Phase 1 |
| Baseline measured (slips/week by category · boot tokens · registration count · みや-catch count trailing 2wk) | pending — capture before first consolidation |
| CLAUDE.md shrink = LAST, only after JIT loading proven by telemetry + full line-parity report (nothing-lost table per みや) | pending |

## OVERNIGHT SPRINT — FINAL STATUS 2026-07-13 (§4.2 table, artifact per row — never prose claims)

| §4.2 gate row | Status | Artifact |
|---|---|---|
| Phase-0 commits landed | ✅ | `de25818` · `439386d` · `994f9cf` · `897b72d` |
| Telemetry has real entries from real turns | ✅ | `meta/telemetry/hook-fires.jsonl` — **1,314 rows**; production fires incl. component-birth-gate 104 fires / 8 blocks, familiar-nudge 65 |
| eval-runner runs + green | ✅ | **24/24 GREEN** full suite (final run 2026-07-13 03:14) |
| Guard freeze respected | ✅ | every component born = plan-specified infra, through the forge, echo+nod in `meta/registry.jsonl`; freeze LIFT = みや's call |
| Baseline measured | ✅ | 23 slips/14d by category · みや-catch 18/14d · registrations 80→74 · boot prose 75.3K→60.6K tok (shadow bundle 2,397) — this section + slip-dashboard |

| Phase | Landed (commit) |
|---|---|
| 1 COMPLETE | hook-runtime+telemetry `b152ad4` · forge `e9e70db` · birth-gate `383192c` · eval-runner `ce46ecf` · report+fleet-wrap `66f0f32` · fixtures+state-check `818a11d` |
| 2 COMPLETE (conservative) | registry `2ac1838` · merges 80→69 `0e2d6b9` · boot-shadow+slips-v2 `fca0c30` · C6 + C5 `4174616` · **CLAUDE.md 582→260 + spec `74004fd`** |
| 3 in-repo COMPLETE | 5 check bodies + ticket-gate bare-number refine + runbook + pilot doc `862a617` · correction `164d122` |
| Deferred (home named) | ≤200-line diet (after JIT telemetry) · boot-bundle cutover (1wk shadow) · K2 jsonl cutover · deeper advisory bundling to ≤45 · SchemaCrawler run (work machine) · pgvector/miyazaki/skill-grading (post-sprint per operator params) — all in main/todo.md |

**Quest-survival proof**: ticket-gate fires on bare "269939" (live, full Phase-0 checklist) + prefixed ✓ · quest skill +51KB absorbed content (3 marker groups verified) · quest-phase-gate/deferrals/predicate/blast-radius evals all green in suite · state-check strict exit 0 · boot chain smoked post-shrink. **Bonus**: the refine CLOSED a pre-existing gap — bare numbers were documented-but-never-implemented in the hook.

## Standing conditions (binding)

- Explanations to みや: story diagrams + tables ONLY
- Eval results shown at every landing
- Parity (nothing-lost) table for every content move
- New-guard freeze until Phase 1 green
- No kernel piece built mid-quest; one piece per dedicated session
