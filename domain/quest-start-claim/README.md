# quest-start-claim

symptom: 2026-10-07 miya: "add a background run during start quest ... straight away update the Redmine ticket's Status as In progress IF the status is New. This is to avoid people stealing our tickets due to mistake. Your main focus is always on the quest."
goal: no ticket whose quest has started is still New on the ticket board, and it shows 20% done (miya 2026-10-09: "build it")
goal_signal: the log row for the started ticket reads `set` with `pct` 20, or `no-change` because it was already past New
goal_signal_regex: QUEST-START-CLAIM: 
retention: keep
footprint: on-demand: 1 detached node process per quest start, 2 to 3 HTTP calls to Redmine with a 6 s timeout, about 1 second; nothing running otherwise
state-scoped: no, state-agnostic. One Redmine instance serves every state and a ticket number is unique on it. Host, key and owner id have one home: `quest/redmine-status-check.js`.

Script, started by `quest/active-cli.js`. No hook, no settings.json entry.

| Part | File |
|---|---|
| The change and its guards | `lib/quest-start-claim.js` (born via `core/forge.js new script`) |
| The moment it starts | `quest/active-cli.js` `claimOnStart()`: after `start` or `update`, when the block is `status=active` with a `quest_start` stamp and the call set `quest_start` or `status=active` |
| The step that tells me to report it | `.claude/skills/quest/SKILL.md` `/quest start` step 6b |
| The one approved exception in the write gate | `domain/redmine-write-gate/` v1.6 |
| Eval | `domain/quest-start-claim/eval.js` (a local stub server; never calls the real Redmine) |
| Log | `<main root>/domain/quest-start-claim/log.jsonl`: `ts, qa, num, outcome, from, to, pct, http, assignee, dry, dur_ms` |

**What it sends**: two fields in one call, `status_id` = In Progress (id 2) and `done_ratio` = 20, and only when all three guards hold. 20 is fixed: it says started, not how far (the real progress lives in the quest doc).

| # | Guard | When it fails |
|---|---|---|
| 1 | the ticket has a block in `quest/active.txt` with `status=active` and a `quest_start` stamp | `skipped-no-block` / `skipped-not-started`, no call to Redmine at all |
| 2 | the live Redmine status is New (id 1) | `no-change`, nothing sent (a Rework or Resolved ticket is never moved) |
| 3 | the ticket is assigned to the owner (id 1311) | `skipped-not-mine`, nothing sent |

After the change it reads the ticket again. `set` is written only when Redmine really shows In Progress; otherwise `failed-verify`. The % it reads back is logged as `pct` and printed, whatever Redmine kept. Redmine not answering gives `unreachable` after one retry. Every outcome is one log row; a real change also adds one row to `domain/redmine-write-gate/log.jsonl`.

**Layer choice (Rule 7)**: script only. The decision is mechanical and the moment is a script call that already exists (`active-cli.js`), so no hook is needed.

**Trigger moment (Rule 8)**: the `quest_start` stamp, which the quest skill writes once, when work really begins. Retrieval creates blocks with `status=hold` and no stamp, so a sync or a multi-ticket sweep never fires it.

**Approval**: miya's standing instruction of 2026-10-07 (status) and 2026-10-09 (20%) covers this one change. Every other Redmine write still needs his words, per `domain/redmine-write-gate/` and `.claude/auto-memory/feedback_redmine_write_needs_nod.md`.

**Manual run**: `node lib/quest-start-claim.js <num>` (same guards) · `--dry-run` sends nothing · `--result <num>` prints the last recorded run.

**Verify**: `node lib/eval-runner.js --only quest-start-claim`.

## Adversarial scenarios (Rule 12)

