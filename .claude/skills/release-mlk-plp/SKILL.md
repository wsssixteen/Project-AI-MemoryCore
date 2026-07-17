---
name: release-mlk-plp
description: Melaka Pelupusan (PLP) release preparation + deploy pipeline — branch mlk/release/<ver> from mlk/master, merge ticket branches, verify, push, SSH build + deploy (endpoints in gitignored servers.local.json), Google Sheet log. 7 みや stop-points V1-V7. Triggers — "prepare release", "release branch", "deploy pelupusan", "release <x.y.z>", pasted BAQA "Planned Release Melaka" message/photo, "/release-mlk-plp".
---

# release-mlk-plp — PLP release pipeline (state-specific: Melaka · Pelupusan ONLY)

> Feature home: `domain/release-mlk-plp/` (script + state + eval) · sibling checks:
> `domain/release-mlk-plp-ask/` (prompt trigger) + `domain/release-mlk-plp-push-gate/` (push guard).
> For another state/module, DUPLICATE as `release-<state>-<module>` — never generalize this one.

## Pipeline (7 stop-points; NEVER skip forward past an un-nodded 🛑)

```
PLAN(V1) → BRANCH → MERGE(V2 per conflict) → VERIFY(V3) → [BUMP-COMMON → VERIFY] → BUMP-VERSION → PUSH
        → BUILD(V4 go · V5 success) → DEPLOY(V6 go) → SHEET(V7 submit)
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
node domain/release-mlk-plp/release-prep.js init   --release <ver> --tickets "<n>=<branch>,..."
node domain/release-mlk-plp/release-prep.js branch --release <ver>
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

## Phase C — BUILD (ssh, key-auth; password typing by me is BANNED)

**🛑 V4: みや says "build".** Read `domain/release-mlk-plp/servers.local.json` (GITIGNORED —
holds host/user/dir; copy from `.example` on a new machine) → `build` block:

```powershell
ssh <build.user>@<build.host> "cd <build.dir> && echo <build.choice> | <build.script> mlk/release/<ver>"
```

- FIRST RUN: probe whether the script accepts piped `stag`; if not, run interactively WITH みや.
- Stream/quote the actual output. **🛑 V5**: quote the literal BUILD SUCCESS line — no quote, no claim.
- Build fails → read the log, diagnose, propose (my call); fixes go back through Phase B rules.

## Phase D — DEPLOY (ssh, key-auth; only after V5)

**🛑 V6: みや says "deploy".** Same config → `deploy` block:

```powershell
ssh <deploy.user>@<deploy.host> "cd <deploy.dir> && <deploy.script>"
```

Quote the literal success message (deploy-proof rule).

## Phase E — SHEET

Open the release Google Sheet (URL in the BAQA message / bookmarks) via browser, prefill the
row (version · date · tickets · status). **🛑 V7: みや reviews; submit/commit only on his nod.**

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
| 10 | **DON'T type/store/commit the server password** | SSH keys only; it lives in みや's vault, never in this repo. |
| 11 | **DON'T claim build/deploy success without the quoted log line** | Deploy-proof rule — no quote, no claim. |
| 12 | **DON'T submit the Google Sheet** | Prefill only; V7 submit is みや's click. |

**Scope test before ANY action during a release** — if the answer to *"is this exact action written in Phase A-E above?"* is anything but a plain **yes**, it is a DON'T.

## Hard rules

- **PLP-only** — etanah-awam/teknikal/common are OUT of scope for this skill.
- **The servers' password is never typed/stored/committed by me** — SSH keys only (one-time install by みや); the password itself lives only in みや's head/vault, NEVER in this repo.
- **No ad-hoc git for releases** — every branch/merge/push goes through `release-prep.js`.
- **`status` anytime**: `node domain/release-mlk-plp/release-prep.js status --release <ver>`.
- Resume after interruption: state survives in `domain/release-mlk-plp/state/release-<ver>.json`.
