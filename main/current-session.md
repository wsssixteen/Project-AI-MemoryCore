# Current Session

## 2026-08-06 19:5x → 21:3x — 273465 PHASE 1 CLOSED: A PRIMEFACES QUEUE JAM, PROVEN ON THE LIVE PAGE

**The buttons were not slow. The ajax queue was permanently jammed, and PrimeFaces will not dispatch
another request while a completed xhr is still sitting in it. Proven by A/B on the failing page itself.**

### ▶▶ NEXT SESSION — START HERE

| Priority | Ticket | State | First step on resume |
|---|---|---|---|
| — | **273465** | **Phase 1 closed** · `fadebbcbce` · int-env `c69f932ad5` | Ask みや if the mlit deploy ran. Then sweep AWAM pages on mlit for `QA273465-PROBE` in `PrimeFaces.ajax.Request.handle.toString()` |
| **1** | **273455** | Phase 0 — fix already in みや's working tree, uncommitted | audit the `PelupusanService.java` PT sempadan fallback, then quest it properly |
| **2** | **273460** | Phase 0 | needs the TRG blast-radius check |
| **3** | 273707 · 273921 · 273956 · 274136 · 274182 · 274318 | not drafted | board ranks by working-days elapsed |

### What shipped — 273465

```
etanah-awam/src/main/webapp/resources/js/app.js:145-203   (+60, additive IIFE)
    wrap oncomplete on cfg / cfg.ext / ext inside PrimeFaces.ajax.Request.handle

code → mlk/esokongan/273465 @ fadebbcbce → mlk/int-env @ c69f932ad5
```

### Root cause, and how it was proven

PrimeFaces 12 `core.js` runs `ext.oncomplete` → `oncomplete` → `Queue.removeXHR` → `Queue.poll`.
A throw in either handler skips the last two, so the finished xhr stays in `Queue.xhrs` and
`offer()` refuses to dispatch anything ever again — until reload.

| | BASELINE | WITH GUARD |
|---|---|---|
| queue after click 1 | 1, stuck | 0, drained |
| click 1 response | readyState 4 / 200 / 29,218 bytes | same |
| rows after 2 clicks | **1** | **3** |
| click 2 dispatched | no — sat in `Queue.requests` | yes |

PROD trigger (**inferred, not proven**): F5 TrafficShield returns HTTP 200 + a 7,485-byte HTML
challenge (`/TSPD/`, support ID `13460219195502148951`) where JSF expects `<partial-response>`.
The throw was **simulated** in the A/B — the WAF→throw link is still an open causal gap.

### The five things I got wrong before getting it right

| # | Slip | What corrected it |
|---|---|---|
| 1 | Diagnosed on a repo 10 behind / etanah-common 641 behind, after writing the behind-count in a table and proceeding anyway | みや: *"Did you not change the env to mlk/master at the start of the ticket"* |
| 2 | Ran the whole A/B on `127.0.0.1` after navigating his PROD tab away from PROD | みや: *"Did you even try on the production page tab?"* |
| 3 | Called a ~10 s local request the root cause — conflated slow with dead | みや: *"PRODUCTION IS QUICKER so you need to test until you get it"* |
| 4 | One-shot `pfAjaxComplete` listener fired on a different queued response; I reported "never adds a row" when the row arrived at 14,481 ms | controlled re-test |
| 5 | Over-corrected the audit into "I probably caused the TSPD challenge", discounting his own pre-automation capture | みや: *"even when you tested I cannot other than Status 200 and type xhr"* |

`/appraise` then found **two defects in my own fix** — `ext.oncomplete` runs first and was unguarded,
and the `PrimeFaces.ab` wrapper ran before `CFG_SHORTCUTS` expansion so it only ever saw `cfg.onco`
(dead code). Both fixed; 21/21 harness cases.

### Behaviour

**I let `status=closed` sit in `active.txt` while the ticket was open.** He asked *"please confirm
you've closed phase 1"* — the honest answer was no, and the state file said otherwise. Corrected in
the same turn. The lesson is not "check before claiming"; it is that a state field I write casually
becomes the thing a later session trusts.

