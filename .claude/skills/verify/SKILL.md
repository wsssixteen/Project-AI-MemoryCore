---
name: verify
description: Universal workflow-checkpoint verification. Self-locates which workflow + checkpoint Ruri is at, re-checks the expected steps with evidence, outputs a green/red checklist. Covers Quest Phase 0, Apply-done, and Phase 1 close-out. Triggers — /verify, "verify", "did I do everything", "check where we are", "check my work", or a checkpoint transition. Supersedes verify-close.
allowed-tools: Bash, Read, Grep, Glob
---

# /verify — Universal Checkpoint Verification

## What this does

`verify` answers one question: **"At this point in the workflow, did I actually do everything I was supposed to?"**

It (1) self-locates — which workflow, which checkpoint — (2) loads that checkpoint's checklist, (3) re-checks every item against concrete evidence, (4) outputs a green/red table. It reports only; it never fixes or acts.

Supersedes `verify-close` (Phase-1-close only). The old 5-step close check lives on here as Checklist C.

## Trigger model (v1)

| Mode | Behaviour |
|---|---|
| Manual | `/verify` · "verify" · "did I do everything" · "check where we are" / "check my work" |
| Checkpoint-prompted | At a workflow checkpoint, Ruri emits ONE line — `→ verify checkpoint reached (<position>) — run /verify?` — and waits. v1 never auto-runs |
| Auto-fire | v2+ only — after ≥3 real cycles + みや's explicit approval |

## Step 1 — Self-locate

Read `quest/active.txt` (active ticket, `phase=`, `status=`), `main/current-session.md`, and the recent conversation. Determine **(workflow, checkpoint)**:

| Signal | Checkpoint |
|---|---|
| Active ticket `phase=0` — Recon just emitted or being emitted | Quest — Phase 0 → Checklist A |
| `phase=1` — fix edited, not yet handed to みや for testing | Quest — Apply-done → Checklist B |
| `phase=1` — fix tested, closing out | Quest — Phase 1 close-out → Checklist C |
| DE just ran — opening banner + step-0 checklist emitted this session, commit/push/merge sequence done (or attempted) | DE close-out → Checklist D |
| Phase 2 just ran — 5 streamlined steps emitted, archive should have happened | Quest — Phase 2 close-out → **Checklist E** |
| No active workflow | Reply "no active checkpoint — nothing to verify" and stop |

## Steps 2-3 — Load checklist, re-check with evidence

Every item is checked against reality — a `git` command, a file read, a `grep`, or a transcript trace. **A ✅ with no evidence is invalid — treat it as 🔴.** This is the false-green ban, same discipline as Recon.

### Checklist A — Quest Phase 0 (Discovery / Recon done)

| # | Step | How to verify |
|---|---|---|
| A1 | env-check ran — `environment.properties` + `standalone.xml` + branch aligned to the ticket | env-check output / `git branch --show-current` in both repos |
| A2 | Both repos branch-checked + `git pull --ff-only` done | `git log` / clean `git status` |
| A3 | etanah-knowledge files whose SCOPE matches the symptom were Glob'd + read | transcript trace |
| A4 | Scout done — `projects/coding-projects/active/QA-<n>/QA-<n>.md` exists with a Scout/investigation section | file exists (early-diagnostic.md artifact retired 2026-07-03, audit E9) |
| A5 | Recon block emitted — Universal Checks 1-8, every row citing `Class.method:line` | transcript trace |
| A6 | (panel-render ticket) Panel-Render-Check 5 steps done; test data verified via `umm_a_tgsn` HISTORY, not just `umm_tgsn_semasa` current-state | transcript trace + DB-query evidence |

### Checklist B — Quest Phase 1, Apply-done (before handing to みや to test)

