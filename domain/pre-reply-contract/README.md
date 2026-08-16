# pre-reply-contract — the reply-shape rules arrive BEFORE the reply

**Fires**: UserPromptSubmit, every prompt ≥4 chars. **Never blocks** (contextOut only, fail-open).

**Contract (what it injects)**: the condensed permanent ADHD reply shape — answer-first · numbered steps · ≤5-item lists · full code addresses · Micro-Summary close · step-position restated · **DELTA-ONLY on any Stop-hook correction**. Canonical rule bodies: `.claude/reply-shape-spec.md` §3b; long-form reference: `.claude/skills/i-have-adhd/`.

**Constrained-format detection**: prompts like "only a table" / "reply with just X" / "one sentence" get the suppression variant instead — みや's format ask outranks every shape rule.

**Why it exists** (todo.md Q1 rows 42+44; みや 2026-07-28 + 2026-08-16): the reply-shape gates lived ONLY at Stop, which evaluates a reply already shown to みや — every rejection forced a full re-emit he read twice. This Feature front-loads the mechanical rules so the reply is right the first time; the Stop gates stay as backstop but their block messages now demand a delta, not a re-emit (same-day edits to `domain/terse-gate/` · `domain/show-gate/` · `domain/full-address-trace-gate/` · `domain/stop-point-summary/`).

**Eval**: `pre-reply-contract.eval.js` — 6 fixtures incl. the 2026-07-28 verbatim "reply with ONLY a table" replay. 6/6 green at ship (2026-08-16).
