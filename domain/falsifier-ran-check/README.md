symptom: #244600 (2026-10-01 to 2026-10-04) — the Rubric wrote "Falsifier C1: a Word no-change save changes body XML beyond rsid/paraId"; the same design shipped as d61fc2e611 with local_test_confirmed=false; the falsifier was never run; BA failed the fix on 2026-10-03; the run took 5 minutes. miya: "you've been ignoring your own fucking alarms"
goal: no etanah fix is committed or passed to BA while a written falsifier is unrun
goal_signal: `node domain/falsifier-ran-check/check.js <QA>` exits 0 before the commit; log.jsonl row outcome=pass for that QA
retention: rotate monthly (log.jsonl) · keep (overrides.jsonl)
footprint: none: no new registration; check.js is required in-process by the compile-gate hook on a `git commit` only, and run on demand by close-phase and ticket-close-block
state-scoped: no, state-agnostic — the quest doc is found through `qa_doc=` in quest/active.txt, the repo through the commit command

# falsifier-ran-check

Two parts, one goal.

| Part | File | When it runs | Effect |
|---|---|---|---|
| Falsifier ledger check | `check.js` | etanah `git commit` (inside `domain/compile-gate`) · `close-phase` Phase 1 step 1 · `ticket-close-block.js --ba` | BLOCK |
| Probe-claim advisory | `falsifier-ran-check.check.hook.js` | Stop, reply says a QA-PROBE was planted and the fix confirmed, with no probe output cited | advisory |

## The ledger (in `QA-<num>.md`)

```
## Falsifier ledger

Fix files: BasePelupusanDokumenForm.java, MlkKertasTemplateForm.java

| # | design | falsifier | cheapest test | status |
|---|---|---|---|---|
| 1 | same-content compare | a Word no-change save changes body XML | Word COM re-save + compare | OPEN |
```

| Status | Meaning | Passes? |
|---|---|---|
| `OPEN` | not run | no |
| `RAN: <what was run, what it showed>` | run, the design held | yes |
| `BROKE: <evidence> → row N` | the falsifier fired, row N is the replacement design's row | only with the pointer; row N is judged on its own |
| `ACCEPTED-RISK: "<miya's words>" miya YYYY-MM-DD` | miya took the risk | yes |
| `SUPERSEDED: row N` | replaced by a live row | yes |

## What blocks

| Kind | Cause |
|---|---|
| `no-ledger` | the doc has a Rubric or a falsifier, or this is a code commit, and there is no ledger section |
| `empty-ledger` | ledger with no rows |
| `open` / `broke` / `bad-status` | a row is unrun, refuted with no replacement, or has no evidence |
| `drift` / `no-fix-files` | a staged file is not on the `Fix files:` line (the design moved after the Rubric). Skipped on a merge commit |
| `stage-separately` | `git add` and `git commit` in one command, or `commit -a` |
| `local-test` | `local_test_confirmed` is not true in quest/active.txt |
| `no-doc` | a code commit for a quest with no quest doc |

Skipped, never blocked: a commit with no ticket number · a ticket with no block in quest/active.txt (a colleague's fix).

## Override

- `local-test` only: miya says in his own message that he tests on the server or skips the local test. Plain words count (2026-10-08, #283751): "I want to test on server", "skip local testing", "BA will check it on staging". Not counted: a question, a negated or "before / unless" sentence, the phrase inside a bracketed option list, a message that names only other ticket numbers, my own text. The token `[risk-ok: <num> <reason>]` still works. It is read from his LAST message (or his popup answer), recorded in `overrides.jsonl`, and counts for 72 hours.
- An OPEN row has no override. Run it, or miya accepts the risk in the row.
- There is no skip token. `[skip-compile-gate:]` does not reach this check.
- Fail-open only on the check's own crash (logged `outcome=error`).

## Commands

- `node domain/falsifier-ran-check/check.js <QA>` — exit 0 clear, 1 blocked
- `node domain/falsifier-ran-check/check.js <QA> --show` — print the ledger
- `node domain/falsifier-ran-check/check.js <QA> --staged <repo>` — add the drift check against that repo's staged files
- `node domain/falsifier-ran-check/check.eval.js` — 45 fixtures, first three are the #244600 replay

log: `domain/falsifier-ran-check/log.jsonl` (ts · qa · ctx cli/commit/note · outcome · kinds · dur_ms).

## Adversarial scenarios (Rule 12)

| # | Scenario | Verdict |
|---|---|---|
| 1 | #244600 as shipped: Rubric + falsifier line, no ledger, local test false | fixture-added (01, 02) |
| 2 | Row left OPEN at commit | fixture-added (03, 40) |
| 3 | `RAN:` with no evidence, or a one-word evidence | fixture-added (05, 06) |
| 4 | I write ACCEPTED-RISK without miya's words | fixture-added (08) for the shape · accepted-risk for a forged quote: the row is printed at the close-phase review gate, where miya reads it |
| 5 | Falsifier fired, row marked BROKE and left | fixture-added (09) |
| 6 | BROKE points at a replacement that is itself OPEN | fixture-added (10) |
| 7 | SUPERSEDED pointing at itself | fixture-added (12) |
| 8 | Free-text status such as "done" | fixture-added (13) |
| 9 | The word OPEN or a pipe inside the falsifier text | fixture-added (14) |
| 10 | Empty ledger from the template | fixture-added (16) |
| 11 | CRLF doc | fixture-added (17) |
| 12 | Ledger only inside a code fence (a quoted example) | fixture-added (18) |
| 13 | A new cycle's ledger section hiding an older OPEN row | fixture-added (19) |
| 14 | Design moved: staged file not in `Fix files:` | fixture-added (21) |
| 15 | Merge commit on an env branch carrying other tickets' files | fixture-added (22) |
| 16 | The override token in my own text | fixture-added (25) |
| 17 | The token echoed by the gate's own help text in a tool result | fixture-added (26) |
| 18 | A token for another ticket, or in an older message | fixture-added (27, 28) |
| 19 | miya's override used to clear an OPEN row | fixture-added (31) |
| 20 | A stale override reused on a rework | fixture-added (32) |
| 21 | Colleague's ticket with no quest block | fixture-added (33) |
| 22 | Quest doc deleted or never written | fixture-added (34) |
| 23 | Worktree session reading a stale active.txt | fixture-added (37) |
| 24 | `[skip-compile-gate:]` used to get past the ledger | fixture-added (40) |
| 25 | `git add . && git commit` so the staged list is empty at check time | fixture-added (42) |
| 26 | BA pass note typed by hand, not through the tool | accepted-risk: the note needs a commit first, and the commit gate is the hard stop |
| 27 | I flip `local_test_confirmed=true` myself | accepted-risk: that is a false claim, covered by `ticket-criteria-gate` Check C; the flip is visible in git |
| 28 | I append a row to `overrides.jsonl` by hand | accepted-risk: a deliberate forgery, not a silent skip; the file is committed, so the diff shows it |
| 29 | A merge to an env branch with no conflict (`git merge`, no `git commit`) | accepted-risk: the ticket branch commit comes first and is gated |
| 30 | compile-gate is unregistered or deleted | handled: `system-audit` reports a ghost hook at boot; check.js still runs at close-phase and the note |

## History

- 2026-07-12 born: Stop advisory for a planted probe never shown firing (narrow).
- 2026-10-04 ledger check added per miya (#244600). Spec preservation: the Stop advisory is untouched (its eval 7/7).
