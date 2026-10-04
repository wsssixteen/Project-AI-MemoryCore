---
name: feedback_awam_test_scenario_entry_key
description: "entry key per urusan (No Resit Carian Rasmi), no permohonan id; portal test logins; kaunter vs AWAM routes; URL host names the WAR"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: cdad55c7-8c42-4190-bc82-985e967bd74c
  modified: 2026-08-20T08:10:48.091Z
---

When preparing a test scenario for an **AWAM** ticket, the entry key differs by urusan — do NOT default to "Permohonan ID + login". That is the **Pelupusan / staff-side** pattern only. Check what extra data the urusan's entry screen demands and provide it in the scenario.

**Why:** みや 2026-08-20 — an AWAM MCL scenario is unrunnable without the **No Resit Carian Rasmi**; the applicant portal starts at `CarianRasmiHakmilikForm.xhtml` and blocks entry until a valid receipt is given. I handed a 276074 scenario with just "any urusan + login" and missed it.

**How to apply:** at test-scenario prep for ANY AWAM ticket, resolve the entry key FROM the urusan first:
- carian-rasmi urusan (**MCL · PSBS · PLTP · PPTPB · PRBB · CRHM\***) → **No Resit Carian Rasmi**, derived from the DB for the target env (4–7 validations, incl. 6-month recency + V6/V7 data-state). Query + validations in `projects/coding-projects/active/etanah-knowledge/melaka/TEST-PERMOHONAN-INDEX.md` § No Resit Carian Rasmi.
- **PPJK** e-Mohon Perizaban → **No Warta + Tarikh Warta** (entry at `AwamSemakanKewujudanRizabForm.xhtml`).
- lesen-renewal flows → **No. Lesen**.
- **Pelupusan / staff** → standard **Permohonan ID + pengguna_semasa login**.

Extend the per-urusan list as new urusan surface. Links: (merged above) · [[feedback_pengguna_semasa]]

---

## Merged 2026-10-04: feedback-awam-no-permohonan-id (was feedback_awam_no_permohonan_id.md)

> In AWAM (applicant portal) do NOT identify test data by Permohonan ID; the carian-rasmi test key is the No Resit Carian Rasmi value

In **AWAM** (etanah-awam / applicant portal) work, do NOT pick or reference test data by a **Permohonan ID** (`PTMLK/...`) — that is a PLP-side concept. AWAM applications are drafts/portal-side; the applicant is identified by login/identity, and the carian-rasmi test key is the **No Resit Carian Rasmi** receipt value itself.

**Why:** みや corrected me (2026-07-02, QA-268273) after I framed AWAM test data around a Permohonan ID. The Permohonan-ID-plus-pengguna_semasa convention ([[feedback-pengguna-semasa]]) is PLP-scoped; applying it to AWAM sends me hunting for the wrong key.

**How to apply:** For AWAM tests, retrieve a valid **No Resit Carian Rasmi** (method saved in `etanah-knowledge/melaka/DEV-TESTING-HACKS.md` → "No Resit Carian Rasmi — retrieve a valid one for AWAM testing": CRHM `ursn_id=107`, `trkh_resit` < 6mo, join `hsl_bayaran → hsl_bayaran_fi → umm_aplikasi`). Reference tests by receipt / applicant identity, not a `PTMLK/...` ID. Related: [[feedback-pengguna-semasa]], [[feedback-test-data-recency]].

---

## Merged 2026-10-04: reference_awam_portal_test_users (was reference_awam_portal_test_users.md)

> みや's usable AWAM (Portal Awam e-Tanah Melaka) test logins per env + MelakaPay staging test-payment (FPX SBI BANK A, user/pass 1234) — staging alyaaqilah802@gmail.com, PROD muhammadsyafiq0102@gmail.com; use when a repro needs the public portal or a staging Bayaran

みや's usable **AWAM Portal (Portal Awam e-Tanah Negeri Melaka)** test accounts, per env — use these when a repro needs the public applicant portal (not the staff app):

