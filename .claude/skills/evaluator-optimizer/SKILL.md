---
name: evaluator-optimizer
description: After writing or modifying code — automatically validate via test/build/check + iterate if failing. Anthropic-recommended Evaluator-Optimizer Loop pattern for code work. Use after any Java/JS/Python/SQL/code-file edit during Etanah work. Triggers — "evaluator-optimizer", "validate the code", "run the tests", "iterate on the fix", "evaluator pattern", "test then iterate", "verify-then-iterate". Built 2026-05-24 Task #19 from Anthropic research finding.
metadata:
  type: discipline-primitive
  sub-layer: discipline
  meta-layer-INDEX: meta/discipline-INDEX.md
  trifecta:
    goal: Never ship code without test-pass evidence in the same emission
    guardrails: Cap retries (3); if 3 failed iterations → escalate to みや with stack trace, don't loop forever
    grounded: Anthropic research (orchestrator-worker pattern) + Etanah build commands (mvn test, docker logs)
---

# evaluator-optimizer — Write → Test → Iterate Loop

## When this fires

- After any code Edit/Write during Quest Apply
- After ad-hoc code change to Etanah / etanah-awam / project code
- Explicit invoke: "/evaluator-optimizer" or trigger phrase

## Steps

1. **WRITE** — code change just made (Edit/Write tool call)
2. **EVALUATE** — run appropriate validator:
   - Java: `mvn test`
   - Container: `docker logs <container> --tail 50`
   - SQL: explain plan + test query on UAT data
   - JS: `npm test`
   - .docx: render via test-data Quest + open in Word
3. **READ STACK TRACE** if fail — surface with file:line citations
4. **ITERATE** — propose narrow fix → re-Edit → re-Evaluate (CAP: 3 iterations)
5. **ESCALATE** if 3 iterations fail — emit "Evaluator-Optimizer: 3 retries exhausted on <X>. Need みや input." + full stack trace + what was tried. Banned: looping indefinitely.
6. **CONFIRM** when pass — emit "Evaluator-Optimizer: PASS after <N> iterations" with test output excerpt

## Output format

```
═══ EVALUATOR-OPTIMIZER ═══
WROTE:    <file:line summary>
EVALUATE: <command> → <PASS/FAIL>
[If FAIL] STACK · HYPOTHESIS · ITERATION N/3 · next change
[If PASS] RESULT excerpt
══════════════════════════
```

## Does NOT

- Auto-commit after pass — that's still みや's nod (commit-gate enforces)
- Skip evaluation step — "I'm confident this works" without test = BANNED
- Loop past 3 iterations — escalation required

## Source

- Anthropic research (orchestrator-worker pattern) — `library-items/agent-architecture/claude-code-best-practices.md`
- Tasks #19 + #31

## Cross-references

- `meta/discipline-INDEX.md`
- `predicate-box` skill (sibling — predicate-box = pre-Edit; this = post-Edit)
- `quest/quest-protocol.md` Apply checkpoint

---

*Atomic Discipline primitive. Built 2026-05-24 (Hardening Round 2).*
