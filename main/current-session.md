# Current Session

## What's loaded
2026-06-25 — Opus 4.8, worktree `unruffled-merkle-53d900`. Day 3 on **REQUIREMENT #239386 (MPT — Maklumat Permohonan Terperinci rollout)**. Ticket received 23rd; worked 23–25. Big productive day: chalk-back rule, the NPE turned out already-fixed, and the code/buttons side understood.

## ▶▶ NEXT SESSION — START HERE: #239386 MPT (mode=dev, multi-session)

### The 3 BIG findings today (verified)
1. **CHALK-BACK rule (Aaron confirmed):** an urusan gets an L7-L10 MPT tab **iff its REAL tugasans own that screen**. Canonical MPT screens (from PLTP's existing build):
   - L7 `PLP_MNCM` (MlkMuatNaikCabutanMinitForm) → owned by PT,PRZ,PPJK,PLPS,PPTPB,PRBB,PRU,BPRZ,**PSBS**,PLTP
   - L8 `PLP_BYRN_LSN` (MlkPengiraanBayaranLesenForm) → PLPS,PPJK,PPTPB,**PSBS**,PLTP
   - L9 `PLP_B4AE`(PLPS,MLPS) `PLP_B4EE`(PPJK) `PLP_B4CE`(PRBB) `PLP_B4DE`(PRU)
   - L10 `PLP_MN_WARTA` → PRZ,BPRZ
   - Trace query: `239386-screen-id-trace.sql`.
2. **The NPE is ALREADY FIXED — it was a DEPLOY LAG.** Aaron's commit `9343ca20bc` (2026-06-20 11:10, in `mlk/release/1.0.0`) wraps `MlkMuatNaikCabutanMinitForm.java:445-447` in `if(!...equalsIgnoreCase("MPT"))` + base guards. UAT WAR = **19/06 11:13 build** → predates the fix by ~1 day. ACTION: redeploy UAT from current `release/1.0.0` (≥9343ca20bc), then re-test.
3. **View-only / disable-buttons = Aaron's base classes** `BasePelupusanForm` + `BasePelupusanDokumenForm`: detect `getTugasanCode()=="MPT"`, build synthetic tugasan, suppress onSave/onGoNext, skip shouldShowLangkah. **All Java-side, no XHTML.** Caveat: `JabatanTeknikalHelper:80-86` has a DEAD empty guard (latent NPE).

### DONE
- L1-L6 patched view-only for **all 20 urusan** (DB-verified).
- **PLTP flag-fix RAN + verified** (8 langkah now flag_boleh_dikemaskini='N').
- Chalk-back Patch.sql built (Sections A base-6 / B PLTP-flagfix / C L7-L10 chalk-back, 22 langkah, idempotent).

### TO-DO NEXT SESSION (revised plan, ~75% done)
1. **Redeploy UAT** (+ target envs) from current `mlk/release/1.0.0` (≥ `9343ca20bc`) — ops/Aaron. *(blocks re-test)*
2. Run **Section C** (chalk-back L7-L10) on the env.
3. **Re-test L7-L10** in the MPT viewer — should render read-only now; **L8/L9/L10 runtime-UNTESTED** (confirm). Browser drive via Carian Pintas → Maklumat Permohonan.
4. Confirm with **Aaron**: (a) PSBS chalk-back — patch adds L7/L8 to PSBS which his reference omitted; (b) **O\* urusan L9** — they own no Borang *display* screen (only Cetak/Penyediaan), confirm screen or exclude.
5. Update `MPT-checklist.txt` — L7/L8 are no longer "to decide", they're chalk-back-determined; mark NPE as fixed-pending-deploy.

### Artifacts (Task folder `79. REQUIREMENT #239386 …`)
- `239386-MPT-Patch.sql` — consolidated release (A+B+C, chalk-back, portable, transaction-wrapped)
- `239386-NPE-findings.txt` — root cause CONFIRMED + Aaron's fix + deploy-lag
- `239386-screen-id-trace.sql` — how the screen IDs were derived (for Aaron to verify)
- `MPT-checklist.txt` — per-langkah Redmine list (compact `done / dont have / to decide (screen…)`)
- `1. 239 386.txt` — 20 test permohonan IDs (via notes.js) · `239386-test-permohonan-per-urusan.txt` — richer matrix
- `239386 - MPT Progress Checklist.xlsx` (Progress + L7-L10 sheet) · `239386 - MPT Java Files x Urusan.xlsx`

## 🎯 Session Recap (for AI restart)
#239386 MPT, day 3. Chalk-back rule cracks L7-L10 (mechanical, per screen-ownership). The NPE was already fixed by Aaron 20/06 — UAT just runs a stale 19/06 build (deploy lag). Buttons/view-only = Aaron's base classes. L1-6 + PLTP flag-fix DONE. Chalk-back Patch.sql ready. Remaining = redeploy UAT → run Section C → re-test L7-L10 → confirm PSBS/O\* w/ Aaron. ~75%. This session also: logged shared-base-edit-untested-subclass slip (strike 2, ⚠️ — tested only PSBS, assumed shared screens; PLTP L7/L8 NPE caught it); fixed notes.js regex (REQUIREMENT folders).

**Memory Type**: RAM | **Last Activity**: 2026-06-25 10:58 — DE close (Opus 4.8, unruffled-merkle worktree).
