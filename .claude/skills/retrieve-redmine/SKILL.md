---
name: retrieve-redmine
description: Retrieve ALL new Redmine tickets and run every one through quest Phase 0 (Scout→Recon→Rubric) via a delegated familiar fleet, then rank + next-plan. Start-of-day / end-of-day batch intake. Triggers — "/retrieve-redmine", "retrieve the new tickets", "pull the new tickets and run them through", "tickets stacked up", "morning ticket sweep", "retrieve then quest start all".
---

# retrieve-redmine — batch intake + quest fleet

`/retrieve-redmine [--waves 1|2] [--only <n>,<n>] [--no-fleet]`

One trigger = the whole start-of-day intake: live queue → sync → folders → one familiar
per NEW ticket to Rubric → controller-verified ranking → next-session plan.

**Default = 2 waves** (W1 quest + W2 blind audit). `--waves 1` skips the audit wave.
`--no-fleet` stops after sync + ranking table (no familiars — cheap triage only).

---

## Step 1 — LIVE queue first (never active.txt)

```
Invoke-RestMethod "http://172.16.90.169/redmine/issues.json?assigned_to_id=me&status_id=open&limit=50" -Headers @{'X-Redmine-API-Key'=<key from quest/redmine-sync.js CONFIG>}
```

- Classify each row: **NEW** (never quested — no qa_doc, no active.txt block) vs
  **Rework** (folder/quest exists) vs **delegated/others**. Only NEW tickets enter the fleet.
- Reconcile active.txt: any block whose ticket is absent from the live queue → flag for archive.

## Step 2 — Sync + folders

```
node quest/redmine-sync.js            # pull descriptions/History/attachments
node quest/redmine-sync.js --create   # Task folders + active.txt blocks (status=hold) for folderless NEW tickets
```

Verify: `Get-ChildItem "…\1. Tasks\Melaka" -Directory` filtered on the ticket numbers — every NEW ticket must have a folder before fan-out.

## Step 2b — Prior-work sweep (adhoc + pre-existing docs) BEFORE fan-out

- **Adhoc/pre-ticket work**: read `etanah-knowledge/melaka/ADHOC-REGISTER.md` (all OPEN/LATENT rows) + glob `projects/coding-projects/active/PENDING-TICKET-*/FINDINGS.md` — a BA often asks us BEFORE raising the ticket, so a new ticket may be (partially) solved already. On a symptom match, the familiar's prompt carries the doc path as a LEAD and starts from the phase the row reached, and the register row is promoted to `TICKETED → #<n>` in the same session (2026-08-03 proof: #273455=A8, #272867=A6 — both arrived pre-solved).
- **Pre-existing qa_docs**: glob `projects/coding-projects/active/QA-<n>/QA-<n>.md` for every ticket — a concurrent/earlier session may have written one. If found: familiar is told APPEND-not-overwrite and to close that doc's stated gaps instead of re-deriving (2026-08-03: 4 of 11 tickets had prior docs).

## Step 3 — DELEGATION PLAN (mandatory emit before fan-out)

Table: stage · # agents · model · effort · output schema · token band.
Standard shape (proven 2026-07-24 + 2026-08-03):

| Stage | Agents | Model | Effort |
|---|---|---|---|
| W1 quest, one ticket each | N | **opus, low** | low |
| W2 blind adversarial audit, one ticket each | N | **opus, low** | low |
| Controller verify + rank + plan | main loop (Fable) | — | — |

