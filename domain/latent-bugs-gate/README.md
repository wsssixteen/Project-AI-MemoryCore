# latent-bugs-gate

**What fires when**: UserPromptSubmit — ticket signal in prompt (prefixed/bare ticket number, quest-start phrase, redmine-retrieval phrase) — same trigger set as adhoc-register.

**Contract**: read `etanah-knowledge/melaka/LATENT-BUGS.md`, inject every SUSPECT/VERIFIED row before Phase 0 with the compare-and-graduate instruction; warn loudly if the register is missing. Silent when the register has zero open rows.

**Why it exists** (miya 2026-08-23): *"if we do find a bug, we put it into bug list, then it will load during Phase 0 to check if it is a known bug. But we will need to make it deterministic so that it won't go missed."* Sweep-found bugs with no ticket yet are pre-diagnosed future tickets; a prose rule ("check the register") can be skipped, a hook cannot.

**Sibling boundary (inventory decision, forge collision overridden 2026-08-23)**:

| Component | Feeds from | Injection | Shape |
|---|---|---|---|
| `adhoc-register` | BA/colleague asks investigated without a ticket | ALL open rows | Q&A (ask → conclusion) |
| `bug-db` | BUG-BESTIARY (confirmed, resolved tickets) | top-3 by similarity score | scored lookup |
| **`latent-bugs-gate`** | proactive bug-family sweeps (pre-ticket) | ALL SUSPECT/VERIFIED rows | lifecycle SUSPECT → VERIFIED → TICKETED → FIXED / REFUTED |

ALL-rows (not scored top-N) because miya's requirement is deterministic — a similarity ranker can miss; the register stays small because rows graduate out (TICKETED/FIXED/REFUTED are not injected).

**Layer choice (Rule 7)**: hook-only. The procedure ("compare, then graduate the row") is 3 lines carried in the injected text itself — no skill needed. The FEEDER side lives in the sweep runs + quest-bounty Step 3, not here.

**Trigger moment (Rule 8)**: UserPromptSubmit gated on ticket signals — the exact moment a ticket enters the conversation, which is when the comparison is needed. Not SessionStart (would dump rows with no ticket to compare against). Predicate copied verbatim from adhoc-register (proven, no observed false-fire complaints since 2026-07-28).

**Observability**: fires append to `domain/latent-bugs-gate/log.jsonl` — `{ts, action: injected|register-missing|register-unreadable, rows, prompt<=120ch}`.

**state-scoped**: yes — keyed by the hardcoded `melaka` path segment in `REL` (`latent-bugs-gate.check.hook.js`). A second state (Perak) needs its own register file + a state-resolved path; recorded per Rule 11, greppable via `melaka`.

**Adversarial scenarios (Rule 12, enumerated at birth 2026-08-23)**:

| # | Scenario | Verdict |
|---|---|---|
| 1 | bypass token quoted in the hook's OWN injected output next turn | handled — hook scans the incoming prompt only, never a transcript (the 2026-08-21 self-disarm class cannot occur) |
| 2 | malformed / non-JSON stdin | fixture-added (F12) — exits 0 silently |
| 3 | schema-only register (header + separator, zero data rows) | fixture-added (F13) — separator rows never parse as data |
| 4 | register missing (ghost-reference class) | fixture-added (F8) — loud warn, never silent |
| 5 | register unreadable (locked by OneDrive sync) | handled — try/catch emits a hand-check warning |
| 6 | worktree execution (`CLAUDE_PROJECT_DIR` ≠ main repo) | handled — main-repo path resolution copied from adhoc-register; register is gitignored/main-tree-only |
| 7 | bare 5-digit number false-positive (e.g. a luas value "27500") | accepted-risk: same predicate as adhoc-register/ticket-gate; cost = one advisory injection, zero block; silent when register empty |
| 8 | row text containing `|` breaking table parse | accepted-risk: authoring rule — escape pipes in cells (same as every other register); a broken row drops silently, sweep log keeps the source |
| 9 | huge register (100+ open rows) bloating every ticket turn | accepted-risk with guard: lifecycle graduates rows out; if open rows ever exceed ~15 the register itself is the bug — prune at Domain Expansion |
| 10 | two sessions appending rows concurrently (OneDrive conflict copy) | accepted-risk: same exposure as every etanah-knowledge file; conflict copies surface in OneDrive UI; rows are append-only which minimizes merge loss |
| 11 | a row's Status cell carrying both words ("VERIFIED, was SUSPECT") | handled — regex matches either token; still-owed either way |
| 12 | miya asks about a ticket AFTER its row graduated (TICKETED) | fixture-added (F6/F7) — graduated rows silent; bug-db covers confirmed-bug recall |

**Eval**: `latent-bugs-gate.eval.js` — 13 fixtures, 13/13 green at birth (2026-08-23).
