---
name: reference_awam_portal_test_users
description: "みや's usable AWAM (Portal Awam e-Tanah Melaka) test logins per env + MelakaPay staging test-payment (FPX SBI BANK A, user/pass 1234) — staging alyaaqilah802@gmail.com, PROD muhammadsyafiq0102@gmail.com; use when a repro needs the public portal or a staging Bayaran"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 3f58836b-c97b-46c8-9d5d-10f1b6c4bfbf
  modified: 2026-08-18T03:24:32.930Z
---

みや's usable **AWAM Portal (Portal Awam e-Tanah Negeri Melaka)** test accounts, per env — use these when a repro needs the public applicant portal (not the staff app):

| Env | Portal host | Login | Account name |
|---|---|---|---|
| **Staging** | `etanah-stg.melaka.gov.my/etanah-awam` | `alyaaqilah802@gmail.com` | ALYA AQILAH BINTI FAUZI (Individu) |
| **PROD** | AWAM PROD portal | `muhammadsyafiq0102@gmail.com` | — |

- Stated by みや 2026-08-18 (QA-275456 PPTPB location-blank simulate). Staging DB = `et_main_stg2` ([[feedback_staging_schema_stg2]]).
- These are shared TEST accounts (no password stored here) — for reproducing portal-origin bugs (e.g. PPTPB Maklumat Tanah save).
- Portal menu note: **PERMOHONAN** = create an application ("e-Mohon"); **E-CARIAN** = Carian Hakmilik / Carian Rasmi (get No Resit Carian Rasmi that links a hakmilik — see [[feedback_awam_no_permohonan_id]]).

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
