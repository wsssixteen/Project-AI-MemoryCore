**Last Activity**: 2026-11-03 11:35 — worktree `suspicious-nash-ce350d` (branch claude/delete-warta-2352-edfbd0), Selangor internal warta delete (blocked), Domain Expansion.

## Session Recap (2026-10-30 to 11-03, Selangor warta 2352 delete)
- Asked: delete no warta 2352 + tarikh warta 04/07/2013 for PTSEL/01/L/BPRZ/2026/7, Selangor internal env.
- Not done: internal DB oracle-slt 172.16.93.32:1521 refused TCP (WinError 10061, host pings, gateway 7411 up), 3 tries on 30/10; blocker row in core/slips.js. No DB written anywhere.
- Found (read only): staging oracle-sgr-stag has the permohonan (aplikasi_id 46486398) with umm_a_rizab 8946 warta asal 3622 06/12/1918, not 2352; 2352 04/07/2013 sits on six ind_rizab rows (1, 65-69) on staging, shared registry. PAT has no such permohonan.
- Resume point: when internal is up, read umm_a_rizab for the permohonan on internal, clear only the pair holding 2352 (1 row, script-check first); if 2352 is only in ind_rizab, stop and show him.
- No adhoc scaffold made (no finding on internal yet). Selangor ENV-ARCHITECTURE.md is still an empty skeleton.
- Assessment: A1 ⏭ nothing new. A2 ⏭ no quest. A3 the internal host refused while staging answered; no tool tells which Selangor env is "internal". A4 the warta is shared registry data on staging, so a blind clear on ind_rizab would hit other rizab rows. A5 ⏭ no sweep.
**Last Activity**: 2026-11-03 11:05 — worktree `baseline-wednesday-release-029181` (branch claude/plp-melaka-esokongan-tickets-6e83ab), eSOKONGAN + Internal Issue sweeps, Domain Expansion.

## Session Recap (2026-11-02 to 11-03, sweeps of tickets not yet quested)
- Asked: list PLP Melaka eSOKONGAN tickets not under miya; sweep them read-only (Redmine not written). Found none New outside his name (12 not his, all other modules). First sweep (284544, 287273 W3 only) stopped: those were handed-off tickets, not New.
- Done: second sweep on Internal Issue tickets never quested. 287638 PPJK last-fasa tempoh: cause confirmed (integer division MlkPengiraanBayaranLesenForm.java:751), confidence 90, on miya. 286927 PLPS Sewa on Keluasan Diluluskan: cause confirmed (no listener, helper computes at load), confidence 84, Ammar holds it. W4 audits banked; no fix built; Resume Points written.
- DE: 287273 Phase 2 archived (Redmine Closed; fix on Awam int-env only, waits for the planned release; ADHOC-MCL-2026-6 still points at its old Task folder path). 284544 WAIT. 287638 Phase 1 not ready (fix not built). 286927 delegated to Ammar.
- RustDesk alert: main already removed `domain/remote-access-check` (79f9a4e0, 2026-11-03 10:04); nothing left calls it. Server 202.186.75.193:21116 was not answering on 2026-11-02.
- Wrong: swept older handed-off tickets without saying they were his; W3 launches first denied by the PROD-read classifier (reran with PROD barred).
- Open: sweep audit Tool exits 1 on `no-return-table` (3 runs); the check looks wrong, cause not traced.

**Last Activity**: 2026-11-03 10:45 — worktree `jovial-kepler-a07ba6` (branch claude/friendly-dubinsky-2b7fd1), 286610 cycle 2 on MLIT + adhoc MCL-2026-5, Domain Expansion.

## Session Recap (2026-11-02 to 11-03, 286610 cycle 2 MCL on MLIT)
- Done: BA unblocked on MLIT PTMLK/01/L/MCL/2026/1 (stray SKM row closed by his script run, Hantar moves). Pembetulan = Ya to PT verified at DB: 14:30:01 to iskandarz at 22.0, BA Expected 3 passed. MLIT model v8 = stg1 v5 by md5; PROD v13 same ids and routes. Redmine notes staged here, submitted by him.
- New adhoc MCL-2026-5 (hold, waiting BA ticket): Surat Keputusan Lulus goes back to Baru when Maklumat Tanah is saved at Semakan or Pengesahan (QA-258004 delete at MlkMaklumatTanahPemberimilikanForm.java:1229). Fix shape told: delete only at PYSKN5A, after checking whether those steps can edit premium. Not drafted.
- Gap: adhoc MCL-2026-4 block one-liner is stale (says Hantar after fix NOT tested; it was tested and passed). The brief-first gate refused the update on the DE turn; blocker row logged. Update it on the next adhoc turn.
- Open: DB pids 1612050 and 1647300 left as found, waiting him. KPT is offered at 24.0 but the gateway has no KPT route.
- Wrong: 14:03 alter without -Commit still committed on the engine. I told him Pembetulan to m.ikram was a stale page; DB showed Tidak then Ya from the same page. Several hours spent before the simple unblock; rule saved as internal-unblock-first.
- redmine-write-gate v1.9 (form_input status needs his named status) landed with this DE. Eval 136/142: the 6 reds come from main f8af263c changing the claim script body; the live quest-start claim is blocked until the gate accepts the status-only payload. Proposal logged.
- Assessment: A1 brief-first gate blocks adhoc saves on a DE turn. A2 the 286610 doc had three DE blocks from three sessions on one day. A3 the unblock took hours because I traced the cause before closing the one stray row. A4 an alter run without -Commit still wrote to the engine. A5 ⏭ no sweep.
**Last Activity**: 2026-11-03 10:35 — worktree `dreamy-pike-08af0b` (branch claude/quest-workflow-diagram-b6c854), QA-287048 rework pass to BA, Domain Expansion.
