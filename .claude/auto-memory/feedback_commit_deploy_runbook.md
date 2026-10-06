---
name: feedback-commit-deploy-runbook
description: "6-step ceremony; subject = what changed; staging implies internal; BA test = int-env; int-env conflicts keep ours; probes local only; servers + console; recheck before push"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3d5bb754-364e-4482-ba29-220b2ea74311
  modified: 2026-08-21T03:13:08.856Z
---

🚨 **A merge conflict found while reviewing a colleague's branch or helping with a deploy is OURS to resolve** (miya 2026-10-05, #278909: "We should resolve the conflict, please remember this rule when we're reviewing and assisting deploy workflow"). Do not hand it back to the colleague and do not ask who resolves it. This covers a template (.docx) conflict too: the junior-builds rule ([[template-work-junior-builds]]) is about building a template, not about a merge conflict on one.
- What I did on #278909 (my method, not his words): merged `origin/mlk/master` into the ticket branch in a work-clone worktree, rebuilt the conflicted shared docx as master's version plus the ticket's own sections, checked section by section, opened it in Word with repair off, compiled, then merged to the env branch.
- The `-X ours` rule further down still holds for text conflicts on `mlk/int-env`. It does not fit a binary file the ticket itself changed, because it drops the ticket's fix.
- Still his call: the falsifier gate at commit (local test or his `[risk-ok: <num> <reason>]`).

🚨 One-pass etanah COMMIT + DEPLOY ceremony (order is the whole rule):

