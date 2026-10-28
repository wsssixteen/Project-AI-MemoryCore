# memory-clean-words

symptom: miya 2026-10-28: sanitize all memory of swearing; remember it as him being angry or frustrated wanting Ruri to be better; gate it
goal: no swear word is written into a Memory shelf
goal_signal: blocked writes are followed by the same write without the word; lib/save-rules.js no-swearing stays PASS
retention: rotate monthly
footprint: per-tool: 1 short node process per Edit/Write/MultiEdit, returns at once for non-memory paths (<50 MB, <50 ms)

**What fires when**: PreToolUse — an Edit, Write or MultiEdit to a Memory file (main/, daily-diary/, .claude/auto-memory/) whose new text holds a swear word

**Contract**: block the write; the message says to record his anger as anger, without the swear words

**Layer choice (Rule 7)**: TODO(forge): hook-only | skill-only | hook+skill — justify.

**Trigger moment (Rule 8)**: TODO(forge): justify this is the LEANEST trigger.

**Observability**: every fire appends to `domain/memory-clean-words/log.jsonl` — TODO(forge): state what each line carries so an audit can read the fire history.

**state-scoped**: TODO(forge, Rule 11): `yes, keyed by <X>` | `no, state-agnostic`.
