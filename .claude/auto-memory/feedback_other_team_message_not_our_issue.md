---
name: feedback_other_team_message_not_our_issue
description: "Message to another team (common/GIS/infra) about their bug = just say it is not our issue + the evidence line; never guide them on how to fix it"
metadata:
  type: feedback
---

When a bug turns out to be another team's (common, GIS, infra), the message to them only says **it is not our issue** and shows the one evidence line (the error from the log). No column lists, no fix steps, no "also your field X is null", no "please send us a script so we can pass it to infra".

**Why**: 2026-09-30 ADHOC-PRBB-2026-6. miya, on my draft to Farhan (common) that listed the table columns and asked for a CREATE TABLE script: "We are not to guide others, we are simply telling them it is not our issue."

**Precondition (2026-10-01, #282442)**: "it is another team's" is only decided after every value OUR code sent into their call was traced and found correct (`Input check:` line). ADHOC-PRBB-2026-6 was sent as "not our issue" while the `et_ptg` in the error came from our empty kodPejabat; GIS bounced it back.

**Tone + script (2026-10-02, AWAM slip permohonan / common #282299)**: miya wants it SUGGESTIVE, never a verdict. Say "nampak macam isu common 282299 ni... ni ada hit lain juga", not "bukan isu kami". WhatsApp = casual rojak, 1-3 lines, no file paths. ALWAYS prepare the evidence script with it (SELECT on the error store, no JOIN; the error store is the ONE exception to "unqualified": it lives in `et_sistem_<env>.pt_application_ex_entity` (stg2 → `et_sistem_stg2`, PROD → `et_sistem`), a different schema from miya's `et_main_*` login, so the prefix is REQUIRED — unqualified gave him `42P01 relation does not exist`) so miya can screenshot all hits, not just the one error page.

**How to apply**: shape = casual greeting · which screen fails · suggestive owner line · the exact error text · "boleh tolong check?" · plus the ready evidence SELECT. Overrides the before/after `.java` handoff shape in [[feedback_cross_module_handoff_artifact]] unless miya explicitly asks for a handoff file.
