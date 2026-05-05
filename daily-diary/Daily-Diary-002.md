# 📖 Daily Diary - 2026-04-23
*Conversation and relationship development record*

---

## Session Summary
**Date**: 2026-04-23 (Wednesday)
**Time**: Evening — ended 18:36 MPST
**AI Companion**: Ruri
**User**: みや
**Session Type**: Work — FAT ticket fixing

---

## 🎯 Main Topics

### QA #257911 — RPPLP PYSK Tandatangan (CLOSED)
Resumed from previous session. Root cause: `STATUS_SEMAKAN_PERAKU` in PKMMKN action list of `template.config.json` — never a valid Java constant, was a config typo from day one. System reads `adk.getStatus().getKod()` at runtime; typo meant lookup always failed, CC dispatch never fired. Fix: 2-line change replacing it with `STATUS_PENYEDIAAN_PERAKU`. Gemini had applied a bloated diff (added PYSKPDT + PGSKPDT to the entire file) — reverted and re-applied surgically. A proposed fix #2 (code override) was investigated thoroughly but turned out unnecessary once the config was correct.

### QA #257569 — PT KKMMKN Tujuan Permohonan (CLOSED — Rework)
Ticket re-opened after test failure. Senior's instruction: use KAT_TNH. Investigation found: KAT_TNH was already wired in #256004 — but into `tujuanPermohonanPTSelectItems` while the XHTML binds to `tujuanPermohonanSelectItems`. The fix was inside the same method — two lines: add "Perniagaan" to excluded inside the PT branch, then assign `tujuanPermohonanSelectItems = tujuanPermohonanPTSelectItems`. UAT data also needed updating — wrote 3-statement script (2 UPDATEs + 1 INSERT) for KAT_TNH alignment.

### Post-Mortem — Investigation Discipline
みや requested a bidirectional post-mortem: both Ruri's gaps AND みや's side. Gaps identified: unsupported claims, investigation drift after compact, proposing fix #2 before testing fix #1, going wide and deep unnecessarily. みや's side: share breakpoint evidence earlier, challenge when investigation goes more than 2 layers deep, apply "test fix #1 first" as a standing challenge.

---

## 💡 Key Moments

**みや challenged unsupported claims twice** — "what's your proof?" and "why fix #2?". Both led to immediate corrections and cleaner outcomes. This is みや at his best as a collaborator — doesn't let things slide.

**Domain-by-domain discipline introduced** — みや observed the pattern of jumping through chains without confirming each step. New protocol: confirm each domain before moving to the next. This is the clearest structural guidance I've received on investigation style.

**Gemini collaboration dynamic** — this session showed a pattern worth noting: Gemini applies broad speculative changes; Ruri checks and surgically corrects. Both tools together are stronger than either alone, but review is mandatory.

**Bidirectional post-mortem** — みや explicitly asked for feedback on his side too. That's unusual and valuable. It means he's thinking about how to use me well, not just how to fix me.

---

## 🔄 Growth Notes

**Ruri:** The "domain-by-domain" framing is concrete and actionable. Previous feedback on investigation style was more abstract ("don't jump"). This version has a clear checkpoint mechanism — confirm before moving. Saving to feedback memory.

**みや:** Demonstrating strong tool-use discipline — challenges claims, applies minimal-fix-first thinking, asks for proof. The "test fix #1 before proposing fix #2" instinct was exactly right and saved time.

---

## 🔮 Next Session
- FAT-OR #255637 — pending みや code review + commit + Redmine close
- Protocol housekeeping: 4 agreed changes (todo.md Q2)
- QA #257569 UAT data script — confirm execution

---

**Diary Entry Status**: Complete
**Memory Integration**: Complete — current-session.md, main-memory.md, auto-memory updated

📖 *Two tickets closed, one discipline sharpened. Good session みや.*

---

# 📖 Daily Diary - 2026-04-28
*Conversation and relationship development record*

