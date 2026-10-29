---
name: reference_flowable_alter_tool
description: Melaka alters (PROD too) — PROD = the page tool with a dry-run approval code that miya approves in chat; STG/MLIT Alter Flow = the headless runner (no login); the tool-by-env table = playbook A5
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

- **STG/MLIT Alter Flow with no login = the headless runner** (2026-10-29, #286650, proven 10/10 urusan): the command and the env routing live in playbook A5 (`etanah-knowledge/ALTER-TICKET-PLAYBOOK.md`); the tool's own README is `E:\Dev\scripts\FlowableAlter\runner\README.md`. Refuses PROD.
- **STG/MLIT and alter.js logged out → Edge mode; never ask miya to log in** (2026-10-29, #286650): his Edge is logged in all day. Open the Alter page in Edge via Claude in Chrome, paste `E:\Dev\scripts\FlowableAlter\edge-agent.js`, run `await __fa.plan({...})` (clicks nothing), show the plan, then `await __fa.proceed()` (it refuses PROD), then verify with `alter.js live`. README section "Edge mode". Ask him only if Edge is logged out too.
- 2026-10-29 (#286650): the scheduled keeper task was NOT installed and STG/MLIT had no stored login, so every env logged out and miya had to do the alter himself. Fix: `node keeper.js --setup` (miya, once: password + task). STG CAS session ends after ~30 min. The tool now calls the keeper before exit 4. `node selfcheck.js --env stg` dry-runs all actions daily. No live engine process: init-alter `--reset no --to-subflow-of <KOD> --urusan <urusan>` (target the Sub Flow box, never rebuild the inner task variables).
- 2026-10-29 (#286988), first real PROD run: the Alter page loads a hidden `etanahv3://` iframe; Edge's "open app?" box ate every click, so Pilih never opened. alter.js now blanks that iframe and reads flows by label. A PROD session showing MUHAMMAD AMMAR ZAQWAN (Advance Support) is normal: it is the shared dev account all devs use (miya 2026-10-29), never flag it.

- **Quest wiring (2026-10-29)**: tool-by-env table = playbook A5 (one home). `domain/alter-ticket-gate` resolves env (prompt → Task folder name) + tracker Internal Issue (PROD), finds a ticket in active.txt → active-archive.txt → the Task folder on disk, and prints only that env's tool; `quest-phase0.js` KnowledgeLoad + Synthesize read the alter layer on a flowable layer or any token-move fix.

Built 2026-10-21 per miya's /goal ("why can you not run an alter patch ticket when we already have access through the UI"). Procedure rows: [[feedback_flowable_node_edge_trace]] + ALTER-TICKET-PLAYBOOK (A0–A4 still decide the target node first).
