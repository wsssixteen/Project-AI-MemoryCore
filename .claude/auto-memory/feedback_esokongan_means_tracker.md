---
name: feedback_esokongan_means_tracker
description: "eSOKONGAN = the tracker; board from redmine-board.js first; shared miya+Ammar filter; BA vs TSO roster; delegated quest stays open, learn before close"
metadata:
  node_type: memory
  type: feedback
  originSessionId: feb49556-3152-4a25-8a15-544795a07418
  modified: 2026-10-16T05:11:17.828Z
---

"eSOKONGAN ticket", from みや or anyone, ALWAYS means a ticket whose **Tracker** is eSOKONGAN (Redmine tracker id 51). The Redmine project "eSOKONGAN MELAKA" also holds Internal Issue and Data Patching tickets; the project name never makes a ticket eSOKONGAN.

Ticket priority order (2026-10-19, replaces the 2026-09-29 order). Maintenance and Project trackers interleave tier by tier:

| Tier | Trackers (Redmine id) |
|---|---|
| 0 | PROD patching: Internal Issue (PROD) 71 · Data Patching (PROD) 64 · Internal Issue (PROD-CR) 63 |
| 1 | eSOKONGAN 51 · PAT / UAT / FAT family (30 31 32 36 37 38 39 40 45 46 47 57 58) |
| 2 | Internal Issue (Permanent Fix) 77 · Internal Issue (MA Fix) 79 |
| 3 | Internal Issue 53 · QA 15 |
| 4 | CR (68 70 73 74 75) · Development 12 · Requirement(s) 13 28 |
| last | not placed yet: Team Initiative (no Redmine tracker has that name), any other tracker |
| inside a tier | Priority Critical > High > Medium > Low, then an urgent-worded ticket (urgent / segera / kritikal / critical / ASAP / mendesak / secepat mungkin / immediate / emergency / kecemasan), then eSOKONGAN nearest due, others 3-DAY age |

**Two states, Melaka + Perak (2026-10-30)**: every category is Melaka's table, then Perak's table of the same category: 1 PROD → 1b Perak PROD, 2 eSOKONGAN → 2b Perak eSOKONGAN, 3 the rest → 3b Perak rest. Perak rows include Ammar's tickets (the shared filter below); he asks Ammar before taking one. Why: みや 2026-10-30, "if our Melaka eSokongan tickets have finished, we should focus on Perak's eSokongan first … I will always ask Ammar first", then "we group them but different tables … same for the rest". Code: `system/states.json` perak `shared_assignee_ids` [1218] + `board_slot` "interleave"; eval `quest/redmine-board.eval.js` P1 to P12.

**This is the default order only. He picks the day's tickets himself** by current priority and complexity / effort. On "what tickets today", show the ordered list with each ticket's state; never pick for him.

**Why:** 2026-10-19 みや: "Maintenance: eSokongan → Internal Issue (Permanent Fix) → Internal Issue → CR → Team Initiative. Project: PAT/UAT/FAT → QA → Development/Requirement"; PROD patching goes ahead of eSOKONGAN; "QA is same as Internal Issue & CR is the same level as Development/Requirement. I'll be the one to choose based on prioriti semasa and complexity/effort". The 2026-09-29 board lumped Permanent Fix, Development and QA into one pile. The eSOKONGAN tracker (not the project name) is still what makes a ticket eSOKONGAN.

**How to apply:** `quest/redmine-board.js` `TRACKER_TIER` implements it (tables: PROD, then eSOKONGAN, then the rest by tier); the ProTime weekly plan reads that same order. Any hand-made ranking (sweep brief, retrieve-redmine, briefing) follows this file.

Related: [[reference_redmine_sla_hours]] · (merged above)

---

## Merged 2026-10-04: feedback_board_from_redmine_first (was feedback_board_from_redmine_first.md)

> Any \"work/finish the tickets\" request → run redmine-board.js (live truth) FIRST, before presenting any ticket list built from active.txt

🚨 On ANY "let's finish the tickets" / "what's in progress" / "work the tickets" request, the FIRST action is `node quest/redmine-board.js` (live Redmine "mine-open") — present the board from THAT, then reconcile active.txt to it. NEVER present a ticket list built from `active.txt` alone.

**Why**: 2026-08-20, session start — miya asked to finish all in-progress tickets. I built the first board from `active.txt` and listed ~14 "open", including 274740 which was Redmine-CLOSED (Shafiq 100%) but kept deliberately-open in active.txt for an owed patch. miya caught it: *"was there a gap in your session boot ticket check? 274740 is already closed."* The real open queue was 7. active.txt over-lists because it holds closed-but-residue rows, pre-ticket adhocs, and delegated items.

