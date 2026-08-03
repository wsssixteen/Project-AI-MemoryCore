# NUKE-MARKER — brief

| Field | Value |
|---|---|
| Created | 2026-07-22 |
| Session | みや `/goal` item 2 — *"create for FEATURE called Brief… use only story diagrams, tables, and bullet points that has short sentences to explain"*. Gap found at inventory: `show-gate` + `terse-gate` already enforce the FORMAT; nothing defined a start-of-work brief's CONTENT. |
| Files | `.claude/skills/brief/SKILL.md` · `domain/brief/eval.js` · `domain/brief/README.md` · `domain/brief/NUKE-MARKER.md` · `domain/brief/log.jsonl` · one `system/registry.jsonl` row (`name: "brief"`, lifecycle `created`) |
| Rollback | `rm -rf ".claude/skills/brief" "domain/brief"` · delete the `"brief"` line from `system/registry.jsonl` · **no `settings.json` entry to remove — skill-only, zero hooks registered** · `git revert <SHA of the brief commit>` |
| Retire | 2026-08-21 (creation + 30d) — delete this file if `/brief` has fired ≥1× in the window AND no rollback |

## Why this is skill-only (the decision worth auditing)

| Layer | Owner | New code? |
|---|---|---|
| Format enforcement | `domain/show-gate` (Stop, hard-block) + `domain/terse-gate` (Stop, hard-block) | ❌ none — already 100% |
| Format spec | `.claude/reply-shape-spec.md` | ❌ none — pointed at |
| Brief CONTENT (6 blocks) | **this Feature** | ✅ skill only |

Adding a `brief-gate` hook would have double-blocked against the two existing gates on the same turn. Rejected at design time per system-rules Rule 1 (inventory first) + system-design Rule 7 (leanest primitive).

## Blast radius if this is wrong

Near zero. No hook is registered, so nothing fires automatically and no turn can be blocked by it. Worst case: a skill nobody invokes. That is why it ships without a `trigger.hook.js` — the invocation cost of being wrong is a description-match, not a block.
