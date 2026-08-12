# Agentic / Ticket-Workflow Assessment — 2026-08-12

Session shape: short, single-arc — QA-265537 stranded `etanah-common` edits removed (git hygiene + quest-file save). No debugging, no fan-out, no etanah code trace.

## Five-axis sweep

| Axis | Finding (with the instance that proves it) |
|---|---|
| **A1 — agentic system** | ⏭ No delegation/fan-out this session. Solo git + file work. |
| **A2 — quest workflow** | **Quest files have two different correct homes and nothing steers the edit to the right one.** `active.txt` is tracked and exists in BOTH main and the worktree; `qa_doc` is untracked/confidential and lives ONLY in main. This session I edited main's `active.txt` first (wrong copy — the worktree is what commits), then had to reconcile. They differed by exactly one line (my own edit) so it was cheap, but the failure mode is real: a diverged `active.txt` between the two copies is invisible until you diff them. Instance: main `active.txt` 74068 B vs worktree 74663 B pre-edit; the direct diff was a single line. |
| **A3 — debugging efficiency + accuracy** | **"Is this fix needed?" was almost answerable wrong from the qa_doc alone.** The QA-265537 qa_doc oscillated — it later argued the read-tolerance path was *necessary* for 191k legacy rows. The authoritative signal was elsewhere: Redmine "Resolved 100% by Aaron Loh" + the shipped commit on `mlk/qa/265537` (awam save-path `e38f1e3f81`). Verifying against what SHIPPED, not the investigation narrative, is what kept the revert correct. Instance: qa_doc:371 rejected-candidate-4 vs qa_doc later "read-tolerance no longer dismissible". |
| **A4 — etanah issue-solving** | Same as A3 — the durable etanah lesson is that a closed ticket's *shipped* fix (committed branch + Redmine resolver) overrides its own qa_doc's mid-investigation reasoning when deciding whether stranded local code belongs. |
| **A5 — sweep / file sweep** | ⏭ No brief/file sweep this session. |

## Proposals logged (weekly-audit feed)

1. **A2** — a DE/quest guard that detects when `active.txt` differs between the main repo and the active worktree and surfaces the one-line-or-more delta at session-start or DE-open, so quest-file edits landing in the wrong copy are caught before commit. Eval case: this session's main-vs-worktree `active.txt` one-line drift, which was only found because I diffed the two copies by hand.
2. **A3/A4** — an "is-it-shipped" check helper: given a ticket + a stranded local diff, report the Redmine resolver/status + the committed branch(es) carrying the fix, so "do we still need this code" is answered from shipped truth not the qa_doc narrative. Eval case: QA-265537, where the qa_doc argued for a path that never shipped.

---

# Session 2 — QA-274532 (PLTP Surat Nilaian JPPH, shipped) + MLKIT common bump

Session shape: full single-ticket arc — Phase 0 (video + code + DB) → fix (Java guard + docx title) → local test PASS → Phase 1 commit/push → int-env merge (conflict-resolved) → deploy card. Plus a colleague common-version bump.

## Five-axis sweep

| Axis | Finding (with the instance) |
|---|---|
| **A1 — agentic system** | ⏭ Solo — no fan-out. A template + one-populator bug this size didn't warrant one. |
| **A2 — quest workflow** | **`/deploy`'s full-merge into a stale `int-env` conflicts on binaries the ticket touched — TWICE today** (273921's `TemplateSuratNilaianJPPH_PLTP_PSBS.docx`, then 274532's SAME file). What worked for 274532: take int-env's NEWER docx (it carried a `pelanCC` control master lacked) and re-apply the ticket's title change on it. That resolution procedure is undocumented; 273921 only proposed a cherry-pick fallback. |
| **A3 — debugging efficiency + accuracy** | Two-sided. WIN: the *truly-blank* field (vs the `-` fallback the code prints) pinned the pembetulan guard as the sole cause before any DB read. MISS: my first scripted Java edit anchored to the first `return tarikh;` and landed in the WRONG method (`4708`, not `populateTarikhSemasa` at `7734`) — the file had shifted line numbers under me between reads. Caught by `git diff` before commit; no bad code shipped, but a first-occurrence string-match edit is a live hazard. |
| **A4 — etanah issue-solving** | The Scout git-log probe found the guard's origin (QA #233948, `885a990388`) in one step — decisive for framing the fix as a scoped regression. Trap worth banking: `populateTarikhSemasa`'s pembetulan guard blanks the Gregorian date on EVERY letter using that populator whenever ANY doc on the app is in pembetulan status. |
| **A5 — sweep / file sweep** | Reading the BA video BEFORE theorising was decisive — the Tarikh-blank / Bersamaan-shown asymmetry is only visible in the recording and IS the diagnosis. Reinforces "a picture/recording testifies to what the user SAW." |

