# Agentic ticket-workflow assessment — 2026-09-07 (DE Step 7.5, session #278585)

| Axis | Finding (instance) | Class |
|---|---|---|
| A1 agentic system | No fan-out this session; single-thread Phase 0 took ~35 min wall-clock incl. video frames, 6 DB queries, git probes. No agent spend. | ⏭ nothing to optimize |
| A2 quest workflow | `redmine-write-gate` blocked two READ-ONLY commands (`ticket-load-verify.js 278585`, `lib/states.js resolve <path>`) — the manifest step (§1a ii) was never run because of it. Commit-approval hook parsed **QA-276549** out of my own reply text and wrote a stray flag; `attachment-ledger-gate` then demanded 276549's files at Stop. `compile-check.js run pelupusan` exits 2 (wants `etanah-pelupusan`) — runbook step 6 names the short form. | gate false-positive ×2 · runbook wording |
| A3 debugging | Zero wrong turns on the diagnosis: file sizes vs the literal settled it before code. Git probe found the Kedah analog (`0576fc1ab6`) in one `git log --grep sizeLimit`. | keep: size-discriminator-first + `-S`/`--grep` probe |
| A4 etanah issue-solving | **Test-data slip**: named `PTMLK/01/L/PLPS/2026/21` (0 `umm_a_jabatan_teknikal` rows) for a panel that renders those rows. The health-check memory existed; the picking query did not carry the child-row count. Fixed in the query this session; not yet mechanical. | test-data-not-from-live-state |
| A5 sweep / file sweep | All 8 attachments opened (2 videos via frames at 0.5/0.2 fps, 4 PDFs 0 annotations, 1 jpeg). Video frames were decisive for the PROD symptom (JKR shown, others absent). | keep |

## Proposals logged (core/slips.js --type proposal)
- A2 redmine-write-gate false positive (logged earlier this session).
- A4 test-scenario health gate: the `Test Scenario` emit must carry a child-row count for the panel the scenario opens (eval: a scenario naming an app whose panel table has 0 rows is blocked).
- A2 commit-approval hook keys the QA from the USER message only, never from assistant text (eval: reply mentioning another QA number must not create its flag).

---

# Agentic + ticket workflow assessment — 2026-09-07 (#278580)

- **A1 agentic system**: hand-composed infra handoffs drift every correction cycle (no gate on chat-pasted text). Instance: #278580 handoff mangled 3x before I built quest/infra-handoff.js. Forward: a Stop hook validating the handoff block shape (DML-only, no SELECT, no file ref).
- **A2 quest workflow**: adhoc to ticketed has no forced re-read of the official Brief. Instance: #278580 BA routing question sat unread in the History journal while I called it done. Forward: a hook blocking resolved/close on a ticketed adhoc until Description, History and attachments are ledgered.
- **A3 debugging efficiency/accuracy**: worktree/main path split stranded the qa_doc (written to worktree, main lacked it until DE copied it). Instance: this session. Forward: a path resolver that always writes projects and etanah-knowledge to MAIN from a worktree session (mirror active-cli suffix strip).
- **A4 etanah issue-solving**: altered permohonan routing not flagged at Phase 0. Instance: #278580 routed Tangguh vs Tolak from a stale keputusan after 2x Alter. Forward: a Phase-0 detector that warns when umm_aliran_kerja has more than 1 process instance or history_init_alter is set.
- **A5 sweep/file sweep**: A5 skip. No multi-ticket sweep this session; single adhoc only.