| Env | Portal host | Login | Account name |
|---|---|---|---|
| **Staging** | `etanah-stg.melaka.gov.my/etanah-awam` | `alyaaqilah802@gmail.com` | ALYA AQILAH BINTI FAUZI (Individu) |
| **MLIT** (internal) | `etanahmlit` host | `alyaaqilah802@gmail.com` | same account, 1106 pra apps on et_main_mlit (verified 2026-09-28, QA-281712) |
| **PROD** | AWAM PROD portal | `muhammadsyafiq0102@gmail.com` | — |

- Stated by みや 2026-08-18 (QA-275456 PPTPB location-blank simulate). Staging DB = `et_main_stg2` ([[feedback_staging_schema_stg2]]).
- These are shared TEST accounts (no password stored here) — for reproducing portal-origin bugs (e.g. PPTPB Maklumat Tanah save).
- Portal menu note: **PERMOHONAN** = create an application ("e-Mohon"); **E-CARIAN** = Carian Hakmilik / Carian Rasmi (get No Resit Carian Rasmi that links a hakmilik — see (merged above)).

### 🚨 MelakaPay STAGING test payment (recall when みや asks "the payment details")

To complete a **Bayaran** on **MelakaPay Staging** (push an AWAM permohonan through to the pelupusan/PLP side):

| Field | Value |
|---|---|
| Kaedah | **FPX** (Perbankan internet) → Akaun Individu |
| Bank | **SBI BANK A** |
| Username | `1234` |
| Password | `1234` |

- Stated by みや 2026-08-18 (QA-275456 PPTPB simulate, MelakaPay Staging 6.0). STAGING-only test-bank simulator — never a real credential.
- Flow: tick the FPX terma checkbox → **Buat Bayaran** → SBI BANK A login `1234`/`1234` → approve → returns to the agency system with the receipt.

---

## Merged 2026-10-04: feedback_two_entry_routes_kaunter_vs_awam (was feedback_two_entry_routes_kaunter_vs_awam.md)

> 🚨 An etanah permohonan has TWO entry routes — AWAM online portal AND Perserahan Kaunter (counter). They save via DIFFERENT code paths, so a bug can exist on one and not the other. NEVER claim 'fixed / won't recur' after testing only ONE route — check the tugasan path (umm_a_tgsn kod PK) FIRST.

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

Pairs with (merged above) (WAR/surface identity) and [[feedback_verify_before_claim]] (one passing test is inconclusive). Family: assume-not-verify.

---

## Merged 2026-10-04: feedback_url_host_identifies_war (was feedback_url_host_identifies_war.md)

> URL host prefix (etanah-stg AWAM vs etanah-appstg apps) identifies the deployed WAR; a field on one surface but not the other for the same DB row = version skew between two separate WARs, not data loss

🚨 The AWAM portal (`etanah-awam`; STG host `etanah-stg`, MLKIT host `etanahmlit`) and the apps/internal pelupusan-staff app (`etanah-pelupusan`; STG host `etanah-appstg`) are **SEPARATE WARs on SEPARATE hosts with INDEPENDENT `mlk/release/x.y.z` baselines**. The URL **host prefix** identifies the WAR; the `.xhtml` path only identifies the form.

**Why:** 2026-08-12 (ad-hoc A12) — "pengalaman kerja disappeared after baseline" was data-intact: the field rendered on the pelupusan staff app (`etanah-appstg`, release/1.6.0) but NOT the AWAM portal (`etanah-stg`) for the same `umm_a_pengalaman_kerja` rows. Root cause bounded to version skew between the two WARs. I burned time conflating the two hosts and tracing AWAM code as if it were one deployment.

**How to apply:**
1. Phase 0 — read the URL **host**, not only the `.xhtml` path. Two screenshots from different hosts = different deployables; never assume one baseline covers both.
2. Field shows on one surface but not the other for the SAME DB row → suspect **deployed-version skew FIRST**; capture EACH surface's own version panel (`Domain / DB / Common / Module Version` + `Git Branch`).
3. DB timing forensics settle data-loss-vs-display in ONE query: `created_by` (SYSTEM auto vs staff `@melaka.gov.my` vs applicant `@gmail`) + `created_date` + `version` — `version=0`, unchanged on deploy day = display/read issue, not data loss.

See [[Knowledgebase enrichment during debugging]]; full env map in etanah-knowledge `ENV-ARCHITECTURE.md §1`.
