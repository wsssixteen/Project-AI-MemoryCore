# NUKE-MARKER — stop-point-summary

> One-file rollback recipe per `/system-design` Rule 9 (added 2026-07-07). Auto-removes at Domain Expansion once retire-conditions hold.

| Field | Value |
|---|---|
| Created | 2026-07-06 |
| Session | Background task — recurring "missing end-of-reply summary" slip. Root symptom: 154/618 substantive turns compliant = 24.9% baseline. みや: *"Please also add ALWAYS AT THE END OF A REPLY A FUCKING SUMMARY."* |
| Files | (a) `domain/stop-point-summary/stop-point-summary.discipline.hook.js` (Stop hook) · (b) `domain/stop-point-summary/eval.js` (compliance scanner + 7-case smoke-test) · (c) `domain/stop-point-summary/README.md` (contract) · (d) `domain/stop-point-summary/log.jsonl` (auto-created on first fire) · (e) `.claude/skills/stop-point-summary/SKILL.md` (REFINED — Micro-Summary + banned bypass docs — pre-existing skill) · (f) `.claude/settings.json` `Stop` array entry pointing to hook · (g) `meta/system-architecture.md` §3.5 rows 110-111 (retirement of old + new hook row) · (h) `meta/system-architecture.md` detail row for the hook · (i) `domain/stop-point-todo-table/README.md` retirement tombstone · (j) `Feature/Forge-Self-Improvement-System/skill-failure-log.md` slip row |
| Rollback | See block below |
| Retire | 2026-08-05 (Created + 30 days). Remove this file at DE if `domain/stop-point-summary/log.jsonl` shows ≥ 1 fire in the window AND no rollback event. |

## Rollback block

Run from repo root. Order matters — remove the hook registration first so no new fires happen while the folder is being deleted.

```bash
# 1. Remove the Stop-hook registration from .claude/settings.json
#    (delete the entry:
#      { "type": "command",
#        "command": "node \"${CLAUDE_PROJECT_DIR}\\domain\\stop-point-summary\\stop-point-summary.discipline.hook.js\"" }
#    from the "Stop" array)

# 2. Delete the Feature folder
rm -rf domain/stop-point-summary/

# 3. Restore the old advisory hook registration (optional — only if the retirement was a mistake)
#    Re-add to .claude/settings.json under PostToolUse:
#      { "matcher": "Edit|Write|NotebookEdit",
#        "hooks": [{
#          "type": "command",
#          "command": "node \"${CLAUDE_PROJECT_DIR}\\domain\\stop-point-todo-table\\stop-point-todo-table.discipline.hook.js\""
#        }] }
#    (the hook file itself is still on disk under domain/stop-point-todo-table/)

# 4. Revert the ship commit (this undoes the skill refinement + tombstone + eval + hook file)
git revert 90e961d

# 5. Revert the parallel-swept commit if the shared-file edits also need to go
#    (this touches settings.json + meta/system-architecture.md + skill-failure-log.md —
#     inspect the diff first; other Features may share this commit and you don't want to
#     revert those too)
git show 031f8c6 --stat
# If safe: git revert 031f8c6

# 6. Push
git push origin main
```

## What each file does (so みや knows what he is nuking)

| File | Purpose | Blast radius if kept broken |
|---|---|---|
| `stop-point-summary.discipline.hook.js` | Stop hook that hard-blocks substantive replies without a summary marker | Blocks Ruri's turn until she rewrites — worst case: infinite block if summary detection is broken (recursion guard on `stop_hook_active` prevents true infinite; harness re-injects prompt once) |
| `eval.js` | Compliance scanner + 7-case fixture smoke-test | No runtime effect — safe to keep even if hook is nuked |
| `README.md` | Feature contract | No runtime effect |
| SKILL.md refinement | Micro-Summary variant + banned bypass documentation | Skill content only — no enforcement without the hook |
| `.claude/settings.json` entry | Registers the hook with the harness | THE trigger point — remove this and the hook is dormant even if files remain |
| `meta/system-architecture.md` rows | Catalog documentation | No runtime effect |
| `skill-failure-log.md` row | Historical record | No runtime effect |
| `stop-point-todo-table/README.md` | Tombstone pointing to new Feature | Cosmetic — restore original README from git if reverting the retirement |

## Baseline + target (for judging whether the Feature works)

| Metric | Value |
|---|---|
| Baseline compliance (before ship) | 24.9% (154/618 substantive turns across 15 recent transcripts) |
| Target (verify next session) | ≥ 95% substantive-turn compliance |
| Verify command | `node "domain/stop-point-summary/eval.js" --limit=15` |
| Smoke-test at ship | 7/7 fixture cases PASS (Rule 6 v1.2 fire+effect checks) |
| Ship commit | `90e961d` |

## Trust ledger

- [ ] Fired ≥ 1× in `log.jsonl` (auto-verified at DE)
- [ ] 30 days elapsed since Created (2026-08-05)
- [ ] No rollback event on the ship commit

When all three hold at Domain Expansion, this file is deleted and the Feature graduates to trusted status.
