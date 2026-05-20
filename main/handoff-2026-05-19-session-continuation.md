# HANDOFF — 2026-05-19 session continuation

**Created**: 2026-05-19 evening (post-DE) · **Author**: Ruri · **For**: a follow-up session
**Supersedes**: `quest/handoff-QA-262027-doc-reconcile.md` (narrow, misplaced — to be deleted as part of action 3 below)

> Use the `checklist` skill — actions 1-3 below are a multi-item set; enumerate them so none is dropped.

---

## TL;DR

1. **MemoryCore docs are stale** for QA-262027 — they cite the old commit + a redundant tag that was reworked. Needs a correction pass across 5 files.
2. **Structural decision is open** — quest artifacts are scattered across `quest/`, per-quest folders, and Task folders. みや answered the open Design-Memo question: **fold per-quest into ONE `QA-NNNN.md`**, with `quest/` reserved for workflow machinery only.
3. **The narrow handoff file** I wrote earlier (`quest/handoff-QA-262027-doc-reconcile.md`) is itself misplaced — fold its content into `QA-262027.md` and delete it as part of action 2.

The etanah-pelupusan repo is **already correct** — branch `mlk/qa/262027` = `54f4b645b4`, do NOT touch it.

---

## Background

QA-262027 (PSBS — *Surat Keputusan PTG kepada PDT*) was fixed, committed `003862e9ff`, tested, and closed through Phase 2 on 2026-05-19.

**Fix #5 ("Pajakan Negeri" → "PN") was done wrong** — by creating a **new** CC tag `singkatanJenisNoHakmilik` + a new Java populator. After Phase 2, みや noticed sibling ticket QA-262039 uses an existing `noHakmilik` tag. Investigation: `populateNoHakmilik` (`PelupusanWordCCMethodConstant.java:11712`) is **byte-for-byte identical** to the populator I'd written — outputs `"PN <number>"`. The new tag was a pure ~48-line **duplicate** of code already in the file.

**Root cause**: incomplete existing-utility sweep at Phase 0 — only `namaJenisNoHakmilik` + `jenisHakmilik` were checked; sibling tags like `noHakmilik` were not. The tell I ignored: the "new" populator was a near-verbatim clone of an existing method — that itself was the signal the capability already existed.

**Etanah branch reconciled** (2026-05-19): remote + local `mlk/qa/262027` (`003862e9ff`) deleted; recreated as **`54f4b645b4`** — now **5 `.docx` edits, 0 Java**. Verified: `git diff master..mlk/qa/262027` shows only the `.docx`. **DO NOT touch the etanah repo.**

But MemoryCore's quest records still describe the superseded version, and the same session's debate about file structure surfaced a wider problem.

---

## Action 1 — MemoryCore doc reconcile (QA-262027 paper trail)

Correct each to the final reality: **commit `54f4b645b4`, fix = 5 `.docx` edits + 0 Java, #5 = swap to existing `noHakmilik` tag.**

| # | File | What is stale → correct to |
|---|---|---|
| 1 | `quest/active.txt` — QA-262027 block | `commit=003862e9ff…` → `commit=54f4b645b4 (2026-05-19) — QA #262027 - PSBS - Fix Surat Keputusan PTG kepada PDT`. `scope_layer=.docx + Java …` → `.docx template only — TemplateSuratMaklumanPTGPSBSLulus.docx`. `files_changed=` → only the `.docx`, drop the Java/new-tag mention. `scope_anchor` "(4) #5 … new tag singkatanJenisNoHakmilik + populator …" → "#5 PN abbrev — template CC tag swapped `namaJenisNoHakmilik` → existing `noHakmilik` (`populateNoHakmilik` already outputs 'PN <number>'); zero Java." Add a `notes:` line recording the reconcile. |
| 2 | `projects/coding-projects/active/QA-262027/QA-262027.md` (the main-repo copy is canonical) | Issue Checklist row #5, Rubric row #5, Apply section (delete the 2 Java rows), header `scope`, Step Log → reflect `noHakmilik` tag swap + 0 Java + commit `54f4b645b4`. |
| 3 | `projects/coding-projects/active/QA-262027/early-diagnostic.md` | The appended "Phase 0→1" section's "Fix applied" list cites the new tag → correct to the `noHakmilik` swap. |
| 4 | `main/post-mortems.md` — QA-262027 entry (already on MemoryCore `main`) | "Process Notes → Fix shipped" cites `003862e9ff` + "new singkatanJenisNoHakmilik tag+populator" → correct to `54f4b645b4` + "#5 via existing `noHakmilik` tag". **ADD a Lessons row** for the slip: *incomplete existing-utility sweep — a "new" populator that is a near-clone of an existing method is itself the signal the capability already exists; sweep sibling tags, not just the one the template carries.* |
| 5 | `main/kpi-tracker.md` — QA-262027 entry | "What we learnt" row about `populateNamaJenisAndNoHakmilik` / "New singkatanJenisNoHakmilik tag added" → correct to "existing `noHakmilik` tag (`populateNoHakmilik`) already outputs 'PN <number>' — swap the template CC tag, no new Java." |

