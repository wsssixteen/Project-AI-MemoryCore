---
name: verify-close
description: Programmatic Phase 1 closure verification — 5-step file-state check (commit landed, push succeeded, remote branch exists, repo on main, active.txt updated). Outputs green/red checklist. Eliminates chat-state-vs-file-state drift at closure declaration.
allowed-tools: Bash, Read, Grep
---

# /verify-close — Phase 1 Closure Verification

## What this does

After みや triggers Phase 1 closure ("passed the ticket" / "wrap [ticket]" / "close phase 1"), and after Ruri performs the close-out steps (return-to-main, active.txt update) and asks the STOP gate confirmation — the **verify-close skill** runs 5 programmatic file-state checks and outputs a green/red checklist.

Eliminates chat-state-vs-file-state drift: declared-closure must match actual-closure.

## Trigger phrases

| Phrase | Action |
|---|---|
| Auto-fire after Phase 1 STOP gate response | Verify all 4 checks before declaring "Phase 1 properly closed" |
| `/verify-close <QA-XXX>` | Manual run for any ticket |
| `verify close for QA-X` | Same as above |

## 5-step check procedure

For ticket `QA-<XXX>`, identify the repo (`etanah-pelupusan` or `etanah-awam`) from active.txt's entry, then run:

**Check 1 — Commit landed locally**
```bash
cd <repo> && git log --oneline -1 mlk/qa/<XXX>
```
Expected: returns SHA + subject. Green if non-empty.

**Check 2 — Push succeeded (local = origin)**
```bash
cd <repo> && git fetch origin mlk/qa/<XXX> 2>/dev/null
[ "$(git rev-parse mlk/qa/<XXX>)" = "$(git rev-parse FETCH_HEAD)" ] && echo "MATCH" || echo "DIFF"
```
Expected: `MATCH`. Green if local SHA == origin SHA.

**Check 3 — Remote branch confirmed exists** (added 2026-05-13 per みや — teammates need this to refer to the branch)
```bash
cd <repo> && git ls-remote origin mlk/qa/<XXX>
```
Expected: returns `<SHA>	refs/heads/mlk/qa/<XXX>`. Green if non-empty (separate from Check 2's diff-match — this proves the branch is discoverable by teammates who haven't fetched yet).

**Check 4 — Repo on main + pulled latest**
```bash
cd <repo> && git branch --show-current
```
Expected: `mlk/master` (pelupusan) or `mlk/release/fat` (awam). Then:
```bash
git fetch origin <main-branch> 2>/dev/null
[ "$(git rev-parse <main>)" = "$(git rev-parse FETCH_HEAD)" ] && echo "AT-TIP" || echo "BEHIND"
```
Expected: `AT-TIP`. Green if on main branch + at origin tip.

**Check 5 — `active.txt` entry updated**
```bash
grep -A 5 "^qa=QA-<XXX>" quest/active.txt
```
Expected: entry shows `phase=1-complete` AND `status=pending post-mortem` AND `commit=<SHA>` populated. Green if all 3 fields present.

## Output format

| Check | Status | Details |
|---|---|---|
| 1. Commit landed | ✅ / ⚠️ | <SHA on branch> |
| 2. Push succeeded (local = origin) | ✅ / ⚠️ | local == origin SHA / local ahead by N |
| 3. Remote branch exists | ✅ / ⚠️ | `refs/heads/mlk/qa/<XXX>` discoverable at origin |
| 4. Repo on main + pulled | ✅ / ⚠️ | <branch> @ <SHA>, 0/N commits ahead of origin |
| 5. active.txt entry | ✅ / ⚠️ | phase=1-complete + commit=<SHA> present / missing field X |

Verdict: ✅ Phase 1 fully closed — safe to proceed
   OR
Verdict: ⚠️ N issues — fix before declaring closure: <list>

## When auto-fires

Per `quest/quest-protocol.md` Phase 1 close-out section, the STOP gate goes:
1. Ruri performs Steps 1-4 (return-to-main, pull, verify clean, active.txt update)
2. **Ruri runs `/verify-close <ticket>`** ← new step
3. Ruri outputs verdict + asks: *"Phase 1 closure for QA-X complete (all 4 checks green / N issues). Confirm before I proceed?"*
4. みや answers "yes" or fixes the red checks

## Why this exists (rationale)

2026-05-11 — みや had to ask *"Have we actually closed phase 1 properly?"* after I declared closure based on chat-state without verifying file-state (return-to-main + active.txt update were both missing). The STOP gate alone catches the "did I ask?" failure mode but doesn't catch the "did I lie to myself about completeness?" failure mode. Programmatic verification eliminates both.

## Lifecycle

- **L1 (now)**: skill file exists, manual + auto-trigger at Phase 1 close
- **L2 (after 3 quest cycles)**: refine the 4 checks based on edge cases (e.g. rework-branch case, multi-repo fix case)
- **L3**: integrate into Domain Expansion session-end ritual so any open `pending post-mortem` ticket gets verified at DE-time

---

*Created: 2026-05-11 by Ruri (proposed) + みや (approved). First use: TBD.*
