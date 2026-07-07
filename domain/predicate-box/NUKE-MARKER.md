# NUKE-MARKER — predicate-box

> One-file rollback recipe per `/system-design` Rule 9 (added 2026-07-07). Auto-removes at Domain Expansion once retire-conditions hold.

| Field | Value |
|---|---|
| Created | 2026-07-07 |
| Session | Familiar-built batch (commit `2750811`). Root symptom: みや 2026-07-07 — *"checks must ALWAYS fire when I ask to apply fix or implement etanah code, even outside quests"*; recon found the v1 gate silently dark without `status=active`. v2 = quest-gate REMOVED + advisory PROMOTED to `decision:block`; firing scope = etanah edit + fix-intent in last user message; `stop_hook_active` guard. |
| Files | (a) `domain/predicate-box/predicate-box.discipline.hook.js` (Stop hook, v2 blocking) · (b) `domain/predicate-box/eval.js` (7/7 fixtures) · (c) `domain/predicate-box/README.md` (contract) · (d) `domain/predicate-box/log.jsonl` (fire log) · (e) `.claude/settings.json` `Stop` array entry pointing to hook · (f) `meta/system-architecture.md` §3.18 row · (g) DELETED legacy `.claude/hooks/predicate-box-gate.js` (v1, advisory + quest-gated) |
| Rollback | See block below |
| Retire | 2026-08-06 (Created + 30 days). Remove this file at DE if `domain/predicate-box/log.jsonl` shows ≥ 1 fire in the window AND no rollback event. |

## Rollback block

Run from repo root. Remove the hook registration first so no new fires happen while the folder is being deleted.

```bash
# 1. Remove the Stop-hook registration from .claude/settings.json
#    (delete the entry from the "Stop" array:
#      { "type": "command",
#        "command": "node \"${CLAUDE_PROJECT_DIR}\\domain\\predicate-box\\predicate-box.discipline.hook.js\"" })

# 2. Delete the Feature folder
rm -rf domain/predicate-box/

# 3. (Optional) Restore the v1 advisory quest-gated hook if the block-promotion was the mistake
git show 2750811^:.claude/hooks/predicate-box-gate.js > .claude/hooks/predicate-box-gate.js
#    then re-add the old registration under the "Stop" array:
#      "node \"${CLAUDE_PROJECT_DIR}\\.claude\\hooks\\predicate-box-gate.js\""

# 4. DO NOT blind git revert 2750811 — it is a SHARED ship commit carrying 4 Features
#    (logic-blast-radius + predicate-box + convention-check-gate + quest-phase-gate)
#    plus settings.json + meta/system-architecture.md edits. Inspect first:
git show 2750811 --stat
# Only revert if ALL FOUR Features are being nuked together.

# 5. Push
git push origin main
```

## What each file does

| File | Purpose | Blast radius if kept broken |
|---|---|---|
| `predicate-box.discipline.hook.js` | Stop hook — HARD-BLOCKS ending a turn after an etanah code edit with fix-intent unless an ASSUMPTION/FALSIFIER (predicate) box was emitted; `stop_hook_active` recursion guard | Blocks Ruri's turn until she emits the box — worst case: false-positive blocks on non-fix etanah edits (recursion guard prevents infinite block) |
| `eval.js` | 7/7 fixture eval | No runtime effect — safe to keep even if hook is nuked |
| `README.md` | Feature contract | No runtime effect |
| `log.jsonl` | Fire history (blocked / passed / bypassed) | No runtime effect — retirement evidence |
| `.claude/settings.json` entry | Registers the hook | THE trigger point — remove this and the hook is dormant even if files remain |

## Trust ledger

- [ ] Fired ≥ 1× in `log.jsonl` (auto-verified at DE)
- [ ] 30 days elapsed since Created (2026-08-06)
- [ ] No rollback event on ship commit `2750811`

When all three hold at Domain Expansion, this file is deleted and the Feature graduates to trusted status.