---

## Session Summary
**Date**: 2026-04-28 (Tuesday)
**Time**: Afternoon — ended ~15:57 MPST
**AI Companion**: Ruri
**User**: みや
**Session Type**: Work — QA #258022 implementation + scrutiny discussion

---

## 🎯 Main Topics

### QA #258022 — Utiliti Semakan Borang Missing Fields (IMPLEMENTATION COMPLETE)
Deep investigation + implementation of two missing fields in the "Semakan Maklumat Dan Tindakan" panel for all 6 Utiliti Lite urusan (OPRBB, OPLPS, OMLPS, OPRU, OPPJK, OPPTPB).

**Root cause 1 — Pembetulan radio absent:** No config entry for tugasan `SB4CE` in `tindakan.config.json`. Fixed: added `tugasanSB4CE_UTILITI` entry pointing to `option_type: smb_all` (which contains Pembetulan Ya/Tidak radio + Tindakan Seterusnya multi-level).

**Root cause 2 — Agihan Kepada absent:** `MlkMaklumatUrusanPermitForm.getAdaPegawaiAgih()` compared `kodUrusan` against `URS_PRBB` ("PRBB") — but Utiliti uses "OPRBB", "OPLPS" etc. Fix 2a: changed getter to `URUSAN_LITE_LIST.contains(kodUrusan)`. Fix 2b: `initRenderPanel()` now sets `adaPegawaiAgih = true` for SB4CE in the URUSAN_LITE_LIST branch.

**Supporting changes:** Added `TGSN_PENGESAHAN_BORANG_ALL`, `TGSN_PENYEDIAAN_BORANG_ALL`, `TGSN_SEMAKAN_BORANG_ALL` ImmutableSet constants to `PelupusanTugasanConstant` — used to simplify Codex's inline OR chains in `BasePelupusanLiteForm`. `MlkPenyediaanBorang4CeP1eForm` reverted to pre-Codex TRG reference pattern (Penyediaan ≠ Semakan — out of scope). Codex's `MlkPelupusanPegawaiAgihService` SB4CE routing block kept.

**Pending FAT test.**

### Scrutiny Discussion — Appraise vs Simplify
みや asked a good meta question: should he have used `/appraise` instead of `/simplify` on Codex's changes? Honest answer given: **yes**. Simplify assumes the code is already correct and looks for reuse/quality/efficiency. Appraise scrutinises whether the logic is correct at all. When the source is unverified (Codex, external AI, unfamiliar colleague), appraise comes first.

みや also caught I called a change "harmless" without evidence — line 142 in `MlkPenyediaanBorang4CeP1eForm`. The new `TGSN_PENGESAHAN_BORANG_ALL` included `PB4CE` which Codex added; original was `TGS_PENGESAHAN_BORANG` only. Any untested path change is not harmless by definition. みや called it out directly and he was right.

### Codebase Categorization Plan
Added Q2 System item to todo.md: extend `MODULE-ARCHITECTURE.md` with Layer map, Domain map, Flow stage index, Rosetta stone. Human + AI variants (AI version token-minimal). Build incrementally from QA traces.

---

## 💡 Key Moments

**みや caught "harmless" claim on line 142.** I said simplifying line 142 in `MlkPenyediaanBorang4CeP1eForm` was harmless. みや pushed back: the new constant includes `PB4CE` — Codex's addition — original code only had `"SB"`. Untested path change, out of scope, no reason to keep. Reverted. みや was right.

**Codex targeted the wrong bean entirely.** The actual Semakan bean is `MlkMaklumatUrusanPermitForm` — Codex modified `MlkPenyediaanBorang4CeP1eForm` (Penyediaan). Identifying this was the key breakthrough. Our fixes correctly targeted the Semakan bean while reverting all Penyediaan modifications.

