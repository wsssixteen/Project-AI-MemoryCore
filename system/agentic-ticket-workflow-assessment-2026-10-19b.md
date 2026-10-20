# Agentic ticket workflow assessment — 2026-10-19 (session tugasan-not-found-c0904c)

Scope: first Penang adhoc, ADHOC-PRU-2026-1 (Penang IT PRU tugasan not found after alters).

| Axis | Assessment | Instance |
|---|---|---|
| A1 agentic system | `lib/audit-briefing.js` run from a worktree reads no hook telemetry and reports 77 hooks "never fired" with RETIRE rulings; run from the main checkout it reports real fires. A wrong RETIRE list is worse than none | This DE: worktree run "0 hook fires · 0 turns", main run listed 37167-fire gates |
| A1 agentic system | `add-penang-db.py` asks for the user name first, then the password. miya typed the password at the user prompt, so it was saved as the user name and shown on screen | `backends.json` PGUSER held the password; I reset PGUSER only |
| A2 quest workflow | The adhoc brief-first gate blocked the save agent and the audit command until a turn ended with the brief, even when the brief had been given turns earlier. It cost two extra turns | Save agent blocked once, audit run blocked once |
| A3 debugging | The answer was in 4 DB reads. Before the DB was connected I spent the session on code paths that were true but not the cause | 3 replies of code theory before the first SELECT |
| A4 etanah issue-solving | The permohonan search (`CommonService.redirectPermohonanToTugasanFromDashboard`) keeps only task rows whose officer is the logged-in user; an alter that leaves the officer blank gives "tiada dalam Senarai Tugasan Pengguna ini" | Penang rows 164503, 164551, 164605 |
| A5 sweep | No sweep work this session | — |