**Commit ran ahead of its own gate.** Protocol has commit+push only after `local_test_confirmed=true`.
It is still false. He approved the commit knowing the coverage was 1-of-87, so the call was his — but
I should have named the gate at approval time, not two turns later.

### Deferred

| Item | Why not now |
|---|---|
| Cache-busting on `avalonAwamTopbar.xhtml:30` | `app.js` has no version param, so cached browsers never get the fix. Separate one-liner, needs a nod |
| Strip-or-ship the `QA273465-PROBE` channels | Step 2.6 says strip by default; they are the only PROD diagnostic for the unproven WAF path |
| WAF log for support ID `13460219195502148951` | infra request, drafted in BM, not yet sent |
| Runtime coverage 1 of 87 AWAM pages | needs the mlit deploy first |

---

## 2026-08-06 17:51 → 19:4x — 273461 CLOSED, AND THE RESUME RULE CAUGHT A SHIPPED FIX I DID NOT KNOW EXISTED

**One ticket end-to-end: quest → fix → commit → deploy → patch handed to the release team. The rule
みや asked for at the start of the session paid for itself on its first run, and a census of PROD
stopped a patch that would have erased 746 migrated licences.**

### ▶▶ NEXT SESSION — START HERE

| Priority | Ticket | State | First step on resume |
|---|---|---|---|
| — | **273461** | **Phase 1 closed** · `93bf7168b4` · int-env `67e49daecd` | Phase 2 archive only. At release: confirm the release team ran `patch-273461.sql`, then re-verify PROD |
| **1** | **273455** | Phase 0 — **fix already in みや's working tree, uncommitted** | `PelupusanService.java` carries a PT sempadan fallback (praHakmilik → VO when App sempadan empty). Not mine; audit it, then quest it properly |
| **2** | **273460** | Phase 0 | needs the TRG blast-radius check |
| **3** | 273465 · 273707 · 273921 · 273956 · 274136 · 274182 · 274318 | not drafted | board ranks by working-days elapsed |

### What shipped — 273461

```
MlkPengiraanBayaranLesenForm.performCustomSave():646-650
    if (!PelupusanUrusanConstant.URS_PLPS.equals(urusanCode)) { …allocate + promote… }

code → mlk/esokongan/273461 @ 93bf7168b4 → mlk/int-env @ 67e49daecd
data → patch-273461.sql attached to Redmine (release team runs it) — git CANNOT see this channel
```

### The three findings that mattered

| # | Finding | How it surfaced |
|---|---|---|
| 1 | A fix for this ticket was **already committed and pushed** (`8bd34da47c`, 08-04) — the qa_doc said *"Phase 0 only. No code changed."* | the new resume rule's existing-fix probe, on its first run |
| 2 | The shipped guard carried an **unreachable** `\|\| PYB4AE` arm — PROD shows skrin 338 mounts on 21 PLPS tugasan, never on PYB4AE | one `ind_langkah` query |
| 3 | "PLPS holds a No Lesen and never reached 4Ae" = **749 rows, 746 of them migrated legacy** (`MIGRATOR_*`, formats `M 003` / `192055`). Real scope: 3 | census before scripting, not after |

Also: `PYB4AE` has **never occurred in PROD** — 0 of 38 PLPS tugasan ever recorded. The fix is right per
BA, but PLPS carries no No Lesen until the workflow first runs that far. Recorded as a deferral.

### Behaviour

**Two emit-shape corrections in one turn on the same card.** The deploy card opened with two local git
steps a server-side deploy never reads (*"your commands seems useless"*), then the evidence block was a
table + commit log + code fence when he wanted `mlk/xxx/xxx → branch`. Same family as the 07-20 hand-off
card. Both fixed in `deploy/SKILL.md`; slip `emit-shape-not-copyable`.

**My own manifest tool false-flagged our uploads.** `ticket-load-verify.js` only searched `0. Brief/`, so
the patch script and test video in `2. Fix/` failed its integrity check as ghost attachments. Fixed to
search the whole task folder. Slip `ticket-source-skipped`.

