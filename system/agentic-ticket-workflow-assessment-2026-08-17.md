# Agentic ticket-workflow assessment — 2026-08-17 (DE 7.5, post-midnight session)

| Axis | Assessment (concrete instance) |
|---|---|
| A1 agentic system | Rule 10 (requirements-conformance) shipped but is PROSE — the sweep-build miss proves prose rules leak. Mechanical follow-up proposed below. Instance: /sweep 12/12 eval-green yet missing 2 conversation-only requirements. |
| A2 quest workflow | Phase-0 awareness became mechanical: bug-db injection (eval 6/6) fires on ticket mention; 7 swept quests carry resume points + phase fields — tomorrow's one-ticket-one-session flow is board-driven. Instance: QA-275009 board row names its audit file first. |
| A3 debugging efficiency | test-data-db kills the recurring live-task-state re-derivation cost (eval 5/5, output leads with the live-state rule). Instance: PPTPB lookup returns recipe + staleness in <1s vs a fresh SQL derivation cycle. |
| A4 etanah issue-solving | W4 adversarial audits changed conclusions on 3 of 4 audited tickets (275009 W2 REFUTED; 275456 save-site claim REFUTED + regression-commit found; 275500 4 doc claims corrected). Two-independent-passes + refute-don't-agree is now proven on real tickets, not just theory. |
| A5 sweep | First live run green (13/13, 0 errors, 22 min) BUT W1 video handling is best-effort: familiars listed videos in gaps[] and no frame extraction was verified. Controller did not surface a gaps column in the report table — silent-cap risk. |

Proposals logged via core/slips.js (each with eval case): see 💡 Open proposals in slip-dashboard.
