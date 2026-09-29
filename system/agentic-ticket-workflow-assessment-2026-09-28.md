# Agentic ticket workflow assessment — 2026-09-28 (DE, #281650 session)

| Axis | Finding (concrete instance) | Proposal (eval case) |
|---|---|---|
| A1 agentic system | `sql-schema-verify` blocked the Stop 8+ times on #281650: its emit pairs every column with every table in a statement (9 false rows: `umm_aplikasi.tempat`, `ind_permit_lesen.no_lot` …) so a correct script can never be stamped, and it demands a check on miya's unqualified `-check.sql` which it cannot parse. Audit-briefing meanwhile reports it at 0 fires (telemetry gap). | Resolve each column to its own FROM/UPDATE table (per-subquery scope) before emitting refs; skip unqualified `*-check.sql`. Eval: `281650.sql` emits 0 false rows; `281650-check.sql` is exempt. |
| A1 agentic system | `attachment-ledger-gate` + `sql-schema-verify` fired this session but audit-briefing shows 0 fires → retire suggestions are built on missing telemetry. | Log fires for gates dispatched through `hook-runtime --wrap`. Eval: a blocked Stop increments the gate's fire count. |
| A2 quest workflow | Worktree-isolation hook blocked writes to the main quest doc and memory index even after the session moved to main; the doc had to be written in the worktree and copied. | Re-read the session's primary dir on each call, not the start-time worktree. Eval: session with cwd=main can Write `projects/coding-projects/active/QA-x/QA-x.md`. |
| A3 debugging | Display-value question answered only after 4 re-asks; the label/value/note split of Tanah Kerajaan was known at turn 10 but never shown as before→after. | Popup options that change a user-visible value carry a before→after preview + value source (phrase in `feedback_popup_questions.md`). Eval: a popup with a display choice and no preview is flagged. |
| A4 etanah issue-solving | Tempat migrated shape still on 73 licence rows; keterangan note lost at licence approval (L13). | Offer BA a one-shot batch patch for the 73 rows (Option C of #278304). Eval: next MLPS renewal on a migrated lesen shows Tempat `-`. |
| A5 sweep | ⏭ no sweep run this session. | — |

## Session addendum — QA-281712 (Portal Awam PLTP syer fix → archived)

| Axis | Assessment (instance) | Proposal logged |
|---|---|---|
| A1 agentic system | the worktree-isolation guard kept denying Edit/Write to main-checkout files (`TEST-PERMOHONAN-INDEX.md`, `.claude/state` flag) after the worktree folder was deleted and the env said "no longer a worktree" — forced PowerShell workarounds | A1 guard re-checks the worktree path exists |
| A2 quest workflow | mlit receipt `260706BSAT00275` passed V1–V6 but failed V8 lease + V9 semakan on miya's screen; he had to find `260709BSAT00111` himself | A2 `lib/awam-resit-check.js` (the bounty refinement) |
| A3 debugging | owner-set via MAX(`versi_mula`) of `ind_pihak_bkptg` gave totals of 3.5 / 9 for many hakmilik (stale duplicate rows) — the query had to filter total = 1 instead of knowing the true current owners | A3 find the code path AWAM uses to auto-pull owners and bank its exact query |
| A4 etanah solving | int-env cherry-pick conflicted: `checkingSyer()` on int-env carried an env-only rewrite (`penyebutValue`) not on master | A4 pre-cherry-pick diff of each touched file `origin/mlk/master..origin/mlk/int-env` surfaced before the pick |
| A5 sweep | ⏭ no ticket/file sweep this session | — |

## Session addendum — NUL popup → nul-redirect-gate

| Axis | Assessment (instance) | Proposal logged |
|---|---|---|
| A1 agentic system | A prose rule ("use /dev/null, not NUL") lived only in the harness Bash tool text; a 2026-09-25 `ssh-keyscan > NUL` still wrote a real NUL file that sat 3 days until OneDrive popped. Now gated + boot-detected. | A1 worktree-cleanup-boot also flags worktree folders whose git link is broken (colleague-cr-issue-ed8731 is one) |
| A2 quest workflow | ⏭ no quest moved this session. | — |
| A3 debugging | Finding the file took one recursive scan of the whole OneDrive tree (~2 min); the boot audit would have named it in seconds had CHECK 10 existed. | — (CHECK 10 is the fix) |
| A4 etanah solving | ⏭ no etanah ticket this session. | — |
| A5 sweep | ⏭ no sweep run this session. | — |
