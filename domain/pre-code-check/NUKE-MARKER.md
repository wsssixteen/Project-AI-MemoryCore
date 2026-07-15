# NUKE-MARKER — pre-code-check

> Per `/system-design` Rule 9. Auto-removes at Domain Expansion once retire-conditions hold.

| Field | Value |
|---|---|
| Created | 2026-07-14 |
| Session | みや in-session ask 2026-07-14 during QA-270052: after I skipped convention-check / sibling-check / logic-check twice + shipped a bug-named hardcoded fix, みや demanded a system that ENFORCES pre-code-change discipline before any etanah source Edit. |
| Files | (a) `domain/pre-code-check/pre-code-check.check.hook.js` (PreToolUse Edit/Write hook) · (b) `domain/pre-code-check/pre-code-check.eval.js` (9-fixture eval) · (c) `domain/pre-code-check/log.jsonl` (auto-created) · (d) `.claude/settings.json` PreToolUse Edit\|Write entry · (e) `meta/registry.jsonl` line for "pre-code-check" |
| Rollback | See block below |
| Retire | 2026-08-13 (Created + 30 days). Remove this file at DE if `domain/pre-code-check/log.jsonl` shows ≥ 1 fire in the window AND no rollback event. |

## Rollback

```bash
# 1. Delete the Feature folder
rm -rf domain/pre-code-check/

# 2. Unregister from .claude/settings.json — delete the entry:
#    { "type": "command",
#      "command": "node \"${CLAUDE_PROJECT_DIR}\\domain\\pre-code-check\\pre-code-check.check.hook.js\"" }
#    from the "PreToolUse" > matcher "Edit|Write" > "hooks" array.

# 3. Remove registry line
grep -v '"name":"pre-code-check"' meta/registry.jsonl > meta/registry.jsonl.tmp && mv meta/registry.jsonl.tmp meta/registry.jsonl

# 4. Revert the ship commit
git log --oneline | grep -i "pre-code-check"  # find ship SHA
git revert <SHA>
```

## What each file does

| File | Purpose | Blast radius if broken |
|---|---|---|
| `pre-code-check.check.hook.js` | PreToolUse Edit/Write hook; blocks Edit on etanah `.java`/`.xhtml`/`.docx` paths unless the last assistant turn contains a `CODE-CHECK:` line with all 15 checks ✓ or ✗-with-justification | High if buggy — could block legitimate edits; mitigated by `[skip-pre-code-check: <reason>]` bypass token + fail-safe empty stdin path |
| `pre-code-check.eval.js` | 9-fixture eval (non-etanah allow · etanah no-emit block · full ✓ allow · ✗-justified allow · bare ✗ block · missing-checks block · xhtml block · bypass allow · empty stdin OK) | No runtime effect |
| `.claude/settings.json` entry | Registers with harness | THE trigger — remove to dormant-ize |

## Baseline + target

| Metric | Value |
|---|---|
| Baseline (before ship) | Zero enforcement of pre-code-change checks; scattered rules across 5+ files, bypass rate ~100% under scope pressure |
| Target at 30-day retire | ≥ 1 fire captured in `log.jsonl` blocking an un-emitted Edit; corresponding CODE-CHECK line emitted by Ruri in the same turn showing 15 checks with justifications for any ✗ |
| Smoke-test at ship | 9/9 fixtures PASS (verified 2026-07-14) |

## Trust ledger

- [ ] Fired ≥ 1× in `log.jsonl` (auto-verified at DE)
- [ ] 30 days elapsed since Created (2026-08-13)
- [ ] No rollback event on the ship commit

When all three hold at Domain Expansion, this file is deleted and the Feature graduates to trusted status.
