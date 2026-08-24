# Agentic workflow assessment — 2026-08-24 (DE Step 7.5 — TWO session arcs, merged)

## Arc 1: board reconcile + codemap v6 (session 2026-08-21→24, main)

Session arc 2026-08-21→24: board reconcile + de-close-gate C4 + codemap v6 + knowledge bake.

| Axis | Assessment (instance-backed) |
|---|---|
| A1 agentic system | ZERO fan-out used — the codemap revamp ran entirely on deterministic scripts (scan→features→build), 3 loop iterations, cheaper + more verifiable than any familiar fleet. Instance: 9 unresolved chain nodes fixed by grep-at-build-time, not by an agent's claim. Lesson: when data is on disk, a script IS the delegation. |
| A2 quest workflow | Board rot proved DE lacked a Redmine step for months (20 stale blocks, 0 assigned-open). FIXED mechanically: C4 + redmine-reconcile.js. Residual gap: adhoc-lifecycle Door B is propose-only and I ignored its output the same day → proposal logged (unify into reconcile). |
| A3 debugging efficiency + accuracy | Entity-JAR discovery kills a whole class of dead-end greps (@Table prefix-split; 5 traps documented). SHIPPED: codemap-recon-consult now injects entity_table_map.json + features.json at Recon. Instance: "couldn't find class for ind_tgsn" now resolves in one lookup (Tugasan). |
| A4 etanah issue-solving | 12 verified feature groups = working-analog picking by group, not by grep-luck. MODULE-ARCHITECTURE.md carries the entity section; codemap v6 is the browsable form. MAX_PATH silent-skip (751/1265 files, exit 0) added to the absence-of-error-is-not-success family. |
| A5 sweep / file sweep | Attachment-ledger gate misfired on a boot-briefing turn (no diagnosis happened) — trigger reads "quest mentioned" as "quest diagnosed". Minor; watch, not build. |

Proposals this arc (all in 💡 lane): #1 recon-consult wiring — **SHIPPED** (eval 7/7) · #2 codegraph domain-JAR index (eval case: bean→repo→entity in one trace) · #3 codemap freshness automation (eval case: stamp ≤7d) · #4 (new) fold adhoc-lifecycle sweep verdicts into redmine-reconcile.js output (eval case: A-row door verdicts printed in the same run that checks Redmine).

## Arc 2: ticket-preparedness build (worktree etanah-eplupusan-review, 2026-08-23→24)

> Five axes, one concrete instance per claim. Proposals logged via `core/slips.js` (💡 Open proposals on the dashboard); weekly audit rules BUILD/DROP/DEFER.

| Axis | Assessment (instance) | Forward idea (eval case) |
|---|---|---|
| A1 agentic system | Forge + birth-gate + design-consult caught a hand-built hook TWICE this session and surfaced the `bug-db` sibling I had not inventoried — the gate stack is earning its cost. Weak spot: `system-audit` flags 14 doc-drift hooks every boot and nobody actions it (noise since ≥2026-08-16). | Proposal logged (A1): auto-generate the CLAUDE.md "Triggered enforcement" hook list from `system/registry.jsonl` + settings.json at DE step 10, killing permanent doc-drift noise. Eval: census run → zero DOC-DRIFT lines at next boot. |
| A2 quest workflow | Phase-0 now has THREE deterministic registers (adhoc, latent-bugs, bug-db) + rows 1c/1d — intake is strong. Gap: nothing verifies the model actually ACTED on an injected row (injection ≠ comparison). | Proposal logged (A2): Stop-side check — when latent-bugs/adhoc injected this turn and reply contains a Phase-0 checklist, require the "match/no match" line. Eval: fixture transcript with injection but no verdict line → block. |
| A3 debugging | The counter-tujuan sweep refuted my own PT hypothesis by reading `PelupusanSpocModuleStrategy.java:781` — cheapest-falsifier-first worked. No new gap surfaced. | A3 ⏭ nothing new this session — existing Recon falsifier rules covered it. |
| A4 etanah issue-solving | Precedent docs now carry BA root-cause text (e.g. #275456 "SPOC does not save Daerah & Bandar") — Phase 0 can diff against it. Gap: docs hold list-API fields only; journals (the BA↔dev dialogue) are not pulled. | Proposal logged (A4): `urusan-tickets.js --journals <KOD>` per-urusan on-demand journal harvest into the doc's notes zone. Eval: run on PPTPB → #276436 journal decisions appear under the marker. |
| A5 sweep/file | Sweep-log discipline held (2 families, hits/verified/notes columns, out-of-scope hits logged not registered). MEMORY.md was over its 24.4KB load budget — boot warned it loads partially. | A5 DONE same session (size gate escalated it): diet 26.1KB → 16.2KB, all 108 entries kept as one-line hooks. |
