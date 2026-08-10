---
name: logic-blast-radius
description: Use when about to Edit a stateful-flow etanah .java file (Form/Bean/Handler/Helper/Service/Controller/Manager) during an active quest — enumerate every action×state path the change touches before editing. Trigger phrases — "blast radius", "logic blast radius", "scenario matrix", "init() fix", "stateful flow", "does this fire on every click", "what else calls this", "state x trigger matrix", "data-supply blast radius", "skip stops creating data", "if (!URS_X) skip", "downstream consumer null". ⚠️ ADVISORY-ONLY today — the planned logic-blast-radius-gate.js PreToolUse hook was NEVER BUILT (ghost-claim corrected 2026-07-19 system-check); the discipline relies on this skill firing. Built 2026-07-02 (QA-268273).
metadata:
  type: discipline-primitive
  sub-layer: discipline
  system-layer-INDEX: system/discipline-INDEX.md
---

# logic-blast-radius — scenario-matrix gate for stateful-flow edits

## What the banner is

⚠️ **PLANNED, NOT BUILT** (corrected 2026-07-19 — system-check found the gate file exists nowhere in the repo; this section described intent as fact for 17 days): the DESIGN was — `logic-blast-radius-gate.js` blocks any Edit/Write to an etanah `*Form|Bean|Handler|Helper|Service|Controller|Manager.java` path while `quest/active.txt` has `status=active`, UNLESS this session's transcript already contains the literal banner `═══ LOGIC BLAST RADIUS ═══` (or ASCII `===` form) — existence-check only, completeness stays on Ruri + みや. Until the gate is built, emitting the banner before such edits is skill-discipline, not enforced.

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

## Reverse direction — a skip/guard that STOPS producing data (added 2026-08-10, #261049×#273461)

The matrix above catches "does my change fire on paths I didn't intend?" This catches the **inverse**: "does my change STOP writing data that something downstream assumes exists?"

**Fires when a diff**: adds `if (!URS_X){ create/populate/save }` (or any `if`/early-`return` that gates a create), removes a setter/save call, or narrows when a field/row gets written. A skip that removes data creation just **moves the crash downstream** — it is as dangerous as a null-deref.

**Rule**: enumerate every DOWNSTREAM consumer that READS the now-unwritten field/row, and confirm each null-guards it. One row per reader, each cell an OBSERVED `Class.method():line`.

```
═══ DATA-SUPPLY BLAST RADIUS ═══
| Field/row no longer written (by this skip) | Downstream reader Class.method():line | Guards null? | Safe? | Evidence |
|---|---|---|---|---|
| <col/row> for <urusan/state>              | <Class.method():line>                 | Y/N          | ✓/✗/⚠ | <file:line> |
```

**Worked example — #261049 × #273461 (PLPS Jana NPE)**:

```
═══ DATA-SUPPLY BLAST RADIUS ═══
| Field no longer written                         | Downstream reader                                                    | Guards null? | Safe? | Evidence |
|---|---|---|---|---|
| umm_a_permit_lesen.versi_permit_lesen_id (PLPS) | PelupusanService.saveMaklumatPermitLesen():17026 vpl.getPermitLesen() | N | ✗ | PelupusanService.java:17028 NPE |
| umm_a_permit_lesen.no_permit_lesen (PLPS)       | (same method, permit lookup null → enters vpl branch)                | N | ✗ | PelupusanService.java:17022 |
```

`#273461` wrapped `saveNoPermitLesen` + `saveMaklumatPermitToInduk` in `if (!URS_PLPS)` (`MlkPengiraanBayaranLesenForm.java:644`) → for PLPS those fields stop being written → the one downstream reader (`saveMaklumatPermitLesen`, unguarded since `#261049`) NPEs. That reader was never enumerated when the skip shipped. **Check: any `if (!URS_X)` around a create/save demands a grep of every reader of what it stopped writing.**

## Bypass

`[skip-logic-blast: <reason>]` anywhere in the session — for a genuinely non-stateful change wrongly matched by the filename pattern, or an audit/compliance walkthrough. Visible in transcript; not silent.

## What this does NOT do

- Does NOT prove the fix correct — a shape-valid but shallow matrix (missing a real path) still PASSES the hook.
- Does NOT replace Rubric row (h) in the Quest workflow — this IS that row, hoisted to a hook-enforced primitive.
- Does NOT fire on templates/config/xhtml/.docx or non-stateful classes (DTOs, constants, utils without the suffix pattern).

## Cross-references

- ~~`.claude/hooks/logic-blast-radius-gate.js`~~ — PLANNED gate, never built (see ⚠️ above); build-candidate if the skill alone keeps slipping
- `quest/quest-protocol.md` "🚨 Logic Blast Radius" — Rubric row (h) origin
- `.claude/skills/predicate-box/SKILL.md` — sibling primitive for single-assumption pre-edit proof; this skill is the multi-path scenario-matrix version for stateful-flow classes specifically

---

*Discipline primitive skill. Built 2026-07-02 (QA-268273) as the structural procedure; its planned gate pair was never built (corrected 2026-07-19).*

*v1.1 — 2026-08-10. Added "Reverse direction — a skip/guard that STOPS producing data" (DATA-SUPPLY BLAST RADIUS matrix) + trigger phrases, from the #261049×#273461 PLPS Jana NPE (an `if (!URS_PLPS)` skip stopped writing `versi_permit_lesen_id`/`no_permit_lesen`; a downstream `saveMaklumatPermitLesen` deref NPE'd for ~19 PLPS permohonan). Merge-in-place per system-rules R1/R2 — extends the sibling, no new Feature. Spec-preservation: all v1.0 content (forward matrix, worked example, bypass, cross-refs) preserved; addition only.*
