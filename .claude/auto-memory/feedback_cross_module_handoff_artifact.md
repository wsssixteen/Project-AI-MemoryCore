---
name: feedback_cross_module_handoff_artifact
description: "When a fix lands in a module we don't own/commit (etanah-common typically) or miya says pass it to another team — prepare a handoff artifact WITH the before-code commented-out above the new-code, in-file, so the recipient compares before/after up-down at a glance."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: bb314863-3a57-4f05-a939-94f49cf121c3
  modified: 2026-08-12T03:46:45.984Z
---

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

**Banned in the reference file**: symptom paragraph · root-cause paragraph · BEFORE code · "why this is needed" · scope notes · any prose. If context is genuinely needed it goes in the quest MD, not the handoff file.

**Why** (2026-08-12, QA-274318): fix was in `etanah-common\...\UtilitiKemaskiniUlasanJPPHForm.java` (common team owns it). I wrote a handoff `.txt` with symptom + root cause + before/after + scope — みや: *"you added bloats, refer to my copy"* — his `3. Reference.java` was just filename + line markers + the new code. The applied `.java` carries the before/after (for the screenshot); the reference file is bare. Pairs with [[reference_utiliti_ulasan_jt_jpph_screen]] + [[feedback_stay_in_module]] + [[feedback_my_files_minimal]].
