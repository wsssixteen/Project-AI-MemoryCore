# Current Session

**Last Activity**: 2026-09-29 18:35 — #282061 PPTPB Permit Khas Jadual VIII: 4-part fix committed, int-env + stag-env, Redmine Resolved to Fizah, PROD-only swap + dup-bill script attached · DE.

## Session Recap (2026-09-29, #282061, worktree quest-282061-rubric-7a809b)
- **Bug**: PROD `PTMLK/02/L/PPTPB/2026/5` (PYJ, norlina@melaka.gov.my) borang showed No Permit Khas `02/2026/3` + Fi RM 2200; BA expects `02/2026/1` + RM 2000 (screen must tally with borang).
- **Cause**: skrin 338 Simpan minted the register number at every PPTPB tugasan (only PLPS exempt since #273461) · screen and borang read two different counters · borang Fi summed PPTPB 200 + PPTPBL 2000 · bill saver reuses only UNPAID rows, so a save after payment re-billed PPTPBL.
- **Shipped**: `mlk/esokongan/282061` `2729190807` (R1 mint at Jadual only · R2 screen reads register · R3 Fi = PPTPBL · C4 no re-bill after payment) · int-env cherry-pick `1cc113f7ee` · stag-env `6c891898ad`. miya deployed; mlit rehearsal patch verified.
- **PROD data**: `2. Fix\282061.sql` (PROD-only, attachment 1023225): swap /5 ↔ /1 in `umm_a_permit_lesen` + `ind_permit_lesen`, delete unpaid dup PPTPBL bill. Swap proven 100% safe (register rows keep own lot + holder, links by id only). Runs with the release.
- **Built**: redmine-write-gate v1.2 (popup + plain status approval, eval 38/38) · `ticket-close-block --ba --envs` prints miya's BA pass note · quest SKILL: Hand-over to BA · Plain first · Everything on this ticket · brief v1.2 · deploy 6b · PERMIT-LESEN knowledge two-counters section.
- **Slips**: reask/rambling · reask/incomplete (D1 dropped) · popup-conflated-options · reask/redundant (BA note in my shape, not his template) · 2 proposals (gate popup gap, sql-schema-verify cross-product).
- **Open**: BA verify on internal/staging · PROD release runs `282061.sql` · other-urusan early-mint audit landed as ADHOC-PERMIT-2026-1 (other session).

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
