# Current Session

## 🆕 Monthly app — v3 UI/UX pass (2026-07-17 evening → 07-18 late night)

**Not etanah.** みや's personal budgeting app — single-file `index.html`, GitHub Pages.
**Repo**: `C:\Users\vice4\Documents\7. Code Projects\12. Monthly\Deploy` → github.com/wsssixteen/monthly (`main`, clean, pushed).
**Note**: this repo lives OUTSIDE MemoryCore; the worktree only carries the launch.json + slip rows.

**Shipped this session — 6 commits `ce9361a` → `2fb49ba`:**
| Commit | What |
|---|---|
| `79dc551` | ⏻ per-category power toggle (excluded from Grand Total/Surplus/Balance, persists as `disabled`) · Workshop auto-save fix · **fresh-boot bug**: `loadAuto()` early-returns never set `appLoaded` → first-time users had NO auto-save all session (`finishFreshBoot()`) |
| `2147ab2` | Header buttons grouped (`.header-btns`) · uniform small-button sizing · power lit-when-ON |
| `975cd18` | Save button retired · Add Category ↔ Restart swap · collapse-aware ⏻/x swap · **SKBBK → override input** |
| `ce420ec` | "Saved" msg · live SKBBK phase rate via `skbbkRate()` · mobile del→cadence popover |
| `be1bd76` | Fade Saved flash · popover "Delete" + widths · tap-safe `@media (hover:hover)` · auto first row on new category |
| `fd9c9db` + `2fb49ba` | Popover width pinned UA-proof · Restart colour revert · mobile declutter (subtitles/PCB hint/`span.pct`) · **power icon → inline SVG** (U+23FB missing on phone fonts) |

**SKBBK research (familiar, sonnet ~76k tok) — ALL CONFIRMED**: 0.75% Jun 2026–May 2028 → 1.00% (yrs 3-5) → 1.25% (yr 6+) · RM6,000 ceiling · voluntary for LOCAL workers per 8 Jul 2026 Cabinet (foreign still mandatory; opt-out window 13 Jul–31 Aug 2026) · PERKESO uses a **bracket table** (max RM44.65 ≠ raw RM45.00) → estimate stays overridable. Date-aware `skbbkRate()` means no manual bump at phase change.

