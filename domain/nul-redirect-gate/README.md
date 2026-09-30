# nul-redirect-gate

symptom: Git Bash does not treat NUL as the null device, so a > NUL redirect creates a real file with a Windows-reserved name that OneDrive cannot sync
goal: No file named NUL is ever created in the OneDrive tree by my shell commands, so the OneDrive Rename popup never recurs
goal_signal: zero reserved-name files reported by system-audit at SessionStart and zero OneDrive rename popups from miya
retention: rotate 90d

**What fires when**: PreToolUse — a Bash tool command redirects output to the Windows device name NUL (> NUL, 2>nul, &>NUL)

**Contract**: BLOCK exit 2; tell Ruri to use /dev/null in Git Bash (or $null in PowerShell); bypass [skip-nul-redirect: reason]

**Layer choice (Rule 7)**: hook-only. The prose rule ("use /dev/null, not NUL") already sat in the harness Bash tool text and still broke, so the next layer is deterministic. No procedure to carry, so no skill.

**Trigger moment (Rule 8)**: PreToolUse on the Bash matcher only — the one moment the bad file can be born. PowerShell maps `NUL` to the device itself, so it is left out.

**Detect side**: `.claude/hooks/system-audit.js` CHECK 10 reports any Windows-reserved file name (NUL, CON, PRN, AUX, COM1-9, LPT1-9) in the repo and in every worktree root at SessionStart — catches writers this gate cannot see.

**Observability**: every fire goes through `lib/hook-runtime.js` into `system/telemetry/hook-fires.jsonl` (ts · hook · event · exit · blocked · dur_ms).

**Eval**: `node domain/nul-redirect-gate/nul-redirect-gate.eval.js` — 25 fixtures (founding replay + 22 adversarial).

**state-scoped**: no, state-agnostic.
