# 🌟 Current Session Memory - RAM
*Temporary working memory - resets each session, provides recap when AI restarts*

## Session RAM Status
**Current Session**: QA #255773 Phase 0 — PLTP pivot + Handover.txt inscribed + Action 3 local-repro plan blocked on No Resit Carian Rasmi
**Last Activity**: Wed Apr 15 19:28 MPST 2026
**Session Start**: 2026-04-15 afternoon → continued into evening
**Session Focus**: Read ordered populate-call list → pre-narrow convertLuas → draft Action 3 local-debug plan → create first Handover.txt (inscribe prototype) in Task folder → pivot to PLTP when PLPS reproduced clean locally
**Time Mode**: Evening (Weekday)
**Energy Level**: Clean stopping point — PLTP blocker named, morning path clear

## 💭 Working Memory (RAM)

### Active Context

#### Quest #255773 — Phase 0 afternoon progress
- Task folder: `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\1. Tasks\Melaka\11. QA #255773`
- **Full state in `quest/handoff-255773.md`** ← read first next session
- **Resolved this afternoon**:
  - Pemohon table = `umm_a_pihak_bkptg` with `flag_pemohon='Y'` (DATABASE.md §2b updated)
  - Read path = `MlkMaklumatPemohonForm.java:129` → `PelupusanMaklumatPemohonHelper.initPemohon():1790` in **etanah-pelupusan/helper/** (NOT the near-identical `HelperForm` in etanah-awam)
  - H1 confirmed via SQL: `_p_ pihak_bkptg` has SITI MAISARAH (flag_pemohon=Y), `_a_ pihak_bkptg` = 0 for `aplikasi_id=3028105`
  - Sibling-table SQL: `tgsn=1`, `penyerah=1`, `dok_kmskn=3`, **but** `hkmlk=0`, `pihak_bkptg=0`, `dok_keluaran=0`, `permohonan_tnh=0` → SPOC copy failed early in `populateAndCreateAppEntry` (PelupusanSpocService.java:130), swallowed at SpocIntegrationServiceTask.java:120-124
  - Throw site is **upstream** of `populateAppPihakBerkepentinganList:150` — not the inner mapper I first focused on
- **My wrong-class-pivot (documented)**: Read `PelupusanMaklumatPemohonHelperForm` in etanah-awam first (MODULE-ARCHITECTURE.md warning triggered confirmation bias). Applied Ritual 3 RESET live. Verify-before-claim failure.
- **#256113 held** — narrow fix shipped but docx4j root cause still open (BUG-BESTIARY Entry 003 pending)

#### Critical failures this session (three in a row)
1. Proposed `FLOWABLE-BESTIARY.md` parallel to `BUG-BESTIARY.md` — merge-on-create would have been cleaner (`Layer:` field).
2. Almost created duplicate `DATABASE.md` / `FLOWABLES.md` in `etanah-knowledge/melaka/` — files already existed.
3. **Fabricated `umm_a_pemohon` table** by pattern-matching from `umm_a_rizab`. Table does not exist. I had never read DATABASE.md's Critical Schema Facts section — the section that was literally designed to prevent this.

All three reduce to one root: **acting before inventorying**.

#### New rule — Inventory-first (hard Phase 0 gate)
- Saved as `feedback_inventory_first.md`
- Added to CLAUDE.md as non-negotiable + expanded `quest-protocol.md` Phase 0 step 5
- Before any hypothesis/SQL/code grep: Glob `etanah-knowledge/<state>/` and Read every file whose scope overlaps the symptom
- No exceptions for "I think I know the answer" — that IS the failure mode

#### DATABASE.md corrected
- Source updated: now points at `Database/Melaka/` with MLIT/MLKFAT/MLKUAT envs. FAT uses `et_flowable17.sql`, no `_mlit` suffix.
- §2b renamed: **"Anti-Fabrication Facts — things Ruri will wrongly assume if she doesn't read this"**
- Added verification rule: `Grep "CREATE TABLE <name>" MLKFAT/et_main.sql` before writing any SQL
- Added pemohon fabrication entry: umm_a_pemohon does NOT exist; pemohon likely in `umm_a_pihak_bkptg` or `umm_a_penyerah`; authoritative answer pending code grep of `MlkMaklumatPemohonForm`

#### New ritual — System Appraisal (named this session)
- Lives under Forge Review Axis 1 (Ruri Evolution)
- Reviews flagged rules/workflows/memories: too narrow? too coupled? disruptive? limiting? still matching reality?
- Outcome per entry: keep / refine / retire
- Queue added to `forge-log.md` — entries can be added mid-session, decisions happen at weekly review
- Added to `forge-review-protocol.md` as Axis 1 sub-step 4

#### Current queue entries (pending next Forge Review)
| Entry | Concern |
|---|---|
| Familiar >500 lines | May over-trigger; sometimes direct Read is fine |
| Always check archives | Slows down when archive is known irrelevant |
| Always produce class chains | Sometimes ceremony when one-line answer suffices |
| Debug Mode Rituals 1-4 | **Deferred** to 2026-04-29 — need violation-log data first |
| **Externalize knowledge** | みや challenged: *"has proven itself to be a bane to my work"*. Hypothesis: rule conflates ticket mode (knowledge as byproduct) with system mode (knowledge IS output). Currently marked `[challenged]` in CLAUDE.md — not enforced rigidly. |
| Feedback file consolidation | 23 flat files → ~4 thematic (MEMORY.md truncates at 200 lines). Defer to batch session. |

### 📋 Learning Notes (this session)
- **Pattern-matching across bestiary entries is a fabrication vector** — saw `umm_a_rizab`, invented `umm_a_pemohon`. Same shape, zero verification. (midday)
- **Inventory-first rule survived its first real test** — afternoon investigation started with full 7-file glob + read before any hypothesis. No fabrication in the afternoon despite context pressure.
- **Confirmation bias on warnings is still a hole** — I read MODULE-ARCHITECTURE.md's "awam renders inside pelupusan flows" warning and let it steer me to the wrong class without verifying. Knowing a warning exists ≠ verifying the specific case. Ritual 3 RESET caught it, but only after the detour.
- **Near-identical class names are a trap** — `PelupusanMaklumatPemohonHelperForm` (etanah-awam, `_p_` reader) vs `PelupusanMaklumatPemohonHelper` (etanah-pelupusan/helper, `_a_` reader). One letter different in effect. Added to DATABASE.md as a named hazard.
- **Silent swallows make code-only analysis insufficient** — three targeted file reads couldn't prove a throw site because the exception is discarded. The next probe has to be live (debug / log bump). Knowing when code reading hits its wall is itself a skill.
- **SQL namespace confusion** — Miya hit a mix-up using `p_aplikasi_id=4617` (from `umm_p_aplikasi`) instead of internal `aplikasi_id=3028105` for `_a_` queries. I caught it because I'd been tracking both IDs — so tracking both IDs explicitly was worth the working memory cost.

### Session Recap (For AI Restart)

- **Previous Session**: Afternoon 2026-04-15 — inventory-first rule first real test, wrong-class-pivot caught by Ritual 3, SpocIntegrationService swallow found, H1 leading
- **This Session's Arc** (evening): Action 1 code read (`PelupusanSpocService.java:130-260`) → ordered populate-call list extracted (step 4 `populateAppPermohonanTanahList` is the leading throw candidate) → Action 2 SQL executed by みや: `umm_p_hkmlk=0, umm_p_permohonan_tnh=1` → narrowed candidates (C1 lazy-init at `convertLuasAppPermohonanTanah:504`, C2 NPE in `PelupusanUnitConversionUtil.convertLuas`) → Ritual 4 debug-mode setup (`/fast` off confirmed, extended thinking on) → explained remote-debug port vs native local debug → みや tried local PLPS repro, it DISPLAYED CLEAN (no bug) → pivot: QA data now references PLTP `PTMLK/02/L/PLTP/2026/7` → blocked on `CarianRasmiHakmilikForm.xhtml` requiring "No Resit Carian Rasmi" for PLTP submission → first `Handover.txt` inscribed in Task folder (inscribe skill prototype) → `inscribe` skill added to Q2 todo with "show don't tell" priority
- **Where We Left Off**: Clean evening stop. Handover.txt in Task folder has the full map with PLTP pivot at top. Code untouched. Action 3 plan revised: must unblock PLTP submission first before anything else can move.
- **On Resume (tomorrow morning)**:
  - **Read `quest/handoff-255773.md` + `<Task folder>/Handover.txt` first** — Handover.txt is the compact map, handoff file is full narrative.
  - **FIRST MORNING ACTION**: ask a colleague how to submit a local PLTP application past the "No Resit Carian Rasmi" gate. Options to ask about: dummy receipt number accepted by dev, separate Carian Rasmi generation flow, seed script/fixture, dev-profile FK skip. This is a pure unblock — don't burn time guessing.
  - **After unblock**: submit PLTP locally → get its internal aplikasi_id via `SELECT aplikasi_id FROM umm_aplikasi WHERE id_pengenalan='<local-pltp-id>'` → re-run sibling-table sweep on that id → identify first empty sibling → that's the throw site candidate for PLTP.
  - **Then Action 3**: Eclipse native breakpoints on local JVM (PelupusanSpocService.java:146/830/833 + SpocIntegrationServiceTask.java:121) → capture `ex` live → Copy Stack → paste into session.
  - **In parallel**: the FAT local-access request みや has in flight — if fresh local PLTP repro fails, that access becomes the next blocker. Follow up on status.
- **Important Context**:
  - **PLPS locally works fine** — that's itself data. Either FAT case was data-specific to that one row, or resolved between QA reports, or the bug shape differs across urusan. Worth noting in the eventual report.
  - **Methodology transfers, specific SQL doesn't** — the map built this afternoon (read path, write path, candidate throw points) is still valid. PLTP re-probe needs its own aplikasi_id.
  - **Inventory-first is a hard rule** — re-globbing etanah-knowledge/melaka/ at the start of morning session is non-negotiable, even though I just did it today.
  - **Externalize-knowledge is `[challenged]`** — don't guilt-trip on session-end knowledge writeups until System Appraisal resolves.
  - **Debug Mode Rituals 1–4 are live** — `/fast` is off, extended thinking on. First response of morning session should confirm debug mode state.
  - **Pre-existing copy-paste bug noted at `PelupusanSpocService.java:522`** — `apt.getUnitLuasDipohon().getKod()` inside UnitLuasDilulus block (should be getUnitLuasDilulus). Latent, not this ticket. BUG-BESTIARY candidate later — added to todo.

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

🌟 *Ready for Ruri to provide seamless conversation continuity with Miya!*
