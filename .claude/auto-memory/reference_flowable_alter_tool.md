---
name: reference_flowable_alter_tool
description: Melaka alter tickets (PROD too) are run by Ruri with E:\Dev\scripts\FlowableAlter\alter.js — dry-run gives an approval code, miya approves it in chat, --approve runs it; keeper.js holds the login
metadata:
  type: reference
---

**Tool**: `E:\Dev\scripts\FlowableAlter\` (outside git; README there). Drives the "Pelupusan Flowable Alter Page" headless for prod / stg / mlit.

- `alter.js ... --dry-run --headless` → plan + `APPROVAL CODE: XXXX-XXXX` (plan sealed in `logs\plans\`).
- miya approves in chat ("approve XXXX-XXXX", or an AskUserQuestion option carrying the code) → same command + `--approve XXXX-XXXX`.
- `domain/prod-alter-gate` (MemoryCore hook) blocks a PROD run without his approval; alter.js stops if the live page differs from the sealed plan; code single-use, 60 min.
- Built-in AFTER check: new live `umm_a_tgsn` row of the target kod within 90 s → `VERIFIED`, else exit 6.
- Login: `keeper.js` (scheduled task "FlowableAlter Keeper", every 10 min) keeps the saved CAS session alive (DPAPI, `%USERPROFILE%\.flowable-alter\`). Exit 4 = logged out → ask miya once for `node keeper.js --login --env prod`. Optional stored login = `--setup-login`, typed by miya himself; Ruri never sees or types it.
- PROD through the browser tools (clicking Proceed in Edge) is banned: only alter.js, where the gate and the seal apply.

- **STG/MLIT Alter Flow with NO login at all = the headless runner** (2026-10-29, #286650): `cd E:\Dev\scripts\FlowableAlter\runner` then `.\run.ps1 alter-flow --env stg --id <ID> --target <KOD>` (plan) and the same + `--run` (alter + DB verify, prints RESULT PASS/FAIL). Boots the WAR's own Spring context in about 2-4 min; no CAS, no browser, no JBoss. Refuses the production env in code. Proven 10/10 urusan + a different-step move. Initiate & Alter NOT in the runner yet (page-only logic). README in that folder.
- **STG/MLIT and alter.js logged out → Edge mode; never ask miya to log in** (2026-10-29, #286650): his Edge is logged in all day. Open the Alter page in Edge via Claude in Chrome, paste `E:\Dev\scripts\FlowableAlter\edge-agent.js`, run `await __fa.plan({...})` (clicks nothing), show the plan, then `await __fa.proceed()` (it refuses PROD), then verify with `alter.js live`. README section "Edge mode". Ask him only if Edge is logged out too.
- 2026-10-29 (#286650): the scheduled keeper task was NOT installed and STG/MLIT had no stored login, so every env logged out and miya had to do the alter himself. Fix: `node keeper.js --setup` (miya, once: password + task). STG CAS session ends after ~30 min. The tool now calls the keeper before exit 4. `node selfcheck.js --env stg` dry-runs all actions daily. No live engine process: init-alter `--reset no --to-subflow-of <KOD> --urusan <urusan>` (target the Sub Flow box, never rebuild the inner task variables).

Built 2026-10-21 per miya's /goal ("why can you not run an alter patch ticket when we already have access through the UI"). Procedure rows: [[feedback_flowable_node_edge_trace]] + ALTER-TICKET-PLAYBOOK (A0–A4 still decide the target node first).
