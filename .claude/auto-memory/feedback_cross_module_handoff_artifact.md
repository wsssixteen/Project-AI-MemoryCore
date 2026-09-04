---
name: feedback_cross_module_handoff_artifact
description: "When a fix lands in a module we don't own/commit (etanah-common typically) or miya says pass it to another team — prepare a handoff artifact WITH the before-code commented-out above the new-code, in-file, so the recipient compares before/after up-down at a glance."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: bb314863-3a57-4f05-a939-94f49cf121c3
  modified: 2026-08-27T07:44:08.434Z
---

**🚨 EVIDENCE/PROOF QUERIES GO IN CHAT, NEVER THE TASK FOLDER (added 2026-08-21, #276436).** A proof SELECT is shown in chat for miya to run and screenshot. It is NOT a deliverable. Do NOT save it into `2. Fix/` — that folder holds only the real fix (the `.java`/`.docx`/patch). A ticket is not a data patch just because it has a query. The Task folder is for what gets attached to the ticket as the fix; a screenshot of the query result is the evidence, the query itself lives in chat. Slip: `evidence-query-in-task-folder`.

**🚫🚫 MARKDOWN (.md) HANDOVER IS FOREVER BANNED (2026-08-27, per みや, deterministic).** NEVER write a `.md` write-up / `HANDOVER-*.md` for a cross-module fix — みや hates it. The hand-off is a BARE source file only (see shape below). Enforced by `domain/cross-module-handoff-gate/` (PreToolUse, BLOCKS any `.md` or `handover/handoff`-named file written into a `1. Tasks\Melaka` Task folder; bypass `[skip-handoff-gate: <reason>]`).

**When a fix belongs to a module that is NOT ours to commit (etanah-common is the usual one; also any non-pelupusan/non-awam module) OR みや signals a hand-off — produce a HANDOFF ARTIFACT, not just a chat diff.**

**Trigger keywords** (quest workflow — treat as a cross-module-handoff signal): "pass to common team" · "give to etanah-common" · "pass to another module" · "not our module" · "not our domain" · "hand to <X> team" · "cross-module" · "prepare for handoff" · "screenshot to give to <team>" · "someone else will fix" · a fix whose file resolves to `etanah-common\src\...` (or any module outside the ticket's own repo).

**The artifact shape** — TWO things, each minimal:
1. **The applied source file** (for the screenshot): apply the change in the local module file and include the BEFORE code commented-out directly ABOVE the new code, in the same file — so the screenshot shows before/after up→down. Comments ARE requested here (`[comment-ok: cross-module handoff]`).
2. **The reference file** in `2. Fix/` (e.g. `3. Reference.java`): **MINIMAL — filename header + `// Line N` marker + the NEW code only.** Nothing else. NO symptom / root-cause / before-after / scope prose — that is bloat.
   ```
   //UtilitiKemaskiniUlasanJPPHForm.java

   // Line 590
   <new code block>

   // Line 795
   <new code block>
   ```

**🚨 COMMENTS ARE SHORT STATEMENTS, NOT EXPLANATIONS (added 2026-08-21, #276436).** Every comment in a handoff file is one short plain sentence stating a fact. No AI-explaining prose. No "DB-proven: X have this, Y do not" — write "PPTPB missing tujuanPermohonan inside DB". No "the constant does not exist yet" — just `// SpocHasilConstant.java — add:` then the line. No sudden CAPS. The ask to the other team is one line: "Please check PPTPB can use the same function as PRBB & PRU for the fix. Thank you." Slip: `handoff-babble-not-statement`.

**Banned in the reference file**: symptom paragraph · root-cause paragraph · BEFORE code · "why this is needed" · scope notes · any prose. If context is genuinely needed it goes in the quest MD, not the handoff file.

---

## 🚨 Handoff to ANOTHER TEAM (SPOC / common / reports) — the 4 deliverables (added 2026-08-21 per みや, #276436)

When the recipient is a **different team** (they do NOT see our chat), the artifact must be self-contained but WAIT-WHAT simple. Every cross-module handoff produces ALL FOUR, in order:

1. **In chat — the EVIDENCE**: the code (`file:line`) **and/or** a query, shown, proving where the gap is. Not described — SHOWN.
2. **In chat — the BRIEF**: plain simple words (the `wait-what` test — if a reader would say "wait, what?", it is too jargony). BANNED jargon like "SPOC never persists" — say "SPOC does not save it".
3. **In `2. Fix/` (or the latest `Rework/`) — `<JavaFileName>.java`**: BARE — filename header + `// Line N (BEFORE)` / `// Line N (AFTER)` markers + the code blocks ONLY. **NO prose explanation inside the file** (miya 2026-08-21: *"this part shouldn't be inside the fucking file"* about a PLAIN-ENGLISH comment block). The wait-what explanation goes in CHAT (step 2), never in the code file. `[comment-ok: cross-module handoff — line markers only]`.
4. **In `2. Fix/` (or the latest `Rework/`) — the script file** (`.sql`): SCRIPT-CONVENTION/CHECK format + VERY SHORT SIMPLE explanation + schema-qualified + env-tagged header (infra convention). **NO before/after SELECT pair** — one evidence query only (miya refers to chat for the rest). It lives in `2. Fix/`, NOT the deploy-`script`-folder that gets uploaded.

**🚨 VERIFY-IN-TARGET-MODULE BEFORE PROPOSING (added 2026-08-21, #276436 — cross-module-unverified-analog slip).** A cross-module handoff names constants / urusan kods / config in a module we do NOT compile. Before writing ANY "add X to Y" fix for that module, GREP THE TARGET MODULE for every literal you reference — the constant, the urusan kod, the config row. Do NOT assume the working-analog (PRBB/PRU) covers the new case (PPTPB) just because the shape matches. **The miss**: proposed "add `URUSAN_PPTPB` to the save list" — but `PPTPB` appears in ZERO etanah-spoc-hasil files and ZERO of the 342 rows in `spocTabAndComponentRules.xls`; the constant does not exist. A handoff that references a non-existent constant is worse than none. **The check**: `grep -rn "<KOD>" <target-module>/src` AND the config file → if 0, the fix is "ADD support", not "add to a list"; say so.

**If the cross-module PASS structure is missing** (the key/channel the other module must write, and our side already reads it) — name it in the handoff: which key/field they write, which of our lines already reads it.

**Why** (2026-08-21, #276436): PPTPB SKM counter-route — Tujuan/Kategori belong to etanah-spoc-hasil (never-edit). The right output is a send-ready package (before/after `.java` + evidence `.sql` + wait-what brief) so みや forwards it to SPOC with zero rework. Distinct from the bare-reference shape above (that was a common-team handoff where みや had already given chat context). Pairs with [[feedback_module_edit_boundary]].

**Why** (2026-08-12, QA-274318): fix was in `etanah-common\...\UtilitiKemaskiniUlasanJPPHForm.java` (common team owns it). I wrote a handoff `.txt` with symptom + root cause + before/after + scope — みや: *"you added bloats, refer to my copy"* — his `3. Reference.java` was just filename + line markers + the new code. The applied `.java` carries the before/after (for the screenshot); the reference file is bare. Pairs with [[reference_utiliti_ulasan_jt_jpph_screen]] + [[feedback_stay_in_module]] + [[feedback_my_files_minimal]].

enforcement: hook-exists: cross-module-handoff-gate
