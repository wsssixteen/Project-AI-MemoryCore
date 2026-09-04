---
name: feedback_knowledge_schema_parity
description: "🚨 Every etanah-knowledge/<state>/ folder uses the SAME file names + layout (KNOWLEDGE-SCHEMA.json); the quest workflow resolves knowledge by exact name, so a differently-named file is invisible. Boot audit + write-time hook enforce it; scaffold new states with the knowledge-schema-audit CLI"
metadata: 
  node_type: memory
  type: feedback
  modified: 2026-09-04T03:59:26.797Z
  originSessionId: b1911db8-d4a0-47a7-98d6-9674b59f2c3b
---

**Rule (みや /goal 2026-09-04)**: the folder structure and MD file names under `projects/coding-projects/active/etanah-knowledge/<state>/` are IDENTICAL across states (melaka · perak · kedah · selangor · terengganu · wp). Canonical set = `etanah-knowledge/KNOWLEDGE-SCHEMA.json` — 14 required files (`index.md`, `STATE-FACTS.md`, `DATABASE.md`, `TEST-PERMOHONAN-INDEX.md`, `ADHOC-REGISTER.md`, `ADHOC-TRIAGE.md`, `BUG-BESTIARY.md`, `DEV-TESTING-HACKS.md`, `ENV-ARCHITECTURE.md`, `BRANCH-AND-DEPLOY.md`, `GIT-REPO-HYGIENE.md`, `DOMAIN-GLOSSARY.md`, `PERANAN-MAP.md`, `FLOWABLE-KNOWLEDGE.md`) + dirs `flowables-bpmn/` (PLP at root, other modules in `<MODULE>/`, `CONSENT/` not `CON/`) and `urusan/`. State facts go in `STATE-FACTS.md` — never `<STATE>-FACTS.md`; a new topic file keeps `UPPER-KEBAB.md` and is listed in that state's `index.md`.

**Why**: `ticket-gate.js`, `lib/test-data-db.js`, `adhoc-lifecycle`, `bpmn-check`, `learn-from-fix`, `pre-code-check` … all read knowledge by exact file name. On 2026-09-04 perak had `PERAK-FACTS.md`, wp had `TEST-DATA-AND-ACCESS.md` + `PROJECT-LOG.md`, kedah had no `index.md`, selangor/terengganu only `DATABASE.md` — none of it reachable by the workflow, and I had not noticed.

**How to apply**: the memory is MECHANICAL, not this note — `domain/knowledge-schema-audit/` fires at every boot (one advisory line per drifting state) and on every Edit|Write under `etanah-knowledge/<state>/` (warns on a legacy/non-canonical name or a bad flowables placement). Commands: `node domain/knowledge-schema-audit/knowledge-schema-audit.js audit [--state s]` · `… scaffold --state s` (skeletons under `⚠️ UNVERIFIED-FOR-<STATE>`, never overwrites). When a new state appears: add it to `KNOWLEDGE-SCHEMA.json` `states` (code · permohonan prefix · Task folder · aliases), then scaffold. Related: [[feedback_state_aware_knowledge_load]] · [[reference_etanah_bpmn_source]].
