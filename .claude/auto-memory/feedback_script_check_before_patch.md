---
name: feedback_script_check_before_patch
description: "Before handing any SQL data patch, run SCRIPT-CHECK; rule 5 = verify WHICH column the UI reads (nama vs perihal), patching the wrong one changes nothing on screen"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 83af2dea-64a4-4b3b-aff3-94cce92184e1
  modified: 2026-08-18T09:55:54.227Z
---

🚨 Before preparing/handing みや ANY SQL data patch (UPDATE/DELETE/INSERT), run the **SCRIPT-CHECK** pre-flight — invoke the `[[script-check]]` skill. 5 rules, mirrored by the `patch-script-gate` Stop hook (CHECK 1–5).

🚨 **Rule 5 — display-column verification (the one that bit us):** when a patch fixes what a user SEES, confirm WHICH column the UI/report actually renders BEFORE writing. Reference tables (`ind_*`/`rjk_*`/`kod_*`) carry sibling label columns (`nama` AND `perihal`) — patch the wrong one and nothing changes on screen.

**Why:** QA-275009 (2026-08-18) — patched `ind_tgsn.nama='Semakan Minit Bebas'` to fix a displayed tugasan label; the Sejarah Tugasan grid reads **`perihal`**, which still said "Semakan Maklumat Bantahan". Correct SQL, wrong column → zero visible change, then hours wasted on cache and wrong-DB theories before miya's `select *` screenshot showed `perihal` held the stale value. It was MLKIT-only seed drift (STG2 + PROD had both columns correct).

**How to apply:**
1. Find the read column FIRST — grep the `.xhtml`/bean/`.jrxml` for the field, OR `SELECT *` the row and match the on-screen string to the column whose value equals it.
2. Set sibling labels together — `SET nama = X, perihal = X` — unless you proved only one is read.
3. Reference tables are cached — a raw UPDATE needs a full app cold restart to show; say so at hand-off.
4. Emit `SCRIPT-CHECK — rule 1 ✓ · … · rule 5 <display col = perihal, verified via DB-match>` before the script.

Pairs with [[feedback_verify_before_claim]] · [[feedback_show_evidence_script_or_code]] · [[feedback_never_hand_miya_a_query]].
