---
name: logic-blast-radius
description: Use when about to Edit a stateful-flow etanah .java file (Form/Bean/Handler/Helper/Service/Controller/Manager) during an active quest — enumerate every action×state path the change touches before editing. Trigger phrases — "blast radius", "logic blast radius", "scenario matrix", "init() fix", "stateful flow", "does this fire on every click", "what else calls this", "state x trigger matrix". Structural defender = logic-blast-radius-gate.js PreToolUse hook, which HARD-BLOCKS the Edit until this matrix's banner appears in-session. Built 2026-07-02 (QA-268273).
metadata:
  type: discipline-primitive
  sub-layer: discipline
  meta-layer-INDEX: meta/discipline-INDEX.md
---

# logic-blast-radius — scenario-matrix gate for stateful-flow edits

## What the banner is

`logic-blast-radius-gate.js` blocks any Edit/Write to an etanah `*Form|Bean|Handler|Helper|Service|Controller|Manager.java` path while `quest/active.txt` has `status=active`, UNLESS this session's transcript already contains the literal banner `═══ LOGIC BLAST RADIUS ═══` (or ASCII `===` form). It checks the matrix **exists** (anti-skip) — it does NOT verify the matrix is complete or correct. That judgment stays on Ruri + みや.

## When this fires

| Trigger | Condition |
|---|---|
| Hook (deterministic) | Edit/Write target matches stateful-flow `.java` path AND an active quest is open |
| Skill (manual/description) | "blast radius", "scenario matrix", "init() fix", "stateful flow" mentioned, or before proposing a fix that touches page-init / an action handler / a shared Service-Helper-Manager |

## The matrix template (mirrors CLAUDE.md v1.57 Rubric row h)

Emit BEFORE the Edit, one row per **action × state** combination the change participates in — page init/entry, each action handler that reaches the changed code, and any re-entry/reload path:

```
═══ LOGIC BLAST RADIUS ═══
| Scenario (action × state) | Change fires? | Outcome | Safe? | Evidence (file:line/test) |
|---|---|---|---|---|
| initData() — first page load                | Y/N | <what happens> | ✓/✗/⚠ | <file:line or test> |
| <actionListener> — user clicks X, state=A    | Y/N | <what happens> | ✓/✗/⚠ | <file:line or test> |
| <actionListener> — user clicks X, state=B    | Y/N | <what happens> | ✓/✗/⚠ | <file:line or test> |
| postback/re-entry — bean re-init on reload   | Y/N | <what happens> | ✓/✗/⚠ | <file:line or test> |
```

Every `Outcome`/`Safe?` cell MUST cite an OBSERVED `file:line` or a live test/log — an ASSUMED verdict is banned; go read the code or run the test first.

## Worked example — QA-268273 (arms-on-every-click)

**Bug shape**: a fix set an "armed" flag inside a single button's `actionListener`, assuming it only fires once. The class chain showed the SAME listener method is bound to 4 buttons sharing one bean — the flag armed on EVERY click, not just the intended one.

```
═══ LOGIC BLAST RADIUS ═══
| Scenario (action × state)              | Change fires? | Outcome                          | Safe? | Evidence |
|---|---|---|---|---|
| Simpan click — state=DRAFT             | Y | flag armed, save proceeds        | ✓ | Form.java:212 |
| Hantar click — state=DRAFT             | Y | flag armed again — unintended    | ⚠ | Form.java:245 (same listener binding) |
| Batal click — state=DRAFT              | Y | flag armed, cancel short-circuits| ✗ | Form.java:260 — cancel now silently saves |
| Semak click — state=SUBMITTED (reload) | Y | flag re-armed on postback        | ✗ | Form.java:120 initData() rebinds bean |
```

The matrix surfaced the ✗ rows the original 1-scenario fix never considered — Batal and the postback path were never traced before the edit shipped.

## Bypass

`[skip-logic-blast: <reason>]` anywhere in the session — for a genuinely non-stateful change wrongly matched by the filename pattern, or an audit/compliance walkthrough. Visible in transcript; not silent.

## What this does NOT do

- Does NOT prove the fix correct — a shape-valid but shallow matrix (missing a real path) still PASSES the hook.
- Does NOT replace Rubric row (h) in the Quest workflow — this IS that row, hoisted to a hook-enforced primitive.
- Does NOT fire on templates/config/xhtml/.docx or non-stateful classes (DTOs, constants, utils without the suffix pattern).

## Cross-references

- `.claude/hooks/logic-blast-radius-gate.js` — the PreToolUse hook enforcing this
- `quest/quest-protocol.md` "🚨 Logic Blast Radius" — Rubric row (h) origin
- `.claude/skills/predicate-box/SKILL.md` — sibling primitive for single-assumption pre-edit proof; this skill is the multi-path scenario-matrix version for stateful-flow classes specifically

---

*Discipline primitive skill. Built 2026-07-02 (QA-268273) as the structural procedure paired with `logic-blast-radius-gate.js`.*