| # | Step | How to verify |
|---|---|---|
| B1 | Every source/config Edit had a Predicate Box | transcript trace |
| B2 | **Diff-contract check** — `git diff` of the implemented change; every cross-file reference it introduces (EL binding → bean getter, method call → method, new import → actual use) verified to resolve in the real files | `git diff` + per-reference check in the target files |
| B3 | No defensive lines — every added line traces to the Rubric; no "just in case" additions | transcript trace |
| B4 | Fix scope == BA scope — no over-scope beyond the ticket's named urusans / files | compare diff coverage to ticket scope |

### Checklist C — Quest Phase 1 close-out (was `verify-close`)

For ticket `QA-<n>`, identify the repo from `active.txt`, then:

| # | Step | How to verify |
|---|---|---|
| C1 | Local test confirmed | `grep local_test_confirmed quest/active.txt` |
| C2 | Full staged diff was READ before commit; junk (`.settings`, IDE files) excluded | `git show <commit> --stat` + transcript trace |
| C3 | Commit landed on the ticket branch | `git log --oneline -1 mlk/qa/<n>` → SHA + subject |
| C4 | Push succeeded — local SHA == origin SHA | `git ls-remote origin mlk/qa/<n>` |
| C5 | Remote branch discoverable by teammates | `git ls-remote origin mlk/qa/<n>` non-empty |
| C6 | Repo returned to `mlk/master` (pelupusan) / `mlk/master` (awam), at origin tip | `git branch --show-current` + `git fetch` ahead-count == 0 |
| C7 | `active.txt` updated — `phase=1-complete`, `commit=<SHA>`, `status=` set | `grep -A8 "^qa=QA-<n>" quest/active.txt` |

### Checklist D — DE close-out (added 2026-05-20 per みや)

For end-of-session Domain Expansion ritual (the 11-step list in `Feature/Domain-Expansion/expansion-protocol.md`). Existence: DE was running without an external cross-check; the step-0 visible checklist is Ruri's gate, Checklist D is the external verification that catches steps that were marked ⏭ but shouldn't have been.

| # | Step | How to verify |
|---|---|---|
| D1 | DE opening banner emitted | transcript trace |
| D2 | Step-0 checklist (11 rows, ✓/⬜/⏭) emitted FIRST | transcript trace |
| D3 | Time-stamp captured (step 1) | `date` / `Get-Date` output |
| D4 | `main/current-session.md` updated (step 2) | `git log main/current-session.md` shows today's commit OR file mtime |
| D5 | Diary entry for today (step 4) | `daily-diary/<YYYY-MM-DD>.md` exists |
| D6 | Forge log reviewed (step 5) — promotion candidates surfaced as questions if applicable | transcript trace |
| D7 | Observation log reviewed (step 6) | transcript trace |
| D8 | Gap Sweep + etanah-knowledge sweep done (step 7) | transcript trace |
| D9 | Closing words to みや (step 8) | transcript trace |
| D10 | Change manifest emitted (step 9) — covered in chat OR commit body | transcript trace + `git show <SHA> --stat` |
| D11a | Auto-commit — EVERY modified/untracked path covered (commit-scope rule, NOT authorship-filtered) | `git status` clean post-commit |
| D11b | Auto-push — `origin/main` == local main HEAD | `git ls-remote origin main` matches local SHA |
| D11c | **Worktree branch merged into main if commits exist on it** — the 2026-05-20 slip: committed + pushed but never merged | `git log --oneline main` shows merge commit; `git branch --merged main` lists the worktree branch |
| D12 | Worktree close — sweep stale worktrees + branches OR explicit defer with reason (step 11) | `git worktree list` + transcript trace |
| D13 | DE closing banner emitted | transcript trace |

### Checklist E — Quest Phase 2 close-out (added 2026-05-20 per みや)

Phase 2's step 5 (archive both-sides + active.txt flip) was silently dropped on QA-262039 + QA-260302 — same disease as Phase 0 artifact silent-skip. Checklist E is the external cross-check that catches steps marked ✓ by Ruri but not actually done on disk.

