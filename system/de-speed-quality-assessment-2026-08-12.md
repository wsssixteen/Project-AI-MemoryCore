# Domain Expansion — Speed & Quality Assessment (2026-08-12)

> Written at みや's request after this session's DE. Evidence = THIS DE run.

## Observed this DE (concrete)

This DE's commit/push took **~10 git attempts across 3 pull-merge rounds with 2 command timeouts** — nearly all of it fighting merge conflicts, not doing save work. Root cause: **three separate sessions ran on 2026-08-12** (QA-265537, QA-274532, QA-273921), and every one appends to the SAME shared files at DE close. Git treats concurrent appends as content conflicts.

| Conflict file | Nature | Why it conflicted |
|---|---|---|
| `system/slips.jsonl` | append-only ledger | every session logs slips/proposals |
| `system/slip-counts.jsonl` | append-only rollup | ditto |
| `system/slip-dashboard.md` | **generated** from slips.jsonl | regenerated per session |
| `main/session-archive.md` | append-only (trim overflow) | every trim appends |
| `quest/active.txt` | structured blocks | different quests touched |
| `daily-diary/current/<day>.md` | per-DAY narrative | N sessions → 1 file |

## Root causes → fixes

### 1. SPEED — append-ledgers line-conflict (biggest cost). FIX IMPLEMENTED.
`.gitattributes` `merge=union` on the append-only ledgers → git auto-concatenates both sides, **zero conflict, zero manual resolution**. Applied this session to `slips.jsonl`, `slip-counts.jsonl`, `session-archive.md`. The generated `slip-dashboard.md` is marked to regenerate post-merge (its content is derivable, never hand-merge it). Expected effect: the 3 pull rounds collapse to a clean auto-merge.

### 2. SPEED — never `grep -rl <pat> .` over the whole repo in DE. FIX = discipline.
One marker-sweep `grep -rl "^<<<<<<<" .` scanned `.git` + confidential + node_modules and **timed out at 2 min**. Target named files only (`git diff --name-only --diff-filter=U`), never the tree.

### 3. SPEED — minimise the concurrent window. PROPOSAL.
Do ALL content saves first, then run **fetch → merge → push as ONE tight terminal sequence at the very end**. The longer the gap between the local commit and the push, the more likely another session lands and forces a re-pull (happened twice today). DE step 10 should be the last thing, done fast.

### 4. QUALITY — union is safe for ledgers, NOT for structured/narrative files.
- `active.txt` union can **duplicate a quest block** if two sessions touch the same quest → keep it a manual/careful merge, add a dedupe scan. (Not unioned via gitattributes.)
- Diary is a per-day narrative → union produces garbage; it needs **manual session-renumber** (Session 2 vs Session 3 collision today). Cost accepted; a per-session diary-fragment compiled at day-close would remove it (deferred proposal).
- `slip-dashboard.md`: always **regenerate** from the merged `slips.jsonl` (`node core/slips.js dashboard`) — never trust a hand-merged generated file.

## Net
The single highest-leverage fix is the `.gitattributes merge=union` driver (done). It removes the dominant DE-close cost with no quality loss (ledgers are order-independent appends). Diary renumber and active.txt dedupe remain manual by nature; the discipline fixes (#2, #3) are free.
