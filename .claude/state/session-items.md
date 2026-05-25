# Session Items — cross-turn tracker

> Mid-conversation items that span turns but aren't yet promoted to todo.md / standing-flags / done. Surfaced at end-of-session ONLY (DE Step 13 / Quest Postscript / save commands). NEVER mid-turn alarms.

## Format

One row per item:

| ID | Added | Status | Item | Context |
|---|---|---|---|---|

**Statuses**:
- `proposed` — Design Memo emitted, awaiting みや's nod
- `in-progress` — Ruri actively working on it (transient — usually closes within the turn)
- `done` — completed this session (auto-prune at session end)
- `moved-to-todo` — promoted to `main/todo.md` (auto-prune)
- `moved-to-standing-flag` — promoted to `main/current-session.md` Standing Flags (auto-prune)
- `rejected` — みや explicitly deferred / dropped (auto-prune)

## Pre-add gate (per `system-design` v1.1)

Before adding ANY item, ask:
1. Could Ruri fix this in-turn? — small + in-reach + non-blocking → **FIX IT NOW**, don't add (per "Mistake → action" rule)
2. Is this naturally a `todo.md` item (cross-session backlog)? → add to todo.md directly, skip session-items
3. Is this a standing-flag (current-session awareness)? → add to current-session.md, skip session-items
4. Only items genuinely needing みや input within THIS session OR future work pending nod get added here.

## Bloat guard

- Cap at 10 active (non-pruned) items
- Items >7 days untouched → auto-move to `todo.md` with reason "aged out of session-items"
- Append-only log; pruned items move to `archive` section below for audit trail

---

## Active items

| ID | Added | Status | Item | Context |
|---|---|---|---|---|
| S001 | 2026-05-25 18:00 | proposed | `git-health` skill build per Design Memo (11 checks, 3-tier safety: auto-fix silent / ask-first / surface-only-if-issue) | Refined Design Memo emitted earlier this session; pending みや's "build" nod |

---

## Archive (pruned items — audit trail)

(none yet)

---

*Created 2026-05-25 — design via `system-design` v1.1 after みや caught the "deferred git-health Design Memo lost across turns" pattern.*
