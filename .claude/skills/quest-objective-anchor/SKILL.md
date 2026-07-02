---
name: quest-objective-anchor
description: Use when re-anchoring to a ticket's original issue mid-quest — recovering from symptom drift, a premature root-cause claim, or a proposed scope-contraction. Triggers — "re-anchor", "objective lock", "original symptom", "what did BA actually report", "are we still on the real issue", "stay on the issue", "did we drift from the ticket", "quest objective anchor", any moment a claim risks outrunning verified evidence or a numbered BA issue is about to be deferred/dropped.
metadata:
  type: honesty-primitive
  pairs-with: quest-objective-anchor.js (UserPromptSubmit hook)
  sibling: quest-active-grounding.js (status line, not discipline)
---

# quest-objective-anchor — re-pin to the BA's real issue mid-quest

## When this fires

- Any moment a symptom is about to be restated from memory instead of re-read
- Before declaring a root cause / "fixed" / "confirmed" claim
- Before deferring, dropping, or narrowing ANY BA-listed numbered issue
- On explicit re-anchor triggers (see frontmatter)

## The 4 anchor rules

| # | Rule | Fires when |
|---|---|---|
| 1 | Symptom = ground truth | About to describe "the issue" — re-read BA/みや's exact words, never paraphrase-from-memory |
| 2 | No root cause past verified evidence | About to say "fixed"/"confirmed"/"root cause is X" — mid-test state ≠ done state |
| 3 | Every behaviour claim cites its verification | Any claim about what code/UI does — cite the DB row / file:line / screenshot that proves it |
| 4 | Scope-contraction needs a verbatim quote + nod | About to defer/drop/narrow a numbered BA issue — even if みや proposed it himself |

## When to re-read BA verbatim (not the paraphrase)

```
active.txt issue_one_liner   →  Ruri's PARAPHRASE — never sufficient alone
        │
        ↓  re-read instead
History.txt "Issue:" / "Expected:" blocks (latest cycle, per hook extraction)
        │
        ↓
verbatim numbered items — the counter-quote source for Rule 4
```

Re-read verbatim whenever: resuming after a time-gap, a correction was just given, or any scope talk touches a numbered issue.

## Scope-contraction nod rule (Rule 4, detail)

1. Quote the specific numbered BA issue VERBATIM (from History.txt, not active.txt)
2. State the proposed contraction in one line
3. Ask みや for explicit nod BEFORE proceeding — silent agreement is banned even when みや proposed the contraction

```
BA Issue 3 (verbatim): "<quoted line>"
Proposing to defer this — separate ticket. Confirm?
```

## What this skill does NOT do

- Does NOT block anything — the paired hook is report-only; this skill is the manual/explicit recovery procedure
- Does NOT replace `scope-anchor-echo` (that's code-edit scope; this is issue/symptom scope)
- Does NOT consolidate re-anchors across a session — each drift moment gets its own re-anchor

## Source

- `.claude/hooks/quest-objective-anchor.js` — auto-fires OBJECTIVE LOCK block every quest-active turn (v1.1, 2026-06-30, QA-267976)
- Built 2026-06-16 (QA-261517) after symptom mis-statement + premature root-cause mid-test

## Cross-references

- `scope-anchor-echo` skill — code-edit scope (sibling concern, not this)
- `claim-verification` skill — done-time diff-backing (Rule 2/3 overlap)
- `over-generalization-check` skill — prior-ticket pattern reuse (different axis)

---

*register_event=NONE — invoked manually or by trigger phrase, not bound to a settings.json hook event.*
