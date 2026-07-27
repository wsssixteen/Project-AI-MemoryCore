---
name: deploy
description: Fast env-deploy card for Melaka test environments — merge a ticket branch into an env branch (mlk/stag-env or mlk/int-env) then emit the numbered ssh build+deploy steps. NOT a release (that is `release-mlk-plp`). Triggers — "/deploy", "/deploy stag awam 271721", "/deploy internal plp 265537", "deploy to internal", "deploy to staging", "deploy X to mlit", "push X to stag", any ask to get a ticket branch onto a Melaka test environment.
---

# deploy — env-deploy card (Melaka)

`/deploy <env> <module> <ticket-or-branch>`

`/deploy internal awam 271721` · `/deploy stag plp mlk/qa/265537`

**Output = a numbered command card. That is all.** No conversation, no options, no essay,
no "would you like me to". みや types one line; he gets steps he can run.

---

## 1 · Resolve the arguments

| みや says | Base branch | Deploy folder |
|---|---|---|
| `stag` · `staging` | `mlk/stag-env` | `deployment-scripts/stag/` on `172.30.12.203` |
| `internal` · `int` · `mlit` | `mlk/int-env` | `deployment-scripts/mlit/` on `172.16.100.162` |

| みや says | Repo | Scripts |
|---|---|---|
| `awam` | `E:\Projects\Melaka\etanah-awam` | `build-awam.sh` · `deploy-awam.sh` |
| `plp` · `pelupusan` | `E:\Projects\Melaka\etanah-pelupusan` | `build-pelupusan.sh` · `deploy-pelupusan.sh` |

**Ticket → branch**: `git ls-remote --heads origin "*<ticket>*"` — never assume the shape.
Prefixes in use: `mlk/esokongan/` · `mlk/esokongan-nr/` · `mlk/internal-issue/` · `mlk/internal/` ·
`mlk/is/` · `mlk/qa/` · `mlk/cr/` · `mlk/requirement/` · `mlk/development/`.
Multiple matches → list them, stop. Zero matches → say so, stop.

---

## 2 · Servers — only two IPs exist

| Host | Alias | Holds |
|---|---|---|
| `172.16.100.162` | `mirage1` | `build-scripts17/` **and** `deployment-scripts/` (`common` `hotfix` `mlit` `mlitdm` `mltg` `warfiles`) |
| `172.30.12.203` | — | `deployment-scripts/stag/` |

ssh user for both: `app`.

`172.16.100.197:5444` is the mlit database — never an ssh target.

---

## 3 · The two pipelines differ — do not blend them

```
INTERNAL (mlit)                        STAGING (stag)
────────────────                       ──────────────
build + deploy = ONE function          build + deploy = TWO steps, TWO hosts

ssh app@172.16.100.162                 ssh app@172.16.100.162
cd deployment-scripts/mlit             cd build-scripts17
./deploy-<module>.sh                   ./build-<module>.sh mlk/stag-env
   → branch prompt → mlk/int-env          → env prompt → stag
                                       (exit)
                                       ssh app@172.30.12.203
                                       cd deployment-scripts/stag
                                       ./deploy-<module>.sh
```

⚠️ `build-<module>.sh`'s env menu is `pat/uat/stag/train/prod/hotfix` — there is
no `int` or `mlit` choice, because internal never touches the build script. Any card
telling みや to pick `int` at a build prompt is wrong.

Source: colleague 2026-07-27 — *"Same IP as building staging, just different folder, also for
internal. Build and deploy is 1 function. So no need to build and deploy in separate
folders/servers."*

---

## 4 · Ruri's git sequence — run it silently, report only the result

Straight-push. **No nod gate.** Justified: `mlk/stag-env` and `mlk/int-env` have zero backflow
into `mlk/master` (verified 2026-07-27 across full merge history) — a wrong merge cannot reach
the release path, and `git revert -m 1 <sha>` undoes it additively. Precedent: `aa2db329a8`.

1. `git fetch origin <base> <ticket-branch>`
2. **Already-merged guard** — `git merge-base --is-ancestor origin/<ticket-branch> origin/<base>`
   passes → skip to the card, one line saying so.
3. Stash tracked modifications only — `git stash push -m "ruri-<ticket>-<env>" -- <paths>`
4. `git tag -f ruri/pre-<env>-<ticket> origin/<base>` ← recovery anchor
5. `git checkout -B ruri/<env>merge-<ticket> origin/<base>`
   **Never** check out the local `mlk/stag-env` / `mlk/int-env` — they go stale (local stag-env
   was 167 ahead / 417 behind on 2026-07-27). Always fresh off `origin/<base>`.
6. `git merge --no-ff origin/<ticket-branch> -m "Merge remote-tracking branch 'remotes/origin/<ticket-branch>' into <base>"`
   — team message format, match it exactly.
7. `git diff --stat origin/<base> HEAD` → must be only the ticket's files. Anything else: stop.
8. `git push origin HEAD:<base>`
9. `git fetch origin <base>` then re-check ancestry against `origin/<base>` → must be true.
10. `git checkout <original-branch>` · `git branch -D ruri/<env>merge-<ticket>` · `git stash pop`

**Conflict** → stop, show conflicted paths, never auto-resolve.

---

## 5 · The card — emit verbatim, values substituted, only the requested env

```
DEPLOY — <ticket> → <env>

  merged   <ticket-branch>
        →  <base> @ <merge-sha>
  delta    <n> file(s): <filenames>
  revert   git revert -m 1 <merge-sha> && git push origin HEAD:<base>

── INTERNAL ──────────────────────────────
1  ssh app@172.16.100.162
2  cd deployment-scripts/mlit
3  ./deploy-<module>.sh
4  branch prompt →  mlk/int-env
5  wait for success message

── STAGING ───────────────────────────────
1  ssh app@172.16.100.162
2  cd build-scripts17
3  ./build-<module>.sh mlk/stag-env
4  env prompt →  stag
5  wait for BUILD SUCCESS, then exit
6  ssh app@172.30.12.203
7  cd deployment-scripts/stag
8  ./deploy-<module>.sh
9  wait for success message
```

Then stop.

---

## 6 · Hard rules

| # | Rule |
|---|---|
| 1 | **Read the Redmine ticket first** when given a ticket number — it may name MORE than one env. 2026-07-27: #271721 said *"merge into mlk/int-env and mlk/stag-env"*; deriving from git convention alone caught only stag-env. |
| 2 | Card only. No explanation, no alternatives, no follow-up questions. |
| 3 | Never claim build/deploy succeeded — Ruri never sees that output. If みや pastes it: quote the literal line or make no claim. |
| 4 | Zero authored code. This skill merges and reports; it never edits source. |
| 5 | Not a release. `mlk/release/*` and `mlk/master` are out of scope → `release-mlk-plp`. |
| 6 | After a successful run, ONE line: the ticket still needs to be on the Redmine planned-release list — env branches never reach `mlk/master`. |

---

## Rollback

Skill-only Feature: no hook, no `settings.json` entry.
Nuke: `rm -rf .claude/skills/deploy/ domain/deploy/` · remove the `registry.jsonl` line for
`deploy` · revert the `meta/system-architecture.md` §4.4 row.
Eval: `node domain/deploy/eval.js`.

## Origin

Built 2026-07-27 during #271721 (AWAM PRBB jrxml). No documented AWAM/MLIT deploy path existed
anywhere in MemoryCore, so the route was re-derived from git history mid-session — and the
derivation missed `int-env` entirely because the Redmine ticket was never read. This skill exists
so that never repeats.
