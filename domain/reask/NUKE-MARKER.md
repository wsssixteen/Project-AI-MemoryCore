# NUKE-MARKER — reask

> Per `/system-design` Rule 9. Auto-removes at Domain Expansion once retire-conditions hold.

| Field | Value |
|---|---|
| Created | 2026-07-14 |
| Session | みや in-session ask 2026-07-14: "I want to create something like a slip-log but for when every time I had to ask you to explain again". Root symptom = reply-clarity failures where the answer was IN the reply but みや still had to ask. |
| Files | (a) `domain/reask/reask.check.hook.js` (UserPromptSubmit check, born via forge) · (b) `domain/reask/reask.eval.js` (10-fixture replay eval) · (c) `domain/reask/README.md` (contract) · (d) `domain/reask/log.jsonl` (auto-created on first fire) · (e) `.claude/settings.json` UserPromptSubmit entry · (f) `system/registry.jsonl` line for "reask" |
| Rollback | See block below |
| Retire | 2026-08-13 (Created + 30 days). Remove this file at DE if `domain/reask/log.jsonl` shows ≥ 1 fire AND no rollback event on the ship commit. |

## Rollback block

```bash
# 1. Delete the Feature folder
rm -rf domain/reask/

# 2. Unregister from .claude/settings.json — delete the entry:
#    { "type": "command",
#      "command": "node \"${CLAUDE_PROJECT_DIR}\\domain\\reask\\reask.check.hook.js\"" }
#    from the "UserPromptSubmit" > first "hooks" array.

# 3. Remove the registry line
grep -v '"name":"reask"' system/registry.jsonl > system/registry.jsonl.tmp && mv system/registry.jsonl.tmp system/registry.jsonl

# 4. (Optional) Purge reask/* slip entries already logged
grep -v '"reask/' system/slips.jsonl > system/slips.jsonl.tmp && mv system/slips.jsonl.tmp system/slips.jsonl
node core/slips.js dashboard  # regenerate

# 5. Revert the ship commit
git log --oneline | grep -i reask  # find the ship SHA
git revert <SHA>
```

## What each file does

| File | Purpose | Blast radius if kept broken |
|---|---|---|
| `reask.check.hook.js` | UserPromptSubmit check, regex-detects 6 reask categories, emits advisory contextOut | Advisory-only — worst case = noisy additional context (never blocks) |
| `reask.eval.js` | 10-fixture replay eval (6 categories + 2 clean + F1 empty + F2 compound) | No runtime effect |
| `README.md` | Contract | No runtime effect |
| `.claude/settings.json` entry | Registers with harness | THE trigger point — remove to dormant-ize |

## Baseline + target

| Metric | Value |
|---|---|
| Baseline | 0 reask slips logged (Feature didn't exist pre-2026-07-14) |
| Target at 30-day retire check | ≥ 1 fire in `log.jsonl` · ≥ 1 slip entry in `system/slips.jsonl` with `reask/*` category |
| Smoke-test at ship | 10/10 fixtures PASS (verified 2026-07-14) |

## Trust ledger

- [ ] Fired ≥ 1× in `log.jsonl` (auto-verified at DE)
- [ ] 30 days elapsed since Created (2026-08-13)
- [ ] No rollback event on the ship commit

When all three hold at Domain Expansion, this file is deleted and the Feature graduates to trusted status.
