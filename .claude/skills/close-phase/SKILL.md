---
name: close-phase
description: Stage-aware quest close — the keyword "close" advances a quest to its NEXT closing stage. Phase 1 (active → closed) branches + commits + pushes the fix and sets status=closed; Phase 2 (closed → archived) runs the Phase 2 emit + archives the folder/block and sets status=archived. Triggers — "/close-phase", "/close", "close", "close phase", "close-out", "close the quest", "close X", "phase 1 close", "phase 2", "archive X" (when already closed), "wrap X", "bounty X". The skill detects the quest's current status and runs the matching stage. Built 2026-06-05 after the QA-263921 close slip (silent deviation from the pull-before-branch sequence) — a skill runs the sequence in a FIXED order so a step can't be dropped.
argument-hint: "[<QA-number>]"
allowed-tools: Read, Glob, Bash, Edit, Write, Skill
---

# close-phase — Stage-aware quest close

ARGUMENTS: $ARGUMENTS

## What this is

ONE keyword — **close** — advances a quest through its closing stages. The skill reads `quest/active.txt`, finds the quest's current `status`, and runs the matching stage:

```
active / hold / blocked / delegated   --close-->   closed     (Phase 1 close-out)
closed                                --close-->   archived   (Phase 2 archive)
archived                              --close-->   (no-op: already archived)
```

**Why a skill, not prose** (built 2026-06-05): the Phase 1 git sequence kept being deviated from — most recently QA-263921, where the "pull before branch" step was silently skipped after a plan that included it. A skill runs the sequence in a FIXED order so a step can't be dropped, and the only-stage-the-cited-files rule protects other parallel WIP.

## Step 0 — locate the quest + its stage (always)

1. Read `quest/active.txt`. Resolve the target quest:
   - `<QA-number>` arg supplied → that block.
   - no arg → the single block with status ∈ {active, hold, blocked, delegated} (Phase 1) OR the single `closed` block (Phase 2). If 0 or >1 candidates, list them + ask which.
2. Read the `status` field → pick the branch below.
3. Emit the visible stage line: `close-phase — QA-<num>: stage = <Phase 1 close-out | Phase 2 archive | already archived>`.

---

## Phase 1 close-out  (status ∈ active/hold/blocked/delegated  →  closed)

**Visible checklist first:** `Phase 1 close — QA-<num>: 1 ⬜ test-confirmed · 2 ⬜ pull+branch · 3 ⬜ stage-fix-only · 4 ⬜ STOP review · 5 ⬜ commit+push · 6 ⬜ master+active.txt · 7 ⬜ /verify`

