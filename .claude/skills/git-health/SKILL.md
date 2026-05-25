---
name: git-health
description: Check git repo health + auto-fix safe issues silently at Quest Phase 0 or on demand. Tier-1 issues (case-collision negative refspec / worktree prune / gc-auto) fixed in background with single-line note. Tier-2 (dirty tree / stash drop / diverged pull) requires みや's nod. Tier-3 (stash list / unpushed / stale fetch) info-only. Completely silent if all clean. Triggers — "check git health", "git health", "/git-health", "is the repo healthy", "before pull", "before push", "is main clean", "branch health".
metadata:
  type: discipline-primitive
  sub-layer: discipline
  meta-layer-INDEX: meta/discipline-INDEX.md
---

# git-health — Pre-flight git repo sanity check with auto-fix

## When this fires

- **Auto** — Quest Phase 0 (after `/env-check`, as next pre-flight step)
- **Manual** — `/git-health` or trigger phrases (see description)
- **Before risky operations** — before `git push`, `git pull --rebase`, or branch switching

## Core principle

**Silent if clean. Single-line note if Ruri fixed something. Prompt if みや needs to decide.** No alarms, no clutter. The whole point is to make みや's between-Quest git work safer without adding overhead.

## The 3-tier safety model

### Tier 1 — Auto-fix silently (background, single-line note if action taken)

Run these as `git` commands; if they reveal a fixable issue, fix it without asking.

| Check | Detection | Auto-fix |
|---|---|---|
| Fetch dry-run failure | `git fetch --prune --dry-run origin 2>&1` returns case-collision error | Identify the colliding ref pair; add negative refspec `^refs/heads/<ref>` via `git config --add remote.origin.fetch` for the variant deemed non-canonical (capital-case typically wins as non-canonical when lowercase exists) |
| Broken worktree metadata | `git worktree list` shows path that doesn't exist | `git worktree prune` |
| Object pack bloat | `git count-objects -v` shows `count > 6700` loose objects | `git gc --auto` |
| Stale local branches | `git branch --merged main` returns branches AND each is NOT `main` / current / has no upstream | List for confirmation (Tier 2) — not auto-delete |

### Tier 2 — Ask みや first (prompt, block until nod)

These can affect work; never auto-fix.

| Check | Detection | Prompt to みや |
|---|---|---|
| Dirty working tree | `git status --short` lists files | "Working tree has N uncommitted changes: [list]. Stash, commit, or revert?" |
| Stash drop | Stashes >30 days old | "Old stashes: [list]. Drop / keep / inspect?" |
| Diverged from origin | `rev-list --left-right --count HEAD...origin/<branch>` shows both >0 | "Branch diverged: N ahead / M behind. Strategy: rebase / merge / discard local?" |
| Stale local branch merged to master, deletion ask | (from Tier 1 detection) | "Merged branches to delete: [list]. Proceed?" |

### Tier 3 — Surface only if relevant (info, no action required)

| Check | Surface threshold |
|---|---|
| Stash count | If >0, list with ages |
| Unpushed commits | If `git log @{u}..HEAD --oneline` returns any |
| Last fetch age | If `.git/FETCH_HEAD` mtime >24h ago |

### Eclipse/EGit compatibility pre-check (lesson from 2026-05-25 reftable miss)

**BEFORE** recommending OR auto-applying any ref-format migration: detect if Eclipse / older EGit / older JGit is in use:

```
which eclipse 2>/dev/null
find ~ -name "eclipse.ini" 2>/dev/null | head -1 | xargs cat 2>/dev/null | head -5
```

If Eclipse detected — **DO NOT recommend `git refs migrate --ref-format=reftable`** even if it would resolve a case-collision. Use the negative-refspec workaround (Tier 1) instead. The reftable format breaks EGit/JGit versions before 6.5 → project shows as `.invalid` in Eclipse.

## Steps

1. **Run all checks in parallel where possible** (single bash call with `&&` / `;` chain to minimize execution time).
2. **For Tier 1**: apply auto-fix immediately. Collect what was fixed.
3. **For Tier 2**: collect issues. Do NOT apply.
4. **For Tier 3**: collect info if relevant; otherwise drop.
5. **Compose output**:
   - **All checks clean + Tier 3 silent** → emit NOTHING (no output at all)
   - **Tier 1 actions taken** → single-line note `git-health: 🛠 fixed <X>` per action
   - **Tier 2 issues** → prompt as numbered list, block for みや decision
   - **Tier 3 surfaces** → fold into existing summary if other output happening; standalone block only if it's the only output

## Output format

When emitting (only when needed — no "all clean" emit):

```
git-health (<repo path>):
  🛠 fixed: <Tier 1 action 1>
  🛠 fixed: <Tier 1 action 2>
  ⚠ pending: <Tier 2 issue 1> — needs your decision
  ℹ info: <Tier 3 surface, if relevant>
```

**Banned**: emitting when everything is clean. **Banned**: alarm-bell formatting when only Tier 3 info matters.

## Integration with Quest workflow

At Quest Phase 0:
- `/env-check` runs first (etanahv3 + standalone.xml + branch)
- `/git-health` runs second (this skill)
- If Tier 2 issues surface → Quest accept paused until みや resolves
- If Tier 1 only → quiet note in Phase 0 summary; Quest continues

## Lifecycle

- v1: confirmation required on Tier 1 auto-fix during first 3 cycles (per system-design v1.1 Step 5b). After ≥3 successful auto-fix cycles + みや explicit approval → v2 truly silent.
- v1 emits a one-line confirm prompt: `git-health: about to fix X (Tier 1 auto-safe). Proceed? [y/skip]` — UNTIL v2 candidacy.

## What this skill does NOT do

- Does NOT auto-commit / auto-push / auto-merge anything
- Does NOT auto-delete branches (always Tier 2 prompt)
- Does NOT touch working-tree files
- Does NOT migrate ref-format (Eclipse pre-check makes this explicit)
- Does NOT emit when everything is clean

## Cross-references

- `library-items/agent-architecture/claude-code-best-practices.md` — Section A (skills) + B (hooks). git-health follows the canonical "small-scoped modular skill" pattern; the Quest Phase 0 trigger lives in the quest workflow protocol, not in this skill.
- `.claude/skills/env-check/SKILL.md` — sibling pre-flight skill (env config); git-health runs after.
- `Feature/Domain-Expansion/expansion-protocol.md` — DE Step 11 worktree cleanup overlaps; git-health detects but defers worktree-remove to Tier 2 (DE Step 11 handles the actual remove).
- Past incidents: 2026-05-25 case-collision (`sgr/eSokonganCR` vs `sgr/esokonganCR`) — Tier 1 would have caught + fixed. Reftable migration that broke Eclipse — Eclipse pre-check now blocks this exact recovery path.

---

*Version: 1.0 | Last updated: 2026-05-25 — built per Design Memo applied via system-design v1.1. v1 confirmation discipline: Tier 1 auto-fix prompts a one-line confirm for first 3 cycles before going truly silent. Eclipse pre-check encoded from 2026-05-25 lesson.*
