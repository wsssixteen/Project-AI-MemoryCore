# deploy-guard

Picture: `domain/deploy-guard/diagram.png`.

PreToolUse hook on every tool call (matcher ""). It refuses a git command that would break a shared etanah company branch (`mlk/*`, the etanah repos and the work clone `E:\Dev\etanah-work`).

symptom: 2026-08-13 QA-274745: a conflicted int-env merge was "solved" by cherry-picking the fix onto the company branch; miya: "NO CHERRY PICKING ... don't keep on breaking the company's branches."
goal: a ticket fix reaches an env branch only by a --no-ff merge of a ticket branch that holds only that ticket's commits on top of origin/mlk/master, and a conflict stays open for miya
goal_signal: `log.jsonl` shows a `blocked` row for each refused command; no cherry-pick, force-push or wrong-base push reaches origin without his order token
retention: keep
footprint: hook, every tool call: a few regex tests; one or two `git log` reads only on a merge into or push of a ticket branch
boundary: covers git commands in etanah repos and the work clone · never edits a repo, never runs git that moves refs · stops at refusing the command; the fix is the deploy skill §4 and close-phase step 2

## What it refuses

| Kind | When | Cleared by |
|---|---|---|
| cherry-pick | any `git cherry-pick` in etanah context | `[skip-deploy-guard: <reason>]` |
| auto-resolve | `-X ours/theirs`, `checkout --ours/--theirs` | `[skip-deploy-guard: <reason>]` |
| force-push | `push --force`, `--force-with-lease`, `-f`, `+ref` | the one allowed path: `node lib/origin-rewrite.js` |
| reset-hard | `reset --hard` to a ref | `[skip-deploy-guard: <reason>]` |
| revert | `git revert` | his `[miya-ordered-revert: <words>]` |
| re-merge | the same ticket branch merged into the same env branch twice in one day | his `[miya-ordered-remerge: <words>]` |
| wrong-base (v3) | a pushed ticket branch carries a commit outside `origin/mlk/master` whose subject lacks the ticket number | his `[miya-ordered-base: <words>]` |
| multi-commit | a pushed ticket branch carries more than one non-merge commit made today | his `[miya-ordered-multi-commit: <words>]` |

Order tokens are read from his messages only (`lib/his-words.js`), never from the assistant turn.

## Rollback

`git log -- domain/deploy-guard/` and revert the commit; or remove the entry from `.claude/settings.json` PreToolUse matcher "".

Eval: `node domain/deploy-guard/deploy-guard.eval.js` (33 cases).

## History

- 2026-11-25 v3 (291091, per miya: "Please audit that mistake of you branching out NOT fro mlk/master ... Build this properly."; Fable 5.2 audit): kind `wrong-base` on a ticket-branch push; the push and merge checks now match `git -C <folder> push|merge` (the 291091 push used that form and was never checked); the `lib/origin-rewrite.js` exemption moved after the cherry-pick and auto-resolve rules (a command that only mentioned the path ran a cherry-pick unchecked). README and diagram added (census gaps from birth).
- 2026-11-05 v2 (287811): revert, re-merge and multi-commit on his order only; `git -C` for the text rules; the work clone in context.
- 2026-08-13 v1 (QA-274745): born via core/forge.js.