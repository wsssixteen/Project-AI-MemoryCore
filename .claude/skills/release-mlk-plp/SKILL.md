---
name: release-mlk-plp
description: Baseline — Melaka Pelupusan (PLP) release PREPARATION. Redmine evidence recon (branch/SQL/common/related verdicts), branch mlk/release/<ver> off mlk/master, merge ticket branches, verify, bump common+module version, push, then hand みや a reminder card for build/deploy/sheet (he runs those). Stop-points V1-V3. Triggers — "baseline", "prepare release", "release branch", "deploy pelupusan", "release <x.y.z>", pasted BAQA "Planned Release Melaka" message/photo, "/release-mlk-plp".
---

# release-mlk-plp — PLP release pipeline (state-specific: Melaka · Pelupusan ONLY)

> Feature home: `domain/release-mlk-plp/` (script + state + eval) · sibling checks:
> `domain/release-mlk-plp-ask/` (prompt trigger) + `domain/release-mlk-plp-push-gate/` (push guard).
> For another state/module, DUPLICATE as `release-<state>-<module>` — never generalize this one.

## Pipeline (7 stop-points; NEVER skip forward past an un-nodded 🛑)

```
── RURI (prepare) ──────────────────────────────────────────────  ── みや (run) ──
PLAN(V1) → BRANCH → MERGE(V2 per conflict) → VERIFY(V3)
         → [BUMP-COMMON → VERIFY] → BUMP-VERSION → PUSH → CARD →  BUILD → DEPLOY → SHEET
              └─ only if recon says COMMON-VER + bump not on release
```

**A release branch is NOT just merges.** It carries up to 3 kinds of content:
| Content | How it lands | Comes from mlk/master? |
|---|---|---|
| Ticket fixes | `merge` the ticket branch | yes (the branches exist there) |
| `<etanah.common.version>` bump | **commit on the release branch** (`bump-common`) | **NO — master keeps the old value** |
| `<version>` module bump | **commit on the release branch** (`bump-version`) | **NO — master keeps the previous release's number** |

## Phase A — PLAN (my judgment; source = みや's pasted message/photo)

1. Parse: release number (`Deploy Pelupusan <ver>`) + ticket list + Redmine version URL.
2. Map each ticket → branch by TRACKER (verify each against `git ls-remote`, never assume):
   | Tracker | Branch shape |
   |---|---|
   | QA | `mlk/qa/<num>` |
   | Internal Issue | `mlk/internal-issue/<num>` |
   | eSokongan | `mlk/esokongan/<num>` |
   | CR | `mlk/cr/<num>` |
   | Requirement | `mlk/requirement/<num>` |
   ⚠️ Rework variants exist (`v2`/`v3` suffix) — pick the LATEST shipped one per active.txt /
   Redmine; when ambiguous, surface both and ask at V1.
