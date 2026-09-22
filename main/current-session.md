# Current Session

**Last Activity**: 2026-09-22 — new-ticket intake + Phase 0 (278909, 279711, 280176) + DE.

## 🎯 HANDOVER — Focus tickets (load this after compaction)

| # | Type | Focus / next action | Effort | Why |
|---|---|---|---|---|
| **280614** | Data patch (PROD) | ✅ **APPLIED** (verified: permohonan /9+/10 tempat='-', lesen rows patched) → **close it** | done | patch ran |
| **280540** | eSOKONGAN code | build `PLP_BANGUNAN_*` flat-rate guard at `PelupusanMaklumatBayaranHelper.java:276` | build+test | recon done, net-new build |
| **246923** | template config | remove 3 dup keys (PRMMKNPTG/SRMMKNPTG/PRRMMKNPTG) from Block A in `template.config.json` | ~9 lines | rework, BA waiting |
| **274323** | Word CC | force `"RM 0.00"` in `PelupusanWordCCMethodConstant.java:4772` when royalti exempted | tiny | rework, BA waiting |
| **279711** | code (populator) | repoint `PelupusanWordCCMethodConstant.java:842-843` to gated `populateJawatanPegawaiSemak` + PPD branch in isValidUser :2043 | small | rework; ⚠️ MaklumatPemohon.docx shared-tag blast radius |
| **280176** | code (read-guard) | add `removeIf(getTarikhTamat==null)` at `PelupusanSearchService.java:2064` + `:2110` | 2 lines | rework; save-side fix shipped, read-side gap |
| **278909** | template add | add 3 docx twins + 3 config blocks (adaPemilikanTanah) mirroring Lulus family | medium | new; task folder unread — get Brief at Apply |

**280265** — patched (generateSurat 7547→YA); pending BA retest. Per DATABASE.md §24 the flip un-hides JPPH (show-goal); if BA needs re-add → Alex's DELETE pattern (BUG-BESTIARY §JT). Knowledge-first: read §24 on any JT ticket.

## Working Memory
- Melaka DB reconnected (postgres-mlkprod live, etprdmlk).
- Canonical formats only (never invent): infra-handoff + SCRIPT-CHECK + close-phase (`feedback_use_canonical_formats_never_invent`).
- close-phase now always emits Redmine Root cause + Solution.

## Session Recap (2026-09-22)
- Reconciled active.txt vs Redmine (31 closed 09-21 + 280099/280191/278580 closed 09-22).
- 280099 solved overnight by Alex (DELETE JT rows) — not stolen.
- New/rework Phase-0 done: 278909 (template variant gap), 279711 (ungated populator), 280176 (read-side removeIf gap).
- Banked BUG-BESTIARY §JT dual-fix pattern (flip=show / delete=re-add) + cross-ref DATABASE.md §24.
