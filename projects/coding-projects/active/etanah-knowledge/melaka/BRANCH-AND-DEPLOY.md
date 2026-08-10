# BRANCH-AND-DEPLOY — Melaka branch topology + env deploy routes

**Scope**: where a ticket branch goes after the fix is committed — the env branches, the release
chain, and the two servers. Verified against `etanah-awam` full merge history 2026-07-27.
For the release *preparation* pipeline see the `release-mlk-plp` skill; for the one-line env deploy
see the `/deploy` skill.

---

## 1. Nothing ever merges into `mlk/master`

Zero direct merges into `mlk/master` exist in the entire history. `mlk/master` is a **label** that
equals the tip of the last cut release branch — on 2026-07-27, `mlk/master` and
`mlk/release/1.4.1` were the same SHA (`e355940ec5`).

Verification: `git log --merges --format='%s' origin/mlk/stag-env | grep 'into mlk/master'` → empty.

---

## 2. Three sinks — a FORK, not a chain

```
mlk/master
    │ branch off
    ▼
mlk/<tracker>/<num>  ──┬──► mlk/int-env        ──► MLIT      (dev merges)
   (stays alive)       ├──► mlk/stag-env       ──► MLKSTAG   (dev merges)
                       └──► mlk/release/<ver>  ──► mlk/master (release mgr, fast-forward)
```

`mlk/release/<ver>` pulls from the **ticket branch**, never from `stag-env`.
Proof — `mlk/esokongan/272076`, both 2026-07-24, same source branch:

| Commit | Merge |
|---|---|
| `0bda3077a2` | → `mlk/stag-env` |
| `925797bd83` | → `mlk/release/1.4.1` |

**Consequences**: the ticket branch must stay alive after staging · anything merged only into an
env branch is invisible to the release path · a fix amended after staging must be re-merged to
every target.

---

## 3. Fates differ

| | `mlk/release/<ver>` | `mlk/int-env` · `mlk/stag-env` |
|---|---|---|
| After merge | frozen; `master` fast-forwards onto it | keeps accreting, never frozen |
| Next release cut from it | yes | never |
| Reaches `mlk/master` | yes | **no** — env merge commits stay permanently unreachable |
| Merged by | khaihantan (30), shahrul.nizam (4) | 14 individual devs |

⚠️ Env merge *commits* stay unreachable from master even when the ticket content ships via the
release path. **Test containment by branch-tip ancestry**, never by hunting the env merge commit.

Because env branches never reach master, a wrong env merge is harmless and reverts cleanly:
`git revert -m 1 <merge-sha>` (precedent: `aa2db329a8` on stag-env).

---

## 4. Nothing is missed by *git* — Redmine is the safety net

On 2026-07-27, **15 branches** sat in `stag-env` carrying no release at all; the oldest,
`mlk/internal/267326`, had been there 33 days. Release cadence is ~one cut per working day
(1.3.7 07-20 → 1.4.1 07-24 → 1.5.0 bumped 07-27).

A branch merged to an env branch but never named on the Redmine **"Planned Release Melaka"** list is
simply never released, silently. This is why `release-mlk-plp` opens with Redmine evidence recon
rather than a git diff.

---

## 5. Deploy routes

| Host | Alias | Holds |
|---|---|---|
| `172.16.100.162` | `mirage1` | `build-scripts17/` **and** `deployment-scripts/` (`common` `hotfix` `mlit` `mlitdm` `mltg` `warfiles`) |
| `172.30.12.203` | — | `deployment-scripts/stag/` |
| `172.16.100.49` | `fudge1` | **mlit APP server** — `mirage1` ssh's in to stop JBoss, copy the war, restart, verify (added 2026-08-06 from a #273938 deploy log; the earlier "only 2 IPs exist" heading was wrong) |

ssh user: `app`. Ruri has no key — `Permission denied (publickey)` verified 2026-08-06.

### 5a. TRAINING — third lane, and the merge order matters (added 2026-08-06, #273938)

There is **no `mlk/train-env`**. Training builds straight from `mlk/training/<ticket>`, so that
branch must carry the ticket fix **and** the release baseline. `mlk/int-env` must carry the ticket
delta and nothing else. Only one order satisfies both:

```
① mlk/training/<ticket> ──merge──▶ mlk/int-env        (ticket fix only)
② mlk/release/<x.y.z>   ──merge──▶ mlk/training/<ticket>   (baseline joins the ticket branch)

do ② before ① → int-env inherits the whole release lineage: pom bump, other tickets,
                 binary templates → conflicts unrelated to your ticket
```

Precedent — Aaron, #273938, 2026-08-05: `ce1198818c` (① 16:08) then `609f83bcb5` (② 16:21).
Proven 2026-08-06: merging the post-② tip into int-env conflicts on
`TemplateSuratNilaianJPPH_PLTP_PSBS.docx`, a binary no ticket commit touches.

