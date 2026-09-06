# skill-invocation-log

symptom: DE 12.5 skill-load counter suspended since 2026-08-16: skill invocations are unlogged (named observability hole)
goal: every Skill tool invocation is one row in domain/skill-invocation-log/log.jsonl with turn_id and skill name so skill liveness can be audited
goal_signal: invoking any skill appends a row with that skill name
retention: rotate monthly

**What fires when**: PostToolUse — PostToolUse for the Skill tool

**Contract**: append {ts, turn_id, qa, skill, args} to log.jsonl; never blocks

**Layer choice (Rule 7)**: TODO(forge): hook-only | skill-only | hook+skill — justify.

**Trigger moment (Rule 8)**: TODO(forge): justify this is the LEANEST trigger.

**Observability**: every fire appends to `domain/skill-invocation-log/log.jsonl` — TODO(forge): state what each line carries so an audit can read the fire history.

**state-scoped**: TODO(forge, Rule 11): `yes, keyed by <X>` | `no, state-agnostic`.
