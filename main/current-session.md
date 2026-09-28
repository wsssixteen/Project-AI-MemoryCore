# Current Session

**Last Activity**: 2026-09-28 14:20 — #281650 (DP PROD, MLPS Tempat + pelan + Tanah Kerajaan) closed + archived + bounty · DE.

## Session Recap (2026-09-25 → 2026-09-28, ticket-281656-prep worktree → main)
- **Ask**: retrieve + quest #281650 (Nurhafizah PDTJ): MLPS /7 and /8 at PYB4AE — Tempat `PT 118` / `PT 225 & 226 PT 117` → `-`, replace pelan L1e, /8 Tanah Kerajaan → `PT 225 & PT 226`.
- **Done**: `281650.sql` (4 UPDATEs, apt 46855/46856 + licence rows 4342/4346) ran in PROD 2026-09-25 by infra, verified 2026-09-28. /8 no_lot NULL + `mklmt_tmbhn.keteranganTempatTanahKerajaan = "PT 225 & PT 226"` → L1e `- PT 225 & PT 226` (miya chose BA Description wording). Pelan: renamed PDFs (`PDTJ.600.2~6~69_M033_pelan.pdf`, `~6~70_M032`) handed to infra; BA reopened 27 Sep → reassigned to Asyraf for pelan; DB cannot confirm a disk swap (ask infra file size 436,915 / 457,395).
- **Closed**: QA-281650 archived (Task 233 → Archive, block → active-archive, doc → archive/QA-281650). Knowledge: MLPS-TICKETS note, LATENT-BUGS L13 (keterangan not copied to licence, `PelupusanLiteService.java:1853`).
- **Rule change**: script naming by role — `<ticket>.sql` = update, `<ticket>-check.sql` = one combined check; `-2` banned.
- **Slips**: `reask/context-free-popup` (225-226 popup with no before/after) · `handoff/unclear-steps` (lone UPDATE beside handoff) · `assume-not-verify/state-guess` (said pelan "most likely not" replaced).

**Last Activity**: 2026-09-25 18:56 — adhoc ADHOC-PLTP-2026-1 (PROD Portal Awam PLTP syer popup) diagnosed + saved; fix APPROVED by BA ketua, awaiting ticket; adhoc-save skill + audit built · DE.

## Session Recap (2026-09-25, portal-awam-syer-validation worktree)
- **Ask**: PDTMT via Fizah: public filled syer exactly as the sijil carian (auto-pulled from hakmilik 040210PM00001265) but Seterusnya shows "Maaf syer yang dimasukkan tidak sah atau melebihi had".
- **Cause (CODE, 95%)**: etanah-awam `PelupusanPemohonTabForm.checkingSyer():462` sums numerators vs the largest denominator (11 vs 28); dialog `PelupusanMaklumatPemohonHelperForm.java:5635` rejects any denominator ≠ row 1. PROD pra `umm_p_pihak_bkptg` p_aplikasi_id 55278: 7×1/28 + 2×1/4 + 2×1/8 = 1.00. Analog = kaunter fraction sum `PelupusanMaklumatPemohonHelper.java:5848`.
- **Status**: BA ketua approved the fix; the ticket already existed → **ESOKONGAN #281712** (found by redmine-reconcile at DE). A32 promoted, adhoc block archived, Task 234 → Archive, canonical doc `projects/coding-projects/active/QA-281712/QA-281712.md` (cold-resume ready). STG repro resit 260925BSAT00029. Next: `/quest resume 281712` → Apply.
- **Reconcile divergences (miya's call)**: QA-278909 (Siti Farhanih, In Progress) · QA-281568 (Closed) · QA-256334 (Rework, Lau Li Wen).
- **Built**: `adhoc-save` skill + `lib/adhoc-save-audit.js` (18/18 eval) · adhoc-paste-detector now anchors on hakmilik id / No Resit (13/13) · `quest/notes.js` keeps ADHOC ids whole (was "1. 2 026.txt").
- **Audit found in older adhocs**: A27 double-claimed (REDMINE-RC re-pointed to new A33) · PRBB-2026-5 notes renamed · legacy qa_docs missing the standard header (FLOWABLE-2026-1, REDMINE-RC-2026-1, PRBB-2026-5) · ADHOC-FLOWABLE-2026-1 block open while register says RESOLVED · ADHOC-PRBB-2026-4 block missing most keys.

**Last Activity**: 2026-09-25 15:48 — #281656 PRBB resit kaunter tidak masuk (PROD): link-resit data patch via infra + Alter Flow PL→PYB4CE on /14 and /15, verified PROD; quest closed + archived + bounty · DE.

## Session Recap (2026-09-25, ticket-281656-prep worktree)
- **Ask**: quest-prepare #281656 (PDTAG PRBB, public paid, resit not in Carian Pintas; link + alter to Penyediaan Borang 4Ce dan P1e).
- **Cause**: public paid at the counter while SDU2 was still open; PL tugasan appeared 11:15, payments 09:26/09:49. Cashiers used manual Bayaran Pelbagai → new hsl_bayaran_fi rows with aplikasi_id NULL; officer fees stayed flag_bayar N.
- **BA data errors caught**: #15 resit are D84300003/4 (BA typed D84000003/4 = Norshamsul SPPK/2026/484-485 Semakan Pelan); #15 receipts keyed PRBB/2025/15.
- **Fix**: `1. Tasks\Melaka\Archive\230. II #281656 ...\2. Fix\281656.sql` (6 btrn repoint + 6 fi paid + deposit 646/647), schema-verified, infra ran it. Alter Flow: /14 → nurwaheda@melaka.gov.my, /15 → samsiah_jaamat@melaka.gov.my. みや confirmed.
- **Slip**: claimed receipts belonged to another payer without showing the evidence script (`show-evidence`, logged).
- **Carry forward**: PTMLK/03/L/PRBB/2026/8 — same cashier 10:37, RM4,500 manual vs RM9,300 unpaid fees, no PL tugasan → likely future ticket.

**Last Activity**: 2026-09-25 12:00 — /goal bulk-ticket triage → quest sweep (6 tickets, 18 agents, run wf_bb588f6c-e2c) → findings saved to qa_docs + active.txt · DE.
