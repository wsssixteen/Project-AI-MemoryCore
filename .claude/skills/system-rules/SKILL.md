---
name: system-rules
description: Universal system-design discipline. 5 rules that apply to any system you maintain. Triggers — "/system-rules", "system rules", "clean system check", "audit the system", "system discipline", "inventory before adding", before any architectural decision or component addition.
---

# /system-rules — Universal System Discipline

Five rules that apply to ANY system, agentic or not.

## The 5 Rules

1. **Inventory first** — before adding any new component (rule / skill / hook / module), check what already exists. If a sibling solves 90% of the problem, refine it instead of duplicating.

2. **Merge in place when refining** — keep the rule clause + concrete example + Banned clause. Drop the Why story / Cross-ref / quote / "pairs with X" scaffolding. **Test**: if removing a sentence doesn't change behavior, it's scaffolding — drop it.

3. **Assess + delete deprecated periodically** — every N days, review hook-fire log, slip log, skill invocations. Delete anything that hasn't earned its slot. Tombstone with a 1-line "deprecated YYYY-MM-DD because X" note.

4. **Clean system value** — atomic components, basic structures, reliability over cleverness. Start simple; patch when evidence shows the simple version missed something.

5. **Build with audit logging** — every new feature/component ships with a log path defined (e.g. `domain/<name>/log.jsonl` for our convention). Logging is a precondition of shipping, not an afterthought. Every "why did X happen" becomes a `grep`, not a debug session.

## Usage

Invoke at any architectural decision point. Apply each rule as a filter. /system-design is the agentic-specific specialization that builds on these universal disciplines.

*Version 1.0 — 2026-06-02. Refactored from old /system-design (was 197 lines of mixed universal + agentic content); the 4 truly-universal rules + 1 new audit-logging rule live here; 2 agentic-specific rules moved to /system-design.*
