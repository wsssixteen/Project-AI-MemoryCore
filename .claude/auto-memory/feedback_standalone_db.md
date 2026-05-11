---
name: standalone_db_switching
description: env-check rule — current active DB target via standalone.xml etanahDS jndi rename convention; etprdmlk=FAT, mlkuat=UAT, mkit=MLIT
type: feedback
originSessionId: 1e7f13d9-75af-4218-be36-a53fbf33c0da
---

At Quest Phase 0 (Cp A entry) and at Cp E entry, run the `env-check` skill to confirm which DB is active in `standalone.xml`. Tell みや the env name in one line — e.g. *"on FAT (etanahDS = etprdmlk)"* — not the full host/schema.

**Why:** DB pointing to wrong environment causes silent wrong-data issues during local testing. Originally added by みや after UAT-CR #239225 (2026-04-17); refined 2026-05-11.

**Canonical paths** (saved 2026-05-11 by みや — DO NOT search again):
- Standalone: `E:\Dev\jboss-7.4-plp-melaka\standalone\configuration\standalone.xml`
- App config: `C:\etanahv3\config\environment.properties` (active — outer `C:\etanahv3\environment.properties` was unused, renamed `.bak` 2026-05-08)
- Setup notes: `E:\Dev\jboss-7.4-plp-melaka\SETUP-NOTES.txt`
- Skill: `.claude/skills/env-check/SKILL.md` — auto-fires at Cp A entry + Cp E entry

**Env naming convention (etanahDS only — Audit + DMS are out of scope for env-check)**:

| Env (purpose) | DB / Schema | Host | jndi when ACTIVE | jndi when SWITCHED-AWAY |
|---|---|---|---|---|
| **FAT** | etprdmlk / et_main | 172.30.17.104:5444 | `etanahDS` | `etanahDS2` or `etanahDS3` |
| **UAT** | mlkuat / et_main_uat | 172.30.59.185:5444 | `etanahDS` | `etanahDS2` or `etanahDS3` |
| **MLIT** (local IT/dev) | mkit / et_main_mlit | 172.16.100.197:5444 | `etanahDS` | `etanahDS2` or `etanahDS3` |

**Switch mechanic**: pure rename swap on jndi-name + pool-name. Only `2` and `3` suffixes are used (3 envs total, never 4+). Active env wears `etanahDS` (no suffix); the other two wear `2` and `3` in any order.

**Today's state (2026-05-11)**: active = FAT (etanahDS = etprdmlk); UAT = `etanahDS2`; MLIT = `etanahDS3`.

**Out of scope for env-check**: `etanahAuditDS` (et_sistem_mlit) and `etanahDMSDS` (et_dms_mlit) — these stay on MLIT regardless of which app env is active. Don't list them when reporting env state.

**Earlier convention noted in this file** (no-suffix = local default, "2" = disabled UAT): OBSOLETE as of 2026-05-04. All datasources now enabled; the active one is identified by the un-suffixed jndi-name only.
