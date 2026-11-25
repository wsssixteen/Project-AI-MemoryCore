**Last Activity (Baseline Pelupusan 1.10.2: released to master and staging)**: 2026-11-24 09:13 — worktree `melaka-baseline-prep-8df5bd`. Release 1.10.2 = 290646 + 290707, no SQL, no flowable, common 1.15.2-MLK.domain.1.0.17-MLK. Pushed 7308f6dab3, staging deployed 16:05 (footer matched), BAQA passed, MR 28 merged by Aaron (091e0d978d), stag-env 3dfead687f (keep-both conflict with 263307 in MlkKertasTemplateForm.java, compiled). State file phase = merged-to-master, stag-catchup --check clean.

## Session Recap (2026-11-23 to 24, Baseline 1.10.2)
- Asked: prepare Melaka baseline; merge; push; is staging ready to tell BA; BA 6.2 dash on PRBB/2026/19; BAQA passed; merge to staging; is GitLab AI review a false alarm; DE.
- Done: release cut, merged, verified, bumped, pushed, card; 6.2 traced (ulasan saved 16:37:38, e-Doket tag present, two causes + one-click test); MR 28 created (Aaron) and merged; staging catch-up with keep-both conflict fix; GitLab AI findings checked against full code (no bug).
- Open: QA-290707 Phase 1 close-out and QA-290646 Phase 2 belong to their own quest sessions; cause of the first 6.2 dash unproven (BA verified after).
- Mistakes: none he corrected; redmine-write-gate false positive on `card --target-version` (blocker slip logged).
- Assessment: A1 release script carried every step, two gates misfired on my own commands (redmine URL, variable path). A2 ⏭ no quest work beyond release. A3 6.2 trace reached DB + template in 10 queries, stopped at the unproven edge. A4 GitLab AI review answered from code, not trust. A5 ⏭ no sweep.

**Last Activity (ADHOC-PRBB-2026-26 Rencana JKBB PTG lost daerah edits: cause + plan agreed)**: 2026-11-20 16:13 — worktree `adhoc-prep-5a52cc` (branch claude/adhoc-prep-5a52cc). PROD PTMLK/02/L/PRBB/2026/9: PTG Jana (`MlkKertasTemplateForm.onJanaUpdate :1814` → `deleteExistingRisalatDocuments`) deletes the daerah Rencana record and makes a fresh template, so versi 24 Word edits are lost. Proof: code + DB + PROD server log (WinSCP, wanda1/2) + decrypted v24 vs v4 (253 vs 219 paragraphs). Plan agreed with BA Fizah: (1) code fix = PTG Jana refills only PTG tags on the same record, the Minit Bebas way (`PelupusanTemplateUtil.restrictPrbbMinitBebasContentControls :671-693`, BA tested MLIT /19); (2) patch: replace RAHSIA-37598722_1.main (record 8783881, revision 41916109) with daerah v24 encrypted by `dms-enc.js` (round trip byte-identical to PROD), reset PDF. Waiting TSO code-fix + patch tickets; adhoc on hold, audit 32/32. Also: ProTime 2026-11-19 = EL only; PROD log + Pena change built outside /system-build (todo row, finish at end of session).

## Session Recap (2026-11-19 to 20, ADHOC-PRBB-2026-26)
- Asked: ProTime EL; adhoc PRBB/2026/9 (why PTG Rencana differs, send back or not, versions); which ticket; 100% sure; can Jana keep edits; retrieve and decrypt PROD documents; BA's patch plan; save; colleague's AWAM remote URL; DE.
- Done: cause 100% (PTG Jana from CR 259108, 2024b86a09); BA test IDs on MLIT; analog found (Minit Bebas tag-restricted repopulate); RAHSIA files decrypted (AES, key in etanah-dms SecurityConstant, 16-byte prefix) and re-encrypt proven; patch target found (current file is versi 1 of record 8783881, not the decrypted versi 4); plan agreed; Remote URL answer (same URL for all clones; Perak pulls master).
- Open: TSO code-fix ticket → promote to QA and Apply candidate A; TSO patch ticket → BA docx → encrypt into 2. Fix + infra boxes; PROD-log/Pena change route steps 1, 2, 8 + main-folder land (todo).
- Mistakes: "by design" said before checking config; CODE-FIX↔CR flip on the user's belief; said RAHSIA cannot be decrypted locally without reading the DMS source; assumed the decrypted versi 4 was the PTG's current file; read the BA's long file name as a different file; system change built without /system-build.
- Assessment: A1 save agents per round kept the audit green but 5 rounds in one hour cost ~600k tokens. A2 adhoc route picked from code + BA analog, not the BA's words (worked). A3 decrypting the stored file settled what the daerah changed in one diff. A4 RAHSIA decrypt/encrypt recipe now in DEV-TESTING-HACKS. A5 ⏭ no sweep.

