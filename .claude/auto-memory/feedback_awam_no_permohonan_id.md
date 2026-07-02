---
name: feedback-awam-no-permohonan-id
description: In AWAM (applicant portal) do NOT identify test data by Permohonan ID; the carian-rasmi test key is the No Resit Carian Rasmi value
metadata: 
  node_type: memory
  type: feedback
  originSessionId: bc66b563-8732-47fc-b2a7-b4842597de74
---

In **AWAM** (etanah-awam / applicant portal) work, do NOT pick or reference test data by a **Permohonan ID** (`PTMLK/...`) — that is a PLP-side concept. AWAM applications are drafts/portal-side; the applicant is identified by login/identity, and the carian-rasmi test key is the **No Resit Carian Rasmi** receipt value itself.

**Why:** みや corrected me (2026-07-02, QA-268273) after I framed AWAM test data around a Permohonan ID. The Permohonan-ID-plus-pengguna_semasa convention ([[feedback-pengguna-semasa]]) is PLP-scoped; applying it to AWAM sends me hunting for the wrong key.

**How to apply:** For AWAM tests, retrieve a valid **No Resit Carian Rasmi** (method saved in `etanah-knowledge/melaka/DEV-TESTING-HACKS.md` → "No Resit Carian Rasmi — retrieve a valid one for AWAM testing": CRHM `ursn_id=107`, `trkh_resit` < 6mo, join `hsl_bayaran → hsl_bayaran_fi → umm_aplikasi`). Reference tests by receipt / applicant identity, not a `PTMLK/...` ID. Related: [[feedback-pengguna-semasa]], [[feedback-test-data-recency]].
