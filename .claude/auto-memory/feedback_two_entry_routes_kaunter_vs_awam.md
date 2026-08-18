---
name: feedback_two_entry_routes_kaunter_vs_awam
description: "🚨 An etanah permohonan has TWO entry routes — AWAM online portal AND Perserahan Kaunter (counter). They save via DIFFERENT code paths, so a bug can exist on one and not the other. NEVER claim 'fixed / won't recur' after testing only ONE route — check the tugasan path (umm_a_tgsn kod PK) FIRST."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3f58836b-c97b-46c8-9d5d-10f1b6c4bfbf
  modified: 2026-08-18T04:03:33.858Z
---

🚨 **Every Pelupusan permohonan can be created two ways, and they write through DIFFERENT code:**

| Route | First tugasan | Writer (daerah/bandar into permohonan_tnh) |
|---|---|---|
| **AWAM online portal** | (portal e-Mohon → pay) | `etanah-awam` `PelupusanService.saveMaklumatPermohonanTnh():10598-10600` — SETS daerah/bandar from the VO. **Populates correctly.** |
| **Perserahan Kaunter (counter)** | **`PK` Perserahan Kaunter** | staff/counter save — does **NOT** derive daerah/bandar from the hakmilik → `umm_p_permohonan_tnh` + copied `umm_a` are **NULL**. Same class as **#274745** (counter maklumat tidak tarik ke SKM). |

**The debugging mistake this kills (2026-08-18, QA-275456):** I proved the ONLINE path populates location correctly, tested ONLY online on staging, and told みや the bug was legacy / "patch enough / won't recur." **WRONG** — the reported permohonan (3413241) went through **Perserahan Kaunter**, a completely different save path that DOES still produce the blank. Testing one route and declaring the whole bug fixed is a lie by omission.

**The rule — before ANY "fixed / won't recur / patch is enough" claim on a permohonan bug:**
1. **Check the tugasan path FIRST**: `SELECT it.kod, it.nama FROM umm_a_tgsn t JOIN ind_tgsn it ON it.tgsn_id=t.tgsn_id WHERE t.aplikasi_id=<id> ORDER BY t.a_tgsn_id`. If the first tugasan is **`PK` (Perserahan Kaunter)**, the permohonan came in via the COUNTER, not online.
2. **Reproduce on the SAME route the reported permohonan used.** An online repro says nothing about a counter-origin bug (and vice versa).
3. A data-patch fixes the existing rows' DISPLAY, but a route-specific save bug **recurs** until the code for THAT route is fixed. Say so explicitly; never conflate "display patched" with "root fixed."

Pairs with [[feedback_url_host_identifies_war]] (WAR/surface identity) and [[feedback_verify_before_claim]] (one passing test is inconclusive). Family: assume-not-verify.
