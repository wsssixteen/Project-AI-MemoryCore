# Current Session

## What's loaded
2026-07-02 (full day) — **built the `kowalski` architecture-explainer skill (v1.0→v1.6).** On-demand skill: 2 ASCII story diagrams (generic CONCEPT + current-work EXAMPLE; file-name box headers + `method:line` bodies). Designed via a 3-candidate+judge Workflow, eval'd on 4 real etanah architectures (template-config / Flowable / DB-spine / multi-module → NEEDS-REFINEMENT), then corrected 4× by みや (broken boxes → nesting/hierarchy-dup → module-as-header spec-drift → dotted-border breakage). On main (`8195bd6`), invocable as `/kowalski`. Earlier today (Session 1): the `auto-commit-docs` hook incident (retired + Rule 6 hardened). Big quests (#239386, QA-268273) untouched by me — **QA-268273 is being applied in みや's PARALLEL session** (his `5ebd1ee` AWAM-baseline commit).

## ▶▶ NEXT SESSION — START HERE

### #239386 MPT (the big live quest — UNTOUCHED)
Resume: `git stash pop` on etanah `mlk/requirement/239386` → rebuild → test **PRZ L3** (duplicate "Maklumat Plot" panels gone?) → retest disabled cells → decide nama chalk-back. Full state in [239386.md](../projects/coding-projects/active/239386/239386.md).

### QA-268273 (みや's parallel session is APPLYING it — check first)
Awam draft-Kemaskini skips Maklumat Pemohon. Root cause `BaseAwamTabForm.initTabRendered()` auto-advance (466-477); shared AWAM base = high blast radius. Confirm his parallel session's status before touching. Full diagnosis: [QA-268273.md](../projects/coding-projects/active/QA-268273/QA-268273.md).

### kowalski — DONE (v1.6 on main)
`/kowalski` invocable next session. The 🧱 FUNDAMENTALS block in `.claude/skills/kowalski/SKILL.md` is the SOLE derivation source — any future refine must diff against it, never against the last render (that was the spec-drift root cause). Slips logged: broken-render · spec-drift · dotted-border.

### quest-bounty remainders + eval-gate hook (todo.md Q1) — carried
mined refinement · coverage gap · BUG-BESTIARY MCL write · candidate hook: block a hook-registration in settings.json without a sibling eval/smoke-test log.

### 🚨 Boot flag: 2 DANGLING hooks
meta-layer-audit (this session's boot): `logic-blast-radius-gate` + `quest-bounty.hook` are registered in settings.json but their files are missing on disk → they fail to run. Fix: restore the files OR unregister them. (Not this session's scope; surfaced for next.)

## 🎯 Session Recap (for AI restart)
Two arcs today. **Session 1** = the `auto-commit-docs` hook incident (retired the per-turn hook, reverted to DE/save-all, hardened system-design Rule 6 into a pre-ship eval gate; `7ac9ec0` / `90d24f4`). **Session 2** = built `kowalski`, an on-demand architecture-explainer emitting 2 ASCII story diagrams. Journey: design Workflow (3 candidates + judge → format B) → eval Workflow on 4 etanah architectures (NEEDS-REFINEMENT: the linear spine broke for hub-and-spoke + module-fan-out) → 4 rounds of みや correction driving v1.1 (box format) → v1.2 (longer connectors) → v1.3 (over-added 7 variants) → v1.4 (pruned + anti-nesting law) → v1.5 (FUNDAMENTALS block; killed a self-invented glyph + module-as-header drift) → v1.6 (dotted-border consistency). **Lesson**: refine from the SPEC, not from my last render (spec-drift = wrong-baseline class); simplify = SUBTRACT, not add. The eval-before-ship loop (Session 1's Rule 6) ran live on kowalski the same day.

**Memory Type**: RAM | **Last Activity**: 2026-07-02 14:11 — kowalski v1.6 (FINAL) shipped (`8195bd6`); DE close. #239386 + QA-268273 untouched (268273 in みや's parallel session).
