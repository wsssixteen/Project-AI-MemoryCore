---
name: standalone_db_switching
description: Remind みや to check standalone.xml DB at quest Phase 0; where switching details are documented
type: feedback
originSessionId: 1e7f13d9-75af-4218-be36-a53fbf33c0da
---
At Quest Phase 0, remind みや which DB is active in `standalone.xml`.

**Why:** DB pointing to wrong environment causes silent wrong-data issues during local testing. みや added this as a Phase 0 check after UAT-CR #239225 session (2026-04-17).

**How to apply:** When any Melaka ticket starts (Phase 0), mention:
> "Which DB should standalone.xml point to? Melaka IT (etanahDS) or UAT (etanahDS2)? See SETUP-NOTES.txt → DB SWITCHING."

Details at: `E:\Dev\jboss-7.4-plp-melaka\SETUP-NOTES.txt` → DB SWITCHING section.
- Melaka IT local (default): `etanahDS` → `172.16.100.197:5444/mkit?currentSchema=et_main_mlit` (line 193)
- UAT (disabled): `etanahDS2` → `172.30.59.185:5444/mlkuat?currentSchema=et_main_uat` (line 214)
- Convention: "2" suffix on jndi-name + pool-name to disable UAT.