**Constraints**: `active.txt`, `post-mortems.md`, `kpi-tracker.md` are git-tracked → correction = a new MemoryCore commit. The `QA-262027.md` + `early-diagnostic.md` are in gitignored `projects/` — edit in place. Do NOT touch the etanah repo.

**Verify**: `grep 003862e9ff` and `grep singkatanJenisNoHakmilik` across all 5 → zero hits (except in deliberate "history" sentences in the post-mortem).

---

## Action 2 — Lock the file-structure seam

**みや's concern**: a single quest's artifacts live in 4 different places — `quest/`, `projects/coding-projects/active/QA-NNNN/`, `1. Tasks/Melaka/...`, and the root MemoryCore — "all over the place."

**The seam to lock** (みや's answer to the open Design-Memo decision from earlier today):

| Location | Holds — **only** |
|---|---|
| `quest/` (root) | Workflow machinery: `quest-protocol.md`, cross-quest `active.txt` index, `redmine-sync.js`, `notes.js`. **No per-quest documents.** |
| `projects/coding-projects/active/QA-NNNN/` | **Everything about one quest in ONE file**: `QA-NNNN.md`. Fold `early-diagnostic.md` content into it as a section. Any handoff is a section, not a separate file. |
| `1. Tasks/Melaka/NN. QA #…/` | BA's Task folder — outside the repo, unchanged. |

**Concretely for QA-262027**: fold `early-diagnostic.md` into `QA-262027.md` as a "Phase 0 — Scout" section (it currently sits as a separate file + is linked from `QA-NNNN.md`); then delete the separate `early-diagnostic.md`.

**Going forward**: the `Scout familiar` template that auto-writes `early-diagnostic.md` should be updated to write into `QA-NNNN.md`'s Phase 0 section instead (or the file-write step is renamed). That's a small follow-up to the `Scout familiar` definition.

---

## Action 3 — Fix the misplaced handoff file

`quest/handoff-QA-262027-doc-reconcile.md` (created earlier this session) is itself an instance of the scatter problem — a per-quest handoff sitting in the workflow-machinery folder.

- Its content is subsumed by **this** overall handoff (action 1 above carries the same task table).
- Action: **delete `quest/handoff-QA-262027-doc-reconcile.md`** as part of executing action 2 (or earlier — it's redundant once you start on action 1).

---

## Context — what else happened this session (for memory continuity)

- Built **`checklist` skill** (`.claude/skills/checklist/SKILL.md`) — universal task checklist; auto-fires at quest drafting + generic-task post-planning. **Core rule: mechanism-done ≠ done; intent must match.** This rule comes directly from QA-262027 #1's "verified" slip.
- Built **`QA-NNNN.md` per-quest lifecycle doc** — Design Memo approved; created for all 4 PSBS tickets (262027, 262039, 262004, 261986).
- Added **`feedback_ticket_cadence.md`** memory — 3 tickets/day; spread difficulty (don't cherry-pick easiest); fix only BA-highlighted items.
- **CLAUDE.md "Phase 1 Closure — Git Sequence"** — precondition added (sequence runs only after `local_test_confirmed=true`; no branch until close). Version bumped 1.17 → 1.18.
- **DE step 10 commit-scope rule** added to `expansion-protocol.md` — `git status` every path; authorship is not a filter (caught after the CLAUDE.md precondition itself was left uncommitted).
- 3 process slips this session — all corrected and turned into structure (skills/rules/Refines): deferred-sweep, premature-branch at Apply, mechanism-vs-intent on fix #1. The redundant-tag finding (this handoff) is a 4th slip — captured here, to land in the post-mortem via action 1.

---

## Quest backlog (next sessions)

| Ticket | State | Notes |
|---|---|---|
| **QA-262039** | Phase 0 done (silent), Scout written | **Next ~2h session target** — PSBS Surat Keputusan Lulus, 12 discrepancies, 0 Java expected |
| QA-262004 | Phase 0 done (silent) | PSBS Ringkasan Risalat, ~3-5h |
| QA-261986 | Phase 0 done (silent) | PSBS Risalat MMKN, HIGH priority, ~5h — needs dedicated session |
| QA-259339 | Held — Scout NOT yet run | New 2026-05-19, PRU template, status "In Progress" (likely rework) |
| QA-260869 / 260302 / 260316 | Phase 1 closed, Phase 2 pending | From prior sessions |

---

## Standing flags

- **env**: pelupusan-UAT (switched this session; was AWAM). FAT environment down for "Mock Cutover 1".
- **CLAUDE.md edit-blocked for Ruri** — the `checklist` skill needs adding to the "Available Skills" list at the bottom of CLAUDE.md by みや's hand.
- **Worktree `sleepy-sutherland-4e433f`** — MemoryCore `main` is at `91c500c` (this session's DE commits merged + pushed). The worktree was supposed to be archived after DE; **acting on this handoff will re-touch `active.txt` (tracked)** → that change must be committed before the worktree can finally archive.

---

*Self-contained — a fresh session can pick this up cold. The narrow `quest/handoff-QA-262027-doc-reconcile.md` is superseded; delete it as part of action 3.*
