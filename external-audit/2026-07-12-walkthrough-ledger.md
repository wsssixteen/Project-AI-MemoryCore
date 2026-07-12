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

## Phase 1 — NEXT (target ≤1 week)

| Item | Status | Notes |
|---|---|---|
| K6 telemetry + K3 gate-runtime (`lib/hook-runtime.js` + `meta/telemetry/hook-fires.jsonl`) | queued — next dedicated session | first kernel piece; one piece per dedicated session (addendum amendment 3, approved) |
| K7 forge scaffolder | queued — immediately after K6+K3 | binding insert (handoff addendum block); everything after is born through it |
| R2 eval-runner + replay fixtures (🚨 classes + 7 eval-less block-capable hooks) | queued | quest-machinery fixtures = the migration's safety net みや prioritized |
| Weekly generated report + lifecycle policy | queued | after telemetry has real entries |

## Phase 2+ — approved, gated

| Gate before Phase 2 | Status |
|---|---|
| Phase 0/1 exit criteria green with artifact evidence per row (addendum §4.2 status table) | pending Phase 1 |
| Baseline measured (slips/week by category · boot tokens · registration count · みや-catch count trailing 2wk) | pending — capture before first consolidation |
| CLAUDE.md shrink = LAST, only after JIT loading proven by telemetry + full line-parity report (nothing-lost table per みや) | pending |

## Standing conditions (binding)

- Explanations to みや: story diagrams + tables ONLY
- Eval results shown at every landing
- Parity (nothing-lost) table for every content move
- New-guard freeze until Phase 1 green
- No kernel piece built mid-quest; one piece per dedicated session