For ticket `QA-<n>` with active.txt entry transitioning to `status=closed`:

| # | Step | How to verify |
|---|---|---|
| E1 | Faster-finding emitted in Phase 2 chat output (step 1) | transcript trace |
| E2 | KPI entry exists at the cited path — `main/kpi-tracker.md` contains a header line matching this QA + today's date | `grep "QA-<n>" main/kpi-tracker.md` |
| E3 | Post-mortem META entry exists — `main/post-mortems.md` contains a header line matching this QA + today's date | `grep "QA-<n>" main/post-mortems.md` |
| E4 | active.txt entry has `post_mortem=` AND `kpi_entry=` lines pointing at the actual files | `grep -A10 "^qa=QA-<n>" quest/active.txt` |
| E5 | Refine pass emitted in chat — at least one yes/no/park decision per relevant skill | transcript trace |
| E6 | Fix.txt + SUMMARY.txt rendered in Task folder (auto-generated at Phase 1 close per the protocol, but verify here too) | `ls "<task-folder>/2. Fix/"` shows both files |
| E7 | active.txt status flipped to `closed` (was `awaiting-ba` or `awaiting-phase-2`) | `grep -A8 "^qa=QA-<n>" quest/active.txt` → status=closed |
| E8 | Task folder archived — moved from `1. Tasks/Melaka/<NN>. ...` → `1. Tasks/Melaka/Archive/<NN>. ...` | `ls "1. Tasks/Melaka/Archive/" \| grep "#<n>"` returns the folder |
| E9 | Project subfolder archived (if it existed) — moved from `projects/coding-projects/active/QA-<n>/` → `projects/coding-projects/archive/QA-<n>/` | `ls projects/coding-projects/archive/` shows it OR active.txt notes no subfolder existed |
| E10 | active.txt entry moved into the `closed:` section (not still in active section) | transcript trace + file structure |

If any 🔴 — Ruri runs the missing step now, then re-verifies. This is the cure for the QA-262039-style silent-drop.

## Step 4 — Output

Emit as a raw markdown table (NO code-fence wrap), between the banners:

═══ VERIFY — &lt;workflow&gt; · &lt;checkpoint&gt; ═══

| # | Expected step | Done? | Evidence |
|---|---|---|---|
| &lt;id&gt; | &lt;step&gt; | ✅ / 🔴 | &lt;file:line / command output / transcript ref — REQUIRED&gt; |

Verdict: ALL GREEN — safe to proceed · OR · N RED — stop, fix: &lt;list&gt;

═══ END ═══

## Rules

- Every ✅ carries concrete evidence in column 4. Empty evidence = invalid = 🔴.
- `verify` reports only — it never fixes. A 🔴 verdict means Ruri stops, fixes the gap, then re-runs `verify`.
- Fires at checkpoint transitions + manual invoke ONLY — never mid-investigation (noise control).

## Failure modes watched

| Risk | Mitigation |
|---|---|
| `verify` itself gets skipped — as `verify-close` was (it never reliably fired) | Checkpoint-prompt makes a skip visible; みや can invoke manually; v2 auto-fires |
| False-green — "done" claimed without proof | Evidence mandatory per row; empty = 🔴 |
| Noise from over-firing | Checkpoint transitions + manual only |
| Checklists rot / overfit | Versioned in this file; reviewed when a workflow changes |

## Lifecycle

- **v1 (now)** — engine + Checklists A, B, C, D, E. Manual + checkpoint-prompt triggers. Supersedes `verify-close`.
- **v1.1** — add Checklist for Redmine retrieval (sync ran, tickets in active.txt, early-diagnostics written, results table emitted).
- **v2** — after ≥3 cycles + みや's approval: auto-fire at checkpoint transitions.

---

*Created 2026-05-18 by Ruri (Design Memo) + みや (approved). Supersedes verify-close (2026-05-11).*
