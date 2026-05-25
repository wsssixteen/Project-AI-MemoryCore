# Handover — Project Structure Compliance

> **Type**: Handover / planning capture. **NOT an implementation.**
> **Status**: 🔒 Deferred — do NOT design or build until the CLAUDE.md / main-context
> architecture revamp (todo.md Q1) is complete.
> **Created**: 2026-05-22 by Ruri, at みや's request.
> **Owner of the eventual build**: みや + Ruri, post-revamp.

---

## 1. Why this file exists

みや (2026-05-22): *"I believe we should have a project structure compliance so that our
project folders are aligned with our architecture — that it may function & be managed
properly. It is part of enforcement, but do not implement it yet. Only after I've done with
the new architecture revamp."*

This file **captures the idea** so it is not lost, and so that whoever picks it up after
the architecture revamp has the full framing. It deliberately does **not** design the
mechanism — designing now would build against folder conventions the revamp is about to
change.

The immediate concrete trigger: the `QA-261659/` folder was just created for a
colleague-assist ticket, and it needed a `QA-261659.md` index doc *by hand* to be
"compliant" — there was no check that would have caught its absence. That is the gap this
mechanism should close.

---

## 2. The problem (plain terms)

Project folders drift from the architecture's expectations:

| Plain symptom | Why it matters |
| --- | --- |
| A `QA-NNNN/` folder exists but has no `QA-NNNN.md` index doc | The folder can't be navigated or audited without opening every file |
| Loose files sit in `projects/coding-projects/active/` root instead of a ticket subfolder | The root becomes a dumping ground; ownership of a file is ambiguous |
| A Task folder's name doesn't follow the `<NN>. <type> #<num> - <env> - ...` convention | Sync scripts + reconciliation diff break on it |
| `active.txt` says a quest is archived but the folder is still in `active/` (or vice-versa) | State and disk truth disagree — already a known recurring drift |
| A `Feature/` folder is missing its expected docs / version footer | The system extension can't be reasoned about consistently |

These are individually small; collectively they erode the architecture's "function &
manage properly" property.

---

## 3. What みや wants — restated

A **project structure compliance** capability: a check that verifies project folders are
aligned with the architecture's expected structure, surfacing drift. みや framed it as
*"part of enforcement"* — i.e. it should catch non-compliance, not just describe it.

---

## 4. Step 0 finding — this is mostly a CONSOLIDATION, not net-new

Per System-Design Discipline Step 0 (refine before introducing): several existing
mechanisms already touch folder/structure correctness in scattered ways. The eventual
design should **consolidate and extend these**, not add a fully parallel mechanism.

| Existing mechanism | What it already does | Gap it leaves |
| --- | --- | --- |
| DE boot reconciliation autoscan (`expansion-protocol.md` signal #1) | Diffs `active.txt` vs disk truth — Tasks vs Archive, git branches, Fix/ folder, post-mortems, diary | Only checks quest *state* consistency, not folder *contents* (e.g. missing `QA-NNNN.md`) |
| `/verify` skill | Universal workflow-checkpoint verification (Phase 0 / Apply / Phase 1 close / DE Checklist D) | Verifies workflow steps, not folder structure |
| `ticket-gate.js` hook | Injects Phase-0 checklist on quest signals | Fires on quest events, not a structure audit |
| quest-protocol Phase 0/2 + CLAUDE.md "Folder format hard rule" | Mandates `<NN>. <type> #<num> - ...` Task-folder naming; Phase 2 archival | Prose rules, fire only if Claude pattern-matches; no deterministic scan |
| Amendment A3 | `QA-NNNN.md` is the per-quest record, created at quest-accept | No check that it actually exists |

**Implication**: the compliance mechanism is likely a *thin consolidating layer* over the
DE autoscan + a deterministic folder scan — not a brand-new subsystem. The revamp may also
move some of these, which is exactly why this is deferred.

---

## 5. Scope sketch (observations only — NOT a spec)

To be decided properly at design time. Captured here so the thinking isn't lost:

- **Folder types that have an expected structure**: `projects/coding-projects/active/QA-NNNN/`
  (expects `QA-NNNN.md`, optionally `early-diagnostic.md`), `Tasks/Melaka/<NN>. ...`
  (naming convention), `Feature/<Capital-Hyphenated>/` (expects docs + version footer),
  `.claude/skills/<lowercase-hyphenated>/` (expects `SKILL.md`), `daily-diary/`, `quest/`.
- **Assist folders** (like `QA-261659/`) are a distinct type — a `QA-NNNN.md` but no
  quest lifecycle, and deliberately absent from `active.txt`. The compliance check must
  not flag these as "missing from active.txt".
- **Naming-tier convention** already exists (CLAUDE.md System-Design Step 5: Tier 1/2/3) —
  compliance should reuse it, not redefine it.

---

## 6. Open questions for the post-revamp design session

1. **Enforcement surface** — boot-time scan (like DE autoscan)? a hook? a `/verify`-style
   skill? Extend DE autoscan vs separate? (Step 0 leans toward extending DE autoscan.)
2. **Warn vs hard-fail** — surface drift as Standing Flags (DE-style, non-blocking) or
   block an action? みや said "enforcement" — clarify which.
3. **Scope** — which folder trees are in? Just `projects/` + `Tasks/`, or also `Feature/`,
   `.claude/skills/`, `quest/`?
4. **Per-type structure registry** — where does "what each folder type must contain" live?
   A single declarative manifest file the check reads, vs hard-coded.
5. **Auto-fix vs report-only** — should it offer to create a missing `QA-NNNN.md`, or only
   report? (Per Step 5b, v1 reports + confirms; auto-fix is a v2+ candidacy.)
6. **Interaction with the revamp** — the revamp reshapes `.claude/` + skills + protocol
   files. The expected-structure registry must be written against the *post-revamp* layout.

---

## 7. Next step (when un-deferred)

When the architecture revamp is done:

1. Run **System-Design Discipline** Steps 0–6 against this idea (Step 0 already started — §4).
2. Emit a **Design Memo** (net-new vs refine-of-DE-autoscan — likely refine).
3. Get みや's explicit nod (Step 5b — v1 always confirms before acting).
4. Build v1 as report-only with confirmation; review automation candidacy at v2+.

**Do not skip to step 4.** This file is the input to step 1, not a substitute for it.

---

*Handover doc — lowercase-hyphenated (Tier 3 artifact, not a Feature folder yet). When the
mechanism is designed, it becomes a proper `Feature/Project-Structure-Compliance/` folder.*