**Last Activity (/arabic: class Lesson 15-16 + sentence table + warm-up built)**: 2026-11-17 23:54 — worktree `arabic-1b6669` (branch claude/arabic-refresh-exercise-9ee6e2). Live class Lesson 15 Ex 7 → Lesson 16 page 95, class closed (journal line written). Engine: ONE sentence table per ayat, 3 rows (role on top, Arabic, makna; first word rightmost), no baris row, no reasons table; new `warmup` command (read without harakat · 3 words · 3 baris · 3 pointer words, score /10 + streak); eval 116/116. Data: baharu→baru everywhere, class words maktab = pejabat, funduq = pondok, word meanings (ms) on 15 rows. Open: Lesson 15/16 ayat not entered into sentences.json (reading round uses Lesson 13 only); phone app with reminders parked by miya ("another time").

## Session Recap (2026-11-17, /arabic)
- Asked: refresh + exercise before class; per-word table in his drawn layout; follow live class; save; build a pre-class warm-up; DE.
- Done: sentence table rebuilt to his layout and trimmed on his word (3 rows); class-along tables per numbered item; class Lesson 15 Ex 7 to Lesson 16 p.95 logged and closed; teacher words saved; warmup built + SKILL row.
- Open: enter Lesson 15/16 ayat (Ayat walk rule 4) so warmup reads the latest class; phone card app (parked).
- Mistakes: pasted the old row-per-word table though he had specified the across layout (2026-11-10); built two tables then misread his "that table" praise; split question/answer into two tables; cut Ex 2 at the page break (items 16-19 missed); "baharu" used; asked "which line is wrong" three times when he only meant next section; Arabic put in a bullet.
- Assessment: A1 his format now lives in the engine (renderSentence), not in my memory. A2 ⏭ no quest. A3 ⏭ no debugging. A4 ⏭ no etanah work. A5 ⏭ no sweep.

**Last Activity (#289819 TRG PT owner Syer empty → handed to ummi)**: 2026-11-17 15:50 — worktree `pelupusan-1-10-baseline-4927df` (branch claude/redmine-issue-289819-a78938). TRG PROD PTTRG/07/01/L/PT/2026/100 → HSBM 07MH1480/2026: Rekod Ketuanpunyaan empty because the owner Syer is NULL on the PLP pemohon row 11820775 AND on the Pendaftaran copy 12035908 (1 of 44,906 copies in 2026). Patch `2. Fix\289819.sql` (Syer 1/1, 2 rows, schema-checked on PROD), picture `3. Diagram - working vs failing.png`; miya submitted the note 07:47 (Resolved By him, 100%). Open: ummi runs the script on PROD; why PSSHS Hantar saved no Syer is unknown (no log line). TRG repos pulled in both places (pelupusan +63, awam +56, common +39); 6 other TRG repos refused by GitLab.

STEP-3:
session: 6457a431-0660-4b9a-a807-7e35f98650a1
his words: "There's nothing to be verified." (order)
cause step: domain/ticket-close-block/ticket-close-block.js:patch note + alter note greeting · change: 12 lines
new parts: 0
fix or report: fix
who pays: on-demand: one live-status read per generated patch or alter note
goal without the part: a note for a ticket already Verified or later never asks the BA to verify
model: claude-opus-5-5
shown: none (one-line greeting change)