**Attribution**: Aaron stated each lane's requirement separately (*"merge the latest release branch
into the training branch before you deploy"* · *"internal — just merge the training branch into the
int-env branch"*). The **ordering between the lanes is Ruri's inference** from his timestamps plus
the reproduced conflict — mechanically sound, but not his words.

**Training pipeline = TWO hosts, like staging.** Aaron 2026-08-06, rejecting the one-host guess:
*"No no. build in 172.16.100.162. Then deploy in another IP. I have to go find. I'll give to you
after lunch."*

```
build   ssh app@172.16.100.162 → build-scripts17 → ./build-<module>.sh mlk/training/<ticket>
                                                 → env prompt: train
deploy  ssh app@<UNKNOWN IP — awaiting Aaron 2026-08-06>
        cd deployment-scripts/<UNKNOWN folder> → ./deploy-<module>.sh
```

⚠️ `deployment-scripts/mltg/` was a **guess and is refuted** — Aaron said the deploy is on another
IP. Never emit a training deploy host until he supplies it.

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

⚠️ The build script's env menu is `pat/uat/stag/train/prod/hotfix` — **there is no `int`/`mlit`
option**, because internal never uses the build script at all.

⚠️ `172.16.100.197:5444` is the **mlit database** (`mkit` / `et_main_mlit`) — never an ssh target.

Source: colleague via みや 2026-07-27 — *"Same IP as building staging, just different folder, also
for internal. Build and deploy is 1 function."* Confirmed against mirage1 `ls` output the same day.

---

## 6. Branch-name shapes seen in `etanah-awam`

`mlk/esokongan/` · `mlk/esokongan-nr/` · `mlk/internal-issue/` · `mlk/internal/` · `mlk/is/` ·
`mlk/qa/` · `mlk/cr/` · `mlk/requirement/` · `mlk/development/` · `mlk/sonar/` · `mlk/cot/`

Tracker → shape is a **hint only**. Always `git ls-remote --heads origin "*<ticket>*"`.
See [[reference_esokongan_branch_shape]] — #271639 lived on `mlk/internal/`.

---

## 7. WHEN release content reaches `mlk/stag-env` — the post-baseline catch-up

Verified against `etanah-pelupusan` full history 2026-08-10. Day-to-day, staging gets individual
**ticket-branch** merges exactly like int-env (§2). But **after each baseline release is built,
aaron performs one catch-up merge into `mlk/stag-env`** that brings the whole release baseline —
in one of two equivalent forms:

- merge `origin/mlk/release/<ver>` directly, **or**
- merge `mlk/master` (which by then equals the release tip — §1)

`mlk/int-env` is **never** the source — 0 int-env→stag-env merges exist in either repo's history.

| Release baseline | Version bumped | Catch-up into stag-env | Lag | Form |
|---|---|---|---|---|
| 1.0.10 | 2026-07-20 | `36c0ccd724` 07-22 aaron | +2d | merge `mlk/master` (`^2` ≡ 1.0.10 content) |
| 1.1.0 | 2026-07-28 | `d8572d45cb` 07-29 aaron | +1d | merge `origin/mlk/release/1.1.0` directly |
| 1.3.0 | 2026-07-31 | `a2200467ca` 08-04 aaron | +4d (weekend) | merge `mlk/master` (`^2` ≡ 1.3.0 content) |

- Not every release gets its own catch-up: 1.2.0 (07-29) had none — its content rode in with the
  later master catch-up. 1.3.1 (bumped 08-05) sat un-caught-up until **2026-08-10**, when it was
  merged `mlk/master`→`mlk/stag-env` (`44ee353632`, +5d) — bringing common **1.0.143-MLK → 1.1.12-MLK**.
- To identify what a catch-up brought: `git rev-parse <merge-sha>^2` then `git log -1` on it —
  the 2nd parent is always a recognizable release-baseline state.
- `etanah-awam` shows the same shape: stag-env's first-parent chain passes through release lines,
  with `mlk/master` catch-ups (e.g. faris 06-25).

**For our pipeline (miya 2026-08-10)**: after a `release-mlk-plp` baseline completes, the missing
follow-up step is `merge mlk/master → mlk/stag-env` + stag build/deploy (§5). ⚠️ A common-version
bump in the catch-up means staging needs that common built/available too, or the module build/boot
can hit an `avalonTemplate parse error` (int-env precedent `fa1fb3aea2`). To be built into the
release/deploy tooling.

---

**Origin**: #271721 (2026-07-27). The route had to be re-derived from git history mid-session
because nothing documented it; the derivation then missed `mlk/int-env` because the Redmine ticket
was never read. The ticket said *"merge into mlk/int-env and mlk/stag-env branch and deploy the
changes in MLIT and MLKSTAG - Awam."* **Read the ticket before deriving anything.**
