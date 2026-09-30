# next-steps-shape

symptom: 2026-09-30 miya: 'not sure what you're talking about. Please fix this behaviour. next steps without short explanation.'
goal: every Next steps row tells miya in plain words what the item is and why it needs him
goal_signal: the reply's Next steps table has a What it means column with a 5+ word sentence per row
retention: rotate monthly
footprint: per-turn: joins the stop-reply-shape bundle, 1 node child, ~30 MB, <200 ms

**What fires when**: Stop — a reply ends with a Next steps table

**Contract**: BLOCK when the table has no 'What it means' column or a meaning cell under 5 words

**Layer choice (Rule 7)**: TODO(forge): hook-only | skill-only | hook+skill — justify.

**Trigger moment (Rule 8)**: TODO(forge): justify this is the LEANEST trigger.

**Observability**: every fire appends to `domain/next-steps-shape/log.jsonl` — TODO(forge): state what each line carries so an audit can read the fire history.

**state-scoped**: TODO(forge, Rule 11): `yes, keyed by <X>` | `no, state-agnostic`.

## Registration + scope
- Runs as a child of `domain/bundles/stop-reply-shape.json` (moved out of the forge's standalone settings.json entry, system-rules Rule 7).
- Paired injector: `domain/pre-reply-contract/pre-reply-contract.check.hook.js` now asks for `# | Action | What it means | Your reply`.
- state-scoped: no, state-agnostic.
- Eval: `next-steps-shape.eval.js` 8/8 (N1 = the exact 2026-09-30 flagged table). Bundle smoke: flagged table exit 2, fixed table exit 0.
