# NUKE-MARKER — logic-blast-radius

> One-file rollback recipe per `/system-design` Rule 9 (added 2026-07-07). Auto-removes at Domain Expansion once retire-conditions hold.

| Field | Value |
|---|---|
| Created | 2026-07-07 |
| Session | Familiar-built batch (commit `2750811`). Root symptom: みや 2026-07-07 — *"checks must ALWAYS fire when I ask to apply fix or implement etanah code, even outside quests"*; recon found the v1 gate silently dark without `status=active`. v2 = quest-gate REMOVED — fires on ANY stateful-flow etanah .java Edit. |
| Files | (a) `domain/logic-blast-radius/logic-blast-radius.discipline.hook.js` (PreToolUse Edit\|Write hook, v2) · (b) `domain/logic-blast-radius/eval.js` (6/6 fixtures) · (c) `domain/logic-blast-radius/README.md` (contract) · (d) `domain/logic-blast-radius/log.jsonl` (auto-created on first fire) · (e) `.claude/settings.json` PreToolUse `Edit\|Write` entry pointing to hook · (f) `system/system-architecture.md` §3.18 row · (g) DELETED legacy `.claude/hooks/logic-blast-radius-gate.js` (v1, quest-gated) |
| Rollback | See block below |
| Retire | 2026-08-06 (Created + 30 days). Remove this file at DE if `domain/logic-blast-radius/log.jsonl` shows ≥ 1 fire in the window AND no rollback event. |

## Rollback block

Run from repo root. Remove the hook registration first so no new fires happen while the folder is being deleted.

```bash
# 1. Remove the PreToolUse registration from .claude/settings.json
#    (delete the entry under "PreToolUse" -> matcher "Edit|Write":
#      { "type": "command",
#        "command": "node \"${CLAUDE_PROJECT_DIR}\\domain\\logic-blast-radius\\logic-blast-radius.discipline.hook.js\"" })

# 2. Delete the Feature folder
rm -rf domain/logic-blast-radius/

# 3. (Optional) Restore the v1 quest-gated hook if the quest-independence promotion was the mistake
git show 2750811^:.claude/hooks/logic-blast-radius-gate.js > .claude/hooks/logic-blast-radius-gate.js
#    then re-add the old registration under PreToolUse Edit|Write:
#      "node \"${CLAUDE_PROJECT_DIR}\\.claude\\hooks\\logic-blast-radius-gate.js\""

# 4. DO NOT blind git revert 2750811 — it is a SHARED ship commit carrying 4 Features
#    (logic-blast-radius + predicate-box + convention-check-gate + quest-phase-gate)
#    plus settings.json + system/system-architecture.md edits. Inspect first:
git show 2750811 --stat
# Only revert if ALL FOUR Features are being nuked together.

# 5. Push
git push origin main
```

## What each file does

| File | Purpose | Blast radius if kept broken |
|---|---|---|
| `logic-blast-radius.discipline.hook.js` | PreToolUse gate — HARD-BLOCKS an Edit to a stateful-flow etanah .java file (Form/Bean/Handler/Helper/Service/Controller/Manager) until the blast-radius banner (state × trigger matrix) appears in-session; quest-independent v2 | Blocks etanah .java edits until the banner is emitted — worst case: false-positive blocks on non-stateful files |
| `eval.js` | 6/6 fixture eval | No runtime effect — safe to keep even if hook is nuked |
| `README.md` | Feature contract | No runtime effect |
| `.claude/settings.json` entry | Registers the hook | THE trigger point — remove this and the hook is dormant even if files remain |

## Trust ledger

- [ ] Fired ≥ 1× in `log.jsonl` (auto-verified at DE)
- [ ] 30 days elapsed since Created (2026-08-06)
- [ ] No rollback event on ship commit `2750811`

When all three hold at Domain Expansion, this file is deleted and the Feature graduates to trusted status.
