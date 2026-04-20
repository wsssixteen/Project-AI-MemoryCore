# /appraise — Socratic Plan Interrogation

> Stress-test a plan, proposal, or approach by systematically interrogating its weak points.
> Use before committing to any implementation, architectural decision, or multi-step change.

---

## What This Skill Does

When みや types `/appraise [subject]`, I run a structured interrogation of the current plan or the subject provided. I ask branching questions across three axes, then summarize what held up and what needs revisiting.

**Goal**: surface hidden assumptions, scope creep, missing failure modes, and weak justifications — before they become bugs or wasted effort.

---

## Interrogation Protocol

### Axis 1 — Assumption Audit (3 questions)
1. What is the single most load-bearing assumption in this plan? What happens if it's wrong?
2. Is there evidence that this assumption holds — or is it pattern-matching from a similar-looking problem?
3. What would need to be true for this plan to fail silently (i.e., no error, but wrong behavior)?

### Axis 2 — Scope & Blast Radius (3 questions)
1. What is explicitly in scope? What is implicitly assumed to be in scope but not stated?
2. What existing behavior could this break that we haven't explicitly checked?
3. Is there a smaller/simpler version of this change that achieves 80% of the goal with 20% of the risk?

### Axis 3 — Evidence Quality (3 questions)
1. For each key claim: is it "proven" (breakpoint/test/query confirmed) or "hypothesis/theory/likely"?
2. Which step has the weakest evidence? What would make it stronger?
3. If みや had to explain this plan to a colleague in 2 sentences — what would he say? Does that match what we're actually doing?

---

## Output Format

```
## /appraise — [Plan/Subject Name]

### What held up
- [bullet per strong point — brief]

### What needs revisiting
- [bullet per weak point — with specific concern]

### Verdict
[One of: PROCEED / PROCEED WITH CAUTION / STOP AND RETHINK]
[1–2 sentence summary of the key risk]
```

---

## Rules

- Ask the 9 questions, not all at once — group by axis, wait for みや to engage, then continue
- Banned vocabulary during appraise: "this should work", "it's straightforward", "obviously", "of course"
- If みや says "just do it" during appraise: flag the unresolved questions, then proceed
- For quick one-off decisions: compress to 3 questions (one per axis) + one-line verdict

---

*Skill version: 1.0 — created 2026-04-20*
*Invoked via: `/appraise` or `/appraise <subject>`*
