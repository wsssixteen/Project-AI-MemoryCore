# Agentic / Ticket-Workflow Assessment — 2026-08-12

Session shape: short, single-arc — QA-265537 stranded `etanah-common` edits removed (git hygiene + quest-file save). No debugging, no fan-out, no etanah code trace.

## Five-axis sweep

| Axis | Finding (with the instance that proves it) |
|---|---|
| **A1 — agentic system** | ⏭ No delegation/fan-out this session. Solo git + file work. |
| **A2 — quest workflow** | **Quest files have two different correct homes and nothing steers the edit to the right one.** `active.txt` is tracked and exists in BOTH main and the worktree; `qa_doc` is untracked/confidential and lives ONLY in main. This session I edited main's `active.txt` first (wrong copy — the worktree is what commits), then had to reconcile. They differed by exactly one line (my own edit) so it was cheap, but the failure mode is real: a diverged `active.txt` between the two copies is invisible until you diff them. Instance: main `active.txt` 74068 B vs worktree 74663 B pre-edit; the direct diff was a single line. |
| **A3 — debugging efficiency + accuracy** | **"Is this fix needed?" was almost answerable wrong from the qa_doc alone.** The QA-265537 qa_doc oscillated — it later argued the read-tolerance path was *necessary* for 191k legacy rows. The authoritative signal was elsewhere: Redmine "Resolved 100% by Aaron Loh" + the shipped commit on `mlk/qa/265537` (awam save-path `e38f1e3f81`). Verifying against what SHIPPED, not the investigation narrative, is what kept the revert correct. Instance: qa_doc:371 rejected-candidate-4 vs qa_doc later "read-tolerance no longer dismissible". |
| **A4 — etanah issue-solving** | Same as A3 — the durable etanah lesson is that a closed ticket's *shipped* fix (committed branch + Redmine resolver) overrides its own qa_doc's mid-investigation reasoning when deciding whether stranded local code belongs. |
| **A5 — sweep / file sweep** | ⏭ No brief/file sweep this session. |

## Proposals logged (weekly-audit feed)

1. **A2** — a DE/quest guard that detects when `active.txt` differs between the main repo and the active worktree and surfaces the one-line-or-more delta at session-start or DE-open, so quest-file edits landing in the wrong copy are caught before commit. Eval case: this session's main-vs-worktree `active.txt` one-line drift, which was only found because I diffed the two copies by hand.
2. **A3/A4** — an "is-it-shipped" check helper: given a ticket + a stranded local diff, report the Redmine resolver/status + the committed branch(es) carrying the fix, so "do we still need this code" is answered from shipped truth not the qa_doc narrative. Eval case: QA-265537, where the qa_doc argued for a path that never shipped.
