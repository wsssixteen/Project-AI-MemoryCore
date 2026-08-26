# live-action-safety

**What fires when**: PreToolUse — Bash/PowerShell command runs run.js/attendance.js/pymclaims.js with no dry flag

**Contract**: BLOCK exit 2; require --dry or [live-action-approved: reason]

**Layer choice (Rule 7)**: TODO(forge): hook-only | skill-only | hook+skill — justify.

**Trigger moment (Rule 8)**: TODO(forge): justify this is the LEANEST trigger.

**Observability**: every fire appends to `domain/live-action-safety/log.jsonl` — TODO(forge): state what each line carries so an audit can read the fire history.

**state-scoped**: TODO(forge, Rule 11): `yes, keyed by <X>` | `no, state-agnostic`.
