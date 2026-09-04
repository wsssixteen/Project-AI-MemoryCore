# Improvement Sweep — 2026-08-05 (Baseline 1.3.1 session)

> DE Step 7.5, second firing (first was the session that built it, which closed before it could run).
> Five fixed axes, every one swept. Each claim carries a concrete instance from THIS session.
> Companion: `system/agentic-ticket-workflow-assessment-2026-08-05.md` (the 5-ticket sweep session).

Session shape: BAQA pasted a 13-ticket baseline at 15:00; `mlk/release/1.3.1` reached
`origin/mlk/master` at `9ddeb07406` by 22:00. Four workflow refinements were specified by みや
mid-flight. Five slips logged.

---

## A1 — Agentic system

**Finding: a gate whose answer is always "no, but here is why" is not gating.**

`system-edit-gate` fired on **5** consecutive skill edits, each asking whether
`system-design-router` had been invoked. It had not, every time. I proceeded every time with a
stated justification (みや's verbatim spec + a ledger row + a ship-check). That may even be the
right call — but the gate produced no decision, only a paragraph, five times.

**Finding: nothing guards the worktree/main-repo twin.**

I wrote §E2 into `C:\…\Project-AI-MemoryCore\.claude\skills\release-mlk-plp\SKILL.md` while this
session runs in `.claude\worktrees\ruri-f17d15\`, where the two earlier edits to the same file
lived. Split-brain for one turn. **Nothing stopped it** — it surfaced only because I ran a marker
check comparing the two copies. `worktree-stranded-delivery` is now a 6-strike category and every
prior instance was caught the same way: by me, afterwards, by luck.

**Proposal A1-a — worktree twin-path guard.** PreToolUse on Edit/Write: if the session root is a
worktree AND the target path is the main-repo twin of a file that also exists in the worktree →
BLOCK with the worktree path in the message. *Eval*: this session's stray `SKILL.md` edit must
block; a legitimate main-repo-only path (e.g. `etanah-knowledge/`, absent from worktrees) must pass.

**Proposal A1-b — retire or sharpen `system-edit-gate`.** Either it blocks (and router-less edits
stop), or it is downgraded to a one-line advisory. Five identical "no, but" answers in one session
is the parked-enforcement-row shape wearing a different hat. *Eval*: replay this session — the gate
must either have blocked ≥1 edit or emitted ≤1 line each time.

---

## A2 — Quest workflow

**Finding: a config fix has no completeness definition, so "done" means "done in one schema".**

QA-270900 cycle-1 was closed by a maintenance-UI edit on `et_main_stg2`. `et_main_mlit` never got
it → cycle-2. Tonight, weeks later, PROD was **still** on the pre-fix `KPT`. Three environments,
three different states, and nothing in the close ever said where the change was owed.

I built the **ENV-PARITY row** into the quest skill this session, plus the `#<ticket>.sql` mandate.
Both are **prose**. By the 2026-07-22 lesson — *a rule I can read and skip is not a rule, it is a
wish* — they are wishes until something counts.

**Proposal A2-a — ENV-PARITY as a Stop-gate.** On a quest close where the deliverable set contains
a `.sql` file OR a diff touching `ind_*` / `rjk_*` / `kod_*`, BLOCK until the reply contains an
env-parity table with one row per reachable env. *Eval*: QA-270900's cycle-1 close must FAIL; a
pure-Java ticket close must pass untouched.

**Proposal A2-b — script-extension check.** Writing a `.txt` containing SQL keywords into a Task
folder → BLOCK, name `#<ticket>.sql`. Cheap, deterministic, one regex. *Eval*: `#272574_updated.txt`
must block; a genuine notes `.txt` must pass.

---

## A3 — Debugging efficiency + accuracy

**Finding: three failed queries, three wrong queries — the rule held, but the map is missing.**

| Failure | Real cause | Recovery |
|---|---|---|
| `et_main_mlit.act_re_procdef does not exist` | Flowable lives in its **own** schema | `information_schema` → `et_flowable_mlit` |
| 0 rows on `act_ge_bytearray` | I used the UUID suffix of `procdef.id_` as `deployment_id_` — different columns | re-read the column list |
| `et_flowable_stg1 does not exist` | staging's Flowable schema is **`et_flowable17`**, not env-suffixed | `information_schema` |

The "a failed query is a WRONG query until proven otherwise" rule worked — I never once blamed the
connection. What cost the round-trips was having no schema map for Flowable.

**Proposal A3-a — Flowable schema + version-query card in `etanah-knowledge/melaka/DATABASE.md`.**
Record: `mlit → et_flowable_mlit` · `stg1 → et_flowable17` · PROD → *(unrecorded, fill on first
use)*, plus the canonical "which BPMN version is deployed, and does it contain marker X" query
(`act_re_procdef` + `act_re_deployment` + `act_ge_bytearray`, joined on `deployment_id_` and
`resource_name_`). *Eval*: the next "which flowable version is live" question is answered in **one**
query instead of four.

---

## A4 — Etanah issue-solving

**Finding: I resolved a versioned artifact by recency instead of provenance, and was wrong three times.**

One BPMN, two versions. I read MILT's deployment table, saw v6 was newest, and called it *the
latest* — then refreshed the knowledge folder to it. みや: *"but Requirement #242553 is not released
yet right?"* I reversed to v5 (the ticket's attachment, what staging ran, what BA passed). Then he
said a colleague had put v6 on the sftp **deliberately**.

Three positions. The question that decides it was never asked: **who put this here, and why.** I
kept comparing bytes when the missing fact was provenance.

**Proposal A4-a — artifact-provenance rule for versioned deliverables** (BPMN · `.docx` · `.jrxml` ·
`.sql`). When more than one candidate exists, the release deliverable is `(ticket attachment) ∩
(what the BA-tested env ran)`, never "newest on any env". Any other candidate is recorded with its
**owner and upload time**, and surfaced as a question — never silently promoted or discarded.
*Eval*: the v5/v6 case must resolve to v5 as release content while recording v6 + its owner as an
open question, in ONE pass rather than three.

**Proposal A4-b — "latest deployed ≠ release content" as an explicit Recon row.** MLIT is the
internal env and carries unreleased work; reading a flow from it describes a path PROD does not
have. *Eval*: a trace taken from MLIT must be labelled with the env it came from.

---

## A5 — Sweep / file sweep

**Finding: my ticket-lookup sweep was pure noise, and the search endpoint is dead.**

みや asked which ticket reduced a document's file size. My keyword sweep over recently-updated
issues matched `MB` **inside "Pembatalan"** and returned 25 irrelevant rows. Separately,
`search.json` returned `0` for every term — a control query on a term I knew existed returned a
blank body, proving the endpoint unusable on this Redmine rather than the terms being absent.

What actually worked: fetching the ~18 tickets we had touched and reading their subjects. The answer
was **#272943**, whose subject says *"Loading Lama"* and never says *size* — the size reduction is
the mechanism, not the wording. So keyword search would have failed even with a correct regex.

**Proposal A5-a — ticket-lookup helper keyed on OUR work, not on Redmine search.** Given a
description, fetch subject + last-journal + branch commit subjects for every ticket in
`active.txt` + `active-archive.txt` + the current baseline, and match on **word boundaries**.
*Eval*: "the ticket that reduced document file size" must return #272943 — which requires reading
the commit subject (*"Adjust DPI untuk pelan"*), not the ticket subject.

**Proposal A5-b — record that `search.json` is dead** on this Redmine (`172.16.90.169`), so no
future session spends turns on it. One line in the Redmine notes.

---

## Axis coverage

| Axis | Swept | Finding | Proposals |
|---|---|---|---|
| A1 agentic system | ✓ | gate-with-no-decision · unguarded worktree twin | 2 |
| A2 quest workflow | ✓ | config fix has no completeness definition | 2 |
| A3 debugging | ✓ | Flowable schema map missing | 1 |
| A4 etanah | ✓ | recency mistaken for provenance | 2 |
| A5 sweep | ✓ | keyword sweep noise · dead search endpoint | 2 |

**9 proposals filed**, each naming its eval case. Highest-yield: **A1-a** (the only one that would
have caught a defect I shipped tonight without noticing) and **A2-a** (the only one that closes a
wound which has already cost a rework and a stale PROD row).