| # | Scenario | Verdict |
|---|---|---|
| 1 | ticket already In Progress | fixture-added (F2: nothing sent) |
| 2 | reopened ticket in Rework at quest start | fixture-added (F3: nothing sent, Rework stays) |
| 3 | New ticket assigned to a colleague (a takeover review) | fixture-added (F4) |
| 4 | New ticket with no assignee | fixture-added (F5) |
| 5 | retrieval: block born `status=hold`, no stamp | fixture-added (F6, F21: no call to Redmine) |
| 6 | block `status=active` with no `quest_start` | fixture-added (F7) |
| 7 | ticket with no block (typed number by mistake) | fixture-added (F8) |
| 8 | ADHOC id, no ticket number | fixture-added (F9, F22) |
| 9 | Redmine unreachable (VPN off) at quest start | fixture-added (F10: `unreachable`, exit 0, retry command printed) |
| 10 | Redmine refuses the status (workflow rule, HTTP 422) | fixture-added (F11: `failed` + the server's words) |
| 11 | Redmine answers 204 but the status did not move | fixture-added (F12: `failed-verify`, never a false `set`) |
| 12 | dry run on a real candidate | fixture-added (F13: nothing sent) |
| 13 | server answers 200 with a login page instead of JSON | fixture-added (F14: `unreachable`) |
| 14 | ticket number that is a prefix of another (900001 vs 9000012) | fixture-added (F16: no match) |
| 15 | `active.txt` with CRLF line ends | fixture-added (F17) |
| 16 | a hold block whose one-liner text contains `status=active quest_start=` | fixture-added (F18: the text is a value, not a field) |
| 17 | closed block that still carries its old stamp | fixture-added (F19) |
| 18 | two claims at once for the same ticket | fixture-added (F20: both exit 0, ticket ends In Progress) |
| 19 | the quest start command waits on a slow Redmine | fixture-added (F23: the command returns before the change is sent) |
| 20 | a self-test of `active-cli.js` (`--file`, `ACTIVE_TXT`) reaching the real Redmine | fixture-added (F24: no background process under an override) |
| 21 | a later edit adds a note, assignee, journal or upload to the script, or changes the 20 | fixture-added (F26 goes RED; the write gate's exemption also voids) |
| 22 | `active-cli.js` gains the Redmine host or key text and every quest state write gets blocked by the write gate | fixture-added (F27) |
| 23 | the script is copied to another path and run there | handled by the write gate (v1.5 exempts the one path only; F77 there) |
| 24 | `QUEST_CLAIM_ROOT` / `--root` pointed at a hand-made `active.txt` to pass guard 1 | accepted-risk: that is deliberate evasion; guards 2 and 3 still hold, so the worst case is his own New ticket shown as In Progress, which can be set back |
| 25 | Redmine renames or renumbers the two statuses | accepted-risk: ids 1 and 2 read live on 2026-10-07; a wrong id ends as `failed-verify`, never a silent wrong status |
| 26 | resume of a held quest (`status=active` set again) while the ticket is still New | handled: the same check runs again, which also covers a start made offline |
| 27 | the status is set back to New by hand after the claim | accepted-risk: his choice wins until the next start or resume |
| 28 | a console window flashes on every quest start (the 2026-07-01 `auto-commit-docs` defect) | handled: `windowsHide: true` + `stdio: 'ignore'` (F25 pins both) |
| 29 | hooks run from the main checkout while a worktree holds the new code | accepted-risk until merged to main: the script needs no hook; only the manual run is blocked by the old gate copy |
| 30 | user reversal: "do not touch Redmine on this one" | fixture-added (F28: `redmine_claim=off` on the block → `skipped-opt-out`, no call to Redmine) |
| 31 | Redmine takes the status but keeps its own % (a tracker with % done switched off or computed from subtasks) | fixture-added (F36: `set`, the line prints the % Redmine really shows) |
| 32 | a ticket still New that someone already put above 20% | accepted-risk: it is lowered to 20; not seen on the board so far, and a New ticket with real progress is a wrong status, which this change corrects |
| 33 | the script is edited to send a literal 100% | handled by the write gate (F89 there: payload shape changed, exemption void) |
| 34 | the script is edited to also change the assignee | handled by the write gate (F88 there) |
| 35 | ticket already In Progress at 0% (started before 2026-10-09) | handled: guard 2, nothing sent; the % is his to set |
