goal_status: draft (derived from registry on 2026-09-06; promote with node lib/goal-backfill.js promote atlas-ship-gate)
symptom: 2026-08-22 Atlas v3.2: synthetic-only verification shipped a page with an invisible modal overlay blocking every real click; miya could not open/use it
goal: BLOCK stop (exit 2) unless etanah_atlas/build/ship_check.json is FRESH for the current etanah_atlas_melaka.html sha256, with smoke=pass and a real headless file:// render recorded; bypass [skip-atlas-ship-gate: reason]
goal_signal: the Stop fire produced: BLOCK stop (exit 2) unless etanah_atlas/build/ship_check.json is FRESH for the c
retention: rotate monthly
# atlas-ship-gate

**What fires when**: Stop — Stop, predicate: session transcript tail shows edits under etanah_atlas/(src|config|lib)

**Contract**: BLOCK stop (exit 2) unless etanah_atlas/build/ship_check.json is FRESH for the current etanah_atlas_melaka.html sha256, with smoke=pass and a real headless file:// render recorded; bypass [skip-atlas-ship-gate: reason]

**Layer choice (Rule 7)**: TODO(forge): hook-only | skill-only | hook+skill — justify.

**Trigger moment (Rule 8)**: TODO(forge): justify this is the LEANEST trigger.

**Observability**: every fire appends to `domain/atlas-ship-gate/log.jsonl` — TODO(forge): state what each line carries so an audit can read the fire history.

**state-scoped**: TODO(forge, Rule 11): `yes, keyed by <X>` | `no, state-agnostic`.

## STATE-SCOPE
state-scoped: no — gate keys on the `etanah_atlas/` folder and its profile-suffixed deliverable; a second state's `etanah_atlas_<state>.html` needs only the ship_check.py HTML constant parameterized (recorded coupling: `lib/ship_check.py` HTML path).

## Adversarial scenarios (Rule 12 — verdicts)
1. Bypass token's placeholder form printed by the gate itself → fixture-added (eval #7 CAUGHT a real backtracking bug at birth; fixed)
2. Real bypass with reason → handled (eval #6)
3. Malformed stdin JSON → fail-open (eval #8)
4. Transcript path missing → fail-open (eval #9)
5. Huge transcript → bounded 400KB tail read (handled by design)
6. Session never touched atlas → no fire (eval #1)
7. Deliverable HTML absent (fresh clone) → fail-open with context note (eval #10)
8. ship_check stale after rebuild → block (eval #4)
9. Recorded smoke=fail → block (eval #5)
10. Worktree vs main root → CLAUDE_PROJECT_DIR-relative paths (handled; eval sandbox proves it)
11. Concurrent session rebuilds HTML mid-check → accepted-risk: last-writer sha wins; gate re-fires next Stop
12. User reversal ("park it") → bypass token is the designed path (eval #6)
