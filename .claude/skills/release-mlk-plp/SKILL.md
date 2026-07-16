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
PLAN(V1) → BRANCH → MERGE(V2 per conflict) → VERIFY(V3) → PUSH
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
3. Emit the plan table (ticket · branch · exists-on-origin ✓) → **🛑 V1: みや nods**.

## Phase B — BRANCH + MERGE + VERIFY + PUSH (script; repo `E:\Projects\Melaka\etanah-pelupusan`)

```powershell
node domain/release-mlk-plp/release-prep.js init   --release <ver> --tickets "<n>=<branch>,..."
node domain/release-mlk-plp/release-prep.js branch --release <ver>
node domain/release-mlk-plp/release-prep.js merge  --release <ver>
#   conflict? script exits 2 + lists files → I propose resolution → 🛑 V2 nod → resolve + git add
node domain/release-mlk-plp/release-prep.js merge-continue --release <ver>
node domain/release-mlk-plp/release-prep.js verify --release <ver>   # ✓-table
#   🛑 V3: みや nods the verify table
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

## Hard rules

- **PLP-only** — etanah-awam/teknikal/common are OUT of scope for this skill.
- **The servers' password is never typed/stored/committed by me** — SSH keys only (one-time install by みや); the password itself lives only in みや's head/vault, NEVER in this repo.
- **No ad-hoc git for releases** — every branch/merge/push goes through `release-prep.js`.
- **`status` anytime**: `node domain/release-mlk-plp/release-prep.js status --release <ver>`.
- Resume after interruption: state survives in `domain/release-mlk-plp/state/release-<ver>.json`.
