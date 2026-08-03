# Hook Test Scenarios — dry-run cases for Stop-hook hard-block predicate

> Created 2026-05-28 per plan `cached-floating-hummingbird.md` Phase 5.
>
> These scenarios are mental walkthroughs to validate the `silent-claim-drift-gate.js` Stage 5B predicate (hard-block) BEFORE flipping from Stage 5A (advisory). Walk each through manually; if the predicate produces the EXPECTED outcome for each, calibration is acceptable for the Stage 5B flip.
>
> Update this file whenever the predicate is modified — add scenarios for new edge cases.

---

## Stage 5A → Stage 5B flip checklist

Before flipping `silent-claim-drift-gate.js` to emit `hookSpecificOutput.decision: "block"` instead of `additionalContext`:

- [ ] All 10 scenarios below produce the expected outcome
- [ ] At least 1 session of Stage 5A advisory-mode observation has happened
- [ ] False-positive rate (advisory reminders that should NOT have fired) is acceptable — log them in `system/slip-log.md` if seen
- [ ] False-negative rate (missing reminders that SHOULD have fired) is acceptable
- [ ] Bypass token `[skip-invoke <name>: <reason>]` regex is tight (no false bypass via partial matches)

---

## Scenario 1 — Correct invocation (PASS)

**Turn shape**:
- Response contains: "→ Skill: rubric for option-ranking"
- Tool calls include: Skill tool invocation with skill name "rubric"
- Response final message ends with no bypass token

**Expected outcome**: PASS (no block, no reminder).

**Why**: token signaled invocation; matching Skill tool call happened. Contract satisfied.

---

## Scenario 2 — Token present, no invocation (BLOCK in 5B, advisory in 5A)

**Turn shape**:
- Response contains: "→ Skill: rubric for option-ranking"
- Tool calls: only Edit, Read, Bash — no Skill tool calls
- No bypass token in message

**Expected outcome (5A)**: advisory reminder injected — "Skill 'rubric' token appeared but no invocation".
**Expected outcome (5B)**: turn-end refused via `decision: "block"`.

**Why**: token created contract; contract violated.

---

## Scenario 3 — Token present, no invocation, bypass token in message (PASS)

**Turn shape**:
- Response contains: "→ Skill: rubric for option-ranking"
- Tool calls: no Skill tool calls
- Response message contains: `[skip-invoke rubric: みや explicitly said skip rubric this turn]`

**Expected outcome**: PASS (bypass honored; visible in transcript for audit).

**Why**: explicit, audit-visible skip with reason. Allowed.

---

## Scenario 4 — Multi-skill turn, partial fulfillment (BLOCK in 5B)

**Turn shape**:
- Response contains: "→ Skill: rubric" AND "→ Skill: claim-verification"
- Tool calls: Skill tool invocation for "rubric" only
- No bypass tokens

**Expected outcome (5A)**: advisory reminder names `claim-verification` as missing.
**Expected outcome (5B)**: turn-end refused (one missing invocation is enough).

**Why**: partial fulfillment fails. Either invoke all OR bypass each missing one explicitly.

---

## Scenario 5 — Plain-first violation (BLOCK in 5B)

**Turn shape**:
- Response starts with: `| Item | Status |` (table-first, no prose lede)
- Tool calls: any

**Expected outcome (5A)**: PlainFirstGate advisory reminder.
**Expected outcome (5B)**: turn-end refused — "open with 1-2 plain prose sentences".

**Why**: layered-explanation rule (personality.md:53) — prose lede mandatory.

---

## Scenario 6 — Prose lede + table (PASS)

**Turn shape**:
- Response starts with: "The fix is in two parts. First, X. Second, Y."
- Followed by: a markdown table summarizing the parts
- Tool calls: any

**Expected outcome**: PASS.

**Why**: prose-first satisfied; table is supporting structure.

---

## Scenario 7 — Bypass token references wrong skill (BLOCK)

**Turn shape**:
- Response contains: "→ Skill: rubric"
- Tool calls: no Skill tool for "rubric"
- Response message contains: `[skip-invoke claim-verification: ...]` (wrong skill named in bypass)

**Expected outcome**: BLOCK — bypass doesn't match the actual missing skill.

**Why**: bypass must name the specific skill being skipped. Typo or wrong-skill = no bypass.

---

## Scenario 8 — Skill not in registry (SURFACE ERROR, not block)

**Turn shape**:
- Response contains: "→ Skill: nonexistent-skill-name"
- Skill tool call attempted: errors with "skill not found"

**Expected outcome**: SURFACE the error to みや explicitly. Workflow paused. Do NOT shortcut to manual interpretation of what the skill would have done.

**Why**: per `skill-invocation-discipline-gate.js` contract — errors surface, never silent.

---

## Scenario 9 — 100%-VERIFY shortfall in Recon emit (BLOCK in 5B)

**Turn shape**:
- Response contains "Recon" section with Universal Checks table
- Table has 5 HYPOTHESIS rows; only 1 VERIFIED follow-up
- No `[skip-100-verify: ...]` bypass

**Expected outcome (5A)**: advisory reminder about 100%-VERIFY clause + line 545 reference.
**Expected outcome (5B)**: turn-end refused until ratio fixed or bypass added.

**Why**: 100%-VERIFY clause (quest-protocol.md:545) demands every HYPOTHESIS paired with VERIFIED+file:line OR downgraded to BA-Q.

---

## Scenario 10 — Architecture-doc-sync violation (BLOCK in 5B)

**Turn shape**:
- Tool calls: Edit on `.claude/hooks/foo.js`
- Tool calls: NO Edit on `system/system-architecture.md`
- Response message: no `[skip-architecture-doc-update: ...]` bypass

**Expected outcome (5A)**: advisory reminder — paired-edit required.
**Expected outcome (5B)**: turn-end refused.

**Why**: plan Phase 0 paired-edit rule — system-component changes must be reflected in the architecture doc.

---

## Predicate edge cases worth dry-running

- **Tokens inside fenced code blocks** — should they count? Currently YES (regex doesn't distinguish). Edge case: if Ruri quotes a token in a code example, the predicate would demand invocation. Mitigation: bypass token allowed inline; OR future predicate refinement to skip tokens inside code fences.
- **Multiple bypass tokens for same skill** — first match wins (bypass honored). Multiple are redundant but not harmful.
- **Case-sensitivity** — current regex is `/i` (case-insensitive). `→ Skill: Rubric` and `→ Skill: rubric` both match. Skill names should be canonical lowercase but tolerant.
- **Unicode arrow variants** — `→` (U+2192) is the canonical; ASCII `->` also accepted. `▶` or other arrow shapes NOT accepted (would silently miss).
- **Token with extra whitespace** — `→ Skill : rubric` (space around colon) → regex tolerates `\s*:\s*`.
- **Token broken across lines** — `→ Skill:\nrubric` would NOT match (regex single-line). Mitigation: don't write tokens across line breaks.

---

## Update log

| Date | Change | Reason |
|---|---|---|
| 2026-05-28 | v1.0 created with 10 scenarios | Plan Phase 5 dry-run requirement |
