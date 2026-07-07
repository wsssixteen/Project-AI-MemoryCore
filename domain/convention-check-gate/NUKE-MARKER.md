# NUKE-MARKER — convention-check-gate

> One-file rollback recipe per `/system-design` Rule 9 (added 2026-07-07). Auto-removes at Domain Expansion once retire-conditions hold.

| Field | Value |
|---|---|
| Created | 2026-07-07 (MIGRATED — v1.5 behavior byte-preserved; hook itself shipped 2026-06-20 at `.claude/hooks/convention-check-gate.js`) |
| Session | Familiar-built batch (commit `2750811`). Migration to `domain/` per trinity convention + first-ever eval; only code change is the log path (now `log.jsonl` beside the hook). Legacy log stays at `.claude/hooks/`. |
| Files | (a) `domain/convention-check-gate/convention-check-gate.gate.hook.js` (git-renamed from `.claude/hooks/convention-check-gate.js`, v1.5 behavior) · (b) `domain/convention-check-gate/eval.js` (5/5 fixtures, first-ever) · (c) `domain/convention-check-gate/README.md` (contract) · (d) `domain/convention-check-gate/log.jsonl` (auto-created on first fire) · (e) `.claude/settings.json` DUAL registration — PreToolUse `Bash` entry + PreToolUse `Edit\|Write` entry, both pointing to hook · (f) `meta/system-architecture.md` §3.18 row |
| Rollback | See block below |
| Retire | 2026-08-06 (Created + 30 days). Remove this file at DE if `domain/convention-check-gate/log.jsonl` shows ≥ 1 fire in the window AND no rollback event. |

## Rollback block

Run from repo root. Remove BOTH hook registrations first so no new fires happen while the folder is being deleted. NOTE: this Feature is a MIGRATION of a working v1.5 gate — nuking the folder without step 3 removes a gate that predates this batch.

```bash
# 1. Remove BOTH PreToolUse registrations from .claude/settings.json
#    (delete this entry from matcher "Bash" AND from matcher "Edit|Write":
#      { "type": "command",
#        "command": "node \"${CLAUDE_PROJECT_DIR}\\domain\\convention-check-gate\\convention-check-gate.gate.hook.js\"" })

# 2. Delete the Feature folder
rm -rf domain/convention-check-gate/

# 3. RESTORE the pre-migration v1.5 hook (recommended — the gate itself was trusted before this batch)
git show 2750811^:.claude/hooks/convention-check-gate.js > .claude/hooks/convention-check-gate.js
#    then re-add the old registration to BOTH matchers (Bash + Edit|Write):
#      "node \"${CLAUDE_PROJECT_DIR}\\.claude\\hooks\\convention-check-gate.js\""

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
| `convention-check-gate.gate.hook.js` | PreToolUse gate (Bash + Edit\|Write) — blocks a new-Java-code Edit/commit without an analog-citation (working sibling `file:line`); v1.5 behavior byte-preserved from the legacy hook | Blocks etanah Java edits/commits until an analog is cited — worst case: false-positive blocks (same risk profile as the trusted v1.5) |
| `eval.js` | 5/5 fixture eval (first-ever for this gate) | No runtime effect — safe to keep even if hook is nuked |
| `README.md` | Feature contract | No runtime effect |
| `.claude/settings.json` entries (×2) | Register the hook on Bash AND Edit\|Write | THE trigger points — remove BOTH or the hook still fires on one surface |

## Trust ledger

- [ ] Fired ≥ 1× in `log.jsonl` (auto-verified at DE)
- [ ] 30 days elapsed since Created (2026-08-06)
- [ ] No rollback event on ship commit `2750811`

When all three hold at Domain Expansion, this file is deleted and the Feature graduates to trusted status.
