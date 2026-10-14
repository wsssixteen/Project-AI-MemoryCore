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
| Pelupusan trunk | `png/development`, the team commits straight to it (no ticket branches) |
| Redmine | `PNG_03_Pelupusan` (id 336) under "e-Tanah Pulau Pinang"; Requirement / Development tickets; team Aaron · Vincent · Izz |
| Task folder | `1. Tasks\Penang` (redmine-sync routes `PNG_*` there) |
| DB | NONE on this laptop: no MCP, no datasource. Ask miya for the host |
| Permohonan prefix | `PTPNG` (from NegeriEnum.java; no live id seen) |

**Why**: 2026-10-14 I asked みや four times for files that one grep of `E:\Projects\Penang` found, and said "we have no Penang BPMN" as a fact.

**How to apply**: a Penang ask = Penang code + Penang folder only; say "not verified" for anything needing the DB. A state name the registry does not know now gets a "state UNREGISTERED" warning from etanah-intake-gate.

Related: [[feedback_state_aware_knowledge_load]] · [[project-terengganu-active]]
