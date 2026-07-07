# NUKE-MARKER — quest-phase-gate

> One-file rollback recipe per `/system-design` Rule 9 (added 2026-07-07). Auto-removes at Domain Expansion once retire-conditions hold.

| Field | Value |
|---|---|
| Created | 2026-07-07 (MIGRATED — behavior unchanged; hook previously at `.claude/hooks/quest-phase-gate.js`) |
| Session | Familiar-built batch (commit `2750811`). Migration to `domain/` per trinity convention + eval. Quest-gated BY DESIGN (Scout/Recon/Rubric banners are quest artifacts; outside-quest coverage = logic-blast-radius + predicate-box + convention-check-gate). Code changes at migration: `log.jsonl` fire log beside the hook + repo-root resolve via `path.resolve(__dirname,'..','..')` — depth-2 invariant, do NOT nest the folder deeper. |
| Files | (a) `domain/quest-phase-gate/quest-phase-gate.gate.hook.js` (git-renamed from `.claude/hooks/quest-phase-gate.js`) · (b) `domain/quest-phase-gate/eval.js` (5/5 fixtures) · (c) `domain/quest-phase-gate/README.md` (contract) · (d) `domain/quest-phase-gate/log.jsonl` (auto-created on first fire) · (e) `.claude/settings.json` PreToolUse `Edit\|Write` entry pointing to hook · (f) `meta/system-architecture.md` §3.18 row |
| Rollback | See block below |
| Retire | 2026-08-06 (Created + 30 days). Remove this file at DE if `domain/quest-phase-gate/log.jsonl` shows ≥ 1 fire in the window AND no rollback event. |

## Rollback block

Run from repo root. Remove the hook registration first so no new fires happen while the folder is being deleted. NOTE: this Feature is a MIGRATION of a working gate — nuking the folder without step 3 removes a gate that predates this batch.

```bash
# 1. Remove the PreToolUse registration from .claude/settings.json
#    (delete the entry under "PreToolUse" -> matcher "Edit|Write":
#      { "type": "command",
#        "command": "node \"${CLAUDE_PROJECT_DIR}\\domain\\quest-phase-gate\\quest-phase-gate.gate.hook.js\"" })

# 2. Delete the Feature folder
rm -rf domain/quest-phase-gate/

# 3. RESTORE the pre-migration hook (recommended — the gate itself was trusted before this batch)
git show 2750811^:.claude/hooks/quest-phase-gate.js > .claude/hooks/quest-phase-gate.js
#    then re-add the old registration under PreToolUse Edit|Write:
#      "node \"${CLAUDE_PROJECT_DIR}\\.claude\\hooks\\quest-phase-gate.js\""

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
| `quest-phase-gate.gate.hook.js` | PreToolUse gate (Edit\|Write) — during an active quest, BLOCKS a code/template/config Edit until the Scout/Recon/Rubric phase-emit banners exist in-session; quest-gated by design | Blocks quest-time edits until phase emits exist — worst case: false-positive blocks during active quests only (dormant outside quests) |
| `eval.js` | 5/5 fixture eval | No runtime effect — safe to keep even if hook is nuked |
| `README.md` | Feature contract | No runtime effect |
| `.claude/settings.json` entry | Registers the hook | THE trigger point — remove this and the hook is dormant even if files remain |

## Trust ledger

- [ ] Fired ≥ 1× in `log.jsonl` (auto-verified at DE)
- [ ] 30 days elapsed since Created (2026-08-06)
- [ ] No rollback event on ship commit `2750811`

When all three hold at Domain Expansion, this file is deleted and the Feature graduates to trusted status.