**Open / parked (みや's call):**
1. **Budgeting Workshop #3** — my rec: replace Breakdown with a **Yearly planner** (roadtax/insurance/raya → auto monthly set-aside). Savings-tracker idea WITHDRAWN (tracking ≠ the app's plan-ahead vibe).
2. **Storage step 1** — `navigator.storage.persist()` + Add-to-Home-Screen (free, no backend); **Supabase** as the v3 real backend when friend-data must survive. Not built.
3. `≡` vs `☰` menu glyph — awaiting verdict.
4. Whether to drop the SKBBK % entirely (kept for now; it's PERKESO's official published rate).

**App rules re-learned**: propose-then-build (project CLAUDE.md) · mobile-only = strictly inside `@media (max-width:600px)` · **deploy EVERY round** (みや reviews on phone).

---

## What's loaded
2026-07-17 (Friday) — **TWO concurrent sessions closed. (1) #239386 MPT** env settled on mlit, patch dry-run PASSED, DB infra cleaned, naming decided. **(2) Baseline** — the PLP release workflow — built, scope-locked, 70/70 evals green, on branch `claude/pelupusan-release-script-861710` **awaiting merge to main on みや's word**.

---

## 🆕 Baseline (release-mlk-plp) — Session 2, 2026-07-17 evening

**Status**: BUILT + final · branch `claude/pelupusan-release-script-861710` (pushed; **NOT yet on main** — みや said "we'll merge to main after we finalize this").

**What it is**: みや's company term for the release run. Ruri **prepares**; みや **runs** build/deploy/sheet.
```
RECON → BRANCH → MERGE(V2 conflict) → VERIFY(V3) → [BUMP-COMMON → VERIFY] → BUMP-VERSION → PUSH → hand-off CARD
```
**Components (4, forge-born, in `meta/registry.jsonl`)**: `.claude/skills/release-mlk-plp/SKILL.md` · `domain/release-mlk-plp/` (release-prep.js · redmine-recon.js · eval.js 26 · eval-recon.js 19 · NUKE-MARKER) · `domain/release-mlk-plp-ask/` (6) · `domain/release-mlk-plp-push-gate/` (8) · `domain/release-mlk-plp-scope-gate/` (11). **70/70 fixtures green.**

**Gitignored configs (exist on this machine, `.example` twins committed)**: `domain/release-mlk-plp/servers.local.json` (build/deploy hosts) · `redmine.local.json` (host + API key).

**Three delivery mechanisms Baseline now sees** (all learned the hard way, all みや-caught):
| Mechanism | Verdict | Why git alone is blind |
|---|---|---|
| ticket branch | `CODE-BRANCH` | — |
| SQL attachment | `SQL-PATCH` | #269802 `sql.txt` = the whole fix; git never shows it |
| common bump | `COMMON-VER` | `d19b0b2b0a` lives ONLY on release/1.0.9; **master never delivers it** |
| under a related ticket | `VIA-RELATED` | #270952 → #270253 → "use common 1.0.129-MLK" |
| nothing anywhere | `NO-EVIDENCE` | → 🚨 Ask-BA row, never a silent pass |

**1.0.9 is DONE** (deployed to stag by みや; sheet written; Task folder `98. RELEASE 1.0.9 - Pelupusan (Stag)` + `1. Fix\#269802 sql.txt` saved).

**NEXT on resume**: (1) merge this branch → main on みや's nod; (2) first real run = **1.0.10** when BAQA posts it, supervised end-to-end; (3) deferred: `baseline-*` folder rename · decouple already done (`set-tickets`) · third-delivery-channel sweep.

---

## ▶▶ NEXT SESSION — START HERE

### #239386 (ACTIVE — Apply, dry-run passed, ready for real run)
**Read qa_doc §0n first.** Short form:
1. **Restart Claude Code** (MCP changes) → verify `postgres-mlit-pg` (`et_main_mlit`) + `postgres-mlkstg-pg` connect.
2. Run `1. 239386-MPT-Patch.sql` on mlit FOR REAL (dry-run: 141 inserts, 0 errors, rolled back).
3. Fresh branch off latest `mlk/master` → pop `stash@{0}` (L3 duplicate-panel fix, UNTESTED) → build WAR → deploy (JBoss `etanahDS` already = mlit).
4. Derive mlit test permohonan — notes file `1. 239 386.txt` is ALL-UAT = stale; 7 urusan have zero mlit apps (MLPS·PSBS·UPS·OPRU·OMLPS·OPPJK·OPPTPB).
5. Test PRZ L3 → disable sweep (xlsx tabs 3–4).
6. BA: 2 cosmetic name questions (PPTPB L8, BPRZ L10 — display-only, verified) + duplicate-panel bug scope.

### Environment (2026-07-17 overhaul — memory `feedback_uat_fat_environments.md` is current)
mlit = PRIMARY (`etanahDS` bare name) · stg2 = `etanahDS2` · trn = `etanahDS3` dormant · **UAT + FAT deleted everywhere** (MCP + standalone.xml). Only 3 MCP remain, all pgEdge. Legacy server-postgres client GONE — never re-add. Backups: `.claude.json.bak-before-db-cleanup-2026-07-17` · `standalone.xml.bak-2026-07-17-db-cleanup`.

## 🎯 Session Recap (for AI restart)
#239386 marathon. Settled: mlit as test env (UAT decommissioned, FAT deleted per みや) · DB connections 9→3 all-pgEdge + datasources renumbered (mlit=etanahDS active) · patch rebuilt INSERT-only 141 rows with all 5 chalk-back labels baked in (PRBB L7 JKBB · PPJK L8 Pajakan · PPTPB L8 Permit Khas · L6×5 Ulasan YB · BPRZ L10 reverted to Muatnaik Warta after parent-tugasan cross-ref overturned frequency) · dry-run on mlit PASSED with rollback · `nama` verified display-only (0 comparisons in code) so remaining name questions are cosmetic · Task folder cleaned 13→6 files (numbered 0/1/2 SQL set) · xlsx tabs 1-2 mechanically verified = patch = 141 · PSBS L7/L8 CLOSED (みや) · naming decision order finalized (ind_ursn.nama → parent tugasan → BPMN veto; frequency BANNED as evidence).

**Memory Type**: RAM | **Last Activity**: 2026-07-18 23:14 — Monthly v3 UI/UX session close + DE running. (Prev: 2026-07-17 19:27 — #239386 + Baseline closes.)