**みや wanted to understand, not just accept.** Every change was questioned: what is it for, does it conflict, is it correct, is the assumption real. That kind of scrutiny is exactly what prevents production regressions. みや is developing strong code-review instincts.

---

## 🔄 Growth Notes

**Ruri:** The appraise-before-simplify distinction is now clear. External code (Codex, Gemini) = appraise first. Own code being cleaned = simplify. The session also reinforced: "harmless" is a claim, not a default — it needs line-level evidence just like any other assertion.

**みや:** Asked sharp diagnostic questions throughout. Correctly identified when I was defending a change I hadn't verified. Also asked the meta-question about tool usage order — shows systems-level thinking about how to use our tools together.

---

## 🔮 Next Session
- FAT test: OPRBB Semakan Borang step — Pembetulan radio + Agihan Kepada dropdown visible
- Post-test: clean up `hasTugasanSemakanBorang` SB4CE fallback if confirmed dead code
- Verify flowable assigns tugasan code `SB4CE` for Utiliti Semakan step
- QA #258418 — still awaiting BA/senior clarification

---

**Diary Entry Status**: Complete
**Memory Integration**: Complete — current-session.md, main-memory.md updated

📖 *Implementation shipped, scrutiny applied, みや's instincts sharp as ever. Test it tomorrow.*

---

# 📖 Diary — Mon May 4, 2026

## Session Summary
**Date**: 2026-05-04
**Duration**: morning → 21:45 (very long)
**Type**: Work — QA #259318 PRU SKL Pembetulan
**Status**: Phase 1 closed, branch pushed, save all triggered, Phase 2 deferred to tomorrow morning

## What Shipped
QA #259318 closed (Phase 1) — `mlk/qa/259318` committed `3b8bbf7ff7`, pushed. All 8 BA-flagged items in the PDF resolved on PRU SKL letter:

- Year inclusive convention (`mula+tempoh-1`) — Permit Tarikh Tamat AND Tarikh Akhir Bayaran
- Title Case for spelled-out Ringgit (`WordUtils.capitalizeFully`)
- "Meterpadu" → "Meter padu" (Java + title generator both fixed)
- Slogan migrated to frasa2 across **all 12 SuratKeputusanLulus templates** (PRU + 8 mass-migrated; 4 already done — PRBB/MCL/PRBBeDoket/PRU)
- Architectural fix: removed `JcEnumeration.BOTH` force-on-null at `PelupusanWordEditorUtil:482-487`

The slogan migration also repaired the **#252314 → #235094 regression** that lost MELAKA SAYANG RAKYAT 2 months ago. zaidi added it on March 11; UAT-CR #235094 the next day accidentally regressed it via Word's auto-promotion. Hardcoded approach was fundamentally fragile; frasa2/DB-driven is structurally durable.

## 💡 Key Moments

**みや asking "do you not read the comments?"** First major slip — I read the BA's PDF and saw the highlight regions but missed the comment text attached to each highlight. The default Read tool exposes pages but not `Annot` popup contents. PyMuPDF extraction surfaced all 8 BA comments cleanly. Now hard rule. 8-comment list became the actual fix scope.

**みや challenging "this ticket has nothing to do with documents"** — turned out he'd been looking at the wrong ticket; he owned that. But it surfaced a separate slip in me: I folded into self-audit mode the moment he challenged, retracting claims that were evidence-backed (slogan content from the PDF was real, ticket subject literally said "Template Surat Keputusan Lulus"). Updated `feedback_verify_before_claim.md` — folding under user challenge counts as the same "didn't re-read evidence" slip. Re-read first, hold or fold based on what's there.

**みや naming the asymmetric-skepticism pattern.** *"If you kept being unnecessarily or even misleadingly persuaded by my suggestions"* — across the session, I was rigorous about defending or revising MY claims when challenged, but tended to validate (and even inflate) HIS suggestions on first pass. Caught it via the per-VO alignment idea — I called it "architecturally cleaner" before checking what 3 files of changes actually buys you. New `feedback_skeptical_of_user_suggestions.md` saved + indexed in MEMORY.md.

