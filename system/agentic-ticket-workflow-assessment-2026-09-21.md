# Agentic / Ticket-Workflow Assessment — 2026-09-21

Session: plan-handover-sweep — applied 4 verify-swept eSOKONGAN tickets (#280191/#280176/#280132 shipped; #280166 delegated). Improvement sweep, 5 axes, one concrete instance per claim.

## A1 — Agentic system
**Claim: I burned turns theorizing instead of reading real state with the access I already had.**
Instance: his local `mlk/stag-env` showed "19 to push". I spent ~6 turns hypothesizing (SourceTree unreliable, refresh, my copies fouling references) before reading `git status -sb` + the upstream map, which showed the branch tracked `origin/mlk/master`. One command on turn 1 would have found it. → Proposal A1 logged: git-state question → first tool call is a status/upstream/reflog read, never prose theory.
**Claim: my own write-side git activity churned his repo.**
Instance: in-repo fetches/worktrees/reset-advice moved refs his SourceTree reads. → Banked `feedback_etanah_git_separate_clone` (write-side git in a server clone `E:/Dev/etanah-work`, never his tree) + Proposal A1 boot-check for env-branch upstream drift.

## A2 — Quest workflow
**Claim: the verify sweep paid off exactly where it was designed to.**
Instance: the W4 "prove expected behaviour + verify fix produces it" gate (added 2026-09-18) is why #280166 did not ship a flat `"TP"` that would have killed the gazette branch — it was caught as behaviourally wrong though the error was silenced. The three that shipped all had DB-proven expected output. No workflow gap surfaced this session; the sweep→apply handoff worked. A2 healthy.

## A3 — Debugging efficiency + accuracy
**Claim: mis-diagnosis came from not reading the primary signal first.**
Instance: same git-tracking case as A1 — I diagnosed the symptom (wrong count) instead of the cause (wrong upstream) because I did not read `git for-each-ref …upstream` first. The fix class is identical to the "read the actual error text before blaming the connection" rule. → Proposal A1 covers it.

## A4 — Etanah issue-solving
**Claim: every fix this session was a "copy the working sibling" job, and that shape held.**
Instance: #280132 forward-finder copied `onCariPermohonanBertindih():209`; #280191 Butir-butir re-populate copied the PT branch's `KEY_BUTIR_BUTIR_LANJUT` read; the popup copied `PelupusanExcelReaderHelper.onSimpanTanah()`'s shared message. Working-analog-first worked cleanly — no regression. A4 healthy.
**Claim: the toolchains trap cost build time.**
Instance: global `toolchains.xml` pointed at a dead `E:\Java\java8`, blocking all builds; fixed with a `-gt` custom toolchains file at jdk-17. Worth a one-line note in new-machine/env docs so it isn't re-discovered. → deferred, low priority (env-local, not a code rule).

## A5 — Sweep / file sweep
**Claim: OneDrive-inside-repo worktrees are structurally unsafe.**
Instance: this worktree's `.git/worktrees/<name>` backing was emptied by OneDrive mid-session; `git worktree repair` failed; DE had to run in the main repo. This is the same class as the 213-folder OneDrive-worktree problem already in memory (`project_onedrive_worktrees`). → Proposal A1 logged: boot must DETECT a dead-git worktree and route to main automatically. No new file-sweep debt this session.

## Proposals logged this session (see slip-dashboard 💡 Open proposals)
1. A1 — git-state question → status/upstream/reflog read as tool-call #1
2. A4 — boot health-check on etanah env-branch upstreams (stag-env→origin/stag-env)
3. A1 — boot detect dead-git worktree (missing `.git/worktrees/<name>`) → main-repo fallback

---

# Assessment (concurrent session — #280191 audit + int-env merge)

Session: /goal — audit colleague Ammar's #280191 fix + merge to internal. Light session (audit + git merge, no fleet, no debugging).

## Five-axis sweep

| Axis | Finding (with instance) |
|---|---|
| **A1 agentic system** | ⏭ no delegation / fan-out this session — single-controller audit + merge. |
| **A2 quest workflow** | ✅ **What worked**: audited a colleague's fix by **per-commit ancestry**, not a branch-tip guess — caught int-env sitting on a half-version (Fixes 1–3 merged, last 2 commits incl. `isParsable` missing). The deploy skill §4 fix-commit ancestry rule earned its keep. ❌ **The miss**: after merging int-env I handed みや a "say the word and I'll do staging" flag; he asked for a **complete merge with nothing left**. Completeness across env branches was treated as a judgment/ask-back when it should be mechanical — do every lagging env, report "done". |
| **A3 debugging** | ⏭ no debugging this session — the bug was already root-caused (our own sweep) and already fixed by the colleague. |
| **A4 etanah issue-solving** | ✅ **Knowledge beat**: a plain `StringUtils.isNotBlank` guard is INSUFFICIENT for a numeric parse — a non-blank but non-numeric value (No Lot "12A") still throws `NumberFormatException`. The robust guard is `NumberUtils.isParsable(...)? Integer.valueOf(...) : null`. Our sweep planned `isNotBlank`; the colleague's `isParsable` is the superset. Candidate for BUG-BESTIARY (defer to Phase-2 close). |
| **A5 sweep / file-sweep** | ⏭ no multi-ticket sweep this session. |

## Root of the miss (A2)
"Complete merge, leave nothing" = every env branch that lags the fix gets merged in one pass. Handing a per-env flag is the same shape as an ask-back for a searchable fact — the answer (does stag-env lag? merge it) was one ancestry check + one merge away, both non-destructive, both mine to do.
