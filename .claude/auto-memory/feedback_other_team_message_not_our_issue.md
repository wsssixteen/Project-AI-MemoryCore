---
name: feedback_other_team_message_not_our_issue
description: "Message to another team (common/GIS/infra) about their bug = just say it is not our issue + the evidence line; never guide them on how to fix it"
metadata:
  type: feedback
---

When a bug turns out to be another team's (common, GIS, infra), the message to them only says **it is not our issue** and shows the one evidence line (the error from the log). No column lists, no fix steps, no "also your field X is null", no "please send us a script so we can pass it to infra".

**Why**: 2026-09-30 ADHOC-PRBB-2026-6. miya, on my draft to Farhan (common) that listed the table columns and asked for a CREATE TABLE script: "We are not to guide others, we are simply telling them it is not our issue."

**Precondition (2026-10-01, #282442)**: "it is another team's" is only decided after every value OUR code sent into their call was traced and found correct (`Input check:` line). ADHOC-PRBB-2026-6 was sent as "not our issue" while the `et_ptg` in the error came from our empty kodPejabat; GIS bounced it back.

**How to apply**: shape = greeting · one line on which screen fails · the exact error line · "mohon semak". Overrides the before/after `.java` handoff shape in [[feedback_cross_module_handoff_artifact]] unless miya explicitly asks for a handoff file.
