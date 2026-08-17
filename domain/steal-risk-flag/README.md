# steal-risk-flag

**Born** 2026-08-17 (miya, after ticket 275587 was stolen). **Surface** boot board (`quest/redmine-board.js`). **Lifecycle** created.

## What it does

Prints a **QUICK-WIN · steal-risk** banner ABOVE the age-ranked Mine table whenever a
ticket is a *diagnosed patch sitting idle* — the cheapest KPI on the board and losable to
whoever applies it first. Silent when nothing qualifies (no false urgency).

A row is flagged when BOTH hold:

| Leg | Signal (read from the board rows `shape()` already produces) |
|---|---|
| Small / known fix | tracker is `Data Patching (PROD)` **OR** State says diagnosis is done (`Recon+Rubric done` · `qa_doc ready` · `fix in own session` · `Recon-done` · `data patch … ready` · `null-guard direction ready`) |
| Idle (losable) | State does **not** already say `Apply` / `committed` / `pushed` / `merged` — the risk window is the gap between *diagnosed* and *applied* |

Ranking: oldest-idle first (same age axis as the main board), then nearer due date, then id.
**Grab-risk beats age** — that is why the banner prints first.

| | |
|---|---|
| Module | `domain/steal-risk-flag/steal-risk.js` — pure functions, no network/fs |
| Wired into | `quest/redmine-board.js` `main()` — one `renderStealBanner(mine)` call before `renderMine` |
| Eval | `steal-risk.eval.js` — 16 fixtures, 16/16 green; lead fixture is the 275587 miss |
| Pairs with | `quest/redmine-status-check.js` — the REACTIVE leg (catches a steal after it happens); this is the PROACTIVE leg (flags it before) |

## Why it exists

miya 2026-08-17:

> we made a mistake for ticket 275587, it was taken over by someone else because we were too
> slow when the thing needed to do was only patching. Please highlight this next time after
> scraping through my redmine tickets. We lost our KPI there.

275587 was fully diagnosed in the sweep (`Recon+Rubric done; qa_doc ready; fix in own session`),
then left `status=hold`. A colleague applied it → Redmine now shows it Resolved under another
name at 0% done. The board ranked by age only; nothing flagged the diagnosed patch as losable.

## Keeping it in sync

The State-phrase regexes in `steal-risk.js` read the **same** vocabulary the board renders from
`quest/active.txt`. If the diagnosed-ready or already-moving phrasing changes, update
`DIAGNOSED_READY` / `ALREADY_MOVING` in one place and re-run the eval.