3. **RUN THE RECON SCRIPT — never eyeball Redmine by hand** (MANDATORY, 2026-07-16):

   ```powershell
   node domain/release-mlk-plp/redmine-recon.js --tickets <n,n,n> --release <ver>
   ```

   It reads EVERY evidence channel (description · all journals full-text · attachments +
   their bodies · relations · parent · fixed_version · custom fields) + probes git, and
   returns a verdict per ticket. Hand-reading is BANNED — that is what missed both misses below.

   | Verdict | Meaning | Action |
   |---|---|---|
   | `CODE-BRANCH` | branch on origin | merge (normal path) |
   | `CODE+SQL` | ⚠️ code **and** a SQL script | merge AND flag the SQL — the merge does NOT carry it |
   | `SQL-PATCH` | ⚠️ SQL-only fix | **git can never deliver this** — BA/DBA runs it; ask who + which env |
   | `COMMON-VER` | fix shipped via `etanah-common <x>-MLK` | check the bump commit is on the release; if present → nothing to merge |
   | *(SQL rows)* | → 📄 **Google Sheet table**, not a question | みや writes `SQL name with ticket number: #<n>, <file>` himself |

   🚨 **KILL a recon SQL row BEFORE showing it to みや if its owning ticket is already in the
   baseline** (2026-07-31, release 1.3.0). A recon row reached via `relations` can point at a ticket
   whose code merged months ago. **Run this first — one command, before the row is ever mentioned:**

   `git log --oneline origin/<owning-ticket-branch> --not mlk/release/<ver>`

   Empty output = already in the baseline = **the row is noise. Drop it silently. Do NOT surface it,
   do NOT put it in the plan table, do NOT ask みや about it.** Only a SQL whose owning ticket is
   NEW to this release is ever mentioned. **Why**: 1.3.0 — I carried `FAT-CR #252786.sql` through the
   plan table, the hand-off card, and the Sheet values across five separate turns. `mlk/fat-cr/252786`
   had been merged long before 1.3.0 and contributed nothing to the delta. みや: *"why the fuck are
   you including it in our baseline out of nowhere?"* Correct answer was to never raise it.

   🚨 **The Sheet's SQL cell — what goes in, and the ONE test** (2026-07-31, release 1.3.0, after I
   got this wrong in BOTH directions in one hour).

   **The test: does THIS release's delta require the script to be run?** Answer from the release diff
   + the owning ticket's own evidence — never from the recon row alone.

   | Case | Cell |
   |---|---|
   | A release ticket ships/needs a SQL | `#<ticket>, <filename>` — one line per SQL |
   | Recon row came via a **relation to a CLOSED ticket**, script already run, 0 `.sql` in the release diff | **empty** |

   **ALWAYS SURFACE the recon row to みや with its evidence** (owning ticket · status · upload date ·
   the journal line about where it ran · whether the release diff contains any `.sql`) — then state a
   verdict. **Banned**: silently dropping a recon SQL row · pasting the recon's internal
   `#<owner>:<file>` notation into the Sheet (the `#<owner>:` prefix means *"attached to ticket
   #<owner>"*, it is NOT part of the filename) · writing our ticket number in front of a file that
   hangs off a different, closed ticket.

   **Why** (1.3.0): recon flagged `#252786:FAT-CR #252786.sql` under #259112. First I read the Apr-27
   journal (*"Script run at uat, fat, and it environment"*), judged it stale, and told みや leave the
   cell empty — he corrected: *"The SQL we'll only mention it in the sheet."* I then over-corrected
   into an unconditional always-record rule and handed him the literal string
   `#259112, #252786:FAT-CR #252786.sql`, which reads as though #259112 shipped that script. He asked
   *"why this?"* — and the honest answer was that 1.3.0 contains **zero** `.sql` files. **The lesson
   is not "record more" or "record less": it is that a manifest cell must describe THIS release, and I
   must show the evidence and give a verdict instead of oscillating between suppressing and pasting.**
   | `VIA-RELATED` | evidence lives on a related/parent ticket | follow that ticket |
   | `NO-EVIDENCE` | 🚨 nothing anywhere | **ask BA — never release on a guess** |

   **The script's 🛑 Ask-BA table goes to みや verbatim** — those are his actions, not mine to resolve.

4. **A git-only check is structurally blind — this is a HARD rule, not a preference** (2026-07-16,
   both proven on release 1.0.9):
   - `#269802` carried attachment `#269802 sql.txt` (`UPDATE ind_tgsn it set nama = …`) — a
     **SQL-only fix**. Git showed nothing; I reported "no branch → exclude?". A code-only
     check can NEVER see a DB fix.
   - `#270952` had `relations → #270253`, whose journal said *"use common 1.0.129-MLK onward"*,
     and `release/1.0.9` already carried `d19b0b2b0a common version increase to: 1.0.129-MLK`.
     It had **already shipped**; I reported it as missing.

   **The common-delivery mechanism** (verified 2026-07-16, the #270952 chain — a PLP release
   carries common fixes without any PLP branch):

   ```
   etanah-common  854ef22796 "refs #270253"  → KadPengenalanUtil.java: maxlength 20→40
                  c7d10d682e "1.0.129-MLK"   → common cuts a release
   etanah-pelupusan  d19b0b2b0a on mlk/release/1.0.9  → pom.xml ONE line:
        - <etanah.common.version>1.0.71-MLK</etanah.common.version>
        + <etanah.common.version>1.0.129-MLK</etanah.common.version>
   ```

   A shared util (`etanah-common`) serves APPS **and** AWAM, so its fix is consumed via a
   **dependency bump**, never a merge — and each module redeploys separately (hence
   BA's *"applied to APPS only, AWAM still occur same issue"*). `COMMON-VER` is therefore a
   NORMAL, correct release state — not a gap. The common bump itself is Aaron's to make
   (DON'T #3); Baseline only verifies it is present on the release branch.
5. **PLP-only applies to the INVESTIGATION too.** A fix not found in `etanah-pelupusan` is
   simply NOT in this release — mark it out-of-module, surface at V1, move on. Hunting
   sibling repos (common/awam/teknikal) is BANNED. (Slip 2026-07-16, みや correction.)
   ⚠️ Nuance: reading a related ticket's *Redmine text* to learn WHY there's no branch is
   recon, not hunting — the script's one-hop follow does exactly this and stops there.
6. Emit the plan table (ticket · verdict · branch · action) + the Ask-BA table →
   **🛑 V1: みや nods**.

## Phase B — BRANCH + MERGE + VERIFY + PUSH (script; repo `E:\Projects\Melaka\etanah-pelupusan`)

```powershell
node domain/release-mlk-plp/release-prep.js init   --release <ver>   # --tickets OPTIONAL here
node domain/release-mlk-plp/release-prep.js branch --release <ver>   # may run DURING recon — branch needs only fresh mlk/master
node domain/release-mlk-plp/release-prep.js set-tickets --release <ver> --tickets "<n>=<branch>,..."
#   ↑ after 🛑 V1 — same all-or-nothing preflight as init, just deferred; merge refuses until this ran
node domain/release-mlk-plp/release-prep.js merge  --release <ver>
#   conflict? script exits 2 + lists files → I propose resolution → 🛑 V2 nod → resolve + git add
node domain/release-mlk-plp/release-prep.js merge-continue --release <ver>
node domain/release-mlk-plp/release-prep.js verify --release <ver>   # ✓-table
#   🛑 V3: みや nods the verify table

#   ── BUMP-COMMON — ONLY when recon returned COMMON-VER with the bump NOT on the release ──
node domain/release-mlk-plp/release-prep.js bump-common --release <ver> --common 1.0.129-MLK
#     ONE pom line: <etanah.common.version>; commits "common version increase to: <x>-MLK".
#     ⚠️ The --common value comes from redmine-recon's COMMON-VER verdict — NEVER invented.
#     ⚠️ This RESETS phase to merged → re-run `verify` before push (the eval pins this).

node domain/release-mlk-plp/release-prep.js verify --release <ver>   # again, if common bumped
node domain/release-mlk-plp/release-prep.js bump-version --release <ver>
#     bumps <version> under <artifactId>etanah-pelupusan</artifactId>; commits
#     "pelupusan version: <ver>" — mirrors 1.0.7 · 1.0.8 · 1.0.9. Idempotent.
node domain/release-mlk-plp/release-prep.js push   --release <ver>
```

Guards live IN the script (PLP-only origin check · clean tree · ff-only pull · all-branches-exist
preflight · stop-on-conflict · HEAD-pinned push) — do not re-implement them ad hoc.
The `release-mlk-plp-push-gate` hook additionally blocks any MANUAL `git push` of a release ref.

## Phases C-E — HAND-OFF (みや runs these himself; SCOPE-LOCKED 2026-07-16 per みや)

> **Baseline's deliverable ENDS at a pushed, correct release branch + a ready sheet line.**
> みや: *"I'm okay with running those simple steps myself, we just need to prepare the release
> properly."* Ruri does NOT ssh, does NOT deploy, does NOT touch the Sheet. No SSH keys needed
> — that whole dependency is retired. **My job at C-E = emit the REMINDER CARD below, filled in.**

**Emit this card (values substituted) once `push` succeeds — then STOP.**

🚨 **NO CODE FENCES ANYWHERE IN THE CARD — plain text lines only** (2026-07-20 per みや, corrected
twice in one release). First shape was one big fence: *"do not share inside this thing, it is hard
to copy line by line"* — one copy button for fifteen lines. Second shape was one fence per command;
still rejected: *"Again, stop using that code block, just showing it in lines in your normal text."*
**The rule**: every command is a normal text line with the command in `inline backticks`. No ``` at
all. Labels and "wait for X" notes are ordinary sentences. Sheet values go in a TABLE (per-cell
copy). A fenced block in a hand-off card is now a slip shape — `emit-shape-not-copyable`.

**Card shape:**

Baseline <ver> — branch ready ✓ pushed ✓ (<sha>)

🚨 **NEVER start an inline command with `./`** (2026-07-20 per みや). The renderer auto-linkifies a
leading `./`, so `./deploy-pelupusan.sh` becomes a hyperlink and copying it drags link markup along.
**Use the `bash <script>` form instead** — `bash deploy-pelupusan.sh` is identical to run and copies
clean. Same for any other leading-dot path in a command line. Slip shape: `emit-shape-not-copyable`.

**B2 · CONFIRM THE MERGES (みや's own 10-second check, added 2026-07-31 per みや)** — one line,
runs from ANY directory, PowerShell or Git Bash, no `cd` needed (`-C` sets the repo):

`git -C E:\Projects\Melaka\etanah-pelupusan log --oneline --merges mlk/master..mlk/release/<ver>`

It prints ONE merge commit per ticket branch — the fastest read of "did all N actually land". みや
asked for this by name because SourceTree is unavailable and he wants to eyeball the release himself
before spending a build cycle. **Always include this line in the card, above C · BUILD.** Expected =
as many lines as tickets; a short list means a branch is missing, and the per-ticket
`git log --oneline origin/<branch> --not mlk/release/<ver>` (empty output = merged) tells you which.

**C · BUILD** — run on the build server:
1. `ssh app@<build.host>`
2. `cd build-scripts17/`
3. `bash build-pelupusan.sh mlk/release/<ver>`
4. choose `stag`, then wait for BUILD SUCCESS.
5. **Before closing the session, copy the checkout line the build prints** (the commit SHA it built
   from) and paste it back — see the SHA-match check below.

**D · DEPLOY** — exit the build session first, then:
1. `ssh app@<deploy.host>`
2. `cd deployment-scripts/stag/`
3. `bash deploy-pelupusan.sh`, then wait for the success message.

### 🚨 V6b — BUILD-SHA MATCH (added 2026-07-20 per みや; the hole his question found)

The deployed footer's `Module Version` + `Git Branch` **cannot distinguish the pre-merge commit from
the merged one** — the version bump commit and the post-merge commit sit on the same branch with the
same version string, so a STALE CHECKOUT on the build server renders an identical, entirely
convincing footer while shipping ZERO fixes. Release 1.0.10 proof: `e85bb92a4a` (pom bump, no
tickets) and `f3c8497a0a` (all three merged) both display `1.0.10` / `mlk/release/1.0.10`.

**The check**: after BUILD, みや pastes the build log's checkout/commit line; Ruri compares that SHA
against the release branch HEAD recorded in `state/release-<ver>.json` (`headSha`, set at push).
Match → the artifact provably carries the merges. Mismatch or absent → 🚨 STOP and re-build; never
infer it from the version footer, and never from "we pushed before building".

**E · SHEET** — <sheet-url>, Developer section:

| Field | Value |
|---|---|
| Common Version | `<common>` |
| Module Version | `<ver>` |
| Branch Name | `mlk/release/<ver>` |
| SQL name with ticket number | `<recon's sheet line, or leave empty>` |

- Host values come from `domain/release-mlk-plp/servers.local.json` (GITIGNORED; `.example` twin
  committed). Never print the password — it isn't stored anywhere in this repo.
- **Build fails?** みや pastes the error → I diagnose (my call) → any fix re-enters Phase B rules
  (its own ticket + branch; the scope-gate still blocks stray edits).
- **Banned**: claiming a build/deploy succeeded — I never see the output unless みや pastes it.
  If he pastes it, the deploy-proof rule applies: quote the literal line or make no claim.

## Phase F — MERGE TO `mlk/master` after BA sign-off (PLP-ONLY; added 2026-07-28 per みや)

**The release does NOT end at the pushed branch. It ends on `mlk/master` — and that merge is OURS.**

```
mlk/release/<ver>  ──push──▶ origin
        │
        ├─ BUILD + DEPLOY (みや) ──▶ BAQA baseline testing
        │                                    │
        │                          ✅ confirmed successful
        │                                    ▼
        └────────── merge ──────────▶ mlk/master        ← WE do this, gated on BA's confirmation
```

**Run it through the script — no hand-run git** (built 2026-07-28, same session as the slip):

```powershell
node domain/release-mlk-plp/release-prep.js merge-to-master --release <ver> --ba-approved
```

It refuses unless `phase=pushed`, re-fetches, asserts `origin/mlk/release/<ver>` still equals the
pushed head, tolerates a dirty tree **only** when no dirty path intersects the release delta,
tags `mlk/pre-master-merge/<ver>` at the pre-merge master SHA, fast-forwards, pushes, then
re-reads `origin/mlk/master` and fails loudly if it isn't the release tip.

| Gate | Rule |
|---|---|
| 🛑 **V8** | Merge to `mlk/master` ONLY after みや confirms BAQA's baseline testing PASSED. No confirmation → no merge, no matter how green the build looked. Enforced: the command dies without `--ba-approved`. |
| Who | **Us** (みや + Ruri) for `etanah-pelupusan`. |
| Never | Do NOT merge on "deploy succeeded" — deploy success ≠ testing success. |

🚨 **This is where AWAM and PLP DIVERGE — do not carry one repo's topology onto the other:**

| | `etanah-pelupusan` (PLP) | `etanah-awam` (AWAM) |
|---|---|---|
| Who merges to `mlk/master` | **we do**, after BA sign-off | **nobody** — 0 direct merges in history; `mlk/master` is a label equal to the last release tip |
| Release owner | us | khaihantan / shahrul.nizam pull the ticket branch into `mlk/release/<ver>` |
| Env branches | — | `mlk/int-env` / `mlk/stag-env`, forks not a chain |

**Why this section exists** (2026-07-28, みや correction): I told him "the release→master merge is khaihantan's step, after testing" during Baseline 1.1.0. That is the **AWAM** topology, learned on 2026-07-27 and applied to Pelupusan without re-checking. Slip class: `over-generalization` — a fact verified in one repo restated as fact in a sibling repo. The repo is the discriminator; state it before stating the owner.

---

## 🚫 DON'Ts — the counter-rail (added 2026-07-16 per みや)

> **THE RULE: DO NOTHING EXCEPT WHAT IS ESTABLISHED ABOVE.**
> A release is an ASSEMBLY job, not a fixing job. Every phase has an exact established action;
> anything outside that list is BANNED — even when it looks helpful, even when it's one line,
> even when I'm confident. If a step feels needed but isn't on this page: STOP and ask みや.
> Enforced structurally by `domain/release-mlk-plp-scope-gate/` (blocks the edit, not just warns).

| # | DON'T | Why (established DO instead) |
|---|---|---|
| 1 | **DON'T touch any file other than `pom.xml`** during a release | The ONLY established edits are the two version bumps. No fixes, no cleanups, no "while I'm here". |
| 2 | **DON'T change any `pom.xml` line except the two bump lines** | Ours: `<version>` under `<artifactId>etanah-pelupusan</artifactId>` (`bump-version`) and `<etanah.common.version>` (`bump-common`). Each is a single diff-asserted line, run via the script — never a hand-edit. |
| 3 | **DON'T touch the `etanah-common` REPO or cut a common release** | Fixing/releasing common is the common-team's (amirul/Aaron). ⚠️ CORRECTED 2026-07-16: bumping `<etanah.common.version>` in *pelupusan's own pom, on the release branch*, IS an established Baseline step — see Phase B `bump-common`. Only the common repo itself is off-limits. |
| 3b | **DON'T touch the parent/plugin/dependency versions** | Only two lines are ever ours: `<version>` under `<artifactId>etanah-pelupusan</artifactId>`, and `<etanah.common.version>`. Both are diff-asserted. |
| 4 | **DON'T touch any repo other than `etanah-pelupusan`** | awam/teknikal/common are out of scope — for the DEPLOY *and* the investigation. |
| 5 | **DON'T hunt for a fix that isn't in `etanah-pelupusan`** | No branch here = not in this release. Mark out-of-module at V1 and move on. Sibling-repo hunts are BANNED. |
| 6 | **DON'T write/author/fix code during a release** | Zero authored code. A missing fix is the ticket-owner's job, on their own branch, through Quest. |
| 7 | **DON'T resolve a conflict without みや's nod** | Script stops at V2; I propose, he decides. Auto-resolve is BANNED. |
| 8 | **DON'T run ad-hoc git** | Every branch/merge/verify/bump/push goes through `release-prep.js`. |
| 9 | **DON'T skip a stop-point because it "obviously passes"** | V1-V7 are みや's, not mine. No forward-skipping past an un-nodded 🛑. |
| 10 | **DON'T ssh, build, deploy, or touch the Sheet** | SCOPE-LOCKED 2026-07-16: those are みや's steps. My output is the reminder card. The password is never typed/stored/committed — it isn't needed at all now. |
| 11 | **DON'T claim build/deploy success** | I never see the output. If みや pastes it: quote the literal line or make no claim (deploy-proof rule). |
| 12 | **DON'T carry on past `push` + the card** | Baseline's deliverable ends there. |

**Scope test before ANY action during a release** — if the answer to *"is this exact action written in Phase A-E above?"* is anything but a plain **yes**, it is a DON'T.

## Hard rules

- **PLP-only** — etanah-awam/teknikal/common are OUT of scope for this skill.
- **The servers' password is never typed/stored/committed by me** — SSH keys only (one-time install by みや); the password itself lives only in みや's head/vault, NEVER in this repo.
- **No ad-hoc git for releases** — every branch/merge/push goes through `release-prep.js`.
- **`status` anytime**: `node domain/release-mlk-plp/release-prep.js status --release <ver>`.
- Resume after interruption: state survives in `domain/release-mlk-plp/state/release-<ver>.json`.
