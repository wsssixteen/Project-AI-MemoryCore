# handoff-load

symptom: 2026-10-02 miya #244600: 'Have you loaded how to prepare this handover to other modules?' (repeat of #256334 2026-09-28 handoff-wrong-format)
goal: every hand-off reply follows the cross-module procedure: bare line-marker code file, short note with only what the ticket lacks
goal_signal: next reply starts with HANDOFF-LOADED and no prose hand-off file is written into the Task folder
retention: rotate monthly
footprint: per-prompt: 0 extra processes, runs inside the existing upsm-mode bundle node process, regex then two small file reads only on match

**What fires when**: UserPromptSubmit — user prompt names a hand-off, handover, another team or module, or a Redmine note to another team

**Contract**: inject the `/handover` skill (the one home of the hand-off procedure, since 2026-11-13) and the ticket writing shape into context. It loads only; the Stop rider in `domain/ownership-input-check` is what forces the `Handover:` line.

**Layer choice (Rule 7)**: hook+skill: this hook is the loader of the `/handover` skill on his words; the skill carries the procedure; the check lives in `ownership-input-check`.

**Trigger moment (Rule 8)**: UserPromptSubmit only when his prompt names a hand-off, another team or module, or a Redmine note to another team (one regex). A hand-over I start myself is caught by the cross-module-check verdict row and the Stop rider, not here.

**Observability**: every fire appends to `domain/handoff-load/log.jsonl` one row: `ts` · `matched` (the phrase) · `loaded` (`handover-skill`, `ticket-writing-style`).

**state-scoped**: no, state-agnostic.
