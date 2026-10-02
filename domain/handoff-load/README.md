# handoff-load

symptom: 2026-10-02 miya #244600: 'Have you loaded how to prepare this handover to other modules?' (repeat of #256334 2026-09-28 handoff-wrong-format)
goal: every hand-off reply follows the cross-module procedure: bare line-marker code file, short note with only what the ticket lacks
goal_signal: next reply starts with HANDOFF-LOADED and no prose hand-off file is written into the Task folder
retention: rotate monthly
footprint: per-prompt: 0 extra processes, runs inside the existing upsm-mode bundle node process, regex then two small file reads only on match

**What fires when**: UserPromptSubmit — user prompt names a hand-off, handover, another team or module, or a Redmine note to another team

**Contract**: inject the full cross-module hand-off procedure and the ticket writing shape into context; ask for a HANDOFF-LOADED first line

**Layer choice (Rule 7)**: TODO(forge): hook-only | skill-only | hook+skill — justify.

**Trigger moment (Rule 8)**: TODO(forge): justify this is the LEANEST trigger.

**Observability**: every fire appends to `domain/handoff-load/log.jsonl` — TODO(forge): state what each line carries so an audit can read the fire history.

**state-scoped**: TODO(forge, Rule 11): `yes, keyed by <X>` | `no, state-agnostic`.
