# Agentic ticket workflow assessment — 2026-10-27 (session esokongan-quest-sweep, 286315 + 286462)

| Axis | Assessment, with the instance | Proposal logged |
|---|---|---|
| A1 agentic system | Replies about system changes listed parts with no kind; miya could not tell a Tool from a Feature. Now blocked by `system-change-title` v2. ASCII story trees were still used to explain the hierarchy until he asked for the diagram skill. | system-change-title: want a sent picture for a 3+ box flow |
| A2 quest workflow | The 286462 hand-over note went out with a TSO report read as a BA spec and two invented Sepatutnya rows. `handover-check.js` + gate now catch both, but the clean line can be pasted without a run, and the Redmine tab is not compared with the checked draft. | stamp check · tab-vs-draft compare |
| A3 debugging | 286315: the A73 adhoc had already proven the fix; the ADHOC-REGISTER compare was skipped at Phase 0 and miya caught it. Existing rule, not a new gap. | A3 ⏭ covered by the existing ADHOC-REGISTER Phase 0 row |
| A4 etanah issue-solving | Fatin answered 286462 with Requirement #222056 in minutes; the requirement-index Tool (2083 Melaka Requirement tickets) existed and was never run before the hand-over. | run requirement-index before any Sepatutnya row |
| A5 sweep | Nothing swept this session. | A5 ⏭ no sweep run |

# Agentic ticket workflow assessment — 2026-10-27 (session surat-tawaran-missing-e1e49c)

| Axis | Assessment (concrete instance) | Proposal logged |
|---|---|---|
| A1 agentic system | `lib/audit-briefing.js` run from this worktree printed "0 hook fires · 0 turns" while hooks fired all session; the telemetry is read from the worktree, not the main checkout. | yes (A1, main-checkout telemetry) |
| A2 quest workflow | Step 6f (code fix → ask BA/TSO for a ticket) shipped as prose with a `Code-fix route:` line; nothing checks the line is emitted. | yes (A2, Stop check for the route line) |
| A3 debugging | The NPE trace went from the error-store row to `PelupusanWordEditorHelperForm.java:3494`, then `git log -L` on that line gave commit 4422003a204 (reader switched to the approved unit), then the writer. That took 3 hops and no wasted reads. ⏭ no new idea. | — |
| A4 etanah issue-solving | Root cause = a reader switched to `getUnitKuantitiDilulus()` while the only PRBB writer has `setUnitKuantitiDilulus` commented out (`PelupusanService.java:11294`); 98 permits carry the null. | yes (A4, reader-changed-field writer sweep) |
| A5 sweep / file sweep | ⏭ no sweep ran this session. | — |