**Model rule (みや 2026-08-03)**: familiars run **Opus 5 with low effort** — NEVER Fable
(Fable is the controller's judgment seat only). Each prompt is SPECIFIC: one ticket, one
question set, explicit boundaries + a reachable stop condition, so the familiar cannot
wander over-boundary. Escalate a single familiar to medium effort only when its low-effort
pass returns demonstrably shallow (name the gap when re-running).

## Step 4 — Wave 1 fleet (one familiar per NEW ticket, ALL concurrent)

Each W1 prompt MUST carry (the delegation safety template):
- ONE ticket only; Scout→Recon→Rubric; **NO code edits**; **NO sub-agents/workflows**
- Ground truth: Task folder full path · codebases `E:\Projects\Melaka\etanah-{pelupusan,awam,common}` · knowledge base `projects/coding-projects/active/etanah-knowledge/melaka/index.md` READ-FIRST · ADHOC-REGISTER.md compare-and-promote · BPMN module-scope check · postgres MCP list with schema names (`SELECT current_schema()` first)
- Evidence language VERIFIED/HYPOTHESIS/BA-Q · latest History.txt overrides · working-analog first · full addresses
- **Leads, not conclusions**: if a prior quest/adhoc/bestiary entry matches the symptom family, name it as "LEAD TO VERIFY" with the doc path — never as settled truth
- Forced deliverable: `projects/coding-projects/active/QA-<n>/QA-<n>.md` in the **MAIN repo path** (projects/ is gitignored in worktrees) with §BA report · §Scout · §Recon (story diagram) · §Rubric (candidates + conf% + effort + falsifier) · §Test data (ID + login + tugasan from DB, never ID alone) · §BA-Q · §Blast radius
- Forced return line: `<ticket> | root-cause-1-liner | top candidate + conf% | effort | ownership | test app`

## Step 5 — Controller verify (W1 outputs are DATA, not truth)

For every familiar: qa_doc file exists on disk · return-line fields present · spot-read the
top candidate's cited file:line against the actual code for ≥2 tickets (rotate). Missing
deliverable = re-run that ONE familiar, never the fleet.

## Step 6 — Wave 2 blind audit (default on)

One familiar per ticket, **banned from reading our qa_docs** (blind): re-derive root cause
from ticket + code + DB only, then unseal — controller diffs W2 verdict vs W1 doc. Any
conflict → controller reads the disputed mechanism personally (citation-vs-mechanism rule)
before the ranking table records a confidence.

**90% goal (みや 2026-08-03)**: the wave ladder targets **≥90% confidence per ticket**.
A ticket below 90% after W2 does not get more waves by default — the ranking row must
instead NAME the single blocking item (a BA-Q, a runtime-only falsifier, or a みや
decision) that buys the remaining %, so the next session spends effort on that item, not
on another re-derivation. Convergence is not confirmation — the % only rises on NEW
evidence (DB row, code read, reproduction), never on two waves agreeing.

## Step 7 — Ranking + next-session plan (the hand-back)

Emit ONE table ranked by **ownership first** (ours > data-patch > reports-team/delegate > out-of-scope), then days-elapsed (3-DAY RULE):

`# · Ticket · Root cause (1-liner) · Conf% · Effort · Ownership · Test app · Testable-together pair`

- **Testable together** line: pairs eligible for one local deploy (small + no shared file + same repo/base; ceiling 2 undisturbed evenings, 1 during office hours)
- **Next plan**: recommend per ticket — `combine-apply+test` (batched fresh session) vs `quest-singular` (own session) vs `delegate/hand-off`
- Update each ticket's active.txt block: `scout=` one-liner + `qa_doc=` path
- Stop-Point Summary closes the run. Apply NEVER happens in this skill — hand-back only.

---

## Guardrails

- `retrieve` = SYNC FIRST (2026-07-16 #270297 wrong-ticket lesson) — a folder on disk is not retrieval.
- Reworks are NOT re-quested by the fleet — surface them in the ranking with their existing qa_doc.
- Same-symptom sibling tickets (e.g. #272881/#273201 agihan kepada) get cross-referenced prompts + a shared-mechanism verdict field.
- Usage-limit mid-fleet: resume the failed familiars only, never relaunch (Delegation Economy).
- Worktree sessions: deliverables + config live in the MAIN repo path; check `quest/redmine.local.json`-class files exist before starting.

*Born 2026-08-03 via core/forge.js per みや (session goal step 6), from the 11-ticket live run of the same shape. Eval: `domain/retrieve-redmine/eval.js`.*
