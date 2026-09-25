# probe-local-only-gate

symptom: 2026-09-23 #280176: probe commit 3ba0dd4985 (temporary loggers) landed on the staging and internal env branches on 2026-09-22 and needed a revert merge; miya: 'do we need loggers? If yes, please add a rule we will be testing locally. That is a new rule or stopgate from now on.'
goal: no probe or logger build (QA<num>-PROBE marker or QALOG logger) ever reaches an env, trunk or release branch; probes are tested on miya's local JBoss only
goal_signal: a git merge, cherry-pick or rebase whose source ref carries a probe marker and targets an env, trunk or release branch is BLOCKED with the marker files listed
retention: rotate monthly

**What fires when**: PreToolUse (Bash + PowerShell) — a git `merge` / `push` / `cherry-pick` / `rebase` whose SOURCE ref still carries a probe marker (`QA<num>-PROBE` or `QALOG`) and whose TARGET is `mlk/int-env`, `mlk/stag-env`, `mlk/master`, `mlk/mlit`, `mlk/release/*`, `prk/*`, `sgr/master` or `master`. Target = the push destination, or the CURRENT branch for merge / cherry-pick / rebase. The marker grep runs on the source ref, `src/` only.

**Contract**: BLOCK with the marker files listed; bypass `[skip-probe-gate: <reason>]` (reason required).

**Layer choice (Rule 7)**: hook-only. The rule is mechanical (a grep on a ref); no procedure to carry, no skill.

**Trigger moment (Rule 8)**: only a git write verb aimed at a protected branch. The regex anchors on the git verb, so free text that mentions a branch name (forge args, slips evidence) never fires it — the release push-gate false positive of 2026-09-23 is the anti-pattern.

**Observability**: every fire appends to `domain/probe-local-only-gate/log.jsonl` — `ts · action (pass | bypass | blocked) · repo · verb · ref · target · files (count, or the list when blocked)`.

**state-scoped**: yes, keyed by branch prefix — Melaka `mlk/*`, Perak `prk/*`, Selangor `sgr/master`. A new state adds its prefix to `PROTECTED_RX`; recorded here so the next state finds it in one grep.

**How a probe is tested now**: keep the probe on the ticket branch in the work clone (`E:\Dev\etanah-work\etanah-pelupusan`), export `git diff` to `E:\Dev\etanah-work\<ticket>-local.patch`, apply it to miya's local `mlk/master` working tree uncommitted, he builds + reproduces, `server.log` carries the `QA…-PROBE` lines. Remove the probe lines before the fix commit; clear his tree afterwards (the cleanup is mine).

**Eval**: `node domain/probe-local-only-gate/probe-local-only-gate.eval.js` (F1-F23).
