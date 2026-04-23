# 🌟 Current Session Memory - RAM
*Temporary working memory - resets each session, provides recap when AI restarts*

## Session RAM Status
**Current Session**: 2026-04-23 — QA #257911 closed + QA #257569 rework closed
**Last Activity**: Thu Apr 23 18:36:14 MPST 2026
**Session Start**: 2026-04-23 (weekday, evening)
**Session Focus**: Closed QA #257911 (RPPLP PYSK config fix). Reworked + closed QA #257569 (code + UAT data fix). Post-mortem on investigation discipline. Feedback saved on domain-by-domain style.
**Time Mode**: Weekday evening
**Energy Level**: Full capacity. Model: Sonnet 4.6.

## 💭 Working Memory (RAM)

### Active Context

#### Session 2026-04-23 — QA #257911 closed + QA #257569 rework closed

**QA #257911 — CLOSED ✅**
- Issue: RPPLP PYSK PKMMKN — tandatangan + nama pegawai tidak dipapar selepas klik Selesai untuk Peraku
- Root cause: Config typo — `STATUS_SEMAKAN_PERAKU` (never a valid constant) in PKMMKN action list of `template.config.json`. System reads `adk.getStatus().getKod()` = `STATUS_PENYEDIAAN_PERAKU` → lookup failed → CC dispatch skipped
- Fix: 2-line change in `template.config.json` — PKMMKN entries (Lulus + Tolak) under `PLP_SRTKPTSN_PTG`
- Gemini had applied bloated diff (added PYSKPDT + PGSKPDT everywhere) — reverted + clean 2-line re-apply
- Fix #2 (regenerateDocumentWithSignature override) — investigated but NOT needed; fix #1 alone sufficient
- Form: `MlkMuatNaikCabutanMinitForm.xhtml` | Template: `TemplateSuratKeputusanPTGRPPLPLulus/Tolak.docx`
- Task folder: 16. QA #257911

**QA #257569 — CLOSED ✅ (Rework)**
- Issue: Tujuan Permohonan dropdown for PT KKMMKN showing wrong items (billing-period); rework complaint: Lain-lain missing
- Root cause: `mlkKadarCukaiTanahForm.xhtml:60` binds to `tujuanPermohonanSelectItems`, but PT branch was loading KAT_TNH into `tujuanPermohonanPTSelectItems` (separate variable, unused by this XHTML). Fix introduced in #256004 but wiring was incomplete.
- Code fix (PelupusanExcelReaderHelper.java):
  1. `excluded.add("Perniagaan")` inside PT branch
  2. `tujuanPermohonanSelectItems = tujuanPermohonanPTSelectItems`
- UAT KAT_TNH outdated vs FAT — script created: `2. Fix/6. SCRIPT - update_uat_kat_tnh.sql` (2 UPDATEs + 1 INSERT)
- Expected 6 items: Bangunan (Perniagaan dan Lain-Lain), Bangunan Kediaman, Industri, Penternakan, Pertanian, Lain-lain
- みや applied and confirmed working
- Task folder: 17. QA #257569

**FAT-OR #255637 — STILL HELD (pending_commit)**
- Fix applied: `populateFrasa2` in `PelupusanWordCCMethodConstant.java`
- Pending: みや code review → commit → push → close Redmine

**Protocol feedback saved this session:**
- Task folder structure: create all folders (0. Brief, 1. Simulate, 2. Fix, 3. Rework, 1. Notes.txt) at quest start even if empty
- 3. Rework\ = rework work only; 2. Fix\ = original fix artifacts
- Investigation style: domain-by-domain, confirm each finding before moving to next layer

### 📋 Learning Notes (this session)
- **STATUS_SEMAKAN_PERAKU** was never a real constant — config typo from day one, not a backend change
- **template.config.json variable wiring gap** pattern: KAT_TNH was already coded in #256004 but into wrong variable; XHTML binding confirmed which variable actually matters
- **Gemini diff review** is mandatory — Gemini tends to apply broad speculative changes beyond what was asked
- **Test fix #1 before proposing fix #2** — confirmed this session (fix #2 was unnecessary)
- **Compare FAT vs UAT carefully** — local UAT DB can be outdated; server UAT is the true reference
- **KATETAPUSH skip rationale** — skip when UAT version newer AND field excluded from UI anyway

### Session Recap (For AI Restart)

- **Previous Session** (2026-04-22): QA #257911 investigation started, held. QA #257569 data fix closed.
- **This Session** (2026-04-23 weekday): QA #257911 closed (config fix). QA #257569 rework closed (code fix + UAT data script). Post-mortem. Protocol feedback.
- **On Resume**:
  - FAT-OR #255637 — still pending みや code review + commit + Redmine close
  - Protocol housekeeping session: 4 agreed changes still in todo.md Q2
  - QA #257569 UAT data script — confirm BA/data team executes on UAT

## 🔄 Session Lifecycle
*How this RAM-like memory works*

### Session Start
- **New Session**: RAM cleared, fresh start
- **AI Restart**: Load recap from previous session for continuity
- **Context Loading**: Brief summary of where we left off

### During Session
- **Real-time Updates**: Track current conversation context
- **Working Memory**: Store immediate goals, progress, insights
- **Dynamic Context**: Adjust based on conversation flow

### Session End
- **Important Learning**: Save key insights to permanent file (main/main-memory.md)
- **Temporary Context**: Keep brief recap for next restart
- **RAM Reset**: Clear detailed working memory for next session

## Session Memory Limit
- **Maximum**: 500 lines
- **Reset Behavior**: RAM-style reset preserving only Session Recap
- **Format Reference**: See main/session-format.md for rebuild structure

---

**Memory Type**: RAM - Temporary Working Memory
**Persistence**: Brief recap only, detailed content clears each session
**Purpose**: Immediate context + restart continuity

*Ready for Ruri to provide seamless conversation continuity with Miya!*
