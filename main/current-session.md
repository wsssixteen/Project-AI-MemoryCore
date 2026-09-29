# Current Session

**Last Activity**: 2026-09-28 18:46 — OneDrive "Rename 1 item? NUL" popup diagnosed; nul-redirect-gate + system-audit CHECK 10 built · DE.

## Session Recap (2026-09-28, NUL popup → session-256334-recovery worktree)
- **Cause**: `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\worktrees\colleague-cr-issue-ed8731\NUL` (93 B, host key of 10.16.63.27) written 2026-09-25 16:05 by a Git Bash `ssh-keyscan … > NUL`. My move was classifier-blocked; miya cleared the file.
- **Built** (commit `f4e0902d`): `domain/nul-redirect-gate` forge-born PreToolUse Bash gate, 25/25 eval, live block confirmed · `.claude/hooks/system-audit.js` CHECK 10 reports CON/PRN/AUX/NUL/COM1-9/LPT1-9 in the repo (depth 4) and each worktree root (depth 2) · bash-tool memory NUL trap · architecture row · slip `shell/nul-redirect`.
- **Open (miya's call)**: leftover worktree folder `colleague-cr-issue-ed8731` (git link broken) still inside OneDrive.

**Last Activity**: 2026-09-28 16:36 — #281712 (Portal Awam PLTP syer popup) fixed, deployed int-env, test passed, Redmine resolved, Phase 2 archived + bounty · DE.

## Session Recap (2026-09-28, #281712 — was ADHOC-PLTP-2026-1)
- **Fix**: etanah-awam `mlk/esokongan/281712` `2121050779` — `PelupusanMaklumatPemohonHelperForm.onNextPbTab():5635` (dialog Seterusnya) + `PelupusanPemohonTabForm.checkingSyer():462` (page Seterusnya) now sum fractions with `RationalNumberUtil` (analog `AwamConsentService.onSemakSyerKepentingan():1168`). int-env cherry-pick `8ffb6a060e` (conflict with an env-only variant resolved). Built in separate clone `E:\Dev\etanah-work\etanah-awam` (remote `git@10.16.63.27`).
- **Test**: local test waived by miya; server test PASSED on mlit with No Resit `260709BSAT00111` / `alyaaqilah802@gmail.com`. My first receipt `260706BSAT00275` failed PLTP V8 (lease expired) + V9 (belum disemak) → screen added to TEST-PERMOHONAN-INDEX.
- **Apps check (miya ask)**: `etanah-pelupusan` `validateSyer():6024` already sums fractions; SKM Maklumat Pemohon Simpan has no syer check; Double rounding false warning (2/3, 3/7) → LATENT L14, no deploy.
- **Redmine**: miya posted; his pass-note wording + root-cause/solution edits banked in memory (Redmine speech collection).
- **Closed**: QA-281712 archived (Task 235 → Archive, doc → archive/QA-281712, BUG-BESTIARY pattern, PLTP-TICKETS note). Quest skill resume step 4: fetch only in the work clone.
- **Slips**: ref-moving `git fetch` in miya's etanah-awam · mlit receipt screened V1–V6 only.
**Last Activity**: 2026-09-28 14:20 — #281650 (DP PROD, MLPS Tempat + pelan + Tanah Kerajaan) closed + archived + bounty · DE.

## Session Recap (2026-09-25 → 2026-09-28, ticket-281656-prep worktree → main)
- **Ask**: retrieve + quest #281650 (Nurhafizah PDTJ): MLPS /7 and /8 at PYB4AE — Tempat `PT 118` / `PT 225 & 226 PT 117` → `-`, replace pelan L1e, /8 Tanah Kerajaan → `PT 225 & PT 226`.
- **Done**: `281650.sql` (4 UPDATEs, apt 46855/46856 + licence rows 4342/4346) ran in PROD 2026-09-25 by infra, verified 2026-09-28. /8 no_lot NULL + `mklmt_tmbhn.keteranganTempatTanahKerajaan = "PT 225 & PT 226"` → L1e `- PT 225 & PT 226` (miya chose BA Description wording). Pelan: renamed PDFs (`PDTJ.600.2~6~69_M033_pelan.pdf`, `~6~70_M032`) handed to infra; BA reopened 27 Sep → reassigned to Asyraf for pelan; DB cannot confirm a disk swap (ask infra file size 436,915 / 457,395).
- **Closed**: QA-281650 archived (Task 233 → Archive, block → active-archive, doc → archive/QA-281650). Knowledge: MLPS-TICKETS note, LATENT-BUGS L13 (keterangan not copied to licence, `PelupusanLiteService.java:1853`).
- **Rule change**: script naming by role — `<ticket>.sql` = update, `<ticket>-check.sql` = one combined check; `-2` banned.
- **Slips**: `reask/context-free-popup` (225-226 popup with no before/after) · `handoff/unclear-steps` (lone UPDATE beside handoff) · `assume-not-verify/state-guess` (said pelan "most likely not" replaced).

**Last Activity**: 2026-09-25 18:56 — adhoc ADHOC-PLTP-2026-1 (PROD Portal Awam PLTP syer popup) diagnosed + saved; fix APPROVED by BA ketua, awaiting ticket; adhoc-save skill + audit built · DE.
