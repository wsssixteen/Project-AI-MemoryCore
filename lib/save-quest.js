#!/usr/bin/env node
// save-quest — born via forge
// symptom: 2026-10-04 miya: when I say save this quest, you will automatically decide based on redmine status to simply close (phase 1) or if the status is Closed in Redmine, it is time for us to Archive so we will run Phase 2
// goal: a quest is closed or archived in step with its live Redmine status, with no stage question to miya
// goal_signal: the reply to save this quest carries the SAVE-QUEST verdict line and the matching stage ran
// retention: keep
// footprint: on-demand: 1 node process per call, one HTTP GET to Redmine with a 6 s timeout, about 1 second; nothing running otherwise
