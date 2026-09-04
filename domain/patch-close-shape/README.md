# patch-close-shape

**Purpose**: when a quest finishes with a PROD data-patch handed to infra, the closing reply must END with the infra handoff block, in format. Born after #277291 (2026-09-02) drifted 3× — handoff verbose, then at the TOP not the end, then a blank line between greeting and `#ticket` — each caught only by みや. `patch-script-gate` checks the SQL pieces; nothing checked the reply ENVELOPE. This is that gate.

**What fires when**: Stop — only when the reply contains a fenced infra handoff block whose first content line is `Hi infra, please assist. Thank you.`. No such block → silent pass. Checks run on the LAST such block (a before/after comparison turn whose final handoff is correct still passes).

**Two checks** (advisory v1):
- **CHECK A** — greeting and `#<ticket>:` are ADJACENT (no blank/prose line between).
- **CHECK B** — the handoff is the CLOSING block (nothing substantive after its closing fence).

**Layer choice (Rule 7)**: hook-only — no procedure to invoke, mechanical detection, no front-gate needed.

**Trigger moment (Rule 8)**: Stop — the handoff exists only in the assistant's output, which UserPromptSubmit cannot see. Leanest trigger for this need.

**Severity (Rule 4)**: advisory v1 (adds context, never blocks) — matches sibling `patch-script-gate`. Flip to block only with confirmed-fire evidence that advisory is being ignored.

**Observability (Rule 5)**: every run appends to `domain/patch-close-shape/log.jsonl` — `{ts, action, detail}`; `action` ∈ `advisory-adjacency` · `advisory-not-last` · `passed`. Grep the fire history to decide advisory→block promotion.

**state-scoped**: no, state-agnostic — the handoff shape is identical for Melaka / Perak / any state; no per-state path, schema, or key (Rule 11).

**Eval**: `node domain/patch-close-shape/patch-close-shape.eval.js` — 27 fixtures (happy path + CHECK A + CHECK B + 15 adversarial/out-of-spec), all green 2026-09-02. Live smoke-test confirmed both advisories render.
