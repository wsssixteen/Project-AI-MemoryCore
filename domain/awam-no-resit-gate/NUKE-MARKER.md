# NUKE-MARKER — awam-no-resit-gate

| Field | Value |
|---|---|
| Created | 2026-07-22 |
| Session | みや `/goal` item 4 — *"build what failed this"*. ESOKONGAN #271721: a PRBB AWAM ticket ran Phase 0 → Rubric → Apply → a full Test Scenario emit with **no No Resit Carian Rasmi**. みや was testing whether I would derive it automatically. I did not. |
| Files | `domain/awam-no-resit-gate/awam-no-resit-gate.check.hook.js` · `awam-no-resit-gate.eval.js` · `README.md` · `NUKE-MARKER.md` · `log.jsonl` · `.claude/settings.json` Stop entry (~line 369) · one `meta/registry.jsonl` row |
| Rollback | `rm -rf domain/awam-no-resit-gate` · remove the Stop entry from `.claude/settings.json` matching `awam-no-resit-gate` · delete the `"awam-no-resit-gate"` line from `meta/registry.jsonl` · `git revert <SHA>` |
| Retire | 2026-08-21 (creation + 30d) — delete if it has fired ≥1× and no rollback |

## Root cause it kills

The rule already existed **as prose** in a boot-loaded file:

> CLAUDE.md:181 — *"🚨 AWAM + No-Resit-urusan → derive the No Resit Carian Rasmi at Phase 0 … **Banned**: handing back an AWAM carian-rasmi ticket with 'need a No Resit from BA'"*

I read CLAUDE.md at boot on 2026-07-22 and still shipped a full test scenario without it. The deterministic row that would have caught it was **explicitly parked**:

> current-session.md 2026-07-20 — *"Parked: No-Resit Phase-0 gate row in `ticket-gate.js` (prose exists in CLAUDE.md; deterministic row not built)"*

Grep confirms `ticket-gate.js` contains zero `resit` / `carian` matches. **Prose in a boot file is not enforcement.** This hook is the enforcement.

## False-positive cost

Blocks a hand-back until a receipt is present or `[skip-no-resit: <reason>]` is used. Guarded four ways so a wrong block is unlikely: requires a hand-back phrase **AND** an AWAM signal **AND** a word-boundary match on one of the 5 urusan **AND** absence of a receipt pattern. `stop_hook_active` prevents re-block loops. 7 negative fixtures in the eval cover the near-misses (pelupusan ticket naming PRBB, AWAM PLPS, mid-work narration, bypass, re-entrancy).

## Blast radius if wrong

Stop-side only — it can never corrupt code or data. Worst case is a nuisance block, clearable in one line with the bypass token.
