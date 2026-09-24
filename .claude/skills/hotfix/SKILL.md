---
name: hotfix
description: Use when a PROD break follows a release and needs a hotfix — the word "hotfix", "released yesterday", "dah release", "after the release", or a CLOSED/released ticket named with a PROD error. Runs the 10-step etanah hotfix workflow (scaffold → PROD vs STAG proof → mlk/hotfix/<own #> branch → PROD-shaped staging mirror → whole-page fix → keyed test scenario → stag-env → renumber → Redmine). The etanah-intake-gate HOTFIX lane injects the invoke.
---

# hotfix — PROD break after a release

TRIGGER: PROD break after a release: the word hotfix, released yesterday/dah release, or a closed ticket named with a PROD error (etanah-intake-gate HOTFIX lane injects the invoke)

**Iron law**: a # named in the prompt that is CLOSED or released is a REFERENCE. The hotfix gets its OWN ticket, quest, Task folder and branch.

| # | Step | Done when | Gate / tool |
|---|---|---|---|
| 0 | **Scaffold first** — own ticket # → `node quest/redmine-sync.js <num>`; no # yet → ADHOC scaffold (ADHOC-REGISTER), renumber at step 8 | quest block + Task folder exist BEFORE any SQL or code | `quest-exists-gate` blocks the commit otherwise |
| 1 | **PROD vs STAG diff** — the same permohonan on both envs, `row_to_json` per table; every claim ("it is DMMLMS", "versi 0 holds X") ships WITH its SELECT | a diff table: column · PROD · STAG · why it differs | evidence rule (`feedback_show_evidence_script_or_code`) |
| 2 | **Branch** `mlk/hotfix/<own #>` off FRESH `origin/mlk/master`, in the work clone `E:\Dev\etanah-work\<repo>` (the local-server clone stays on trunk) | `git rev-list --count HEAD..origin/mlk/master` = 0 at branch time | `branch-guard` (F9/F10) |
| 3 | **Staging mirror** — `2. Fix\<#>-reset.sql` restores the PROD shape on staging (every row the diff showed, extra rows deleted, FK children first); stamp via `domain/sql-schema-verify` | reset run → staging diff vs PROD = empty | `script-check` skill |
| 4 | **Fix — whole page, whole flow**: trace EVERY value on the BA screenshot, not just the reported one; list every tugasan that shares the screen/VO; read each caller's VO loader before calling it safe | a table: value on screen · source column · writer · every tugasan that reads it | quest Rubric blast-radius |
| 5 | **Test scenario with exact keys** — login · screen · exact input (no spaces in No LPS; a Tahun with no issued versi) · every auto-added blank row filled or Hapus'd · expected result per step | the scenario runs green end-to-end without a question back | test-data-echo |
| 6 | **Compile** in the work clone (`mvn -o -q compile`), commit subject-only `#<own #> - <URUSAN> - <Tugasan> - <what changed>` | compile green; no AI trailer | `compile-gate` · commit trailer ban |
| 7 | **stag-env** merge `--no-ff`, push; after BA pass → int-env | both env tips contain the hotfix SHA | `release-mlk-plp` ENV-TESTED gate |
| 8 | **Renumber** (own # arrives late / wrong # used): new branch off master, re-apply with `git diff A~1 A \| git apply --index`, revert the old merge on stag-env, re-merge, delete the old remote branch. Never force-push, never cherry-pick | `git log origin/mlk/stag-env --grep <old #>` shows only the revert | `deploy-guard` bans cherry-pick |
| 9 | **Redmine pass** — Root cause + Solution in plain Malay, branch named; `redmine-phase1-prefill` needs a nod | miya submits | `redmine-write-needs-nod` |

**Before handback, emit**: `HOTFIX — scaffold ✓ · proof SELECTs <n> · branch mlk/hotfix/<#> off <master SHA> · mirror reset ✓ · screen values traced <n>/<n> · tugasan sharing screen <list> · test keys echoed ✓`

**Knowledge**: `projects/coding-projects/active/etanah-knowledge/melaka/BRANCH-AND-DEPLOY.md` §8 (branch + renumber commands).

**Replay (2026-09-24, #281392)**: the prompt named closed #280176 and said "hotfix". I worked it as #280176: fix on the closed ticket branch, no quest or Task folder until miya forced it, claims without SELECTs, test key `M 081` that finds nothing, a blank auto-row that silently blocked the save, and two defects (Semakan overwrite, 2027 dates) that miya found. Steps 0, 1, 2, 4 and 5 each stop one of those.

symptom: 2026-09-24 #281392: miya - you don't know how to handle hotfixes? you failed to create a task folder
goal: a PROD hotfix ships on its own ticket branch with a quest, proof per claim, and a full-page tested fix in one pass
goal_signal: hotfix quest reaches Resolved with zero miya corrections on branch, scaffold, proof or test data
retention: keep
