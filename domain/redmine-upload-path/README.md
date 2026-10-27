# redmine-upload-path

symptom: Redmine uploads not kept in the Task folder
goal: every file uploaded to Redmine sits in the Task folder cycle folder first
goal_signal: no blocked rows in log.jsonl after one week
retention: rotate monthly
footprint: per-tool: 1 node process under 100 ms, only on mcp__claude-in-chrome__file_upload

**What fires when**: PreToolUse — a browser file upload (Redmine attachment) whose path is not in the Task folder's 2. Fix or N. Rework root

**Contract**: BLOCK the upload until the file is copied into the cycle folder; bypass [skip-upload-path: <reason>]

**Layer choice (Rule 7)**: TODO(forge): hook-only | skill-only | hook+skill — justify.

**Trigger moment (Rule 8)**: TODO(forge): justify this is the LEANEST trigger.

**Observability**: every fire appends to `domain/redmine-upload-path/log.jsonl` — TODO(forge): state what each line carries so an audit can read the fire history.

**state-scoped**: TODO(forge, Rule 11): `yes, keyed by <X>` | `no, state-agnostic`.
