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
PLAN(V1) → BRANCH → MERGE(V2 per conflict) → VERIFY(V3) → BUMP-VERSION → PUSH
        → BUILD(V4 go · V5 success) → DEPLOY(V6 go) → SHEET(V7 submit)
```

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
3. **READ THE WHOLE TICKET — NO FILTERED READS.** Fetch description + EVERY journal note
   FULL-TEXT + the attachments list (`?include=journals,attachments`). Keyword-regex or
   truncated reads are BANNED — devs share fix files / branches / commits inside the
   conversation and as attachments. (Slip 2026-07-16: filtered read missed exactly this.)
4. **PLP-only applies to the INVESTIGATION too.** A fix not found in `etanah-pelupusan` is
   simply NOT in this release — mark it out-of-module, surface at V1, move on. Hunting
   sibling repos (common/awam/teknikal) is BANNED. (Slip 2026-07-16, みや correction.)
5. Emit the plan table (ticket · branch · exists-on-origin ✓) → **🛑 V1: みや nods**.

## Phase B — BRANCH + MERGE + VERIFY + PUSH (script; repo `E:\Projects\Melaka\etanah-pelupusan`)

```powershell
node domain/release-mlk-plp/release-prep.js init   --release <ver> --tickets "<n>=<branch>,..."
node domain/release-mlk-plp/release-prep.js branch --release <ver>
node domain/release-mlk-plp/release-prep.js merge  --release <ver>
#   conflict? script exits 2 + lists files → I propose resolution → 🛑 V2 nod → resolve + git add
node domain/release-mlk-plp/release-prep.js merge-continue --release <ver>
node domain/release-mlk-plp/release-prep.js verify --release <ver>   # ✓-table
#   🛑 V3: みや nods the verify table
node domain/release-mlk-plp/release-prep.js bump-version --release <ver>
#     bumps <version> under <artifactId>etanah-pelupusan</artifactId> in pom.xml
#     and commits "pelupusan version: <ver>" — mirrors past bumps (1.0.7 · 1.0.8 · 1.0.9)
#     idempotent: re-running when pom already at <ver> is a no-op.
#     ⚠️ common-artifact bump (e.g. "common version increase to: 1.0.129-MLK") remains MANUAL
#        via cherry-pick from Aaron's upstream commit — this Feature only owns the pelupusan bump.
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
| 1 | **DON'T touch any file other than `pom.xml`** during a release | The ONLY established edit is the version bump. No fixes, no cleanups, no "while I'm here". |
| 2 | **DON'T change anything in `pom.xml` except the `x.y.z` under `<artifactId>etanah-pelupusan</artifactId>`** | Not the parent version · not plugin versions · not dependencies · not `<properties>`. Exactly 1 line, exactly the number. |
| 3 | **DON'T bump the common/parent artifact version** | That's Aaron's upstream cherry-pick (`common version increase to: <ver>-MLK`). Out of this Feature's ownership. |
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
