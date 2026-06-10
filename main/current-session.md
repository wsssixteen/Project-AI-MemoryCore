# 🌟 Current Session Memory - RAM

**Current session**: 2026-06-10 (Wed) Session 2 — wrap ~18:42 MPST. Theme: **QA-262004 PSBS Ringkasan Risalat cycle-2 rework — fixes done, but a long marathon chasing an empty document list that turned out to be TWO colleague regressions on mlk/master, not our code**.

## 🚨 READ FIRST IF STARTING A NEW SESSION / PULLING mlk/master (etanah-pelupusan)
**Latest `mlk/master` is BROKEN in two independent ways — anyone who pulls + builds locally gets an empty "Senarai Dokumen" (Tiada rekod) on every tugasan:**
1. **etanah-common 0.0.748** (commit `de46bc0eee`, amirul, refs #264423): moved `filterBasedOnAppTugasanSebelum` from `initCetakanMode()` into the shared `populatePenyediaanDokumenVOList` → the previous-tugasan filter now strips docs in ALL 23 modes. **Workaround: pin `pom.xml` → `<etanah.common.version>0.0.728-MLK</etanah.common.version>`** (0.0.728 is in `.m2`, = the version the working UAT server runs).
2. **template.config.json `:5693`** (commit `3ec243a4c3`, faizudin, QA #264309): `"tarikhSignPTG".` — period not comma → whole config fails to parse. **Workaround: change `.` → `,`.**
- Both pinned with full evidence in `projects/coding-projects/active/QA-262004/MASTER-BROKEN-config-typo.md`. Upstream owners: amirul (#264423 filter needs mode-scoping) + faizudin (comma).

## High-Level Objective (AGENT_STATE)
- ✅ **QA-262004 cycle-2 Phase 1 CLOSED** — PSBS "Ringkasan Risalat MMKN" template+populator fixes shipped `71446bcaf5` on `mlk/qa/262004v2` (pushed), local_test_confirmed=true. Phase 2 archive pending.

## ✅ Phase 1 close (2026-06-10 ~19:30)
- **Shipped commit `71446bcaf5`** on `mlk/qa/262004v2` (pushed) — 4 files: `PelupusanWordCCMethodConstant.java` (dedicated PSBS JT method + arabic numbering + street-case branch) · `TemplateRingkasanRisalatPSBS.docx` · `references/JabatanTeknikal.docx` · `template.config.json` (faizudin's #264309 comma folded in per みや, via `--amend` + `--force-with-lease ad572ae371→71446bcaf5`).
- **NOT in the commit** (deliberately): `pom.xml` common-0.0.728 pin — that's the local workaround for amirul's #264423 regression; stays uncommitted on local master so the build runs. (The config comma IS in the commit per みや; also re-applied locally so master builds.)
- **Phase 2 pending**: archive QA-262004 (folder→Archive, block→active-archive) + report amirul #264423 / faizudin #264309 upstream.

## Current Progress (AGENT_STATE) — QA-262004 (historical, pre-close)
- All fixes were applied on disk then committed at close:
  - `TemplateRingkasanRisalatPSBS.docx`: Century Gothic 10.5pt · reference alignments/bold · single line-spacing (was double) · widened JT slot 9014→9060 · removed gap (stray tab + shrunk slot para mark) · slot CC retagged `jtRingkasanRisalatPLPS`→`jtRingkasanRisalatPSBS` · (みや's jenisPegangan "Pajakan" CC removal preserved)
  - `references/JabatanTeknikal.docx`: みや's dedicated `jtRingkasanRisalatPSBS` table + Ruri bolded the Bil(rowNumJT) cell + widened to 9060
  - `PelupusanWordCCMethodConstant.java`: new constant `TAG_JT_RINGKASAN_RISALAT_PSBS` + registration + dedicated `populateJTRingkasanRisalatPSBS` (arabic `String.valueOf(rowNum++)` — NOT `(rowNum++)` which is an Integer the renderer's `handleText` drops as non-String) + `keepOriginalCase` PSBS branch in `populateJalanKampungTempat` (street-name proper case)
  - `pom.xml`: common pinned 0.0.748→**0.0.728** (the master-regression workaround above)
  - `template.config.json`: faizudin comma fix
- **Branch state**: premature `mlk/qa/262004v2` was created then DELETED (per みや — no branch until test passes). Currently on `mlk/master` (local, uncommitted). At Phase 1 commit time: create `mlk/qa/262004v2` fresh, stage OUR files (NOT pom/config — those are colleague-owned workarounds), commit, push.
- **Backup** of the 3 core fix files at `%TEMP%\qa262004_backup`.

## Test data (QA-262004, in Notes.txt)
- `PTMLK/03/L/PSBS/2025/5` (aplikasi 2900183) @ **suraya.wahab@melaka.gov.my** — Penyediaan PRMMKNPTGT, tempoh=99, Lokasi filled. Cleanest test.
- `PTMLK/02/L/PSBS/2026/1` (aplikasi 2957068) @ **nor.aini@melaka.gov.my** — Perakuan PRRMMKNPTG, 4 JT rows (good numbering test); Lokasi was empty `{}` → **data-patched** (kedudukan_tanah filled, version 3) via `patch-262004-2026-1-lokasi.sql`.

## Blockers / Debts (AGENT_STATE)
- QA-262004 NOT yet tested green (master breakage ate the session) → not committed. Resume at test→commit.
- QA-262495 Phase 2 archive still pending (from Session 1).
- Open reworks parked Phase 0: QA-261986, QA-260508 (cycle-3), QA-262027, QA-262039 (folders 67-70 reactivated this session's earlier retrieval).

## Immediate Next Steps (AGENT_STATE)
- みや rebuilds (common 0.0.728) + tests QA-262004 → if green, Phase 1 commit on fresh mlk/qa/262004v2.
- Report amirul (#264423) + faizudin (config comma) upstream.
- QA-262495 Phase 2 archive.

## 🎯 Session Recap (for AI restart)
2026-06-10 S2: QA-262004 PSBS Ringkasan Risalat cycle-2. Did the template + populator fixes cleanly (fonts, spacing, widths, gap, arabic-bold numbering, street-name case, dedicated PSBS JT method). Then lost hours to an empty document list I chased as infrastructure — config typo, then a wedged debug-suspended JBoss zombie holding :8080 (two of them, 17:29 + 17:44), redeploy races. みや (rightly, with mounting anger) pushed me to BISECT instead of theorise. The bisect + reading the pulled commits found the real root cause: **NOT our code** — two colleague regressions arrived via today's master pull (faizudin's config typo + amirul's etanah-common 0.0.748 commit that moved the prev-tugasan doc filter into the shared list-builder so it strips docs in all modes). Pinned common to 0.0.728 → unblocked. **Lesson (the day's slip): when a symptom appears right after pulling latest master, DIFF ALL PULLED COMMITS against the symptom's code path FIRST — before any environment/infrastructure theory.** Same `wrong-baseline-diagnosis` family as Session 1's QA-262495.

**Memory Type**: RAM | **Last Activity**: 2026-06-10 ~19:35 MPST — QA-262004 Phase 1 CLOSED (shipped `71446bcaf5`, pushed `mlk/qa/262004v2`); incremental DE; session ending. Phase 2 archive + upstream reports (amirul #264423, faizudin #264309) carry to next session.
