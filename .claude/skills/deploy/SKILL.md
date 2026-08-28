---
name: deploy
description: Fast env-deploy card for Melaka test environments — merge a ticket branch into an env branch (mlk/stag-env or mlk/int-env), or build a training branch directly, then emit the numbered ssh build+deploy steps. Owns the MERGE ORDER rule (training → int-env FIRST, release → training SECOND) and deploy-script failure triage. NOT a release (that is `release-mlk-plp`). Triggers — "/deploy", "/deploy stag awam 271721", "/deploy internal plp 265537", "/deploy training plp 273938", "deploy to internal", "deploy to staging", "deploy to training", "deploy X to mlit", "push X to stag", "merge order", "which order do we merge", "deployment failed", "Invalid WAR structure", any ask to get a ticket branch onto a Melaka test environment.
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
| `training` · `train` | **none — the ticket branch IS the artifact** | build on `172.16.100.162`, deploy on **`172.30.12.152`** (Reus1, "Utility (Deployment VM)") — folder name unconfirmed |

| みや says | Repo | Scripts |
|---|---|---|
| `awam` | `E:\Projects\Melaka\etanah-awam` | `build-awam.sh` · `deploy-awam.sh` |
| `plp` · `pelupusan` | `E:\Projects\Melaka\etanah-pelupusan` | `build-pelupusan.sh` · `deploy-pelupusan.sh` |

**Ticket → branch**: `git ls-remote --heads origin "*<ticket>*"` — never assume the shape.
Prefixes in use: `mlk/esokongan/` · `mlk/esokongan-nr/` · `mlk/internal-issue/` · `mlk/internal/` ·
`mlk/is/` · `mlk/qa/` · `mlk/cr/` · `mlk/requirement/` · `mlk/development/` · **`mlk/training/`**.
Multiple matches → list them, stop. Zero matches → say so, stop.

---

## 2 · Servers — every env has its own app tier AND its own deploy VM

The old "only two IPs exist" line was wrong on both counts.

| Host | Alias | Holds |
|---|---|---|
| `172.16.100.162` | `mirage1` | `build-scripts17/` **and** `deployment-scripts/` (`common` `hotfix` `mlit` `mlitdm` `mltg` `warfiles`); clones into `/home/app/git/MLK/<module>` |
| **`172.16.100.49`** | **`fudge1`** | **the mlit APP host — JBoss actually runs HERE.** `JBOSS_HOME=/home/app/jboss`, unit `/etc/systemd/system/jboss.service`. `deploy-*.sh` sshes here to stop/copy/start |
| `172.30.12.203` | — | `deployment-scripts/stag/` |
| **`172.30.12.152`** | **`Reus1`** | **the TRAINING deploy VM** ("Utility (Deployment VM)" on the architecture sheet) — the role `.203` plays for staging. Script folder name not yet listed |

**Where our WAR actually lands** (from the `ETANAH ARCHITECTURE - MLK` sheet, read 2026-08-06 —
full map in [ENV-ARCHITECTURE.md](../../../projects/coding-projects/active/etanah-knowledge/melaka/ENV-ARCHITECTURE.md)):

| Env | Pelupusan app node(s) | Build box | Deploy VM |
|---|---|---|---|
| mlit | Fudge1 `172.16.100.49` | Mirage1 `172.16.100.162` | same box, `deployment-scripts/mlit` |
| training | Eto1/2/3 `172.30.12.126-128` | Mirage1 `172.16.100.162` | **Reus1 `172.30.12.152`** |
| staging | Radome1/2/3 `172.30.12.176-178` | Mirage1 `172.16.100.162` | `172.30.12.203`, `deployment-scripts/stag` |

ssh user for all: `app`. **Ruri has no key** — `Permission denied (publickey)` verified 2026-08-06.
Every ssh step is みや's to run.

`172.16.100.197:5444` is the mlit database — never an ssh target.

