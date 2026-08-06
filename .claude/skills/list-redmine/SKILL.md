---
name: list-redmine
description: Print みや's live Melaka ticket board from Redmine — his own list ranked by the 3-DAY RULE, colleagues' tickets on request. Triggers — "/list-redmine", "list redmine", "my tickets", "the board", "show my tickets", "what's on my plate", "ticket list", "open tickets", "redmine list", "refresh the board", any ask for the current open-ticket standing. Also fires automatically at session boot via open-quest-surfacer.js; this skill is the on-demand path.
allowed-tools: Bash, PowerShell, Read
---

# list-redmine — the live Melaka ticket board

Born via `core/forge.js` 2026-08-05 · nod: みや *"I don't trust you, create an
invokable skill. /list-redmine"*

## ACTION (the whole procedure)

Run the board and **paste its output verbatim**:

```bash
node quest/redmine-board.js
```

Flags — add ONLY when みや asks for that view:

| Flag | Effect |
|---|---|
| *(none)* | みや's list only, ranked. **This is the default and the boot shape.** |
| `--tracking` | also print colleagues' open tickets |
| `--all-statuses` | re-include `Resolved` / `Verified` |
| `--all-trains` | re-include other teams' release trains (SPOC etc.) |
| `--json` | raw rows for other tooling |

## 🚨 The one hard rule

**Paste the script's output. Do not retype a cell, do not re-sort, do not
re-word a subject, do not "improve" a State value.**

みや 2026-08-05: *"I need to make the table deterministic so that it will
CONSISTENTLY load the same way."* Every column I hand-fill is a column that
renders differently each boot — the one time `State` was mine to write, it did.

Narrative around the table is fine — a flag, a suggestion, a warning. Altering
the table is not.

## Where each column comes from

| Column | Source | Never |
|---|---|---|
| `#` · `Subject` · `Days` · `Due date` | live Redmine API | `quest/active.txt` — it is working memory and it rots |
| `State` | `board_state=` in the ticket's `active.txt` block, else `Phase <n>` from `phase=`, else `Not drafted` | my recollection of where we stopped |
| `Train` (tracking table) | `/versions/<id>.json` → `project.name` | `fixed_version.name` — it returns only `1.5.1`, and two live versions share the name `1.0.13` |

## Scope — what the board sweeps

Four unioned passes, deduped by issue id:

| Pass | Purpose |
|---|---|
| `cf_17=Pelupusan` (Melaka project, 7 trackers) | the Module filter |
| `cf_77=Awam Pelupusan` (same scope) | AWAM-side Pelupusan work |
| `assigned_to_id=me` (same scope) | safety net — a mislabelled Module must never hide his work (#273919 is `Module=Awam`) |
| `assigned_to_id=me` **unscoped — no project, no tracker** | cross-state safety net. A ticket on another state's project would otherwise be invisible; it is surfaced on its own 🚨 line, never merged into the ranked list |

Trackers: eSOKONGAN · Internal Issue · Internal Issue (PROD-CR) · Internal Issue
(PROD) · Internal Issue (Permanent Fix) · Internal Issue (MA Fix) · Data Patching
(PROD).

## Ranking — the 3-DAY RULE

Descending by days elapsed since `start_date`; tie-break on the nearer due date.
Difficulty is **not** the sort axis — secondary column on request only.
Full spec: `Feature/Session-Briefing-System/session-briefing.md`.

## Editing the board's behaviour

Three constants in `quest/redmine-board.js`, each changed only on みや's word:

| Constant | Meaning |
|---|---|
| `ADOPTED_AS_MINE` | tickets he has claimed even though Redmine shows another name. Local view only — Redmine is never written |
| `FOREIGN_TRAINS` | release-train projects owned by other teams, excluded by version→project |
| `HIDDEN_STATUSES` | `Resolved` / `Verified` — delivered, sitting with the BA |

**Every exclusion prints the rows it removed, by number.** A filter that goes
wrong must be visible on the next boot rather than silently shrinking his board.
Never add a silent cap.

## When this fires

- **Automatically at boot** — `.claude/hooks/open-quest-surfacer.js` executes the
  script as part of the Session Briefing. This skill is not needed then.
- **On demand** — `/list-redmine`, or any trigger phrase above.

## Eval

`domain/list-redmine/eval.js` — 13 assertions: the column contract, the banned
columns (`Deadline` · `Start` · `+3d` · `Days left` · "Redmine due"), the
no-year date shape, adoption, no-silent-caps, and byte-identical repeat runs.
A network failure reports SKIP; a crash reports FAIL. Last run: 13/13.

## Trifecta

| Axis | Declaration |
|---|---|
| **Goal** | みや sees his true open standing, ranked his way, identically every time |
| **Guardrails** | output pasted verbatim never composed · every exclusion named · Redmine read-only |
| **Grounded** | live Redmine API + `quest/active.txt` on disk — no model memory in any cell |
