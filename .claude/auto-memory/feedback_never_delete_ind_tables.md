---
name: feedback_never_delete_ind_tables
description: "🚨 PILLAR — never DELETE from ind_* (registry/master) tables; an ind_ row = record succeeded to daftar / permanent. Default cleanup = reset the umm_a_* application side only, leave the registry intact"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: fab69977-dae8-4e2d-942b-cb8569c1bedf
  modified: 2026-08-10T12:48:32.304Z
---

🚨 **PILLAR: never `DELETE FROM ind_*` (registry / master tables).** An `ind_*` row (`ind_permit_lesen`, `ind_versi_permit_lesen`, `ind_mklmt_tnh_permit_lesen`, `ind_hkmlk`, etc.) means the record **already succeeded to daftar and is PERMANENT**. Deleting one destroys registered data — there is **almost NO legitimate reason** to do it.

**Why:** Aaron (senior dev) 2026-08-10, #273461 — *"for ind_permit_lesen, if it's in there, it means the lesen is already succeeded to daftar, it is already permanent. so we are not supposed to delete ind_permit_lesen, there is almost NO reason that we should delete."*

**How to apply:**
- **Default cleanup pattern**: reset the **application side** (`umm_a_*`) only — e.g. `UPDATE umm_a_permit_lesen SET no_permit_lesen=NULL, versi_permit_lesen_id=NULL`. Leave every `ind_*` row intact. The app re-derives at its proper step.
- If an `ind_*` delete seems truly needed (accidental un-activated shell), STOP: get a senior-dev nod, use pinned + `trkh_mula IS NULL` + orphan-guard, and only then bypass.
- Enforced by `patch-script-gate` **CHECK 4** (fires on `DELETE FROM ind_*` in a reply; bypass `[skip-ind-delete: <reason + approver>]`). Related: [[feedback_readable_safe_script]], [[feedback_sql_insert_id_check]]. Domain detail: `etanah-knowledge/melaka/PERMIT-LESEN-RUNNING-NUMBER.md`.