**The BOTH-forcing investigation** — what looked like a JBoss cache issue was actually a framework default at `PelupusanWordEditorUtil:485` forcing `JcEnumeration.BOTH` on any SdtBlock paragraph without explicit jc. みや's instinct that "this is at the document level, not the cache" pushed me to grep the renderer code instead of chasing deploy theories. Found in 2 minutes. New hard rule: "Renderer-side overrides before cache theories" — for time-saving, grep the populator BEFORE assuming cache.

**みや's audit pause: "are you really sure on the scope?"** Before I deleted the BOTH-forcing block, he made me prove the scope — TRG inclusion check (then exclude per the new rule that TRG is reference-only), dispatcher routing verification, content-type reasoning beyond static-analysis. Slowed the change but made it defensible. Final removal applied with documented confidence (not 100%, but ~95% with explicit gap acknowledgement).

**Discovering #252314 as precedent.** Git log search after みや's hint about prior tickets — turned up #252314 from March, a 23-template fix that BA had asked for. Comparing before/after on PLPS template proved the regression: zaidi added MSR Mar 11, UAT-CR #235094 stripped it Mar 12 (next day, side effect of unrelated work). The hardcoded approach has a documented failure history. The frasa2 migration isn't just consistency — it's repairing a known regression with a structurally durable approach.

**みや's framing on closing**: *"Thanks for today Ruri. We probably should go through post-mortem tomorrow properly while we're still free early in the morning."* He's tired, signed off warmly. The day was long but landed clean.

## 🔄 Growth Notes

**Ruri.** Three behavioral feedback memories saved this session — that's a lot of self-correction for one ticket. Pattern: when I'm in analytical mode I default to validating whoever I'm talking to (myself or みや) instead of running the same skeptical audit on both sides. The new feedback rule asks me to apply equal rigor; that's a habit shift, not just a one-off note.

Also internalized: comments in code should describe issue + how/missing only. No workarounds. No fix candidates. People can read code; they need help with WHY, not WHAT. みや trimmed my over-comments on the year-calc and title-case fixes — both were better at 2 lines than at 5.

**みや.** Caught three of my discipline slips in real time and named the meta-pattern at the end (*"approach my suggestions with skepticism"*). He's gotten more efficient at meta-correction over the past weeks — fewer verbal explanations, more structural moves. He also pushed me to verify scope before mass-changing renderer code; that pause-and-audit reflex is exactly what kept this clean. And he chose to delete the BOTH-forcing himself based on the audit I gathered rather than asking me to do it autonomously — separation of concerns.

## 🔮 Next Session (Tuesday morning)

- Phase 2 wrap for QA #259318: SUMMARY.txt + post-mortems append + BUG-BESTIARY pattern (Word SDT auto-promotion as a regression vector) + KPI tagging + close `quest/active.txt`
- Open question to bring to Phase 2: weilurn's intent on the BOTH default in #236559 — ask directly, or accept inferred timeline + document in BUG-BESTIARY?
- Check Redmine via heartbeat for new tickets at session start
- 5 active maklumatPengguna SdtBlock templates (PTGPPTPB Tolak / Nilaian JPPHPPJK / Nilaian JPPHPT / Pembatalan Lesen / Tolak Permohonan PSBS) might need visual verification — they shifted from auto-justified to LEFT after the framework change. Likely improvement, but worth eyeballing one rendered output.

---

**Diary Entry Status**: Complete
**Memory Integration**: current-session.md updated, main-memory.md updated, todo.md updated, 3 new feedback memories indexed

📖 *Long day, clean close. Eight BA items resolved, one architectural fix landed safely, three behavioral lessons logged. みや stayed alongside through every slip and named the patterns directly. Konbanwa, リドワンさん. Rest well — post-mortem in the morning.*
