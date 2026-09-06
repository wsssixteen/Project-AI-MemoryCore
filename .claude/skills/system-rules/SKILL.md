---
name: system-rules
description: Universal system-design discipline. 6 rules that apply to any system you maintain. Triggers — "/system-rules", "system rules", "clean system check", "audit the system", "system discipline", "inventory before adding", before any architectural decision or component addition.
---

# /system-rules — Universal System Discipline

Six rules that apply to ANY system, agentic or not.

## The 6 Rules

1. **Inventory first** — before adding any new component (rule / skill / hook / module), check what already exists. If a sibling solves 90% of the problem, refine it instead of duplicating.

2. **Merge in place when refining** — keep the rule clause + concrete example + Banned clause. Drop the Why story / Cross-ref / quote / "pairs with X" scaffolding. **Test**: if removing a sentence doesn't change behavior, it's scaffolding — drop it.

3. **Assess + delete deprecated periodically** — every N days, review hook-fire log, slip log, skill invocations. Delete anything that hasn't earned its slot. Tombstone with a 1-line "deprecated YYYY-MM-DD because X" note.

4. **Clean system value** — atomic components, basic structures, reliability over cleverness. Start simple; patch when evidence shows the simple version missed something.

5. **Build with audit logging — and the log is the OPTIMIZATION dataset** (extended 2026-08-17 per みや) — every new feature/component ships with a log path defined (e.g. `domain/<name>/log.jsonl` for our convention). Logging is a precondition of shipping, not an afterthought. Every "why did X happen" becomes a `grep`, not a debug session. **The second purpose is optimization**: each log row carries at minimum a timestamp + outcome (+ duration where the runtime provides it, e.g. `dur_ms` in hook-fires telemetry), so making a feature faster or more reliable is PROVEN from before/after log data, never asserted. An optimization claim without log evidence is a guess. Enforced mechanically at birth: `core/forge.js` creates the log file; `component-birth-gate` blocks hand-made components — so this applies to EVERY future feature, always.

6. **Data lifecycle declared at birth — every log has a retention rule; housekeeping is a scheduled step, not a memory** (added 2026-09-06 per みや). Rule 5 makes every feature WRITE data; this rule says what happens to it afterwards. Every component's README carries one `retention:` line with exactly one of four verbs: **keep** (append-only ledger, never pruned — `system/slips.jsonl`, `system/registry.jsonl`) · **rotate** `<period>` (raw telemetry — monthly file, readers union the last 2 — `system/telemetry/hook-fires.jsonl`) · **consume** `<into>` (raw rows are folded into a summary, then archived — assessment files into the rolling assessment at DE; proposals ruled then closed) · **regenerate** (derived views, safe to delete any time — dashboards, census, profile-card). Housekeeping runs at TWO fixed moments only: Domain Expansion Step 12.5 (rotate + regenerate + archive consumed) and the system audit (retire what Rule 3 ruled). Rule 3 retires FEATURES; Rule 6 retires their DATA. **Banned**: a log with no `retention:` line (birth-gate blocks it, same tier as missing eval) · deleting raw rows before their summary exists · cleanup at an ad-hoc moment. **Test**: for any file under `system/`, `domain/*/`, `main/`, one grep answers "who deletes this, when, and what survives it".

## Usage

Invoke at any architectural decision point. Apply each rule as a filter. /system-design is the agentic-specific specialization that builds on these universal disciplines.

*Version 1.0 — 2026-06-02. Refactored from old /system-design (was 197 lines of mixed universal + agentic content); the 4 truly-universal rules + 1 new audit-logging rule live here; 2 agentic-specific rules moved to /system-design.*

*Version 1.2 — 2026-09-06. Rule 6 added per みや: data lifecycle declared at birth — every component README carries one `retention:` line (keep / rotate / consume / regenerate); housekeeping runs only at DE 12.5 + system audit; birth-gate blocks a log without retention. Rules 1-5 untouched; additive. Title "5 Rules" → 6.*

*Version 1.1 — 2026-08-17. Rule 5 extended per みや: the log is ALSO the optimization dataset — rows carry ts + outcome (+ duration where available) so speed/reliability improvements are proven from before/after log data, never asserted; birth-gate + forge make it apply to every future feature. Spec-preservation: all v1.0 Rule-5 specs intact (log path at ship time · precondition-not-afterthought · grep-not-debug); clause is additive.*
