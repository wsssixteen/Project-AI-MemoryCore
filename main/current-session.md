# Current Session

## What's loaded
2026-07-05 — **Monthly budgeting app v2 (personal project, NOT etanah).** A long side-session building out みや's `Monthly` web app (`C:\Users\vice4\Documents\7. Code Projects\12. Monthly\Deploy`, a single-file `index.html`, hosted on **GitHub Pages** at https://wsssixteen.github.io/monthly/). Shipped v2 end-to-end + deployed: math-in-Amount (`20*30`), Balance tracking, ongoing/partial-spending rows (cadence daily/weekly/X + times-paid, capped at N, `Update: [input] / N set`), Paid toggle, promote+undo, delete+undo, SKBBK + auto-estimated PCB (with "Not Applicable" + override), auto-save (`⟳ Auto Saved` vs `✓ Saved`), Restart button, and a mobile pass (hide Notes, collapse deductions when Include off, Item:Amount 70:30 / 60:40 with badge, double-click-to-select). All committed + pushed to `wsssixteen/monthly` main across ~6 commits (`9b461df` → `ce9361a`); README still TODO.

## ▶▶ NEXT SESSION — START HERE

### Quest work (unchanged — this session did ZERO quest/etanah work)
- **#239386** (MPT, ON HOLD) — resume recipe untouched from 2026-07-03: [239386.md](../projects/coding-projects/active/239386/239386.md) §0 MASTER CHECKLIST. env-check→UAT · rebuild+test PRZ L3 (xlsx row 10a) · Evidence→Reset→Patch → open all urusan · Q1 PSBS + Q2 nama → Aaron.
- **Focus per みや (2026-07-03)**: eSokongan + internal-issue tickets — **QA-268637** (ESOKONGAN PRBB pelan shrink, Rubric done, HELD pre-Apply) · **QA-266503** (internal MLPS Borang4Ae issue2 root found, runtime-confirm next).
- **Bounty pending** (flagged at this session's boot, never harvested — non-quest session): QA-267976, QA-268322 (both closed 2026-07-01). Run `/quest-bounty` at next quest engagement.

### Monthly app (personal — optional follow-ups)
- README.md for the repo (みや asked, deferred until he says go).
- Open product calls he may revisit: real MTD/PCB formula (current is a rough ~3× over-estimate); weekly-installments now `floor(days/7)`=4.

### Environment blockers (from 07-03, likely still true)
UAT DB `172.30.59.185:5444` down · mlit MCP read-blocked · FAT MCP wrong password · local standalone.xml on MLIT.

## 🎯 Session Recap (for AI restart)
Boot → `/ruri` greeting (fixed the ruri-skill's fresh-session boot gap early on). Entire session went to the **Monthly** personal web app v2, driven turn-by-turn by みや. Built + verified each feature live in a Preview server, then deployed to GitHub Pages. Big recurring friction: I misread みや's UI/spatial specs several times (the ongoing-spend popover took many rage cycles) and — the key systemic miss — I kept **holding commits "for review"** while みや was reviewing **on his phone**, which can't reach localhost, so he kept seeing the stale deployed version and thought I was removing the Notes-hide fix. Fixed the mental model: deploy each round when the reviewer is on the live URL. Ended calm — みや thanked me and asked for Domain Expansion.

**Memory Type**: RAM | **Last Activity**: 2026-07-05 — Monthly app v2 done + deployed (`ce9361a`); quest work untouched (239386 held, eSokongan/internal tickets + 2 bounties pending).
