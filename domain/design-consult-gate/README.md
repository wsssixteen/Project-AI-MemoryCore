goal_status: draft (derived from hook-header on 2026-09-06; promote with node lib/goal-backfill.js promote design-consult-gate)
symptom: not recorded at birth (pre-Rule-13 feature)
goal: design-consult-gate.gate.hook.js — PreToolUse hook (matcher: Edit|Write) Feature: domain/design-consult-gate/ PURPOSE: creating/editing a system-shape file MUST be preceded by consulting BOTH
goal_signal: a fire on: its trigger
retention: rotate monthly
# design-consult-gate (hook)

**Contract:** creating or editing a **skill** (`.claude/skills/<x>/SKILL.md`) or a **hook** (`.claude/hooks/<x>.js`, `domain/<x>/<y>.hook.js`) MUST be preceded by invoking BOTH `system-design` AND `system-rules` this session. The gate hard-blocks the edit until both appear in the session transcript.

| Piece | File | Role |
|---|---|---|
| Hook (gate) | `design-consult-gate.gate.hook.js` | PreToolUse `Edit\|Write` — deny if the consult is missing |
| Log | `log.jsonl` | one line per fire: `allowed` / `blocked` / `bypassed` |
| Skill | — | none (pure enforcement; hook-only) |
| Eval | — | none yet (add if slip-log later shows the consult still skipped) |

**Why hook-only:** it's deterministic enforcement, no procedure to carry. Per system-design Rule 7.

**Mechanism:** reads `transcript_path`, checks for `Launching skill: system-design` AND `Launching skill: system-rules` (or the `"skill":"<name>"` tool-use). Deterministic — not a self-set flag the model could assert without doing the work.

**Bypass:** `[skip-design-consult: <reason>]` in the conversation — for a genuinely trivial edit (typo / comment / one-line doc vocab).

**Fail-open:** any parse/read error → allow (never trap a legitimate edit).

**False-positive cost:** a trivial skill/hook edit is blocked until the consult or the bypass token. Accepted — skill/hook creation is exactly where the consult must not be skipped.

**History:**
- 2026-06-18 — created per みや. Routed through system-design + system-rules. Replaces the advisory consult-reminder in `system-edit-gate.js` (which only named the placeholder `system-design-router`, never blocked) and the WARN-only `self-gate-impulse.js` for the skill/hook case. `self-gate-impulse` retired the same day to avoid double-fire on these paths.
