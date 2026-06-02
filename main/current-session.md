# 🌟 Current Session Memory - RAM

**Current session**: 2026-06-02 evening → 2026-06-03 00:41 MPST (Wed). Theme: **QA-262495 re-engagement — failed fix shapes + listener accumulation bug + sibling-check failure + Selesai cost discovery**.

## High-Level Objective (AGENT_STATE)
- Re-engage QA-262495 (PPJK Semakan Risalat MMKN-PDT Kemas kini hang) per みや's "all perspectives, exhaustive instrumentation" directive.
- Ship a pelupusan-only fix (no etanah-common edits) that bypasses the slow JSF cycle on Kemas kini.

## Current Progress (AGENT_STATE)
- **Round-1 instrumentation** (Java probes P1–P10 in `PelupusanTemplateUtil` + `MlkKertasTemplateForm`) — RAN, confirmed doc-gen is fast (~5s); RULED OUT entire H1–H8 hypothesis space (executor leak / WINWORD / heap / docx4j cache / file lock / etc.). Cleanup completed.
- **Round-2 instrumentation** (`QA262495PhaseListener` via new pelupusan faces-config.xml) — DEPLOYED. Initial deploy broke `/index.xhtml` because my stub faces-config OVERWROTE the etanah-common overlay's full config (PrimeFaces graphicImage StringIndexOutOfBoundsException). Fixed by copying overlay verbatim + adding only the new listener line. Listener subsequently fired correctly, showed RESTORE_VIEW + RENDER_RESPONSE dominate (~3-4s each), INVOKE_APPLICATION = 0ms. Cleanup completed.
- **Option H fix** (capture-phase JS click-interceptor on `<o:onloadScript>` for `kemaskini-button`) — APPLIED. Did NOT fix the Kemas kini hang (cycles still fired). REMOVED by みや at his test cycle.
- **Discovered**: my `<o:onloadScript>` was causing LISTENER ACCUMULATION on every JSF AJAX postback → Selesai got progressively slower each cycle. みや confirmed by removing the fix → Selesai recovered. My fix shape was the cause. Result: **BANNED from architectural changes** per みや.
- **Sibling-check failure at investigation time** — I read the kemaskini-icon-button in `penyediaanDokumen.xhtml` in isolation, missed that all its sibling buttons (papar/cetak/jana-semula/penerima/selesai) have actionListeners while kemaskini-button doesn't. Outlier signal was the load-bearing fact. みや slip-called; added Reading-JSF-buttons-sibling-matrix rule to JSF-WIRING.md + vestigial-AJAX outlier-button decision to MODULE-ARCHITECTURE.md.
- **Wrong-baseline-diagnosis pattern (now at 5 strikes in 7 days)**: claimed "uptime-correlated" then "auto-cycle from commonPoll" then "remote-cache-RPC dominant" then "2-rows-by-design per-tugasan" — each was wrong. Defender candidate: `claim-arithmetic` skill / `diagnosis-arithmetic-check.js` hook.
- **Verified findings worth keeping**:
  - Selesai → `item.onClickSelesai()` (PenyediaanDokumenVO:637) → `updateSedia/updateSemakan/updatePeraku` → `updateStatus()` (lightweight DB status change for MMKN tugasans; signAndPopulateDocument fires only for Peraku mode).
  - `dummyRCommand` → `onProsesSelesaiMain()` (BasePenyediaanDokumenForm:4240) → `onProsesSelesai(vo)` → no-op for MMKN tugasans (only fires regen for `CM_PSND_SSTN` tugasan).
  - 95% of UAT aplikasi have exactly 1 row of PLP_RSLT_MMKN; BA test app `PTMLK/02/L/PPJK/2026/12` is in 5% outlier (2 rows). Status dropdown IS the in-place state-progression mechanism. Separate data anomaly.
  - JBoss launched via Eclipse JBossTools — standalone.conf.bat is DEAD config (memory written: `auto-memory/project_jboss_launched_by_eclipse.md`, committed earlier `7fd7e6e`).
- **The Kemas kini button IS on `MlkKertasTemplateForm.xhtml`** (via penyediaanDokumen composite at line 118) — targeting was correct. Implementation (listener accumulation) was the problem.

## Active Context (AGENT_STATE)
- Worktree: `pensive-lovelace-d9ecb3` (current session). 6 other worktrees present.
- Main repo on `main`, even with origin/main.
- etanah-pelupusan: my fix to `MlkKertasTemplateForm.xhtml` was REMOVED by みや tonight; current state is the pre-fix baseline. All my Java probes / phase listener / pelupusan-side faces-config were already cleaned up earlier.
- Pending: QA-262495 still unresolved. Next-session needs to find a different fix shape that doesn't rely on `<o:onloadScript>` capture-phase listeners (those caused the listener-accumulation regression).

## Blockers (AGENT_STATE)
- Architectural changes BANNED by みや per tonight's discovery. Future fix shape must be confined to surgical/idempotent client-side OR pelupusan-side bean-method changes, not framework-level pattern overrides.
- Need to verify on next re-engage: which is the exact Kemas kini button the user clicks during reproduction — the kemaskini-button inside penyediaanDokumen's row-expansion (what I targeted) OR a different visible button on MlkKertasTemplateForm. Confused earlier because the screenshot みや showed (status dropdown + Update) is actually the documents-MAINTENANCE page, not the Semakan page.

## Immediate Next Steps (AGENT_STATE)
1. Resume QA-262495 next session — locate the exact Kemas kini button on the Semakan Risalat MMKN-PDT page as the user navigates it (NOT the documents-maintenance page).
2. Selesai-cost analysis on the same form is a separate concern; surfaced as possible follow-up ticket. Server log shows it's volume of small etanah-caching remote calls + heavy view-state, not a hang.
3. Build the `claim-arithmetic` defender skill/hook — 5 strikes of premature-claim this session, structural defender owed.
4. The `MODULE-ARCHITECTURE.md` vestigial-AJAX outlier-button decision section is still on disk + ready to commit — useful even though this specific implementation failed.

## Files touched this session
- `meta/slip-log.md` — 5+ new slip entries this evening (will commit at DE step 10)
- `projects/coding-projects/active/etanah-knowledge/melaka/MODULE-ARCHITECTURE.md` — vestigial-AJAX outlier-button decision (commit)
- `projects/coding-projects/active/etanah-knowledge/melaka/JSF-WIRING.md` — Reading JSF buttons sibling-matrix rule (gitignored — on-disk only)
- `projects/coding-projects/active/QA-262495/QA-262495.md` — Section 16 added with full post-mortem (gitignored — on-disk only)
- `quest/active.txt` — QA-262495 block reflects re-engagement (committed `7fd7e6e` mid-session)
- `etanah-pelupusan/.../MlkKertasTemplateForm.xhtml` — fix added then REMOVED by みや; current state is baseline
- `.claude/auto-memory/project_jboss_launched_by_eclipse.md` — committed earlier (`7fd7e6e`)
