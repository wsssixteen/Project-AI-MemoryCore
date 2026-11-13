# release-mlk-plp-ask

On a release message, points to the Melaka release pipeline (`release-mlk-plp` skill), or, when the message names another state, says that pipeline does not apply and gives that state's main branch.

symptom: 2026-07-16 miya pasted a Planned Release Melaka message and ad-hoc git ran instead of the pipeline · 2026-11-12 a Planned Release PERAK 1.75.7 message got the Melaka-only pipeline advice (target mlk/master); miya 2026-11-13: "I am worried this will be an issue in the future, can you audit and check"
goal: a release message is routed to the release route of the state it names, never to the Melaka pipeline for another state
goal_signal: a Melaka release message gets the release-mlk-plp advice · a Perak or Selangor release message gets "does NOT apply" and that state's main branch
retention: rotate monthly (central hook-fires telemetry; no own log)
footprint: per-prompt: 1 node process, regex only; reads system/states.json only when the release words already matched
boundary: covers the prompt text and system/states.json · never edits a file, never blocks, never runs git · stops at one advisory line in context
self_audit: the eval (12 fixtures) replays the Melaka, Perak and Selangor messages and checks the advice text
diagram: diagram.png (source diagram.html)
replaces: none: this README documents an existing hook (born 2026-07-16 with no README); no new part is born, miya ordered the fix "Yes, build it"
state-scoped: yes, keyed by the state names and main branches in system/states.json (lib/states.js)

| Prompt names | Advice |
|---|---|
| Melaka, or no state | run the `release-mlk-plp` skill (unchanged since 2026-07-16) |
| another state only | the Melaka pipeline does NOT apply; `<state>` main branch = `lib/states.js trunk` |
| Melaka and another state | Melaka advice (Melaka is named) |

Eval: `node domain/release-mlk-plp-ask/release-mlk-plp-ask.eval.js`

Change 2026-11-13: state check added (8 lines). Rollback: `git revert <commit>`.
