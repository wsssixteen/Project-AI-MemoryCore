# system-change-title

symptom: 2026-10-27 (286462): system-change replies listed a script, a gate, a skill line and a people row together; miya could not tell which kind of part each one was
goal: every reply about a system change tells miya at a glance which kind of part changed and whether it is new or changed
goal_signal: the reply that reports a system change carries a heading like '## [Feature · new] <name>'
retention: rotate monthly
footprint: per-turn: 0 new processes, runs inside the stop-reply-shape bundle, under 50 ms

**What fires when**: Stop — my reply reports creating or changing a system part (a system path on the same line as built / created / added / updated / changed / refined / new)

**Contract** (v3, 2026-10-28): block unless the reply has at least one heading `## System › <kind> (new|changed)` with one table under it, one row per part; block when the same kind is headed twice (the 2026-10-28 reply carried four `System › Memory` headings, miya: "if it is under memory, just put it in a single table").

**Layer choice (Rule 7)**: TODO(forge): hook-only | skill-only | hook+skill — justify.

**Trigger moment (Rule 8)**: TODO(forge): justify this is the LEANEST trigger.

**Observability**: every fire appends to `domain/system-change-title/log.jsonl` — TODO(forge): state what each line carries so an audit can read the fire history.

**state-scoped**: TODO(forge, Rule 11): `yes, keyed by <X>` | `no, state-agnostic`.

**Registration**: child of `domain/bundles/stop-reply-shape.json` (Stop), not a standalone settings.json entry (system-rules Rule 7).
**state-scoped**: no, state-agnostic.
**self_audit**: the eval replays the 286462 audit reply through the real hook process and asserts the block text shows the heading shape.
