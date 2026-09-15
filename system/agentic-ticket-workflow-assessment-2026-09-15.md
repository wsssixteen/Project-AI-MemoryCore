# Improvement Sweep — 2026-09-15

Session: OMLPS "tujuan/tanah tiada pilihan" adhoc → #279709 (dropdown bug) + #279882 (M081 date patch).

| Axis | Instance this session | Verdict |
|---|---|---|
| **A1 agentic system** | Worktree could not write the base `.claude/auto-memory/` (the live dir); `feedback_adhoc_full_quest.md` landed in the worktree copy, reaching main only via merge. Friction, handled. | minor — no proposal; DE merge covers it |
| **A2 quest workflow** | Adhoc with real DB/code investigation ran 3 guesses BEFORE `/quest` was invoked. The rule alone (feedback_adhoc_full_quest) is prose. | → proposal A3 logged: adhoc-quest gate (nudge when etanah investigation tools fire with no active quest) |
| **A3 debugging accuracy** | THREE premature root causes, each refuted by miya's next screenshot (migration-didn't-carry / key-PDTJ / key-2027-cascade). Root = concluding past verified evidence. | fix = `feedback_adhoc_full_quest.md` + slip `reask/hallucination`; the mechanical follow-up is proposal A3 |
| **A4 etanah issue-solving** | Migrated lesen split into TWO unlinked `id_pengenalan` records — portal `MIGRATOR_MOHON_PLP` PLPS stub vs fail-format DMMLMS holding the No LPS. Keying the wrong one lands OMLPS on an empty stub. | → proposal A4 logged: BUG-BESTIARY entry at #279709/#279882 Phase-2 (knowledge distill only at Phase 2) |
| **A5 sweep / file sweep** | none this session | ⏭ nothing to sweep |

Both proposals logged via `core/slips.js --type proposal` (A3, A4) → weekly audit rules BUILD/DROP/DEFER.
