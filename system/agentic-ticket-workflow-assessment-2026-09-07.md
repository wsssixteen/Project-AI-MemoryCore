# Agentic ticket-workflow assessment — 2026-09-07 (Baseline 1.5.0)

| Axis | Finding | Instance |
|---|---|---|
| A1 agentic system | Zero delegation needed; deterministic scripts (recon · audit-ticket · discover) did the work inline. Two Stop gates false-fired on a release turn (render-verify, predicate-box) because a .docx was compared for merge resolution. | V2 turn: `git checkout --theirs MaklumatPemohon.docx` → RENDER-VERIFY demanded |
| A2 quest workflow | Release skill promised "exclude with a reason via discover review" with no implementation; `git cherry` misses a one-blank-line drift. Built `mark-equivalent`. Detection side was right: audit-ticket found Aaron's unpushed `7cb2d36297` that a branch-name merge would have missed. | `c27700141e` UNCOVERED; `7cb2d36297` parent = branch tip, only on int-env |
| A3 debugging | Content-equivalence proof by added/removed line-set + docx blob ids took 2 commands and settled the merge with no build cycle. | line-set diff = 1 blank line; blobs 9f933b5726/7ef03c6b15/f65e24df14 |
| A4 etanah issue-solving | Judgment slip: handed miya "confirm with Aaron / Anis" when the diff already answered include. | slip `ask-back/fact-check`; memory `feedback_release_recommend_dont_ask` |
| A5 sweep | ⏭ no ticket sweep this session |

Infra: worktree `.git/worktrees/<name>` admin dir vanished mid-session (OneDrive de-registration class, 2026-09-04 D1); recovered by re-creating gitdir/HEAD/commondir + `git reset`. `*.local.json` missing in worktree for the 4th time → `seedLocalConfigs()` at init.
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