1. Ensure `quest/active.txt` has the ticket's block with `status=active` + `local_test_confirmed=true` (miya saying "local test passed" = set it NOW).
2. Show miya staged diff + verbatim commit message → he approves.
3. Write `.claude/state/commit-approved-<QA>.flag` in its OWN call (Write tool) — a flag written in the same Bash call as the commit is invisible (PreToolUse fires before the command runs).
4. `git add <files>` alone → then `git commit -m ...` alone (combined add&&commit = blocked).
5. Env branch: surface merge-vs-cherry-pick (`git log --oneline <env>..<branch>` count + what a merge drags) → put `[deploy-merge-decision: cherrypick - <count shown>]` INSIDE the cherry-pick command as a trailing `#` comment (hook v2 accepts it in-command).
6. Cherry-pick onto env branch (master-based branch merge into int-env drags the release train — cherry-pick is the norm, ref #276504 twice). Needs a fresh (<3h) green compile marker — `node domain/compile-gate/compile-check.js run <module>` — enforced by deploy-merge-surface v3.
7. The deploy card ALWAYS carries the Test Scenario table (| Login | Screen | Do | Expect |, real login) directly under the steps — enforced by test-scenario-login-gate v2 (miya 2026-08-21: "prepare a test scenario right after the deploy steps").

**Why:** QA-276504 2026-08-21 — 6 blocked calls, miya furious ("every single time without fail"). Two hook bugs fixed same day: commit-gate v3 consumes the approval flag only after ALL checks pass; deploy-merge-surface v2 accepts the token in-command + scans last 5 messages.

**How to apply:** On any "deploy"/"commit" nod from miya, run steps 1-6 verbatim, no exploration. Related: (merged above).

---

## Merged 2026-10-04: feedback_commit_subject_shape (was feedback_commit_subject_shape.md)

> 🚨 etanah commit subject = what CHANGED only, verbs from staged status letters (A add, D remove, R rename), no \";\" no dash inside description, ≤100 chars, never a non-change word (keep/leave/untouched), a redraft is SHORTER never longer; miya's exemplar \"Ref #277697 - Remove TRG code & resources, rename 2 shared composites to mlk\"

An etanah commit subject describes the staged diff and nothing else. Verbs map to the status letters: A → add, D → remove, R → rename (never "move"), M → fix or change. Files that were not touched are not in the diff, so words like keep, leave, untouched, unchanged, retain, remain, still are banned. No `;`, no dash inside the description, no arrows, at most 100 characters, clauses joined with `,` or `and` or `&`. When miya asks for better words the rewrite gets shorter, never longer.


**🚨 NO internal code-symbol jargon in the subject (2026-09-21, #280029).** Banned: method/class/variable identifiers (rPrOrSdtPrFallback, populateTarafMilikHakmilik), framework/library internals (docx4j rPr, sdtPr, RPr), camelCase code names. Say what changed in plain technical English / domain terms a reader who never saw the code understands - e.g. "filled fields now use the template font instead of the default", NOT "rPrOrSdtPrFallback restores CC sdtPr font/size". miya, angry: not using word's rPrOrSdtPrFallback / sdtwhatever, use simple technical english. Same spirit as domain-term naming - describe behaviour/effect, not the implementation symbol.
**🚨 Subject language = English, very short, his plain voice (2026-10-05, #244600).** No formal Malay and no Malay translation of a dev or Word term (banding, jajaran, lorekan, kepala/kaki). Screen and button names stay as the screen shows them (Kemaskini, Jana Semula). No marker words like SEMAKAN SAHAJA or (belum diuji) in a subject; a review branch is marked by its branch name. miya: *"why you used bahasa baku for git comments. I prefer my style of speech... very short sentence and in english, avoid technical terms or direct named variables."* My reading: I copied the Malay subjects I had written earlier on the same branch instead of his own subjects in the log.
**Why:** 2026-09-02, QA-277697. Five drafts of one subject, each longer than the last, carrying `;`, dashes and "keep 3 trg pages" (a non-change), until miya wrote it himself: `Ref #277697 - Remove TRG code & resources, rename 2 shared composites to mlk`. miya: *"the 'keep' word doesn't explain you renamed something"*, *"why is your sentence getting longer"*, *"not ';' or dashes, like I said"*.

**How to apply:** before showing a subject, read `git diff --cached --name-status`, pick one verb per status letter present, write one line under 100 chars, run it against the six rules in `.claude/commit-conventions.md` §Subject shape. Enforced by `domain/commit-subject-gate/` at draft time and `.claude/hooks/commit-gate.js` Check 0 at commit time. Related: [[feedback_reply_separation_of_concerns]] · [[feedback_redmine_rootcause_format]] · [[feedback_ticket_writing_style]].

---

## Merged 2026-10-04: feedback_commit_msg_in_handback_table (was feedback_commit_msg_in_handback_table.md)

> At any commit / deploy prep hand-back, the DRAFTED git commit message MUST appear in the review table itself (a row) alongside branch + staged files — never described in prose or omitted; みや reviews the commit comment as usual and needs it visible in the same table

🚨 **TRIGGER = emitting a ▶ YOUR MOVE / test-scenario hand-back for a fix that will be committed/deployed.** That SAME table gets a **`Commit message`** row (the drafted subject-line, per commit-conventions), sitting with the test-data / branch rows. みや reviews the git comment in the test-scenario table itself — never in separate prose, never omitted.

**Table shape (commit prep)**:

| Item | Value |
|---|---|
| Branch | `mlk/<tracker>/<num>` |
| Staged | `<file>` (1-line what) |
| **Commit message** | `<the exact subject-line, per commit-conventions>` |

**Banned**: showing the staged diff without the commit message · describing the message in a sentence instead of a table row · asking "ready to commit?" without the message shown.

**Why (2026-08-27, per みや)**: I staged the pelupusan fix and showed the diff but omitted the drafted commit message from the hand-back table — みや reviews the comment every time and had to ask for it. Pairs with [[feedback_reply_separation_of_concerns]] + the quest skill Stop-at-stage gate.

enforcement: memory-only (reply-composition layout — the "commit message in the same table" requirement is a judgment/style call, not mechanically detectable from a hook)

---

## Merged 2026-10-04: feedback_ba_test_deploy_int_env (was feedback_ba_test_deploy_int_env.md)

> Closing a ticket for BA to test → branch off mlk/master then merge to mlk/int-env (internal); NEVER STG for a BA-test deploy

🚨 When closing an Etanah ticket **for BA to test**, the deploy target is **`mlk/int-env` (internal)** — NEVER STG/staging.

Flow (both repos): branch the fix off **`mlk/master`** → merge that ticket branch into **`mlk/int-env`** → deploy internal (`deployment-scripts/mlit` on `172.16.100.162`) → BA tests on mlit. STG (`mlk/stag-env`, `172.30.12.203`) is a separate downstream target, NOT where BA tests a closing ticket.

**Why:** 2026-08-18, QA-275152 — I wrote "deploy to STG" in the commit plan from memory without consulting the `/deploy` skill's env-resolution; みや had to stop me twice (*"why STG, it should be internal. mlk/int-env"* → then *"branch off from mlk/master then mlk/int-env for BA to test"*) and set a `/goal` to force it. Slip: deploy-target defaulted from memory instead of the deploy skill.

**How to apply:** at any ticket close / "deploy for BA to test" → target is int-env; run `/deploy internal <module> <ticket>`. Never say STG for a BA-test deploy. See (merged above) + the `deploy` skill env table.

---

## Merged 2026-10-04: deploy-staging-implies-internal (was feedback_deploy_staging_implies_internal.md)

> 🚨 Deploy to staging → MUST also deploy to internal; deploy to internal → internal only

🚨 When みや says **deploy to staging**, deploy to **BOTH** staging (`mlk/stag-env`) **and** internal (`mlk/int-env`). When he says **deploy to internal**, deploy to **internal ONLY**.

**Why:** 2026-09-22, みや set this as a standing rule during the 279711/280176 reworks. Staging is the wider BA-facing env, so anything reaching staging must also be on internal — internal must never lag behind staging. Internal is the narrower env, so an internal-only request stays internal.

**🚨 Staging only on his word (2026-10-05, #246923, みや: "We should only deploy ticket branch to staging if I specified it").** A ticket branch is merged to `mlk/stag-env` ONLY when he names staging for that ticket. A bare "deploy" or a BA-test deploy = internal only. Never offer or plan staging as a default step in a deploy card or Next steps.

**How to apply:** at every deploy step read the target from みや's exact words. staging → merge/deploy the fix into both env branches. internal → `mlk/int-env` only. The apply/local-test/STOP-review gates still precede any deploy. Pairs with (merged above) and the commit-deploy-runbook.

---

## Merged 2026-10-04: internal-env-merge-keep-latest (was feedback_internal_env_merge_keep_latest.md)

> 🚨 When \"updating\" internal env (mlk/int-env) by merging a ticket branch and it CONFLICTS, always keep internal's own side — its common version AND its code — via git merge -X ours; int-env is the latest-accumulating test env with no backflow to master

🚨 Global rule for **"updating" the internal env** (`mlk/int-env`): on a merge conflict, ALWAYS retain internal's own side — never the incoming branch's side.

**Why:** int-env is the integration/test env that accumulates every ticket's work, so it is routinely AHEAD of a single ticket branch (and even ahead of `mlk/master` on `etanah.common.version` + on other tickets' code — e.g. #263304 Tambah Kuantiti, PDBB CC tags). Taking the incoming side would REGRESS int-env's common version and DROP other tickets' work. It has no backflow to `mlk/master`, so favoring int-env is safe.

**How to apply — the two concrete rules みや set (2026-09-09, #276997):**
1. **Common version** — keep int-env's `<etanah.common.version>` (the ahead/latest one); never let the incoming branch downgrade it.
2. **Code changes** — keep int-env's code on any conflicting hunk.

**Mechanism:** `git merge --no-ff -X ours origin/mlk/<tracker>/<num>` — `-X ours` auto-resolves every conflict in favor of int-env (HEAD) while STILL absorbing the incoming branch's non-conflicting changes (so the ticket's actual fix, which is non-conflicting, still lands). This is the sanctioned exception to the deploy skill's "merge conflict → STOP, never auto-resolve" rule, and ONLY for `mlk/int-env`. For `mlk/stag-env` / `mlk/master` the STOP-and-surface rule still holds.

Pairs with [[feedback_do_dont_ask_answer_literal]] and the `deploy` skill §4. Applies to `mlk/int-env` only.

---

## Merged 2026-10-04: feedback_probe_builds_local_only (was feedback_probe_builds_local_only.md)

> 🚨 PROBE / logger builds are tested on miya's LOCAL JBoss only — never merged or pushed to int-env / stag-env / master / release; enforced by domain/probe-local-only-gate (PreToolUse Bash+PowerShell). Rule stands 'for now', may change later.

🚨 When a diagnosis needs runtime loggers (a `QA<num>-PROBE` build), the probe is tested **locally** on みや's JBoss (`E:\Dev\jboss-7.4-plp-melaka`, local `etanahDS` → `et_main_stg2`, so the same staging data works). It is NEVER merged or pushed to `mlk/int-env`, `mlk/stag-env`, `mlk/master`, `mlk/release/*`, `mlk/mlit` or `prk/*`.

**Why** (2026-09-23, #280176 Issue B): on 2026-09-22 the probe commit `3ba0dd4985` went into stag-env + int-env and needed a revert merge. みや: *"do we need loggers? If yes, please add a rule we will be testing locally. That is a new rule or stopgate from now on. The only reason we will be testing locally for now and will change in the future if any."*

**How to apply**:
- Write the probe on the ticket branch in the work clone (`E:\Dev\etanah-work\etanah-pelupusan`), compile there, export a patch (`E:\Dev\etanah-work\<ticket>-local.patch`) and apply it to みや's local `mlk/master` working tree, uncommitted.
- He builds + reproduces; read `E:\Dev\jboss-7.4-plp-melaka\standalone\log\server.log` for the `QA…-PROBE` lines.
- The fix commit that follows carries NO probe lines. `domain/probe-local-only-gate` blocks any merge/push of a marker-carrying ref into a protected branch; bypass `[skip-probe-gate: <reason>]` only on みや's explicit word.
- "For now": if みや later moves probe testing back to an env, retire the gate and this rule together.

Related: [[feedback_etanah_git_separate_clone]] (write-side git in the clone, never his tree), (merged above).

---

## Merged 2026-10-04: feedback-recheck-at-last-checkpoint (was feedback_recheck_at_last_checkpoint.md)

> 🚨 A one-shot Phase-0 audit is NOT prevention — completeness checks (rework siblings, reverts, dropped files) must RE-RUN and BLOCK at the last checkpoint before an irreversible step (push/deploy), because the world changes between audit and push

Release 1.3.6 (2026-08-24): `audit-ticket.js` (built 2026-08-13 for exactly this) enumerated rework branches at Phase 0, saw only `mlk/training/275539`, and its verdict was trusted through push. `mlk/training/275539v2` — the complete, MLIT-verified fix (+`PelupusanExcelReaderHelper.java`) — reached origin after the audit. みや caught it after the push; second incident of the incomplete-footprint class (#273461 was the first).

**Why:** an advisory tool that runs once protects only the moment it ran. Anything that can change on origin (new branches, reverts, force-pushes) must be re-checked at the LAST gate before the irreversible step, and the check must FAIL the pipeline, not print a warning.

**How to apply:** for any pipeline (release, deploy, patch): identify the irreversible step, and make every completeness/freshness check a blocking gate immediately before it. Shipped form: `domain/release-mlk-plp/release-prep.js` `verify` sibling-sweep + revert-scan + per-file drop-scan + pom asserts (commits `9767b87`, `71b50cb`, tests in `sibling-sweep.test.js`). Related: [[feedback-verify-before-claim]], [[Verify before claiming during code tracing]].

---

## Merged 2026-10-04: release-recommend-dont-ask (was feedback_release_recommend_dont_ask.md)

> Baseline/release decisions — check the code delta myself and brief the recommended option with confidence; never hand miya a fact-check question

At a release stop-point (V1/V2), when a decision hinges on WHAT a commit or branch changes, read the diff myself and state the recommended option with a confidence figure. Do not ask miya to fact-check (e.g. "confirm Anis verified", "ask Aaron whether the commit belongs").

**Why:** 2026-09-07 Baseline 1.5.0 — I surfaced Aaron's orphan commit 7cb2d36297 as an include/exclude question plus "confirm with Aaron/Anis". The delta (one new template + config entries, clean ancestry) already said include. miya: *"just check straight away the (code) changes and brief me the recommended with higher confidence instead of asking me to fact check you when it is your job."*

**How to apply:** for every candidate source: diff it, classify (additive / conflicting / unrelated), then emit `Recommend: include — 90%` with the one-line reason. Keep the stop-point as a nod, not a question. Related: [[release-mlk-plp]] skill, [[verify-before-claim]].

---

## Merged 2026-10-04: reference_melaka_env_deploy_paths (was reference_melaka_env_deploy_paths.md)

> Melaka env-deploy routes — internal/mlit = one function on 172.16.100.162 deployment-scripts/mlit; staging = build on .162 then deploy on 172.30.12.203 deployment-scripts/stag. Only 2 IPs exist. Use the /deploy skill.

Two IPs, and that is all — `172.16.100.162` (alias `mirage1`, holds BOTH `build-scripts17/` and
`deployment-scripts/`) and `172.30.12.203` (holds `deployment-scripts/stag/`). ssh user `app`.

| Env | Branch | Route |
|---|---|---|
| internal / mlit | `mlk/int-env` | `172.16.100.162` → `deployment-scripts/mlit/` → `./deploy-<module>.sh` → branch prompt. **Build + deploy is ONE function.** |
| staging | `mlk/stag-env` | build `172.16.100.162` → `build-scripts17/` → `./build-<module>.sh <branch>` → env prompt `stag`; then deploy `172.30.12.203` → `deployment-scripts/stag/` → `./deploy-<module>.sh` |

`deployment-scripts/` on mirage1: `common` `hotfix` `mlit` `mlitdm` `mltg` `warfiles` — no `stag`
folder there, which is why staging deploy lives on the other box.

The build script's env menu is `pat/uat/stag/train/prod/hotfix` — **there is no `int`/`mlit`
option**, because internal never uses the build script at all.

`172.16.100.197:5444` is the mlit **database** (`mkit` / `et_main_mlit`) — never an ssh target.
See [[feedback_uat_fat_environments]].

Use the `/deploy <env> <module> <ticket>` skill rather than re-deriving this.
Env branches never reach `mlk/master` — shipping still needs the Redmine planned-release list.

Source: colleague 2026-07-27 — *"Same IP as building staging, just different folder, also for
internal. Build and deploy is 1 function."* Confirmed against mirage1 `ls` output same day.

---

## Merged 2026-10-04: etanah-deploy-console (was reference_etanah_deploy_console.md)

> 🚨 Melaka e-Tanah web Deployment Console (172.16.90.169/etanah-deployment) — the browser-driven deploy Ruri can drive herself (alternative to the ssh mlit script); pick State→Application→Environment, branch auto-fills, then Deploy Selected Target

**e-Tanah Deployment Console** — `http://172.16.90.169/etanah-deployment/` (HTTP, "Not secure" is expected on the internal LAN).

Browser-driven deploy UI (shown to Ruri 2026-09-10 by みや) — the deploy method Ruri CAN drive herself via the Chrome/Browser tools, as an alternative to the `ssh app@172.16.100.162` mlit script Ruri has no key for. **Shared console — active deployments are visible to everyone using it.**

**Flow (top of page: State · Application · Environment · Active Runs status cards)**:
1. **Your Name** — free text (put `Ridhwan`); labels the run in Active Deployments.
2. **1. Select Target** — cascading selects, each unlocks the next: **State** → **Application** (loads after state) → **Environment** (depends on application).
3. **2. Verify Branch** — **Branch** auto-fills from deploy config after Environment (e.g. `wp/int-env` for WP; Melaka would be `mlk/int-env`). Toggle **Deploy existing artifact** = ON to skip Git checkout+build and deploy the WAR already in the workspace; OFF (default) = Build then deploy.
4. **3. Review and Deploy** — review card (Operator/State/Application/Environment/Branch/Mode) → **Deploy Selected Target** button opens a confirm dialog.
5. Watch **Deployment Progress** (phase-by-phase) + **Deployment Logs** (Auto-scroll / Export) panels on the right.

**For a deploy-with-proof handback (みや's ask 2026-09-10)**: after the fix is confirmed + committed to branch + merged to `mlk/int-env`, drive this console (Melaka state → the pelupusan app → int-env), screenshot DURING (progress running) and AFTER (success), share both. Header tabs: Deployment Console · Deployment Freeze · History · Config · Maintenance.

**Reading a failed run (2026-09-30)**: the built-in browser pane hits the Keycloak login; read it through **Claude in Chrome** (みや's signed-in session). Full log as JSON: `/etanah-deployment/api/deployment-history/<run-id>` (`.logs[]`), running job `/api/deployment-queue/<id>/live`, job list `/api/deployment-queue`. The **first red step** in Deployment Progress decides the owner; triage table + the fudge1 prepare exit-137 case live in the `deploy` skill §8. **Console/infra owner = Nick** (Yih Kit: "refer Nick").

Related: (merged above) · (merged above) · (merged above).

---

## Merged 2026-10-04: reference-baseline-release-servers (was reference_baseline_release_servers.md)

> Baseline (PLP release) build + deploy server endpoints — build 172.16.100.162, deploy 172.30.12.203, ssh user app

Baseline / `release-mlk-plp` hand-off endpoints (みや runs these; Ruri only emits the card):

| Step | Host | Path | Script |
|---|---|---|---|
| BUILD | `172.16.100.162` | `build-scripts17/` | `./build-pelupusan.sh <branch>` → choose `stag` |
| DEPLOY | `172.30.12.203` | `deployment-scripts/stag/` | `./deploy-pelupusan.sh` |

SSH user is `app` for both. The password is みや's alone — never stored here or anywhere in the repo.

**Why this file exists**: these values live in `domain/release-mlk-plp/servers.local.json`, which is
**gitignored**, so they never sync between みや's machines — at release 1.0.10 (2026-07-20) the card
came out with empty host slots on the Ridhwan laptop and みや had to re-supply values he had already
given once. A gitignored file cannot serve as cross-machine memory. This memory is the durable copy;
re-create the local json from it on any machine where the card renders blank.

Related: [[feedback_uat_fat_environments]]

---

## Merged 2026-10-04: reference_compile_gate_local_build (was reference_compile_gate_local_build.md)

> compile-gate — mandatory local `mvn compile` (green + current) before any etanah commit; + the mvn -t toolchains trick to run that compile in Ruri's shell (no JDK 8/11 installed)

**compile-gate** (`domain/compile-gate/`) — a PreToolUse Bash hook that BLOCKS a `git commit` issued inside an etanah repo (etanah-pelupusan/awam/common cwd) unless a local `mvn compile` for that module is green **and** current (no `.java` edited since). Bypass `[skip-compile-gate: <reason>]`.

**Workflow before committing an etanah code fix:**
- `node domain/compile-gate/compile-check.js run "<repo path>"` — ANY etanah repo path, worktrees included (e.g. `E:\Dev\etanah-work\stag-awam-pdbb`); short names `etanah-awam` etc. still mean `E:\Projects\Melaka\…`. Runs ~1-2 min (backgroundable), writes a green marker keyed by repo path at `.claude/state/compile-ok-<module>-<hash>.json` (gitignored).
- Offline cache missing a dependency (new common version) → it retries ONCE online by itself. Failures print `KIND=compile|dependency|toolchain|other`; compile errors listed as `file:line`. Every run logged in `domain/compile-gate/log.jsonl`.
- The commit hook names the repo by its **origin remote** (lib/git-target.js), not its folder name, then calls `verify "<repo top>"` — passes only if marker is green AND no `.java` newer than the marker ts.
- 🚨 NEVER run raw `mvn compile` in an etanah repo — the gate BLOCKS it (no JDK 8 here, and it records no marker). Use the tool. (2026-10-02: I ran mvn by hand in a worktree and hit the offline miss, then the toolchain error.)

**The toolchains trick** — etanah's build demands JDK-8 + JDK-11 toolchains at `E:\Java\java8` / `E:\Java\java11`, which Ruri's shell does NOT have (only JRE 8 + JDK 17). `compile-check.js` passes `mvn -o -q -t domain/compile-gate/toolchains.xml compile`; that `toolchains.xml` maps both `1.8` and `11` → `C:\Program Files\Java\jdk-17`. Per-invocation via `-t`, so みや's global `~/.m2` is never touched. Compiles source-8/11 on JDK 17 — enough to catch `cannot find symbol` (the target bug class). NOT a production build; a compile-only smoke check.

**Why it exists** (QA-275456, 2026-08-18): a fix used `mh.getBandar()` where `MaklumatHakmilik` has no such method. It never compiled, but a green DB read (4/87 from the Kemas kini composite) made me report "tested PASSED". The int-env BUILD was the FIRST real compile — it failed on the server AFTER commit, and mlit went down. A green DB read is NOT proof the code compiled or ran. See [[feedback_verify_before_claim]].
