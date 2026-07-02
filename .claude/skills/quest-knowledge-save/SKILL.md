---
name: quest-knowledge-save
description: Use when a discovery/root-cause/mechanism surfaces mid-quest and it needs to be persisted before it's lost. Triggers — "save finding", "save this", "knowledge save", "update quest md", "persist this", "write this down", "save to knowledge", any Stop-hook nudge from quest-knowledge-save-gate.js. Companion to that hook: the hook fires the reminder deterministically (discovery signal / phase-emit / hand-back), this skill carries the WHAT-goes-WHERE procedure.
metadata:
  type: discipline-primitive
  sub-layer: discipline
  meta-layer-INDEX: meta/discipline-INDEX.md
---

# quest-knowledge-save — mid-quest persistence procedure

## When this fires

- `quest-knowledge-save-gate.js` (Stop hook) nudges after a turn with a discovery signal, a phase-emit (Scout/Recon/Rubric), or a hand-back — while a quest is `status=active`
- Manual: "save finding", "save this", "update quest md"

## WHAT goes WHERE (the split — do not cross these)

| Finding shape | Save NOW, mid-quest, to | Save ONLY at Phase-2 close, to |
|---|---|---|
| Quest-specific detail (this ticket's chain, this fix, this test data) | `projects/coding-projects/active/QA-<n>/QA-<n>.md` | — |
| Durable codebase knowledge (schema, JSF wiring, BPMN routing, domain term) | matching `etanah-knowledge/melaka/<file>.md` (table below) | — |
| Recurring bug PATTERN (generalized, ticket-agnostic) | — | `BUG-BESTIARY.md` |
| Post-mortem / lesson-learned narrative | — | `main/post-mortems.md` |

**Why the BUG-BESTIARY/post-mortem gate is Phase-2-only** (QA-262495 lesson): a mid-quest entry written from an unverified Scout/Recon hypothesis got reverted when Rubric overturned it — the bestiary is meant to hold CONFIRMED, CLOSED-ticket patterns, not live working theories. Writing it early created a false-confirmed entry that had to be un-written. Quest-specific detail and per-file knowledge are low-risk to write live (they're scoped/superseded naturally); BUG-BESTIARY/post-mortems generalize across tickets, so they wait until the fix is verified and the quest is closing.

## Category → etanah-knowledge file

| Category | File |
|---|---|
| DB schema · `@Column`/`@Table` · canonical query · `aplikasi_id` join | `DATABASE.md` |
| bean/class convention · package boundary · populator framework | `MODULE-ARCHITECTURE.md` |
| composite · EL binding · `selectOneMenu`/listener wiring · xhtml pattern | `JSF-WIRING.md` |
| BPMN · tugasan · langkah · skrin routing · `userTask` vs `callActivity` | `FLOWABLE-WORKFLOWS.md` |
| Malay term · urusan code · business rule | `DOMAIN-GLOSSARY.md` |
| verified permohonan-tugasan-user tuple | `TEST-PERMOHONAN-INDEX.md` |
| UX pattern · mode-binding convention | `FRONTEND-PATTERNS.md` |
| cross-urusan flow · role/peranan map | `URUSAN-FLOW.md` / `PERANAN-MAP.md` |
| known issue we cannot fix yet | `DEFERRED-CRITICAL-ISSUES.md` |

## Steps

1. Read the gate's stderr nudge — it names the active QA + phase, not the category (that's model judgment)
2. Classify the finding against the table above — quest-specific vs durable, and if durable, which file
3. Write it NOW (Edit/Write the target file) — do not defer to session-end DE sweep
4. State what was saved + where, in the reply — the literal phrase `saved to <file>` / `→ <FILE>.md` / `updated QA-<n>.md` silences the gate next turn (matches its `ALREADY_SAVED_RX`)

## Output format (mandatory, 1 line)

```
saved → <etanah-knowledge/melaka/FILE.md | QA-<n>.md>: <one-line description of what was written>
```

## Banned

- Writing a live/unverified hypothesis to `BUG-BESTIARY.md` or `main/post-mortems.md` before Phase-2 close
- Letting findings pile up for the session-end DE sweep when the gate already nudged this turn
- Saving without the 1-line confirmation (the gate will nag again next turn — that's the intended deterministic check)

## Cross-references

- `.claude/hooks/quest-knowledge-save-gate.js` — the Stop hook that fires this trigger
- `Feature/Domain-Expansion/expansion-protocol.md` Step 7 — session-end sweep (catches anything this skill missed)
- `quest/quest-protocol.md` — Phase 2 Closure (where BUG-BESTIARY/post-mortem entries are finally written)

---

*Atomic primitive skill. Companion to `quest-knowledge-save-gate.js` v2. register_event=NONE (skill, not a hook registration).*
