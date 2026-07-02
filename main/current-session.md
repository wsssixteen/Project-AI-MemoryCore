# Current Session

## What's loaded
2026-07-02 (00:45→09:39) — **cmd-window / junk-commit incident, resolved.** The `auto-commit-docs` Stop hook (built 2026-07-01) ran git on EVERY turn → flashed a cmd window + committed hook-telemetry logs as junk every turn. **Retired it** (unregistered + deleted the hook + worker) and reverted saving to the normal **DE / save-all** method. Then hardened system-design Rule 6 into a pre-ship eval gate. The big live quests (#239386, QA-268273, quest-bounty) were NOT touched — this session WAS the incident.

## ▶▶ NEXT SESSION — START HERE

### ✅ Hook incident — DONE (just confirm no recurrence)
`auto-commit-docs` + worker deleted + unregistered (commit `7ac9ec0`); telemetry gitignored; saving = DE/save-all now (commit `90d24f4` = catalog + Rule 6). On next boot: confirm NO cmd-window flashes + NO `docs: auto-commit` junk commits. The per-turn git source is gone, so the `windowsHide` band-aids were reverted (not needed).

### #239386 MPT (still the big live quest — UNTOUCHED)
Resume: `git stash pop` on etanah `mlk/requirement/239386` → rebuild → test **PRZ L3** (duplicate "Maklumat Plot" panels gone?) → retest disabled cells → decide nama chalk-back. Full state in [239386.md](../projects/coding-projects/active/239386/239386.md).

### QA-268273 (HELD — diagnosed, needs a dedicated Apply session)
Awam draft-Kemaskini skips Maklumat Pemohon → lands on Maklumat Tanah. Root cause: `BaseAwamTabForm.initTabRendered()` auto-advance (466-477). **Shared AWAM base = high blast radius** — careful Apply + regression sweep, not a drop-in. Full diagnosis: [QA-268273.md](../projects/coding-projects/active/QA-268273/QA-268273.md).

### quest-bounty remainders + a candidate eval-gate hook
Prior-session remainders (todo.md Q1): mined refinement · coverage gap · BUG-BESTIARY MCL write. NEW: system-design Rule 6 now HARD-gates eval-before-ship — worth designing a deterministic hook that blocks a hook-registration in `settings.json` unless a sibling eval/smoke-test log exists.

## 🎯 Session Recap (for AI restart)
This session = the `auto-commit-docs` hook incident. The hook (built 2026-07-01, **no eval**) ran a per-turn background git commit+push → cmd window every turn + telemetry-log junk commits. I first band-aided (`windowsHide` + telemetry untrack, commit `3e71340`) — AND made it worse by editing hook files at MAIN-repo absolute paths while committing from a WORKTREE (split the fix across trees, touched a live parallel session). みや (rightly furious) named the real fix: retire the per-turn hook, use the normal DE/save-all path. FINAL: retired `auto-commit-docs` + worker (`7ac9ec0`), reverted to DE/save-all, gitignored telemetry. Then per /goal: `system-architecture.md` §3.13 + catalog RETIRED, `system-design` Rule 6 hardened into a pre-ship eval gate, slip logged (`90d24f4`). **Lessons**: (1) NEVER ship a hook without running its eval/smoke-test (Rule 6 is now hard); (2) work in the tree the session runs in — never edit MAIN-repo absolute paths from a worktree.

**Memory Type**: RAM | **Last Activity**: 2026-07-02 09:39 — `auto-commit-docs` RETIRED (`7ac9ec0`) + Rule 6 hardened + slip logged (`90d24f4`); DE close. Big quests untouched.
