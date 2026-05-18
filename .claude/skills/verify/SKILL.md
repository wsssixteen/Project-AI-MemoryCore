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
| No active workflow | Reply "no active checkpoint — nothing to verify" and stop |

## Steps 2-3 — Load checklist, re-check with evidence

Every item is checked against reality — a `git` command, a file read, a `grep`, or a transcript trace. **A ✅ with no evidence is invalid — treat it as 🔴.** This is the false-green ban, same discipline as Recon.

### Checklist A — Quest Phase 0 (Discovery / Recon done)

| # | Step | How to verify |
|---|---|---|
| A1 | env-check ran — `environment.properties` + `standalone.xml` + branch aligned to the ticket | env-check output / `git branch --show-current` in both repos |
| A2 | Both repos branch-checked + `git pull --ff-only` done | `git log` / clean `git status` |
| A3 | etanah-knowledge files whose SCOPE matches the symptom were Glob'd + read | transcript trace |
| A4 | Scout done — `projects/coding-projects/active/QA-<n>/early-diagnostic.md` exists | file exists |
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
| C6 | Repo returned to `mlk/master` (pelupusan) / `mlk/release/fat` (awam), at origin tip | `git branch --show-current` + `git fetch` ahead-count == 0 |
| C7 | `active.txt` updated — `phase=1-complete`, `commit=<SHA>`, `status=` set | `grep -A8 "^qa=QA-<n>" quest/active.txt` |

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

- **v1 (now)** — engine + Checklists A, B, C. Manual + checkpoint-prompt triggers. Supersedes `verify-close`.
- **v1.1** — add Checklist D (Redmine retrieval: sync ran, tickets in active.txt, early-diagnostics written, results table emitted).
- **v2** — after ≥3 cycles + みや's approval: auto-fire at checkpoint transitions.

---

*Created 2026-05-18 by Ruri (Design Memo) + みや (approved). Supersedes verify-close (2026-05-11).*
