---
name: reference_flowable_alter_tool
description: Melaka alter tickets (PROD too) are run by Ruri with E:\Dev\scripts\FlowableAlter\alter.js — dry-run gives an approval code, miya approves it in chat, --approve runs it; keeper.js holds the login
metadata:
  type: reference
---

**🚨 STAGING / MLIT = PAGE-FREE, NO LOGIN (2026-10-28 per miya, 262027)**: run the alter page's own Java code straight on the DB — `powershell -NoProfile -ExecutionPolicy Bypass -File E:\Dev\scripts\AlterSim\as.ps1 -Env stg1|stg2|mlit -Id <ID> -Target <KOD>` = rollback trial; same + `-Commit` = the real alter (commits only on a clean run). Then `node E:\Dev\scripts\FlowableAlter\alter.js live --env stg|mlit --id <ID>` must show LINKED. Never ask him for a keeper login for stg/mlit. PROD stays on alter.js + his approval code below.

**Tool**: `E:\Dev\scripts\FlowableAlter\` (outside git; README there). Drives the "Pelupusan Flowable Alter Page" headless for prod / stg / mlit.

- `alter.js ... --dry-run --headless` → plan + `APPROVAL CODE: XXXX-XXXX` (plan sealed in `logs\plans\`).
- miya approves in chat ("approve XXXX-XXXX", or an AskUserQuestion option carrying the code) → same command + `--approve XXXX-XXXX`.
- `domain/prod-alter-gate` (MemoryCore hook) blocks a PROD run without his approval; alter.js stops if the live page differs from the sealed plan; code single-use, 60 min.
- Built-in AFTER check: new live `umm_a_tgsn` row of the target kod within 90 s → `VERIFIED`, else exit 6.
- Login: `keeper.js` (scheduled task "FlowableAlter Keeper", every 10 min) keeps the saved CAS session alive (DPAPI, `%USERPROFILE%\.flowable-alter\`). Exit 4 = logged out → ask miya once for `node keeper.js --login --env prod`. Optional stored login = `--setup-login`, typed by miya himself; Ruri never sees or types it.
- PROD through the browser tools (clicking Proceed in Edge) is banned: only alter.js, where the gate and the seal apply.

Built 2026-10-21 per miya's /goal ("why can you not run an alter patch ticket when we already have access through the UI"). Procedure rows: [[feedback_flowable_node_edge_trace]] + ALTER-TICKET-PLAYBOOK (A0–A4 still decide the target node first).