**Two copies of the same qa_doc.** I edited the durable main-repo one; the deferrals gate reads the
worktree's, which was a stale 08:25 snapshot. Same `${CLAUDE_PROJECT_DIR}`-is-the-worktree trap as the
skill edit earlier in the session — hit twice in one evening.

**He asked for conditions, not literals.** The patch was a hardcoded 3-number list; he asked *"can we not
hardcode it? We know the conditions already right?"* Rewriting it by predicate also killed a bad
condition of mine — `created_by='SYSTEM'` is incidental, the same code path stamps the officer's login.

## 2026-08-06 10:34 → 21:45 — A DEPLOY THAT NEEDED NO MERGE, AND THE SERVER MAP WE NEVER HAD

**#273938 went to mlit and the whole job was two ssh sessions — Aaron had already done both merges
the evening before, and I spent the morning inventing a conflict for a merge that was finished.
Then みや handed me the architecture sheet and the deploy skill finally has real hosts in it.**

### ▶▶ NEXT SESSION — START HERE (this thread)

| Item | State | First step on resume |
|---|---|---|
| **273938 training** | build+deploy NOT run | `./build-pelupusan.sh mlk/training/273938` → env `train` → deploy on `172.30.12.152`; **`ls ~/deployment-scripts/` there first** — folder name unconfirmed |
| **273938 mlit** | ✅ deployed on 2nd attempt | add to the Redmine planned-release list |
| `deploy` skill | v1.2, eval 52/52 | — |

### The merge order — Aaron's lanes, my inference

```
① mlk/training/<ticket> ──▶ mlk/int-env             (ticket fix ONLY)
② mlk/release/<x.y.z>   ──▶ mlk/training/<ticket>   (baseline joins the ticket branch)

② before ① poisons int-env with the whole release lineage.
Aaron: ce1198818c 16:08 (①)  →  609f83bcb5 16:21 (②)
```

Aaron stated each lane separately and never ordered them. The ordering is **my** inference from his
timestamps plus the conflict I reproduced — written into the skill labelled as such, not as his words.

### The server map — `etanah-knowledge/melaka/ENV-ARCHITECTURE.md` (new)

Read from the `ETANAH ARCHITECTURE - MLK` sheet, our modules only.

| Env | Pelupusan app tier | Deploy VM |
|---|---|---|
| mlit | Fudge1 `172.16.100.49` | `172.16.100.162` · `deployment-scripts/mlit` |
| training | Eto1/2/3 `172.30.12.126-128` | **Reus1 `172.30.12.152`** |
| staging | Radome1/2/3 `172.30.12.176-178` | `172.30.12.203` · `deployment-scripts/stag` |

Training schemas sit on the **staging DB host**: `172.30.12.202:5444/mlkstg?currentSchema=et_main_trn`.
One word separates `trn` from `stg1` on the same connection.

### Behaviour

**I checked ancestry one direction.** Reported #273938 "not in int-env" from a `merge-base` test on
the branch TIP — which had grown a release merge *after* int-env took the fix. Both fix commits were
already there. I then built an A/B/C plan to resolve a binary `.docx` conflict for a merge that never
needed to happen. みや caught it: *"those tickets are missed?"* Skill §4 now probes fix commits.

**I read the deploy log bottom-up.** Took `Invalid WAR structure (WEB-INF missing)` as the thing to
explain when the first failure — `git clone` dying at `index-pack` — sat ten lines above. Then
asserted disk-full with no evidence; his `df -h` showed 83G free. Skill §7 is now a top-down triage table.

**I guessed infrastructure from an `ls`.** `deployment-scripts/mltg` became "the training deploy
folder" because it was the only training-shaped name in a listing, and I shipped it into two files
behind a thin ⚠️. Aaron: *"No no. build in 172.16.100.162. Then deploy in another IP."*

**Slips**: `ancestry-checked-one-direction` · `read-last-line-not-first-failure` ·
`guessed-infra-path-from-folder-name`.