🚨 **Diagnose on the RIGHT host.** mirage1 has its own long-dead `jboss.service` (`status=127`,
missing `start_jboss.sh`, failed since 06:00) that has nothing to do with any deploy, and no
`server.log` at all. Checking JBoss state on mirage1 returns a red herring — read the shell prompt
hostname first. Found 2026-08-06 (#273455) when a `systemctl status` on mirage1 was nearly diagnosed
as our deploy failure.

🚨 **`app` has NO sudo.** Verified refusals 2026-08-06: `journalctl -xeu jboss.service` (mirage1),
`systemctl start jboss.service` (fudge1). `systemctl status` works unprivileged; start/stop and
journalctl do not. **Never put a `sudo` command in a card** — the script owns the restart through its
own path. Recovery from any failed deploy = re-run the script.

🚨 **One JBoss serves every module on mlit.** Two `deploy-*.sh` runs a minute apart SIGKILL each other:
the second one's `stop_jboss.sh` cannot finish while JBoss is mid-deploying the first war, systemd
times out and kills both, and neither module deploys. Signature in `systemctl status`:
`ExecStart code=exited, status=0/SUCCESS` **plus** `ExecStop code=killed, signal=KILL` — a stop-side
kill, NOT a startup crash. Check `/home/app/jboss/standalone/deployments/` markers
(`.dodeploy` queued · `.isdeploying` killed mid-deploy · `.deployed` done · `.failed` errored) before
theorising. If it recurs, the answer is coordination in the team channel, not another re-run.

---

## 3 · The two pipelines differ — do not blend them

```
INTERNAL (mlit)                        STAGING (stag)
────────────────                       ──────────────
build + deploy = ONE function          build + deploy = TWO steps, TWO hosts

ssh app@172.16.100.162                 ssh app@172.16.100.162
cd deployment-scripts/mlit             cd build-scripts17
sh deploy-<module>.sh                   sh build-<module>.sh mlk/stag-env
   → branch prompt → mlk/int-env          → env prompt → stag
                                       (exit)
                                       ssh app@172.30.12.203
                                       cd deployment-scripts/stag
                                       sh deploy-<module>.sh
```

⚠️ `build-<module>.sh`'s env menu is `pat/uat/stag/train/prod/hotfix` — there is
no `int` or `mlit` choice, because internal never touches the build script. Any card
telling みや to pick `int` at a build prompt is wrong.

Source: colleague 2026-07-27 — *"Same IP as building staging, just different folder, also for
internal. Build and deploy is 1 function. So no need to build and deploy in separate
folders/servers."*

---

## 3b · 🚨 TRAINING — different lane, and the MERGE ORDER is load-bearing

There is **no `mlk/train-env` branch**. Training builds directly from `mlk/training/<ticket>`, so
that branch must be a *complete deployable app*: the ticket fix **plus** the current release
baseline. Internal is the opposite — `mlk/int-env` must receive the ticket delta and **nothing else**.

Those two requirements only both hold in ONE order:

```
        ①                                    ②
mlk/training/<ticket> ──merge──▶ mlk/int-env   THEN   mlk/release/<x.y.z> ──merge──▶ mlk/training/<ticket>
   (ticket fix only)                                        (baseline joins the ticket branch)

WHY THIS ORDER — do ① before ② or int-env gets poisoned:

  ✅ ① then ②                          ❌ ② then ①
  int-env  = base + ticket             int-env = base + ticket + WHOLE release lineage
  training = ticket + release          → pom bump, other people's tickets, binary templates
                                       → conflicts that have nothing to do with your ticket
```

**Precedent — Aaron, #273938, 2026-08-05** (verified by `git log`, timestamps decisive):

| Time | Commit | Action |
|---|---|---|
| 15:50 · 16:06 | `15df9cd426` · `4c9e739b00` | fix lands on `mlk/training/273938` |
| **16:08** | `ce1198818c` | **① Merge `mlk/training/273938` → `mlk/int-env`** |
| **16:21** | `609f83bcb5` | **② Merge `mlk/release/1.3.1` → `mlk/training/273938`** |

**Proof the order matters** (2026-08-06): merging the *post-②* training tip into `mlk/int-env`
conflicts on `TemplateSuratNilaianJPPH_PLTP_PSBS.docx` — a binary carried by release/1.3.1's
lineage, touched by zero of the ticket's commits. The whole conflict is manufactured by doing ②
first. Correct answer was: nothing to merge, int-env already had it.

**Ordering caveat — who said what** (be precise; do not quote me as quoting Aaron):

| Claim | Source |
|---|---|
| release → training, before deploying training | Aaron, verbatim 2026-08-06 |
| training → int-env for internal | Aaron, verbatim 2026-08-06 |
| ① must come *before* ② | **Ruri's inference** — from Aaron's commit timestamps + the conflict reproduced 2026-08-06. Mechanically sound, never stated by him |

**Training pipeline — TWO hosts, like staging, NOT one function** 🚨 (corrected 2026-08-06).
Aaron, when みや proposed the one-host route: *"No no. build in 172.16.100.162. Then deploy in
another IP."* The earlier `deployment-scripts/mltg/` guess is **refuted** — `mltg` may hold build
output, but the deploy runs elsewhere.

```
ssh app@172.16.100.162  →  cd build-scripts17
→ ./build-<module>.sh mlk/training/<ticket>   → env prompt: train
→ (exit)
→ ssh app@172.30.12.152          ← Reus1, "Utility (Deployment VM)", per the architecture sheet
→ cd deployment-scripts/<folder — name unconfirmed>  → ./deploy-<module>.sh
→ lands on Eto1/2/3  172.30.12.126-128   → etanah-apptrn.melaka.gov.my
```

**The IP is sourced, the folder name is not.** `172.30.12.152` comes from the `MLK TRN` tab of the
`ETANAH ARCHITECTURE - MLK` sheet, where it holds the same "Utility (Deployment VM)" role that
`172.30.12.203` holds for staging — not from a folder-name guess. The deploy-script folder on it
has never been listed; have みや `ls ~/deployment-scripts/` on first connect.
Never guess a deploy host from a folder listing — a wrong one either fails or ships to the wrong env.

---

## 4 · Ruri's git sequence — run it silently, report only the result

Straight-push. **No nod gate.** Justified: `mlk/stag-env` and `mlk/int-env` have zero backflow
into `mlk/master` (verified 2026-07-27 across full merge history) — a wrong merge cannot reach
the release path, and `git revert -m 1 <sha>` undoes it additively. Precedent: `aa2db329a8`.

1. `git fetch origin <base> <ticket-branch>`
2. **Already-merged guard — test the FIX COMMITS, never the branch TIP** 🚨 (corrected 2026-08-06).
   `git merge-base --is-ancestor origin/<ticket-branch> origin/<base>` asks about the **tip**, and a
   tip drifts: `mlk/training/273938` grew a release-merge commit *after* int-env had already taken
   the fix, so the tip test said NO while both fix commits were sitting in int-env. Correct probe:

   ```bash
   git log --oneline origin/<base> --grep="<ticket>"          # is the merge already recorded?
   git log --oneline origin/<base>..origin/<ticket-branch>    # what would actually come across?
   ```
   Then per fix commit: `git merge-base --is-ancestor <fix-sha> origin/<base>`.
   All fix commits present → **stop, say so, emit the deploy card with no git work.**

   **Slip this kills**: `ancestry-checked-one-direction` — I reported "not in int-env" from a
   tip test, then built a whole conflict-resolution plan for a merge that never needed to happen.
3. Stash tracked modifications only — `git stash push -m "ruri-<ticket>-<env>" -- <paths>`
4. `git tag -f pre-<env>-<ticket> origin/<base>` ← recovery anchor
5. `git checkout -B <env>merge-<ticket> origin/<base>`

   🚨 **Git artefact names carry the TICKET NUMBER ONLY — never a person/agent name** (みや 2026-08-05).
   Banned prefix: `ruri/` (and any other name) on tags, temp branches, stashes. Same rule as the
   stash convention (`stash <ticket-number>` and nothing else) and the no-names-in-deliverables rule.
   **Never** check out the local `mlk/stag-env` / `mlk/int-env` — they go stale (local stag-env
   was 167 ahead / 417 behind on 2026-07-27). Always fresh off `origin/<base>`.
6. `git merge --no-ff origin/<ticket-branch> -m "Merge remote-tracking branch 'remotes/origin/<ticket-branch>' into <base>"`
   — team message format, match it exactly.
7. **Verify the TICKET's own contribution** — `git diff --stat HEAD^1 HEAD` → must be only the
   ticket's files. Anything else: stop.

   🚨 **Do NOT stop because `origin/<base>..HEAD` shows extra files** (みや 2026-08-05). An env
   branch sits BEHIND `mlk/master`, so every master-based ticket branch legitimately carries
   master's accumulated delta with it — pom bumps, other people's commits, whatever landed since
   the env branch last caught up. **That is what an integration branch IS.** Treating it as a
   blocker turns a routine merge into a fake decision and wastes みや's time. Report the catch-up
   as one line (`env also catches up to master: <n> file(s)`), do not gate on it.
8. `git push origin HEAD:<base>`
9. `git fetch origin <base>` then re-check ancestry against `origin/<base>` → must be true.
10. `git checkout <original-branch>` · `git branch -D ruri/<env>merge-<ticket>` · `git stash pop`

**Conflict** → stop, show conflicted paths, never auto-resolve.

---

## 4b · Common-side fix — no ticket branch, bump the version PIN (ticket-first message) 🚨

When the fix lives in **etanah-common** (or any dependency module), there is **no `mlk/<tracker>/<num>`
pelupusan/awam branch to merge** — the deployable change is the **`${etanah.common.version}` pin** in
the module pom on the env branch. The common team ships the fix as a released version
(e.g. `1.1.24-MLK.beta.patch2` on `origin/mlk/beta`); the module just needs to point at it.

Sequence (isolated worktree so みや's live checkout is untouched):
1. **Verify the released version carries the fix + is a superset** — `git -C etanah-common show
   origin/mlk/beta:pom.xml` (version) + `git -C etanah-common log --oneline origin/mlk/beta` — confirm
   the ticket's merge is in it AND the branch is a linear superset of the version int-env currently
   pins (so no other internal ticket's fix is dropped). If it's a side-patch, not a superset → STOP,
   flag to the common team.
2. `git -C <module> worktree add -b intenv-<num> <tmpdir> origin/<base>`
3. Edit ONLY the `<etanah.common.version>` line → the released version.
4. **🚨 Ticket-first commit message** (みや 2026-08-12): `Ref #<num>: bump etanah-common to <ver> for <env>`.
   Banned: a bare `Bump etanah-common version to <ver>` with no ticket ref — every version-pin bump
   must be greppable to the ticket that needed it. (The pre-2026-08-12 int-env bumps had no ref;
   that is the gap this rule closes.)
5. `git -C <tmpdir> push origin HEAD:<base>` → then `git worktree remove <tmpdir>` + delete the temp branch.
6. Evidence line: `#<num> common bump → <base> @ <sha>  (common now <ver>)`. Then the card.

**Rule 4 (zero authored code) carve-out**: a `${...version}` pin is config, not logic — this bump is
in-scope for deploy. Editing any `.java`/`.xhtml` is not.

---

## 5 · The card — ONE COMMAND PER FENCED BLOCK

🚨 **NEVER wrap the whole card in one code block** (みや 2026-08-05, 4th correction of this same
shape — see the 2026-07-20 hand-off-card lesson in `main/main-memory.md`). He runs these steps
**one at a time in a terminal**; a single big fence forces him to hand-select each line out of a
block he can only copy whole. Every runnable command gets **its own ` ```bash ` block** — the app
renders a copy/Run button per block. Prose lines (waits, prompts) stay plain text, never fenced.

Header lines (merged / delta / revert) are plain text too — the revert command gets its own block.

🚨 **NEVER write a script with a leading `./` in the card** (みや 2026-08-07, second time — the
2026-07-20 hand-off-card lesson names this same `./` linkify). The renderer turns `./name.sh` into a
hyperlink **even inside backticks**, so みや gets a link where he needs a command. Write
`sh deploy-<module>.sh` / `sh build-<module>.sh <branch>` — identical behaviour for a shell script,
no leading `./`, no linkify. Applies to every runnable line in the card, not just the deploy step.

🚨 **A VALUE みや types AT a prompt gets its OWN ` ```bash ` fenced block** (みや 2026-08-14, 2nd ask;
**tag upgraded to `bash` 2026-08-28**). The branch name he pastes at the `deploy-*.sh` branch prompt
(`mlk/int-env`) and the env choice at the `build-*.sh` menu (`stag`) are things he SENDS to the shell —
a plain fenced block gives only a Copy button, but a **`bash`-tagged block gives the Run/send button**,
which types the value straight into the terminal that is sitting at the prompt. Emit each as a `bash`
block under a one-line "at the prompt, send:". Banned: inline backticks · a plain (untagged) fenced
block for a value he must send. Same test as a command: will he send it into the shell? → `bash` block.

Emit only the requested env. Shape:

    DEPLOY — <ticket> → <env>
    merged  <ticket-branch> → <base> @ <merge-sha>
    delta   <n> file(s): <filenames>

    🚨 **The card OPENS AT `ssh` — no local git steps** (みや 2026-08-06, superseding the 2026-08-05
    local-catch-up rule). The build+deploy scripts pull from **origin** on the server; みや's local
    working copy plays no part in a deploy, so `git checkout <base>` / `git pull` are dead steps he
    has to read past. His words: *"your commands seems useless… better you just show evidence of the
    branch being created remotely through push and evidence of the merge to int-env and the steps
    can straight away show starting with ssh app…"*

    **What replaces them: ONE evidence LINE above the card** (みや 2026-08-06, second correction in
    the same turn) — verified with `git ls-remote` (not local refs), rendered as:

        mlk/<tracker>/<num> @ <sha> → <base> @ <merge-sha>

    **Banned in the evidence**: a What/Remote-ref/SHA table · the commit log · the fix's source
    lines · anything wrapped in a fence. He asked for *"a simple `mlk/xxx/xxx <arrow> <branch>`"*.
    The verification still runs in full — only the emit shrinks to one line.

    *(The 2026-08-05 rule was right about its own case — a HAND-OFF card where みや builds locally.
    It was wrong to generalise to server-side deploys.)*

    ```bash
    ssh app@172.16.100.162
    ```
    **2.** go to the build scripts
    ```bash
    cd build-scripts17
    ```
    **3.** build
    ```bash
    sh build-<module>.sh mlk/stag-env
    ```
    **4.** at the env prompt, paste:
    ```
    stag
    ```
    wait for BUILD SUCCESS, then `exit`
    ... (one block per command; the branch/env VALUE always gets its own fenced block, never inline)

    Revert if needed:
    ```bash
    git revert -m 1 <merge-sha> && git push origin HEAD:<base>
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
| 7 | 🚨 **Merge order: training → `int-env` FIRST, release → training SECOND** (§3b). Never merge a training branch into `int-env` after it has taken a release merge — that drags the whole release lineage in. |
| 8 | 🚨 **`int-env` receives ONLY the ticket's fixes.** If the staged merge diff vs `origin/mlk/int-env` shows a `pom.xml` version bump or other tickets' files, you are merging the wrong thing — stop. |
| 9 | 🚨 **A deploy-script failure is read TOP-DOWN, never from the last line.** The final error is usually a cascade symptom (§7). |

---

## 7 · Deploy-script failure — read the log TOP-DOWN

`deploy-<module>.sh` never aborts on error. It runs every remaining step against missing inputs,
so the **last** line is the loudest symptom and almost never the cause.

```
❌ Deployment FAILED: Invalid WAR structure (WEB-INF missing)
        ▲
        └── that is step 12 reporting on step 2's failure
```

Scan the log in this order, stop at the FIRST failure:

| Order | Line to look for | Means |
|---|---|---|
| 1 | `Cloning into …` / `fatal:` | clone died — nothing downstream can work |
| 2 | `cd: … No such file or directory` | workspace absent, cascade begins |
| 3 | `BUILD FAILURE` + tiny `Total time` (<1 s) | maven ran with no POM — not a code error |
| 4 | `cp: cannot stat … .war` | no artifact was produced |
| 5 | `unzip: cannot find or open` / `rm: cannot remove` | deployments dir emptied, nothing to refill |
| 6 | `App Version:` blank / `Version file not found` | nothing deployed |
| 7 | `Invalid WAR structure (WEB-INF missing)` | the verifier confirming 1–6 |

Benign noise, never the cause: `mkdir: … File exists`, `Pseudo-terminal will not be allocated`,
`The requested profile "testing" could not be activated`, the post-quantum ssh warning.

### Known failure: clone dies at `index-pack` (2026-08-06, #273938)

```
Receiving objects: 100% (466627/466627), 247.36 MiB | 53.29 MiB/s, done.
fatal: could not open '…/.git/objects/pack/tmp_pack_XXXXXX' for reading: No such file or directory
fatal: fetch-pack: invalid index-pack output
```

**Transient.** Falsifiers run 2026-08-06 and all refuted a storage cause:

| Check | Result |
|---|---|
| `df -h /home/app` | 49% used, 83G free — not full |
| `df -i /home/app` | 1% inodes used — not exhausted |
| `mount \| grep /home` | `xfs (rw,…,noquota)` — writable, no quota |
| `ls -la /home/app/git/MLK/` | empty — no partial clone to clean |

**Fix**: re-run the script. It succeeded on the second attempt with no other change.
If `/home/app/git/MLK/<repo>` is non-empty, `rm -rf` it first. If it repeats, then check
`ps -ef | grep deploy-` (the script `rm -rf`s its clone target, so two concurrent runs on
`mirage1` destroy each other) and `dmesg -T | tail -30`.

**While it is failed, mlit is DOWN** — the exploded war directory exists but is empty.

---

## Rollback

Skill-only Feature: no hook, no `settings.json` entry.
Nuke: `rm -rf .claude/skills/deploy/ domain/deploy/` · remove the `registry.jsonl` line for
`deploy` · revert the `system/system-architecture.md` §4.4 row.
Eval: `node domain/deploy/eval.js`.

## Origin

**v1.2 — 2026-08-06 later** — みや supplied the `ETANAH ARCHITECTURE - MLK` sheet. Read the four
tabs that touch us and wrote
[ENV-ARCHITECTURE.md](../../../projects/coding-projects/active/etanah-knowledge/melaka/ENV-ARCHITECTURE.md)
(our modules only). Skill gains the real host map: training deploy VM = Reus1 `172.30.12.152`,
training app tier = Eto1/2/3 `172.30.12.126-128`, mlit app node = Fudge1 `172.16.100.49`
(confirms the log-derived guess), staging app tier = Radome1/2/3 `172.30.12.176-178`.

**v1.1 — 2026-08-06** (#273938, per みや: *"This is another skill you need to create so that we do
this correctly"*). Extended rather than forked: `deploy` already owned env merges + cards, and a
sibling skill would have split the concern (system-rules Rule 1, merge > proliferate).
Added: §1 training row + `mlk/training/` prefix · §2 third IP `172.16.100.49` (the "only two IPs"
claim was wrong) + Ruri-has-no-ssh-key · **§3b training lane + merge-order rule** · §4 fix-commit
ancestry probe · §6 rules 7–9 · **§7 top-down deploy-failure triage** + the `index-pack` transient.
Source: Aaron's #273938 history, timestamps `ce1198818c` 16:08 → `609f83bcb5` 16:21.

Built 2026-07-27 during #271721 (AWAM PRBB jrxml). No documented AWAM/MLIT deploy path existed
anywhere in MemoryCore, so the route was re-derived from git history mid-session — and the
derivation missed `int-env` entirely because the Redmine ticket was never read. This skill exists
so that never repeats.
