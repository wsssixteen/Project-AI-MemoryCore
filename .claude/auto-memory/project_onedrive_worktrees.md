---
name: project-onedrive-worktrees
description: "no worktrees inside OneDrive; deleted branches can reappear; hooks may run from MAIN; untracked = confidential; verify handoffs vs git; grep the diary; every session lands its work on main and never regresses it"
metadata: 
  node_type: memory
  type: project
  originSessionId: 6e2f7830-916e-4545-ae29-7e0c7f2bb184
  modified: 2026-10-08T10:51:19.168Z
---

**What happened (2026-09-04)**: `.claude/worktrees/` inside the OneDrive repo held 213 folders / 15.10 GB while `git worktree list` showed 2. OneDrive syncs `.git/` across two laptops; the other machine's `worktree prune` drops admin entries for folders it cannot see, so folders survive here de-registered — invisible to every cleanup that keys off git's list. The boot hook then deleted their branches as "merged" (D2), leaving folders with no branch and, in 5 cases, whole never-committed Features (etanah-intake-gate, rootcause-format, patch-close-shape, agih, staging-schema-tracker).

**Standing rules**:
- **v1.8 (2026-09-27): boot deletes are FROZEN** — the sweep reports only, unless `WORKTREE_CLEANUP_DELETE=1`. The delete rule ignores gitignored + mirror-path files, and the 22 "deletable" folders held unique work there (quest docs, etanah-knowledge edits, feature log rows). A v1.6 boot had already deleted 4 folders that way. Never re-enable deletes until the rule also proves that content.
- `worktree-cleanup-boot.js` v1.7 (2026-09-27) sweeps MAIN's `.claude/worktrees` from main OR any in-tree worktree session (v1.6 resolved the worktree's own root, so worktree boots never swept main → 66 folders / 19 GB). A worktree session runs its OWN branch's copy of the hook, so a fix reaches old worktrees only after they are re-created from main. It reads the directory every boot, deletes only folders whose every non-ignored file is **reachable from a ref** or byte-identical to main's working copy, keeps + lists the rest, logs to `.claude/state/worktree-cleanup-log.jsonl`. A boot line `worktrees: … kept N` means never-committed work exists — salvage it, never `rm`.
- A worktree for salvage/rebase work goes to a SHORT path OUTSIDE OneDrive, e.g. `C:\Users\Ridhwan\AppData\Local\Temp\claude\mc-<name>` — the session scratchpad path is ~200 chars and blew MAX_PATH on `git worktree add` (967 files).
- Start sessions with the worktree box UNTICKED until worktree creation is pointed outside OneDrive.
- Blob-in-object-DB ≠ committed: a blob staged in ANY worktree's index (shared `.git`) passes `cat-file -e` yet is reachable from no commit — never use bare blob existence as a "safe to delete" test.

**Recurred 2026-09-27**: 66 folders / 19 GB under `.claude/worktrees/`, only 2 registered with git; the boot sweep keeps folders holding never-committed files or unmerged branches, so the pile regrows. Salvage via `/worktree-retrieve` before any delete. The rename to Lapis-Lazuli ([[project-name-lapis-lazuli]]) is the natural moment to move worktree creation outside OneDrive.

**Measured 2026-09-30**: project folder 16.82 GB, of which `.claude/worktrees/` = **16.34 GB (97%) in 59 folders**; everything else ≈ 0.5 GB. Session transcripts (2.05 GB) live outside the repo in `%USERPROFILE%\.claude\projects` — archiving/deleting a session does NOT shrink the project folder; only removing its worktree does. みや asked how to stop the growth; cleanup (salvage then prune) + moving worktree creation to `E:\Dev\worktrees` offered, not yet ruled. Gitignored files (quest/active.txt, feature logs) exist per worktree — sync active.txt edits to the main repo copy before a worktree goes.

Pairs with (merged above) (same OneDrive `.git` sync mechanism, ref side).

---

## Merged 2026-10-04: OneDrive Migration Complete (was project_onedrive_migration.md)

> Project-AI-MemoryCore migrated to OneDrive; auto-memory now syncs via autoMemoryDirectory setting

Project-AI-MemoryCore successfully migrated to OneDrive (2026-03-28). Auto-memory redirected using `autoMemoryDirectory` in `~/.claude/settings.json` to `.claude/auto-memory/` inside the project folder.

