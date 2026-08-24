# Agentic workflow assessment — 2026-08-24 (DE Step 7.5)

Session arc 2026-08-21→24: board reconcile + de-close-gate C4 + codemap v6 + knowledge bake.

| Axis | Assessment (instance-backed) |
|---|---|
| A1 agentic system | ZERO fan-out used — the codemap revamp ran entirely on deterministic scripts (scan→features→build), 3 loop iterations, cheaper + more verifiable than any familiar fleet. Instance: 9 unresolved chain nodes fixed by grep-at-build-time, not by an agent's claim. Lesson: when data is on disk, a script IS the delegation. |
| A2 quest workflow | Board rot proved DE lacked a Redmine step for months (20 stale blocks, 0 assigned-open). FIXED mechanically: C4 + redmine-reconcile.js. Residual gap: adhoc-lifecycle Door B is propose-only and I ignored its output the same day → proposal logged (unify into reconcile). |
| A3 debugging efficiency + accuracy | Entity-JAR discovery kills a whole class of dead-end greps (@Table prefix-split; 5 traps documented). SHIPPED: codemap-recon-consult now injects entity_table_map.json + features.json at Recon. Instance: "couldn't find class for ind_tgsn" now resolves in one lookup (Tugasan). |
| A4 etanah issue-solving | 12 verified feature groups = working-analog picking by group, not by grep-luck. MODULE-ARCHITECTURE.md carries the entity section; codemap v6 is the browsable form. MAX_PATH silent-skip (751/1265 files, exit 0) added to the absence-of-error-is-not-success family. |
| A5 sweep / file sweep | Attachment-ledger gate misfired on a boot-briefing turn (no diagnosis happened) — trigger reads "quest mentioned" as "quest diagnosed". Minor; watch, not build. |

Proposals this arc (all in 💡 lane): #1 recon-consult wiring — **SHIPPED** (eval 7/7) · #2 codegraph domain-JAR index (eval case: bean→repo→entity in one trace) · #3 codemap freshness automation (eval case: stamp ≤7d) · #4 (new) fold adhoc-lifecycle sweep verdicts into redmine-reconcile.js output (eval case: A-row door verdicts printed in the same run that checks Redmine).