**Root cause (miya's own question answered)**: NOT because miya added context instead of just summoning "Ruri" — context is never the disruption. The cause was reading my own derived artifact (active.txt) as the board instead of the live source. Same family as the 07-27 lesson "active.txt rots while Redmine stays true" and [[feedback_readable_safe_script]] — my ledgers decay, Redmine is truth.

**How to apply**: board request → `redmine-board.js` first → map each active.txt block to a live row → drop rows not in mine-open (closed/handed/reassigned) → only THEN show the list. Pure-adhoc (no Redmine ticket) rows are labeled as such, not counted as open Redmine work.

**Script times out (`LIVE REDMINE NOT READ`) → the browser, never the ledger** (2026-10-16): the home PC has no route to 172.16.90.169, but Claude in Chrome drives an Edge that does. Read the board and each named ticket there before any status line. On 2026-10-16 I answered from active.txt instead, called #284831 ours and "not sent to BA", and messaged its session; Redmine had moved it. A "No folder" session loads only MEMORY.md, so the pointer to this sits in Always on. Steps: `list-redmine` skill section "When the script prints LIVE REDMINE NOT READ".

---

## Merged 2026-10-04: reference_redmine_shared_board_miya_ammar (was reference_redmine_shared_board_miya_ammar.md)

> Saved Redmine filter — OPEN tickets assigned to みや + Ammar (assignee ids 1311, 1218); pull it up on \"any other tickets to do?\", \"tickets under Ammar and me\", \"Perak & Melaka tickets\", \"other tickets I can work on?\"

みや's saved Redmine board — **OPEN tickets assigned to both みや and Ammar** (assignee ids `1311` + `1218`), grouped ungrouped, columns: project · tracker · status · priority · subject · assigned_to · updated_on · done_ratio.

**URL** (host `172.16.90.169`):
```
http://172.16.90.169/redmine/issues?utf8=%E2%9C%93&set_filter=1&f%5B%5D=status_id&op%5Bstatus_id%5D=o&f%5B%5D=assigned_to_id&op%5Bassigned_to_id%5D=%3D&v%5Bassigned_to_id%5D%5B%5D=1311&v%5Bassigned_to_id%5D%5B%5D=1218&f%5B%5D=&c%5B%5D=project&c%5B%5D=tracker&c%5B%5D=status&c%5B%5D=priority&c%5B%5D=subject&c%5B%5D=assigned_to&c%5B%5D=updated_on&c%5B%5D=done_ratio&group_by=
```

**Fire on**: "are there any other tickets to do?" · "what are the tickets under Perak & Melaka" · "what are the tickets under Ammar and me" · "are there other tickets I can work on?" · any ask for the shared open-ticket standing across みや + Ammar.

**How to serve**: this is the LIVE shared board — the two-person superset. For みや's own ranked list use (merged above) / the `list-redmine` skill (`redmine-board.js`) first; this URL is the wider net (adds Ammar's open tickets + covers Perak & Melaka projects together).

**Note**: filter is `status = open` only — no project filter, so it returns every project (Perak, Melaka, …) both are assigned to.

---

## Merged 2026-10-04: redmine-people-roster (was feedback_redmine_people_roster.md)

> 🚨 TSO (not BA) raises eSOKONGAN tickets; who is BA vs TSO = etanah-knowledge/melaka/REDMINE-PEOPLE.md, refreshed by quest/redmine-people.js on every redmine-sync

When a BA says "we will raise an eSOKONGAN ticket", the **TSO** creates it, not the BA. Most eSOKONGAN MELAKA tickets are authored by the shared account **ITSO Melaka Admin**. Search tracker eSOKONGAN (id 51) in project eSOKONGAN MELAKA (`helpdesk_melaka`) by topic words, not by the BA's name.

Who is BA / TSO / developer = `projects/coding-projects/active/etanah-knowledge/melaka/REDMINE-PEOPLE.md`, built from Redmine project memberships by `node quest/redmine-people.js`. `quest/redmine-sync.js` refreshes it once a day on any retrieval (`--if-stale`).

**Why:** 2026-10-02 miya, ADHOC-PRBB-2026-9: "The TSO will create. Please keep/save the list of names everytime you retrieve tickets to know which one is BA, which one is TSO."

**How to apply:** before calling someone BA or TSO, look them up in REDMINE-PEOPLE.md. Redmine gives `Business Analyst` to nearly everyone, so the file classes BA only when it is the person's only role. Known: Mira = Nurul Amirah Nadiah (BA) · Kak Anis = Anis Nabilah J Daud (BA). Related [[esokongan-means-tracker]].

---

## Merged 2026-10-04: delegated-quest-learn-before-close (was feedback_delegated_quest_learn_before_close.md)

> A quest a colleague holds on Redmine is never closed locally while open there; once Redmine shows Closed, audit their fix (learn-from-fix) before closing

A delegated or reassigned quest stays `status=delegated` while Redmine still shows it open (In Progress, Rework, Resolved). It closes only after Redmine shows Closed AND the colleague's fix was read and audited with `/learn-from-fix` (strict: scrutinize, appraise; each finding routed to quest workflow, that state's etanah-knowledge, elsewhere, or none).

**Why:** みや 2026-10-04, when I offered to close QA-275043 (Ammar, Rework) and QA-265109 (Ammar, In Progress): "add a rule to not close reworks. Because once we detected a Delegated quest being Closed, we need to learn from it. You will see how they solved it, audit it, then decide if we need to add into our Quest workflow or etanah-knowledge for that particular state or any other places. Be strict about it, scrutinize, appraise."

**How to apply:** boot check `quest/redmine-status-check.js` prints `👀 TRACKING` (keep, do not close) or `🎓 LEARN BEFORE CLOSE` (run the skill first). Never offer "close" for a TRACKING row. Related: [[cross-module-handoff-artifact]], [[rework-commit-on-existing-ticket-branch]].
