# 🌟 Current Session Memory - RAM

**Current session**: 2026-06-10 (Wed) Session 3 — wrap ~20:41 MPST (session limit hit, resets 8:40pm KL). Theme: **QA-262039 cycle-2 Phase-0 — diagnosed both surviving issues (template-only, 0 Java), awaiting みや's nod on the Mukim fix. QA-260508 Fable familiar launched but DIED on the session limit with no findings.**

## 🚨 READ FIRST IF STARTING A NEW SESSION / PULLING mlk/master (etanah-pelupusan)
**Latest `mlk/master` is BROKEN in two independent ways (from S2 2026-06-10) — anyone who pulls + builds locally gets an empty "Senarai Dokumen" (Tiada rekod):**
1. **etanah-common 0.0.748** (`de46bc0eee`, amirul, #264423): moved `filterBasedOnAppTugasanSebelum` into shared `populatePenyediaanDokumenVOList` → strips docs in ALL 23 modes. **Workaround: pin `pom.xml` → `0.0.728-MLK`.**
2. **template.config.json `:5693`** (`3ec243a4c3`, faizudin, #264309): `"tarikhSignPTG".` period not comma → config fails to parse. **Workaround: `.` → `,`.**
- Full evidence: `projects/coding-projects/active/QA-262004/MASTER-BROKEN-config-typo.md`. Upstream owners: amirul + faizudin. Still pending report.

## High-Level Objective (AGENT_STATE)
- Clear the PSBS rework batch (QA-262039 → next QA-262027 → QA-261986 → QA-262004 test→commit). QA-260508 cycle-3 needs fresh investigation.

## Current Progress (AGENT_STATE)
### QA-262039 (PSBS Surat Keputusan Lulus kepada Pemohon) — Phase-0 DONE, awaiting nod
- **Both cycle-2 issues are TEMPLATE-ONLY** (`TemplateSuratKeputusanLulusPSBS.docx`), 0 Java. Full findings in `projects/coding-projects/active/QA-262039/QA-262039.md` §7.
  1. **"Mukim Mukim" duplicate** — cycle-1 added a literal "Mukim"/"MUKIM" before `[[bandarPekanMukim]]`, but the field value already carries the prefix (`getNama()` → "Mukim Bukit Katil"). Master: 109/111 names prefixed, 2 bare. **Fix = Option A: remove the literal** (recommended; rejected populator-strip = wrong for Pekan/Bandar + blast radius).
  2. **Sekatan Kepentingan "tidak selari"** — `[[sekatanKepentingan]]` value para sits outside the value cell → spills to left margin. Fix = move it into the value cell like the Syarat-Nyata row above.
- **Test app**: PTMLK/01/L/PSBS/2026/10 (aplikasi_id 2963425, UAT). Cycle-1 Notes app was PTMLK/02/L/PSBS/2025/2 @ aizzatyaqilah.95@gmail.com.
- **NOT applied** — awaiting みや's Option-A nod, then apply both template edits via python/zipfile + regenerate for test.

### QA-260508 (cycle-3) — INVESTIGATION INCOMPLETE
- Spawned a Fable Explore familiar to find why parent-page Simpan/Seterusnya drops the added Pengkelasan-Tanah field. **Familiar ran 43 tool calls then DIED on the session limit — returned NO usable findings.** Re-run next session. Aaron 2026-06-09: deployed but still failing, possibly our cycle-1/2 change reverted/overwritten or disrupted another flow.

## Immediate Next Steps (AGENT_STATE)
1. QA-262039: get Option-A nod → apply both template fixes → regenerate → hand to みや for test → Phase 1 commit.
2. NEXT after 262039: **QA-262027** (sibling — PSBS Surat Keputusan PTG kepada PDT; same "maklumat tak tarik + ejaan + align" shape). (みや's "next" message said 262039 again — assumed typo for 262027; confirm.)
3. Re-run QA-260508 cycle-3 investigation (familiar died).
4. QA-262004 rebuild (common 0.0.728) + test → Phase 1 commit on fresh mlk/qa/262004v2. QA-262495 Phase 2 archive still pending.

## 🎯 Session Recap (for AI restart)
2026-06-10 S3: Briefing → started QA-262039 (みや: "very easy"). Phase-0 nailed both cycle-2 issues as template-only: (1) "Mukim Mukim" = cycle-1's literal-MUKIM addition collides with the field's own prefix (109/111 master records prefixed — confirmed via live DB); (2) Sekatan Kepentingan value paragraph outside the value cell. Recommended Option A (remove literal). Launched a Fable familiar on QA-260508 cycle-3 — it died on the session limit with no findings. Session limit → DE. Good discipline this session: queried live DB to disambiguate the Mukim fix instead of guessing; extracted PDF annotations first; was honest the familiar produced nothing rather than confabulating a 260508 diagnosis.

**Memory Type**: RAM | **Last Activity**: 2026-06-10 ~20:41 MPST — QA-262039 Phase-0 saved to QA-262039.md §7, awaiting Option-A nod; QA-260508 familiar failed (re-run next session); DE run.