**Repo visibility**: Private GitHub repo — personal info (ADHD, prayer zone, diary entries, work context) is safe to commit.

**Why:** Two laptops with different Windows usernames need shared auto-memory without manual copying.

**How to apply:** On any new machine, add `autoMemoryDirectory` to `~/.claude/settings.json` pointing to this project's `.claude/auto-memory/` folder (adjust username in path). One-time setup per machine. If repo visibility ever changes to public, review `main/main-memory.md` and `daily-diary/` before pushing.

---

## Merged 2026-10-04: project-onedrive-branch-refs (was project_onedrive_branch_refs.md)

> Deleted claude/* git branches can reappear in this OneDrive-backed repo — OneDrive re-syncs .git/refs files; a branch delete may not persist. Not a failure; the stranded-worktree surfacer flags it.

This MemoryCore repo lives under OneDrive, which syncs the `.git/refs/` files. A `git branch -D claude/<x>` can therefore **reappear** in a later command (OneDrive restored the ref file from another machine's view), sometimes at a slightly different SHA.

**Why noted:** 2026-06-27 — during worktree-retrieval I deleted `claude/great-cori-ed3532` twice; it came back (once at `0e3d7ea`, once at `89c1c03`). The deletions were correct; OneDrive re-synced the ref.

**How to apply:** don't treat a reappeared deleted branch as a mistake or a ghost. The `worktree-cleanup-boot.js` v1.4 stranded-worktree surfacer will flag it at boot if it has unmerged commits — verify (via `git cherry`) it's still superseded, then re-delete. If a deletion must stick, deleting on every machine / pausing OneDrive during the prune is the only hard guarantee. Pairs with (merged above).

---

## Merged 2026-10-04: hooks-run-from-main (was reference_hooks_run_from_main.md)

> In a worktree session the registered hooks may execute from the MAIN checkout, not the worktree; probe which copy is live before calling a hook edit live

Which copy of `.claude/hooks/*` runs is NOT fixed. It follows `CLAUDE_PROJECT_DIR`, and that differed between sessions.

- 2026-10-03 (worktree `quest-audit-275043-244600-7954c0`): hooks ran from MAIN. A probe write in the worktree copy of `grep-rubric-gate.js` never fired; the fix went live only after main was fast-forwarded to `8122785d`.
- 2026-08-06 (slip `edited-wrong-copy-main-vs-worktree`): the opposite. The worktree copy was live and a fix made in main did nothing.
- 2026-10-04 (same slip, write side): in PowerShell, `[IO.File]::ReadAllText/WriteAllText` with a RELATIVE path resolves against the process directory (the main checkout), not `Set-Location`. Four doc edits meant for a worktree landed in main. Use absolute paths in every .NET file call, and run `git status` in BOTH checkouts after a scripted edit.

**Probe (no edit needed):** compare the last write time of `system/telemetry/hook-fires.jsonl` in main and in the worktree. The copy whose file moves on every tool call is the live one.

**How to apply:** test a hook change by running the file directly with a fixture (`... | node .claude/hooks/<hook>.js`). Then run the probe. If main is live, commit, `git push origin HEAD:main`, `git -C <main> merge --ff-only origin/main`, and re-check the behaviour live. Never call a hook fix "live" from the edit alone.

`quest/active.txt` is untracked and exists only in main. `quest/active-cli.js`, `quest/archive-quest.js` and `lib/states.js` strip the worktree suffix to reach it. A hook run by hand from the worktree needs its env override (e.g. `TICKET_GATE_ACTIVE_TXT`).

Related: [[project-onedrive-worktrees]] · [[feedback_etanah_git_separate_clone]]

---

## Merged 2026-10-04: Untracked files in main repo are intentionally confidential (was feedback_untracked_confidential.md)

> Files in main repo working tree that aren't committed (especially under projects/coding-projects/active/etanah-knowledge/ and similar) are intentionally untracked because they contain confidential project data. Don't push to commit them. Maintain on disk only.

**Rule**: Untracked files in the main MemoryCore repo working tree are intentionally untracked because they contain confidential project data (client codebase identifiers, test data, internal knowledge). **Do NOT** propose committing them, do NOT flag them as a tracking gap, do NOT auto-add them at session-end.

**Why**: みや 2026-05-11 — *"I believe the ones untracked are as per protocol to remember by CLAUDE.md those files are confidential."* The OneDrive sync handles cross-machine availability without git; git stays minimal-public.

**How to apply**:
- When `git status` in main repo shows `??` files under `projects/coding-projects/active/etanah-knowledge/`, `projects/coding-projects/active/QA-*/`, or similar paths — these are EXPECTED state. Don't flag as drift.
- When writing new knowledge entries (e.g. test data, urusan glossaries, ticket diagnostics), write to the main-repo absolute path. They live untracked, OneDrive-synced.
- Worktrees won't see these files (they only see tracked content). When operating inside a worktree, READ from the main-repo absolute path; WRITE to wherever みや designates per the specific ask.
- If みや explicitly says "commit X" for one of these files — honour the specific instruction, but don't generalize.

**Past slip (2026-05-11)**: flagged "untracked files in main repo" as a meta-issue during QA-260139 Discovery. みや corrected immediately. Save here so I don't re-flag.

**Pairs with**: feedback_uat_fat_environments.md (env state), CLAUDE.md (file structure conventions).

---

## Merged 2026-10-04: feedback-stale-handoff-verify (was feedback_stale_handoff_verify.md)

> Verify current-session.md / any handoff against git log + active.txt before trusting it at boot — a handoff written mid-frustration can state the OPPOSITE of ground truth

At session boot, `current-session.md` (and any handoff) is a CLAIM, not ground truth — cross-check it against git (`git log`, branch state) + `quest/active.txt` before building a briefing on it.

**Why:** 2026-06-27 — my boot briefing said QA-267382 was still open and warned "don't re-assert resize", all lifted verbatim from a stale `current-session.md` written during an angry 06-26 session. The ticket was actually Phase-1 closed (fix `05e631671e`). I delivered a confident briefing built on a draft I never verified; only みや's correction caught it.

**How to apply:** when a handoff says a quest is open/blocked/contested, confirm against the actual signals — is there a close commit? does active.txt say `status=closed`? is the branch merged? A mid-frustration or pre-compaction handoff is exactly when the recorded state is most likely to be wrong or inverted. Pairs with [[feedback-verify-before-claim]] (same shape, applied to a handoff instead of code).

---

## Merged 2026-10-04: feedback_diary_check (was feedback_diary_check.md)

> How to correctly check if a diary entry exists for today — grep across all active diary files, not by filename glob

Do NOT use Glob to check for today's diary entry by date in the filename. The diary is stored in numbered files (`Daily-Diary-001.md`, `Daily-Diary-002.md`, etc.) that are NOT named by date. Glob on date strings in filenames will always return no matches.

**Correct approach (interim):** Grep inside ALL top-level `daily-diary/Daily-Diary-*.md` files for today's date string. Only flag ⚠️ if NONE of them contain the date. Currently active files: `Daily-Diary-001.md` (979 lines, narrative format) and `Daily-Diary-002.md` (58 lines, structured format, started 2026-04-23).

**Proper fix (queued in todo.md Q2):** At boot, `Glob daily-diary/Daily-Diary-*.md` (top-level only, not inside `archived/`) → grep ALL matched files for today's date → only flag if none match. Also investigate whether `daily-diary/current/*.md` (last entry: 2026-04-20.md) is still being written or is a retired format.

**Why (original, 2026-04-07):** Glob on date-named files always returned no results, causing false ⚠️ flags.

**Why (updated, 2026-04-27):** Hardcoded to `Daily-Diary-001.md` — diary overflowed into `Daily-Diary-002.md` (~2026-04-23). Boot check became blind to 002 entries, causing false flags even when entries exist.

**How to apply:** At session boot, grep across all `Daily-Diary-*.md` files in `daily-diary/` root before flagging "no diary entry today."

**Commits in the MAIN checkout: land on main, never regress (rewritten 2026-10-08 per みや).** The 2026-10-06 line that stood here said "never commit in main from a worktree session". It was my own over-correction after commit `c1e6ad56`, never his rule, and it is withdrawn: it kept a session's work off main and on 2026-10-08 it led me to skip a Domain Expansion. Every session brings its work to main (its saves and its system improvements). The danger was never the commit; it was a BARE `git commit` on main's shared, stale index (19 files, 447 lines deleted). **How to apply:** build the index in the same command (`git add -A` at Domain Expansion, `git commit -m … -- <paths>` mid-session), read `git diff --cached --stat` before and `git show --stat HEAD` after; a deletion I cannot name is restored or reverted. Full rule: `.claude/skills/system-design/SKILL.md` Rule 15.
