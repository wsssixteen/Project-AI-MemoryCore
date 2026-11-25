# domain/deploy

symptom: 2026-11-24 290517: the QA wrote "Need help to deploy the fixing in STAG for testing"; miya had to say "quickly merge I want to deploy", and the merge, its checks and the note took several turns by hand
goal: a BA or QA request to deploy a ticket to internal or staging becomes one sealed plan and one approval code; the merge runs only on that code, the server deploy and the Redmine Submit stay miya's
goal_signal: `log.jsonl` rows `planned` · `stopped` · `merged`; every `merged` row carries the approval line miya typed
retention: keep
footprint: on-demand: one node process plus git children per call, a few seconds; nothing runs otherwise
self_audit: `run` re-checks the sealed plan before it pushes: plan age, single use, approval newer than the plan, source branch unmoved, and the merge changes exactly the sealed files; any miss stops before the push
diagram: diagram.png
boundary: covers a ticket branch, its state's int-env and stag-env branches on origin, and the plans folder · never builds or deploys a server, never touches trunk, release, training, PAT, UAT or PROD, never posts to Redmine · stops at the sealed plan for miya's approval, and at every STOP line
replaces: the by-hand merge, file check and push for a BA deploy request (290517: several turns)

## Parts

| File | What |
|---|---|
| `deploy-plan.js` | Tool (`system/tools.json` row `deploy-plan`): `plan` seals a plan under a code, `run --approve <code>` merges and pushes, `status <code>` |
| `deploy-plan.eval.js` | replays 290517 on a throwaway git origin: 19 checks (seal, refusals, stale source, single use, stops) |
| `deploy-check.js`, `eval*.js` | the older Melaka deploy check, unchanged |
| `plans/` | sealed plans `<code>.json`, the approval record `<code>.miya.json`, the run record `<code>.used.json` (not in git) |

## How it runs

1. A BA or QA asks to deploy a ticket to internal or staging (Redmine note or his relayed words).
2. `plan` reads origin: one `<prefix>/.../<ticket>` branch, the target from `env_branches`, the commits it carries, the files, a conflict check. It seals a plan only when every check passes.
3. miya sees the plan and types `approve deploy XXXX-XXXX`. `domain/prod-alter-gate` writes `<code>.miya.json` from his newest message only (the same reader as PROD alters).
4. `run --approve` re-checks: plan under 60 minutes, not used, approval newer than the plan, the source branch has not moved. It merges `--no-ff` in a temporary folder, checks the merge changes exactly the sealed files, pushes, marks the code used.
5. miya deploys on the server; the BA note is staged and goes out on his word.

## Stops (no code is given)

| Condition | Why |
|---|---|
| env is not internal or staging | PAT, UAT, PROD, training and release go by their own route |
| no branch, or more than one, names the ticket | never guess a branch |
| a carried commit does not name the ticket | another ticket would ride along (`deploy` rule 8) |
| the merge changes `pom.xml` or a file no ticket commit touched | a version bump or a release comes with it |
| the merge conflicts | never resolve by itself |
| the branch is already in the target | nothing to merge |

A commit by another author is not a stop: it is a `WARN` line in the plan, so his approval covers a ticket we did not touch.

## Not built (Fable 5.2 design, 2026-11-25)

Redmine journal detector and board tag, ticket banner, `ticket-close-block --redeploy`, Melaka `env_branches` (Melaka keeps its deploy card), auto conflict resolution.
