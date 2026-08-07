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

## 5. Deploy routes — only 2 IPs exist

| Host | Alias | Holds |
|---|---|---|
| `172.16.100.162` | `mirage1` | `build-scripts17/` **and** `deployment-scripts/` (`common` `hotfix` `mlit` `mlitdm` `mltg` `warfiles`) |
| `172.30.12.203` | — | `deployment-scripts/stag/` |

ssh user: `app`.

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

**Origin**: #271721 (2026-07-27). The route had to be re-derived from git history mid-session
because nothing documented it; the derivation then missed `mlk/int-env` because the Redmine ticket
was never read. The ticket said *"merge into mlk/int-env and mlk/stag-env branch and deploy the
changes in MLIT and MLKSTAG - Awam."* **Read the ticket before deriving anything.**