1. **Assert local test.** If `local_test_confirmed` ≠ true → ask みや "Tested locally?" Do NOT proceed until confirmed.
2. **🚨 The FIXED git sequence (etanah repo, e.g. `E:\Projects\Melaka\etanah-pelupusan`). The pull is NON-SKIPPABLE.** Identify the **cited fix file(s)** for THIS quest — the files actually changed for the fix, NOT other uncommitted WIP (e.g. another ticket's edits). Then, in order:
   ```
   git stash push -- <cited-fix-file…>          # protect ONLY the fix; leave other WIP alone
   git checkout mlk/master
   git pull --ff-only origin mlk/master          # ← the step that gets skipped — NEVER skip it
   git checkout -b mlk/qa/<num>
   git stash pop
   git add <cited-fix-file…>                      # stage ONLY the cited files
   ```
   - **Banned**: branching before pulling · `git add -A` / `git add .` (stages other WIP) · staging any file not part of this quest's fix · silently deviating from this order (if a deviation is genuinely needed, SURFACE it and get a nod first).
3. **🛑 STOP — review gate (mandatory).** Emit three things and WAIT for みや's explicit approval before committing:
   - the staged file list (confirm ONLY the cited files),
   - the full `git diff --cached`,
   - the drafted commit message (etanah convention: subject-only — `QA #<num> - <URUSAN> - <TUGASAN-KOD> - <action-oriented desc>`, no body, no trailer — per `.claude/commit-conventions.md`; ONE version only).
4. **On approval:** `git commit -m "<approved>"` → `git push -u origin mlk/qa/<num>`.
   - If `origin/mlk/master` advanced during the work, base the branch on the latest: `git fetch` → stash the non-fix WIP → `git rebase origin/mlk/master` → pop → `git push --force-with-lease`. Inspect any commit that touches the same area for interaction with the fix. **Rebase once, then stop chasing** — further team pushes are handled at merge time.
5. **Return:** `git checkout mlk/master` → `git pull --ff-only origin mlk/master` (the non-fix WIP follows back, untouched).
6. **Mark closed:** `node quest/active-cli.js update QA-<num> status=closed current_phase=Closed local_test_confirmed=true commit=<sha> closed=@now`
   (run against the LIVE `active.txt`; if running inside a worktree, target the main-repo path so the live state — what the boot hooks read — is the one updated).
7. **`/verify` Checklist C** — emit the green/red close-out table (branch off current master · only the fix committed · pushed · message · active.txt closed).

**The quest is now `closed` (Phase 1 done). The next `close` archives it (Phase 2).**

---

## Phase 2 archive  (status == closed  →  archived)

**Visible Phase 2 step line:** `Phase 2 — QA-<num>: 1 ⬜ Faster-finding · 1b ⬜ Fastest-Path · 2 ⬜ KPI · 3 ⬜ Post-mortem · 4 ⬜ Refine · 5 ⬜ Archive · 5b ⬜ Bounty · 6 ⬜ /verify`

1. **Phase 2 emit** (the 5 streamlined steps — `quest/quest-protocol.md` Phase 2, each emitted inline, not just ticked):
   - **Step 1 — Faster-finding** (1-2 lines + the applied artifact).
   - **Step 1b — Fastest-Path Retrospective** (if the quest took >1 wrong turn): write a `## Fastest Path` block into `QA-NNNN.md` — symptom signature · the clean shortest path to root cause · wrong turns removed · reusable recipe (promote a recurring class to `BUG-BESTIARY.md`).
   - **Step 2 — KPI** (only-if-significant; else emit `KPI: skip — routine`).
   - **Step 3 — Post-mortem META** (Contributing Factors / Process Notes / Carry Forward) into the archive QA doc.
   - **Step 4 — Refine pass** (skill/protocol refinements; promote the Improvement Checklist).
2. **🚨 Archive hygiene — run the atomic mover:** `node quest/archive-quest.js QA-<num>` — moves the Task folder → `Archive\`, the active.txt block → `active-archive.txt` (status=archived + task_folder repointed), and the project subfolder → `archive\` if present. Use `-LiteralPath` semantics for `[FAT]`-bracketed folder names (the script handles this).
3. **Emit the visible gate:** `Archive hygiene — QA-<num>: folder→Archive\ ✓ · active.txt block→active-archive.txt ✓ · project subfolder <✓|⬜ no-archive-dir>`.
4. **⛏ Harvest + bank — invoke `quest-bounty`** (Skill tool): harvest the quest doc + any system improvements made this quest + new etanah-knowledge, mine ONE refinement (dimension catalog + un-actioned slip-log clusters), then commit/push/merge the **MemoryCore** spoils to main — NEVER the etanah repos (their fix is a teammate-merged PR). See `.claude/skills/quest-bounty/SKILL.md`.
5. **`/verify` Checklist E** — confirm every Phase 2 step + the archive moves fired.

**The quest is now `archived`. Done.**

---

## Already archived

If status == archived → emit `QA-<num> is already archived — nothing to close.` and stop.

## Notes

- **Redmine is みや's** — this skill never touches Redmine. `/redmine-phase1-prefill` is the separate, manual-invoke skill for the Redmine form.
- **Be explicit with >1 open quest** — pass the `<QA-number>` argument.
- **Pairs with**: `quest/active-cli.js` (active.txt CRUD), `quest/archive-quest.js` (Phase 2 moves), `.claude/commit-conventions.md` (commit subject), `/verify` (checkpoint verification), `quest-protocol.md` (Phase 1 close-out + Phase 2 emit bodies).

## Skill History
- 2026-06-05 — created. Born from the QA-263921 Phase 1 close slip: a plan that started with "pull first" was silently executed without the pull (branched off a stale master). The defender is this skill — the pull-before-branch + stage-cited-files-only + stop-at-stage steps are now a fixed, non-skippable sequence. Wraps the existing `active-cli.js` / `archive-quest.js` primitives (inventory-first: no new CRUD invented).
