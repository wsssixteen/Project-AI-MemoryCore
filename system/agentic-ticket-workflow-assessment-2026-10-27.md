# Agentic ticket workflow assessment — 2026-10-27 (session surat-tawaran-missing-e1e49c)

| Axis | Assessment (concrete instance) | Proposal logged |
|---|---|---|
| A1 agentic system | `lib/audit-briefing.js` run from this worktree printed "0 hook fires · 0 turns" while hooks fired all session; the telemetry is read from the worktree, not the main checkout. | yes (A1, main-checkout telemetry) |
| A2 quest workflow | Step 6f (code fix → ask BA/TSO for a ticket) shipped as prose with a `Code-fix route:` line; nothing checks the line is emitted. | yes (A2, Stop check for the route line) |
| A3 debugging | The NPE trace went from the error-store row to `PelupusanWordEditorHelperForm.java:3494`, then `git log -L` on that line gave commit 4422003a204 (reader switched to the approved unit), then the writer. That took 3 hops and no wasted reads. ⏭ no new idea. | — |
| A4 etanah issue-solving | Root cause = a reader switched to `getUnitKuantitiDilulus()` while the only PRBB writer has `setUnitKuantitiDilulus` commented out (`PelupusanService.java:11294`); 98 permits carry the null. | yes (A4, reader-changed-field writer sweep) |
| A5 sweep / file sweep | ⏭ no sweep ran this session. | — |
