# handover-check-gate

symptom: 286462 (2026-10-27): the hand-over check existed only as a skill line, so nothing forced it to run; the note also went to the Reports PIC, not TL Nurhayati Abdul Razak
goal: no Redmine hand-over draft reaches miya unless lib/handover-check.js passed on it, and every Reports hand-over is addressed to kak Yati
goal_signal: every reply with a hand-over draft carries HANDOVER-CHECK: 0 finding(s)
retention: rotate monthly
footprint: per-turn: 0 new processes, runs inside the stop-reply-shape bundle, under 50 ms

**What fires when**: Stop — my reply carries a Redmine hand-over draft (a Salam line plus a table with a Sepatutnya/Expected column)

**Contract**: block unless the reply also carries 'HANDOVER-CHECK: 0 finding(s)' from lib/handover-check.js; block a .jrxml hand-over not greeted to kak Yati

**Layer choice (Rule 7)**: TODO(forge): hook-only | skill-only | hook+skill — justify.

**Trigger moment (Rule 8)**: TODO(forge): justify this is the LEANEST trigger.

**Observability**: every fire appends to `domain/handover-check-gate/log.jsonl` — TODO(forge): state what each line carries so an audit can read the fire history.

**state-scoped**: TODO(forge, Rule 11): `yes, keyed by <X>` | `no, state-agnostic`.

**Registration**: child of `domain/bundles/stop-reply-shape.json` (Stop), not a standalone settings.json entry (system-rules Rule 7).
**state-scoped**: partly. The kak Yati routing is the Melaka Reports TL (from `etanah-knowledge/melaka/STATE-FACTS.md` § 8); another state's Reports TL needs its own row before this gate is used there.
**self_audit**: the eval replays the 286462 note through the real hook process and asserts the block text names kak Yati and the check command.
