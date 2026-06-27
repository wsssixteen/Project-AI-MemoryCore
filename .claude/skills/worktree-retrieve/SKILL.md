---
name: worktree-retrieve
description: Survey unmerged claude/* worktree branches, salvage genuinely-stranded work into main, prune superseded branches. The ACT side of the stranded-worktree gap (worktree-cleanup-boot.js surfacer is the DETECT side). Triggers — "/worktree-retrieve", "retrieve worktree updates", "retrieve all worktrees", "check the other worktrees", "salvage stranded branches", "what's not on main", "unmerged branch work", boot stderr "STRANDED WORKTREE WORK". Use when session-branches may hold quest closes / built hooks / docs that never reached main.
metadata:
  type: operational-primitive
  sub-layer: discipline
  pairs-with: .claude/hooks/worktree-cleanup-boot.js (v1.4 surfacer)
---

# /worktree-retrieve — salvage stranded worktree work into main

**Why this exists:** session worktrees are auto-removed when merged, but UNMERGED branches strand. QA-267382's Phase-1 close + 3 built Powers sat unretrieved for days across 6 branches because main moved on and nobody surfaced them. This skill is the repeatable retrieval the manual scramble taught.

## The loop — Survey → Classify → Salvage → Prune

### 1. Survey (enumerate + patch-level status)
```
git worktree list
git for-each-ref --sort=-committerdate refs/heads --format='%(refname:short) | %(committerdate:iso8601) | %(subject)'
git branch --no-merged main
```
Then per candidate branch, the **decisive** check:
```
git cherry -v main <branch>        # "+" = commit NOT on main by patch-id · "-" = equivalent already on main
```

> 🚫 **DO NOT trust `git diff main..<branch>`** — big deletions there usually mean the branch is *behind* main (main advanced), NOT that it holds unique deletions. `git cherry` is the truth; `git diff` misleads.

### 2. Classify each branch
| Verdict | Signal | Action |
|---|---|---|
| **Stranded-unique** | `git cherry` shows `+` commits AND its NEW files are absent from main | salvage (step 3) |
| **Already-on-main** | `git cherry` shows only `-` | delete branch |
| **Superseded** | unique commit's fix was reverted/replaced or its ticket closed on main | delete branch |

Confirm "NEW files absent from main" before deciding:
```
git show <commit> --stat --diff-filter=A          # what files the commit ADDS
git cat-file -e main:<path> 2>/dev/null && echo ON-MAIN || echo MISSING
```

### 3. Salvage (bring unique work to main) — work in the MAIN worktree
- **Clean files (main untouched since merge-base):** `git checkout <branch> -- <path>` then verify with `git log <merge-base>..main -- <path>` (empty = clean apply, zero conflict).
- **New artifact dirs (hooks/Powers/docs):** `git checkout <branch> -- domain/<x>` — purely additive.
- **Conflicting state files (active.txt, current-session.md):** edit by hand — keep the AUTHORITATIVE final state (a `status=closed` block REPLACES the in-progress one; don't append a duplicate).
- **Live hooks** brought as files: do NOT register in settings.json without an overlap-eval + みや nod (registration changes every-turn behaviour).
- Stage all wanted paths (per commit-scope rule: every modified path staged or explained), commit, `git push origin main`.

### 4. Prune (content-guarded)
- Delete ONLY branches verified already-on-main or superseded: `git branch -D <branch>` (`-D` not `-d` — git sees them as unmerged by SHA even when merged-by-content).
- **Content-guard before every `-D`:** confirm its unique commits add no NEW non-log file that's missing from main. Never delete on a commit-message guess.
- Keep any branch still holding live multi-session work (e.g. an in-flight Requirement).

## Gotchas (learned 2026-06-27)
- `git show <branch>:<path>` mangles under MSYS (colon→`;`, `/`→`\`) — use `git show <commit> -- <path>` or `git checkout` instead.
- A removed worktree leaves its branch behind with the commits — survey `git branch`, not just `git worktree list`.
- jsonl log files (`log.jsonl`, `recent-tool-calls.jsonl`, `reply-log.jsonl`) are ephemeral noise — ignore them when reading a commit's real change set.
- Validate `settings.json` with `node -e "JSON.parse(...)"` after any hook-registration edit (a broken file disables ALL hooks).

## Log
Append one line per run to `.claude/state/worktree-retrieve-log.jsonl`: `{ts, branches_surveyed, salvaged[], pruned[], commit}`.