## Proposals logged (weekly-audit feed)

1. **A2** — codify the int-env binary-conflict resolution in `.claude/skills/deploy`: when merging a ticket into stale int-env conflicts on a binary the ticket edited, take int-env's version and re-apply the ticket's specific change onto it (preserve int-env's newer content) rather than take-ours. Eval case: 274532's docx conflict where int-env carried `pelanCC` master lacked — take-ours would have deleted it.
2. **A3** — a scripted-edit anchor-verify discipline: before any string-match edit to a source file, anchor to the enclosing symbol (method signature) AND emit/confirm the resolved line number, so a first-occurrence match can't hit a sibling method. Eval case: 274532 guard edit hit `4708` not `7734`.

---

# DE-process evaluation — 2026-08-12 (per みや: "how you observe our domain expansion, how we can improve speed and quality")

**Verdict: the CONTENT saves are high quality; the BASE-SYNC (step 0b) is where the time went, and it went there because a two-session, OneDrive-synced worktree has no mechanical reconcile.** This DE spent the bulk of its wall-clock on git plumbing, not on writing.

| Where the time/quality went | Observation (this DE's instance) |
|---|---|
| **0b active.txt reconcile (SLOW)** | ~6 manual git steps — stash → FF-merge → pop → conflict → python-resolve → add → stash-drop — to absorb a parallel session's 2 commits. The active.txt conflict was **trivial** (upstream side empty, my 274532 block the only content), yet it needed a hand-written resolver. A second session had already done today's DE (wrote the diary + assessment), so every shared file was a read-modify-write. |
| **Unrelated worktree drift (QUALITY risk)** | `index.md` carried a PERMIT-LESEN deletion I didn't make; `git checkout --` wouldn't stick (OneDrive re-syncs worktree files under git), so it re-appeared twice and was only caught **at commit time**, not at DE-open. A stray deletion of an entry whose file still exists nearly rode into the commit under the "commit every modified path" rule. |
| **RecursiveLoopDetector false-fire (NOISE)** | Fired 7× on legitimately-distinct sequential git operations during 0b, reading them as a stuck loop. It counts "similar args" but DE base-sync is inherently many similar-looking git calls. |
| **Content saves (GOOD)** | current-session (+trim), qa_doc (both copies reconciled), diary Session 2, main-memory row, assessment — all landed cleanly and fast once past 0b. |

**Speed/quality proposals (logged to weekly audit):**
1. **DE base-sync helper** — one script for 0b: detect worktree-behind-main + dirty tracked files, run stash→FF→pop, and auto-resolve an `active.txt` conflict where one side is empty (keep-both). Eval: this DE's 6-step manual reconcile on a one-block trivial conflict.
2. **DE-open worktree-drift scan** — at DE-open, list modified files NOT authored this session (OneDrive re-sync artifacts like the index.md deletion) and force a keep/revert decision up front, not at commit. Eval: index.md PERMIT-LESEN deletion re-surfaced twice mid-DE.
3. **RecursiveLoopDetector DE-exemption** — during a DE the detector should key on command identity, not "similar args", or suppress during known git-sequence phases. Eval: 7 distinct git ops flagged as a loop this DE.

---

## Domain Expansion — self-observation (2026-08-12, session-end, per みや)

**How this DE actually ran — speed + quality findings, each with the concrete instance:**

| # | Observation | Instance this DE | Improvement |
|---|---|---|---|
| DE-1 | DE ran content steps on a repo that was silently mid-merge | main repo had `MERGE_HEAD` (QA-273921 close-race) + 7 unmerged files; discovered only at step 10, after ~6 diagnostic calls | **Step 0b must FIRST `Test-Path .git/MERGE_HEAD` + count unmerged; if mid-merge → STOP + surface in ONE line**, never run content saves on a conflicted tree |
| DE-2 | Two-tree split (worktree vs main) made the commit target ambiguous | my edits landed in the MAIN repo working tree; hooks wrote active.txt/slips to the WORKTREE; reconciling cost several calls | Step 0b should emit a **tree map**: `main: <n tracked> · worktree: <n tracked>` so the commit target is unambiguous up front |
| DE-3 | Git forensics looped (RecursiveLoopDetector fired 4×) | piecemeal `git status`/marker checks across calls | **one consolidated `git-state snapshot` script** (branch · behind · MERGE_HEAD · unmerged · my-files-present) run ONCE at DE start replaces the piecemeal probing |
| DE-4 | Blocker-surfacing worked well | I stopped + used AskUserQuestion instead of blindly completing another quest's merge → no data loss | keep: mid-merge = STOP + ask, never auto-resolve append/log files |

**Speed verdict**: the DE itself was slowed almost entirely by the pre-existing git conflict, not by the content steps. A deterministic mid-merge guard at step 0b would have turned ~10 minutes of forensics into one surfaced line.
