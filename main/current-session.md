# Current Session

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

**Memory Type**: RAM | **Last Activity**: 2026-07-17 19:27 — session-close saves + DE running.
