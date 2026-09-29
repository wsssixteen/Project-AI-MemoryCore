# Current Session

**Last Activity**: 2026-09-29 15:25 — laptop RAM incident closed out: db-gateway live, 153 sessions archived, system-rules Rule 7 + birth enforcement, research note · DE.

## Session Recap (2026-09-22 → 09-29, resource-usage-investigation worktree)
- **Incident**: laptop hung at 93-96% RAM, 60 GB commit. Every session started all 21 stdio DB MCP servers (~23 processes, ~2.4 GB each); 233 finished sessions never archived; 2 sessions ran 4 days at 70-85 CPU-hours.
- **Fixed**: `E:\Dev\scripts\db-gateway` (local git `8f66e6a`): one shared process serves 20 DB MCP endpoints on 127.0.0.1:7411, starts a DB server on first call, stops it after 10 idle min, token + Host check; Task Scheduler "DB Gateway" at logon + 5 min, Priority 4. Selftest 22/22; `claude mcp list` 20/20 connected; 3-DB live test OK. Commit after reboot 12 GB (was 60).
- **Cleanup**: 153 sessions archived after a 14-gate safety check; 412 Oracle connector processes stopped.
- **System**: system-rules **Rule 7** (resource footprint declared at birth) + `core/forge.js --footprint` (forge.eval 17/17) + `component-birth-gate` `footprint:` (eval 9/9). Research + audit: `library-items/agent-architecture/agent-resource-footprint-2026.md`. Memory `feedback_resource_footprint`, `project_db_gateway`; new-machine Step 2c.
- **Open (todo Q1 "Resource footprint follow-ups")**: mechanical resource-guard (miya: not a UI) · `auto_archive_inactive_days` 0→7 · bundle 36 UserPromptSubmit + 42 Stop hooks · rotate 64 MB telemetry · worktree consent sweep (56 / 15 GB) · WaRead watcher crash · codegraph shared · pdf-viewer off in claude.ai settings (miya only).

**Last Activity**: 2026-09-29 15:10 — #278909 Risalat MMKN PT: Farah's rework audited, PBN regression fixed (Option D), committed + merged int-env/stag-env, stag-env caught up to PROD 1.7.0, Phase 1 closed · DE.

## Session Recap (2026-09-25 → 09-29, #278909, worktree redmine-278909-ebf259 — git link pruned mid-session, saved from main)
- **Decision**: separate AdaPemilikan templates (option A) over CC tags in the Tolak base — tajuk paragraph is auto-numbered, an empty CC leaves a dangling "2.3.3"; renderer has no paragraph removal.
- **BA add-on**: PDT tidak boleh dipertimbangkan + PTG lulus. PT was on single `KeputusanSyor` (PTG overwrites PDT). Farah moved PT to dual keys → dropped PTG "Diangkat untuk pertimbangan PBN" (#260325) + relabelled PDT radio. Refuted; replaced by `40993fe86d`: PT stays single-key, PDT tugasan also saves `KeputusanSyorPDT`, 5.1 CC `syorKeputusanPDT` reads it.
- **Shipped**: `mlk/internal-issues/278909` 40993fe86d · int-env 8f339a6861 · stag-env ab7a68c42f → 1.7.0 catch-up 2a9cd0afa5. Compile ×3 green, `E:\Dev\tmp-278909\review\Sim.java` 8/8. Not run on JBoss; render check pending deploy.
- **Open**: miya deploys int + stag · post Redmine root cause/solution (text in QA doc) · pass to BA · int-env lacks 1.7.0 (4-file conflict, left) · stg2 `PTMLK/01/L/PT/2026/2` + 6 mlit syarikat PT apps are Flowable orphans (Initiate & Alter) · new PROD alter tickets #282178, #282175 have no block.
- **Built/saved**: brief skill cap 60→25 lines (eval green) · memory dev fix-list Redmine shape (`feedback_ticket_writing_style`) · slips `gate/false-positive`, `reask/verbose`, `git/write-in-miya-repo`, `knowledge/derivable-not-derived` · 2 wrong-fix rows.

**Last Activity**: 2026-09-29 14:55 — #281650 rework (MLPS PTMLK/02/L/MLPS/2026/8 Tanah Kerajaan) patched in PROD, verified, closed + archived · DE.

## Session Recap (2026-09-29, #281650 rework)
- **Ask**: BA (Fizah/Idris) wanted Tanah Kerajaan (No.PT) on MLPS/2026/8 to show numbers only, no leading dash, no "&", no PT wording ("225,226").
- **Limit**: `umm_a_permohonan_tnh.no_lot` is NUMERIC (`'225,226'::numeric` errors); L1e prints `no_lot` + " - " + note. miya chose `225 - 226` (patch ticket).
- **Done**: `3. Rework\2. Fix\281650.sql` — row 46856 no_lot 225 + note 226, licence row 4346 same (so next renewal seeds it). Infra ran it; PROD verified. Redmine Resolved text prepared (miya posts).
- **stg2 test** (MLPS/2026/4 row 44424, note 1140): L1e + 4Ae show `1139 - 1140`; Papar Borang 4Ae + Simpan did not touch the row, so my "Simpan wipes the note" claim is refuted (LATENT-BUGS L15). miya to run the stg2 reset.
- **Closed**: QA-281650 archived (Task 239 to Archive, doc to archive/QA-281650, block to active-archive, cycle-0 block merged).
- **Slips**: `assume-not-verify/state-guess` x2 (Hantar-safe claim; wipe claim before test) · `reask/misread-ba-intent`.

**Last Activity**: 2026-09-29 12:18 — eSOKONGAN priority rule patched system-wide · Redmine retrieved · 3-ticket sweep (W1-W4, 9 familiars) · DE.
