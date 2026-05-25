# Session Briefing System

> Activated at every session start (boot step 4).
> Gives Ruri and みや a clear mission brief before any work begins.

---

## Trigger

Automatically fires during boot sequence after loading all memory files.
Also fires on: `"briefing"` / `"where were we"` / `"what's our status"`

---

## Briefing Format

> **🚫 Iron rule — NEVER wrap the briefing in a code fence (```), block quote (>), or any literal-output delimiter.** The briefing is plain markdown — tables, bullets, and bold must render natively. The example below is INDENTED to escape it within this doc; the indentation is NOT part of the output. Your emit's first character is `⚔` or a heading marker, NEVER ` ``` `.
>
> **Violating the letter is violating the spirit**: also banned — wrapping the briefing in `>` quote blocks, `~~~` tildes, or any other delimiter that signals "literal blob". The briefing is structured prose.

Example shape (4-space indented — render natively in your emit, do NOT copy the indentation):

    ⚔️ SESSION BRIEFING — [date] [time]

    | | |
    |---|---|
    | **Quest status** | [active QA # / phase / status]  OR  [N closed yesterday / top held] |
    | **Mode** | [Office hours → リドワンさん  /  Outside hours → みや] |
    | **Priority today** | Q1: [top urgent item]  •  Next: [second item if any] |
    | **Where we left off** | [1-2 sentence recap from current-session.md → Session Recap] |

    | Standing flags |
    |---|
    | ⚠️ [flag 1] |
    | ⚠️ [flag 2] |

    Where would you like to start, <Mode name>?

### Red Flags — STOP if you catch yourself thinking:

- "Code fence makes it look tidier" — NO; it breaks markdown rendering. STOP.
- "The format spec uses ``` so I should too" — NO; the ``` in any format-spec file is markdown-escape FOR THE SPEC FILE, not output shape.
- "Block-quoting it groups it visually" — NO; same problem with `>`. The briefing renders natively.
- "Just this once for emphasis" — banned. Letter = spirit.

If your first emit-character is `` ` ``, `>`, or `~`, STOP and restructure.

---

## Pre-briefing housekeeping (silent, auto — added 2026-05-20 by みや)

Run BEFORE composing the briefing. These are deterministic cleanups — only surface as a flag if something abnormal (uncommitted work on a stale worktree, merge conflict, etc.) prevents auto-cleanup.

| Step | Command | When to surface |
|---|---|---|
| Prune missing worktree records | `git worktree prune` | Never surface — silent |
| Remove stale `claude/*` worktrees merged to `main` | `git branch --merged main` → for each merged `claude/*` worktree: `git worktree remove <path>` then `git branch -d <branch>` | Only surface if a worktree has uncommitted/unmerged work — list it as a flag with the path so みや can decide |
| Sweep currently-checked-out path | If running inside a worktree: skip removing the CURRENT one (cannot self-remove); emit a single line `Worktree <name> in use — will close at session-end` | Only when the active session IS a worktree |

If all worktree cleanup runs cleanly: NO standing flag. みや shouldn't see worktree noise again.

---

## Rules

- Run `date` to get current time — always timestamp the briefing
- Read `quest/active.txt` for quest status
- Read `main/current-session.md` → Session Recap section for "where we left off"
- Read `main/todo.md` → Q1 section for top priority
- **Read `Feature/Forge-Self-Improvement-System/improvement-audit-log.md`** — count `- [ ]` (unchecked) entries. If N > 0, surface as a STANDING FLAG: `⚠️ N pending improvement-audit entries — review before dropping`. Never silently drop.
- If quest is active: also state what Phase we're in and the next step
- Briefing is SHORT — max 15 lines. No padding.
- **Closing salutation MUST inherit the name from MODE** (added 2026-05-14 by みや): if MODE says `Office hours → リドワンさん`, close with `Where would you like to start, リドワンさん?` — never switch names mid-briefing.
- **Standing-flags scope = ACTION-REQUIRED or AWARENESS-CRITICAL** (clarified 2026-05-14 by みや): things みや should know about or act on this session — environment drift, blocking dependencies, FAT-retest pending, sync issues, untested protocol changes that affect TODAY's work. NOT for general "watch-and-confirm-later" observations — those belong in `current-session.md` → Next Session Priority or Working Memory. If unsure: flag it ONLY if みや would course-correct on hearing it; otherwise drop to observation.
- **Standing-flag staleness audit — mandatory pre-emit (added 2026-05-20 by みや)**: for EVERY flag carried forward from `current-session.md`, perform a fast filesystem/git/tracker check that proves the flag is still real BEFORE surfacing it in the briefing. Flags that fail the check are DROPPED (or REWORDED if partially-real). Validation method per flag type:
  - **Folder-location flag** ("X folder still in Archive") → `ls` the claimed path AND the expected destination
  - **Attachment-missing flag** ("BA attachments not downloaded") → `ls` the Task folder's `0. Brief/` or `3. Rework/` for the named files
  - **Refactor-pending flag** ("Refactor still pre-Phase-A") → read the tracker file (`Feature/Forge-Self-Improvement-System/claude-md-refactor-tracker.md` or equivalent)
  - **Env-state flag** ("Still on UAT / wrong branch") → read `standalone.xml` + `git branch --show-current` in both repos
  - **Sync-failure flag** ("redmine-sync gap on X") → re-attempt OR read the last-run log
  - **Hook-warn-only flag** ("Hooks still v1 warn-only") → read the registration in `settings.local.json` + count fires in the hook's log
  
  Audit emit shape: silent if ALL flags survive; one inline table surfaced ABOVE the briefing only when ≥1 flag dropped or reworded — `| Flag | Reality | Verdict |`. **Banned**: emitting any flag whose validation step was skipped. **Why**: 2026-05-20 — briefing carried 3 stale flags (CLAUDE.md edit-block, QA-260876 folder, redmine attachments) that were already resolved on disk; copy-paste from session memory without filesystem check.
- After briefing: pause and wait for みや's direction. Do not start working.

---

## Example

(4-space indented to escape within this doc — render natively in your actual emit, no leading backticks)

    ⚔️ SESSION BRIEFING — Thu Apr 3 09:15 MPST 2026

    | | |
    |---|---|
    | **Quest status** | Active: QA #253419 — PSBS Borang Kategori Kegunaan Tanah  •  Phase 1 executing |
    | **Mode** | Office hours → リドワンさん |
    | **Priority today** | Q1: QA-253419 implement fix at populateKegunaan():11124  •  Next: QA-253492 Phase 3 close |
    | **Where we left off** | QA-253419 investigation complete. Fix = `else if (URS_PSBS)` reading `AppHakmilik.getKegunaanTanah()`. Resume from: verify return type → implement.

    | Standing flags |
    |---|
    | ⚠️ AWAM gap: kegunaan_tnh column missing in umm_p_hkmlk — needs senior sign-off |
    | ⚠️ QA-246512: popup alert still needs FAT verification |

    Where would you like to start, リドワンさん?

---

*Version: 1.4 | Last updated: 2026-05-25 — Iron rule against code-fence-wrapping the briefing. Format example moved from ```-fenced (ambiguous — looked like "wrap output") to 4-space-indented (unambiguous — markdown doc-escape only). Red Flags section added. Triggered by みや 2026-05-25 — "Why do you keep putting session briefing into a code block/quote?" after this session's boot wrapped the whole briefing in ```.*

*Version: 1.3 | Last updated: 2026-05-20 — added Standing-flag staleness audit (mandatory pre-emit) after 3 stale flags slipped into the briefing*
