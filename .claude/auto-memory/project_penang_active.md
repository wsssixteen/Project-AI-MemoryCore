---
name: project-penang-active
description: "🚨 Penang (PNG, Pulau Pinang) registered as an ACTIVE state 2026-10-14; its code is on disk at E:\\Projects\\Penang; no DB yet; where its knowledge, Redmine and branches live"
metadata:
  type: project
---

🚨 Penang (PNG) became a registered, ACTIVE state on 2026-10-14, per みや ("set everything for Penang … including installing penang into quest workflow"). Before that it had no registry record, so the knowledge hook fell back to Melaka and a Penang flowable error was answered from `melaka/` files.

**Start here for any Penang ask**: `projects/coding-projects/active/etanah-knowledge/penang/index.md` (quick card + guards), then `STATE-FACTS.md`. Registry: `node lib/states.js show penang`.

| Thing | Value (verified 2026-10-14) |
|---|---|
| Code | `E:\Projects\Penang\<repo>`, 10 repos, GitLab. Search it FIRST. codegraph `projectPath` per repo |
| Code shape | Melaka layout + `Png*` classes, `config/PNG`, `template/PNG`, `protected/png` |
| Reference state | Penang → Melaka → Terengganu (root). Knowledge migrated from Melaka by `lib/state-migration.js` with a ledger (`penang/MIGRATION-LEDGER.json`); what Penang still lacks = `node lib/state-migration.js gates --state penang` |
| Trunks | pelupusan `png/development` (team commits straight to it); awam `png/plp_development` (`png/int-env` is a stale Kedah-merge branch) |
| Redmine | `PNG_03_Pelupusan` (id 336) under "e-Tanah Pulau Pinang"; Requirement / Development tickets; team Aaron · Vincent · Izz |
| Task folder | `1. Tasks\Penang` (redmine-sync routes `PNG_*` there) |
| BPMN | `penang/flowables-bpmn/`: 17 `PNG_PLP_*` from Redmine #279199 zip (2026-09-22 snapshot). Live: modeler `http://10.16.56.22/flowable-ui/modeler/` (miya logs in) |
| DB | `jdbc:edb://10.16.65.54:5444/pgit` (EDB Postgres, given by miya 2026-10-19), user `et_main_pgit` (ticket #280747). Schemas: `et_main_pgit` · `et_sistem_pgit` · `et_dms_pgit` · `et_flowable_pgit`. CONNECTED 2026-10-19 as MCP `postgres-pgit-pg` behind the db-gateway (engine schema `et_flowable17_pgit`; a session started before the add reaches it through the gateway HTTP endpoint) |
| Permohonan prefix | `PTPNG` (from NegeriEnum.java; no live id seen) |

**Why**: 2026-10-14 I asked みや four times for files that one grep of `E:\Projects\Penang` found, said "we have no Penang BPMN" as a fact, and then called Penang "set up" while the playbook's Flowable-source check had never run (the BPMN was on Redmine #279199 and the modeler answered on 10.16.56.22).

**How to apply**: a Penang ask = Penang code + Penang folder only; say "not verified" for anything needing the DB. A state name the registry does not know now gets a "state UNREGISTERED" warning from etanah-intake-gate.

Related: [[feedback_state_aware_knowledge_load]] · [[project-terengganu-active]]
