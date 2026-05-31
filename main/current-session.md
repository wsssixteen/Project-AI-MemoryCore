# 🌟 Current Session Memory - RAM

> **AGENT_STATE discipline** — High-Level Objective · Current Progress · Active Context · Blockers · Immediate Next Steps. Read at boot; updated at session end.

**Current session**: 2026-05-31 (Sun) — worktree `eloquent-noether-0c1bb4` (auto-cleaned mid-session; finished on main repo `main`). Theme: **QA-258004 closed end-to-end (Phase 0→2)** — the MCL Surat Keputusan Lulus syarat/sekatan/Notis-5A fix — plus the per-file-sibling-diff rule it taught.

## High-Level Objective (AGENT_STATE)
- Resume + fix QA-258004 (MCL letter not reflecting officer's Syarat Nyata / Sekatan Kepentingan / Notis-5A bayaran), close Phase 1+2, then DE so QA-259702 can resume in a fresh session using the rules learned here. **Done.**

## Current Progress (AGENT_STATE)
- **QA-258004 CLOSED (Phase 1 + Phase 2).** etanah commit `ec64535e44` on branch `mlk/qa/258004v2`, **pushed to origin** (etanah repo). True root cause: officer's dropdown pick never reached `umm_a_permohonan_tnh` — (1) the dialog include `mlkMaklumatPajakanForm` didn't forward `mbb` to the syarat composite → `'. mbb' resolved to null` → pick lost; (2) the entity dropdown value re-decodes to null on Simpan postback. Fix (4 files, mirrors the working RM-field `onPremiumChange` + sibling `kadar-cukai-sebelum` dropdown): forward `mbb` + no-paren `onSelectSyaratNyataSekatan` listener captures into `@ViewScoped` fields on change + restore-onto-VO before `saveMaklumatPremiumCukai` + guarded init-load; kept `onPremiumChange`/`saveMaklumatMCL`/invalidate for the RM amount + letter regen. みや live-confirmed. Post-mortem in `main/post-mortems.md`.
- **CLAUDE.md hardened 5× this session**: v1.33 DB & Entity Resolution · v1.34 smallest-change + programmer-convention · v1.35 UI→code→table explanation · v1.36 JSF copy-working-sibling · **v1.38 🚨 PER-FILE SIBLING DIFF (headline lesson)** — every edited file diffed against a named working sibling across ALL coupling points (include attrs · listener signature · VO-instance · lifecycle) BEFORE build. (v1.37 loggers-not-breakpoints came from the parallel session.)
- **Decisive debug tool**: bundled LOGGERs (Ritual 6), not breakpoints — breakpoints repeatedly mis-bound/misled; one logger build printed `mbb resolved to null` + `LISTENER FIRED:0` + which VO held the value, ending ~1.5 days of guessing.

## Active Context (AGENT_STATE)
- MemoryCore: this DE committed **LOCAL ONLY (no push)** per みや — a parallel session owns origin/main right now; next session reconciles + pushes. Local `main` started this DE at `6be4ccb`, 0 behind/0 ahead origin.
- etanah-pelupusan: on `mlk/master`; QA-259702's `template.config.json` + `TemplateRingkasanRisalatPRU.docx` remain uncommitted on the working tree (that ticket's, untouched by QA-258004's commit).
- ⚠️ Sandbox Bash clock runs ~4h behind real machine (DE timestamp shows ~11:00; real ~15:00). Trust `ls`/server.log over `date`.
- Worktree `eloquent-noether-0c1bb4` auto-cleaned mid-session; work finished from the main repo.

## Blockers (AGENT_STATE)
- None for QA-258004 (closed).

## Immediate Next Steps (AGENT_STATE)
1. **Sibling-consistency-check hook/harness** — `todo.md` Q1, do NEXT. Enforce CLAUDE.md v1.38 deterministically (extend `convention-check-gate.js` from "cite an analog" to "diff against the named sibling"). みや's explicit next-task directive.
2. **QA-259702** (open, phase=1) — resume in the new session; awaiting live FAT test on `PTMLK/02/L/PRU/2026/12` @ nor.aini@melaka.gov.my. みや expects the fix to APPLY the rules learned here (per-file sibling diff, working-analog-first, loggers-not-breakpoints).
3. **Reconcile + push MemoryCore to origin** once the parallel session releases origin/main.
4. ⚑ Meta-layer effectiveness audit (carried) — hook net-value / false-positive pruning (RecursiveLoopDetector false-fired on distinct greps/edits again this session).

## 🎯 Session Recap (for AI restart)
1. **QA-258004 closed** (Phase 1+2, etanah `ec64535e44` / `mlk/qa/258004v2`): MCL letter now shows officer-selected Syarat Nyata + Sekatan Kepentingan + Notis-5A amount. Root cause = dropdown pick never persisted (`mbb` not forwarded + postback re-decode-to-null); fix mirrors the working RM-field + sibling-dropdown wiring.
2. **Headline lesson → CLAUDE.md v1.38**: PER-FILE SIBLING DIFF before building — each edited file's every coupling point checked against a working sibling. The ~1.5-day cost came from skipping exactly this.
3. Loggers-not-breakpoints (Ritual 6) was the tool that cracked it.
4. MemoryCore DE committed local-only (no push) — parallel session owns origin.

**Memory Type**: RAM | **Last Activity**: 2026-05-31 — QA-258004 closed end-to-end + CLAUDE.md v1.38 per-file-sibling-diff rule; DE local commit (no push); QA-259702 next.
