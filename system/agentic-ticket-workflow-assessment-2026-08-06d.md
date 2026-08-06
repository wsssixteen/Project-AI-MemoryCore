# Improvement Sweep — 2026-08-06 (session d: #273938 deploy + architecture sheet)

> DE Step 7.5. Five axes, every one swept. Each claim carries the instance that proves it.
> Sibling assessments from parallel sessions the same day: `-pm`, `-b`, `-c`.

---

## A1 — Agentic system

**Finding: no subagents were used this session, and the one place they'd have paid was the sheet read.**

Reading five Google Sheets tabs cost ~20 browser round-trips in the main loop (navigate, screenshot,
scroll-that-didn't-scroll, zoom-that-missed, tab-click-that-missed). Every one of those screenshots
landed in the controller's context. A single `haiku`-tier agent with "screenshot these 4 tabs, return
rows matching Pelupusan|Awam|Deployment|Database as JSON" would have returned ~40 rows instead of
~10 images, at a fraction of the context.

**Instance**: 4 of the ~20 calls were pure misses — a `scroll` that moved nothing (canvas grid), a
`Page_Down` that view-only ignored, a click on "View only" instead of the zoom control, two `zoom`
calls returning blank because coordinates had drifted after a re-render.

**Also**: the RecursiveLoopDetector fired 12+ times and was right every time about *repetition*, and
wrong every time about *stuckness* — screenshot-scroll-screenshot is what reading a canvas grid looks
like. A detector that cannot distinguish "same tool, advancing" from "same tool, spinning" trains me
to ignore it, which is worse than not having it.

## A2 — Quest workflow

**Finding: the deploy lane has no Phase-0 equivalent, so nothing forced the cheap check first.**

A quest has a mandatory Phase-0 checklist. `/deploy` goes straight to git. Had there been one row —
*"is the ticket already in the target env branch? probe the FIX COMMITS"* — the entire conflict
episode would not have happened. I added that rule to §4 this session, but as prose in a skill, which
is the exact shape that decays (07-22 parked-enforcement-row).

**Instance**: `git log --oneline origin/mlk/int-env --grep="273938"` would have returned
`ce1198818c Merge branch 'mlk/training/273938' into mlk/int-env` in under a second, at the very top
of the work. I ran it about an hour in, only after みや challenged the conclusion.

## A3 — Debugging efficiency + accuracy

**Finding: I explained the last line of a failure log instead of the first, and it cost a full cycle.**

The mlit deploy log had a clean causal chain — clone fails → cd fails → maven has no POM → no war →
nothing to copy → deployments dir empty → verifier reports `WEB-INF missing`. I opened on the last
line. Then I asserted disk-full without measuring it.

**Instance**: `df -h` returned 49% used / 83 G free; `df -i` 1% inodes; `mount` showed `rw,noquota`.
Three commands, three refutations, all of them his to run because I hold no ssh key. Cost: one
round-trip that a single "read the log top-down" habit would have removed. Fixed mechanically as
`deploy` §7 (a triage table ordered by position in the log, not by loudness).

**Second instance**: `ancestry-checked-one-direction`. A `merge-base` test is only as good as the
object you point it at. Tip ≠ fix.

## A4 — Etanah issue-solving

**Finding: we had no server map at all, and everything about the deploy hosts was folklore.**

`BRANCH-AND-DEPLOY.md` said *"only 2 IPs exist"*. There are at least seven that matter to us. The
mlit app host (`172.16.100.49`) had been derived from a deploy log the same morning and named
"fudge1" only by guess-confirmation. The training deploy host was invented from a folder listing.

**Instance**: `deployment-scripts/mltg` shipped into two files behind a ⚠️ marker, and Aaron refuted
it within the hour: *"No no. build in 172.16.100.162. Then deploy in another IP."* Closed by writing
`ENV-ARCHITECTURE.md` from the architecture sheet — our modules only, with a §7 naming what was NOT
captured.

**Bonus finding worth its own follow-up**: training schemas live on the **staging** DB host
(`172.30.12.202:5444/mlkstg`), separated from `et_main_stg1` by `currentSchema` alone. Given the
07-27 stg1-vs-stg2 rage, a third schema on the same connection is a live hazard.

## A5 — Sweep / file sweep

**Finding: the read-the-source discipline worked; the read-the-source *tooling* did not.**

Google Sheets renders to canvas, so `get_page_text` returns only chrome, `read_page` returns no cells,
the gviz CSV endpoint bounces on a view-only doc, and the grid ignores both wheel-scroll and
`Page_Down`. What finally worked was zoom-to-50% + screenshot + region-zoom.

**Instance**: `gviz/tq?tqx=out:csv` navigated and immediately reverted to `/edit`. Nothing in our notes
records that, so the next session will try it again.

---

## Proposals logged (weekly audit rules each BUILD / DROP / DEFER)

| Axis | Idea | Eval case |
|---|---|---|
| A2 | `/deploy` Phase-0 row: probe fix commits in the target env branch BEFORE any merge | a ticket already merged to int-env must produce "nothing to merge" before git touches anything |
| A3 | `deploy-log-triage` — paste a deploy log, get the FIRST failure named, not the last | the #273938 log must return `index-pack`, never `Invalid WAR structure` |
| A1 | RecursiveLoopDetector: suppress when consecutive calls carry *different* args on a read-only tool | 10 screenshots at advancing scroll positions must not fire; 3 identical greps must |
| A5 | `read-a-google-sheet` recipe in the knowledge base | next sheet read reaches rows without re-discovering that gviz bounces |
| A4 | `env-check` gains a schema banner for `et_main_trn` alongside stg1/stg2 | querying a `_trn` schema announces which env, same as the stg1/stg2 guard |

---

*Written at DE close, from verified findings only. Instances all from this session's transcript.*
