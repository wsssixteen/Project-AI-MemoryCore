# Current Session

## 2026-08-05 15:00 → 22:06 — BASELINE 1.3.1 shipped end-to-end · 4 workflow refinements from miya

**A full release, PLAN → mlk/master, with six recon verdicts corrected before they could ship.
Then four workflow fixes miya specified while the build ran. Both bumps and the merge are on
origin; `mlk/master` = `9ddeb07406`.**

### ▶▶ NEXT SESSION — START HERE

| # | Thing | State |
|---|---|---|
| 1 | **Baseline 1.3.1 COMPLETE** | `origin/mlk/master` = `origin/mlk/release/1.3.1` = `9ddeb07406`, 12/12 tickets, verified post-push. Undo tag `ruri/pre-master-merge-1.3.1` @ `fdfddc602b` — **local only** |
| 2 | `#270900` PROD `UPDATE` | NOT ours — someone else runs it. PROD `ind_tgsn` SSMW/BPRZ tgsn_id 14822 still `KPT`, needs `KPT-KPPD-PPD`. Blast radius measured **0** in-flight tasks |
| 3 | ⚠️ **v5-vs-v6 flowable, unresolved** | sftp holds a colleague's **v6** (452,783). Staging + the ticket ran **v5** (451,836). v6 DELETES the `Tamat` endEvent so PLPS loops back to PJTLT. Never tested outside MLIT; `#242553` has `fixed_version=NONE`. **Ask the colleague: BAQA-passed anywhere? ships with 1.3.1?** |
| 4 | 4 refinements shipped | see below — all in the worktree, none stranded in main |
| 5 | ENV-PARITY + `.sql` rules are PROSE ONLY | no hook enforces either. By the 07-22 lesson that makes them wishes. Candidate for a gate |

### Baseline 1.3.1 — what the recon got wrong

`redmine-recon.js` returned 13 verdicts; **6 were wrong** and one would have shipped 5 unrequested tickets.

| Recon said | Truth |
|---|---|
| 6× "commit found by git log --grep (no branch)" | all pointed at **`mlk/int-env` MERGE commits** — merging those pulls all of int-env into the baseline |
| #272881 → "ask BA, no branch" | answered myself: `bd827a1bb6 Ref #272881 #273201` rides inside `273201v3` |
| #273763 / #273576 → plain CODE-BRANCH | **stacked training chain** — `mlk/training/273763` is 16 ahead and drags #273025 · #272917 · #272464 · #270224 · #270091, all `fixed_version=NONE`, 4 of 5 never in any release |

Resolution: 7 branch merges (script) + **3 cherry-picks** (273763 · 273576 · 273691 — messages and authorship preserved verbatim), because `set-tickets` requires the branch on origin and those three were deleted or contaminated. `verify` therefore shows 7 rows, not 10; the other 3 were hand-checked SHA-by-SHA.

Delta I authored: **`pom.xml` only, 2 insertions 2 deletions** — `1.0.143-MLK → 1.1.12-MLK` and `1.3.0 → 1.3.1`.

### The four refinements (all miya-specified)

| # | Fix | Where | Enforced? |
|---|---|---|---|
| 1 | **Commit subject = `#<ticket>: <msg>`** | `release-prep.js cmdBumpCommon` refuses without `--ticket` (3/3 behavioural tests) | ✅ mechanical |
| 2 | **SQL verified on the target env at Phase A**, with blast radius | `release-mlk-plp` SKILL §3b | prose |
| 3 | **§E2 post-deploy comment** — flowable path + SQL lines, deterministic slots, omit-when-none | `release-mlk-plp` SKILL §E2 | prose |
| 4 | **ENV-PARITY row at Phase 1 close** + **scripts are `#<ticket>.sql`** | `quest` SKILL | prose |

Naming reconciled across both files: `#<ticket> sql.txt` → **`#<ticket>.sql`** (miya: it should open as SQL, not text).

### Behaviour

**The costly shape: I called v6 "latest" from MLIT alone and treated that as "belongs in this release".**
Latest-deployed ≠ release content — MLIT carries unreleased work. I then refreshed the knowledge
folder to v6, reverted it to v5, and it turns out a colleague had put v6 on sftp deliberately. Three
positions on one artifact in one evening; the census I never ran was *who put it there and why*.

Also: miya told me in his FIRST message that `Documents\` was the FileZilla/sftp copy. Hours later I
told him I could not verify sftp — the file had been on disk the whole time (`reask/redundant`).

And I edited `release-mlk-plp/SKILL.md` in the **main repo** while the session runs in a worktree
where the earlier edits lived — split-brain for one turn, caught by my own marker check, re-applied
to the worktree, main reverted to HEAD.

**Slips**: `commit-message-missing-ticket-number` · `sql-delivery-not-verified-on-target-env` ·
`worktree-stranded-delivery` · `env-parity-not-checked-at-close` · `reask/redundant`.

## 2026-08-04 23:55 → 2026-08-05 04:00 — 5-TICKET FOUR-PASS SWEEP · every ticket's conclusion overturned

**miya asked what he could close in 30 minutes. The honest answer was "I can't tell you" — three of his
six open tickets had never been retrieved. So the night became a sweep, and then a two-goal verification
run over it. 20 familiars, four independent passes per ticket. 5 of 5 tickets had a load-bearing claim
overturned; three of those were claims I had personally verified and reported to him as fact.**

### ▶▶ NEXT SESSION — START HERE

| Ticket | State | First step on resume |
|---|---|---|
| **273919** | **Apply-ready** | branch off `mlk/master`, one line at `AwamSemakanKewujudanRizabForm.xhtml:41` (ternary — NOT `urusan.nama`) |
| **273921** | **Apply-ready** | Word: move `syaratKelulusan` control to its own paragraph, THEN delete+regenerate the doc. PRBB bundling = miya's call |
| **273460** | H+3 closest | TRG blast-radius check; app has moved to `-PPD-`; BA tests `mlk/release/1.3.0` not int-env |
| **273455** | blocked on discovery | **pin Defect 1's write site** (`PelupusanSpocService:235` area) — open since ADHOC A8 |
| **273621** | blocked on one test | one local render of a migrated pelan → settles PDF-vs-PNG |

All five qa_docs now carry a `RESUME POINT` section and an authority header.

### The four-pass shape (this is the finding worth keeping)

`sweep → blind quest (no access to our docs) → adversarial audit (told to refute) → fit-check (does it
answer BA's ask?)`, with a controller read/query between waves. Each lens caught a class the others
missed. Full assessment + 6 proposals: `system/agentic-ticket-workflow-assessment-2026-08-05.md`.

### What got overturned

| Ticket | Was | Is |
|---|---|---|
| 273919 | bind panel to `#{mb.urusan.nama}` | REJECTED — renders the breadcrumb string. BA's **handwritten** annotation on the PNG wanted `Maklumat Pajakan Tanah Perizaban`. Ternary; BPRZ untouched |
| 273621 | accept `GP_L1E` → then "data-side, 369 rows are the defect" | both wrong. `adalahMigrasi` = `{DMPRBB,DMPRU,DMPRZ}` (Daftar-Masuk urusan), and our A-series never reaches those lines. Leading candidate: kod is confounded with **format** (pdf vs png) — unverified, needs a render |
| 273460 | disabled control | audit said clickable-value-wrong, I confirmed from 8 PROD rows and told miya — then the **video** showed the radio genuinely dead. Both true: saves succeeded, radio stuck |
| 273455 | fix `:4992` | that is Defect 2. BA's scenario is Defect 1. Her repro row has zero premium keys, so `:4992` never fired on it |
| 273921 | template fix (88%) | mechanism now proven 18/18 on local artifacts; wrong screen name corrected; regenerate step promoted to mandatory |

### Behaviour

**The decisive artifact was a non-text file twice** — 273919's annotated PNG and 273460's 93 MB video,
both sitting unopened in `0. Brief/` while three passes argued. That is the 2026-05-14 multi-dimensional
evidence lesson, unlearned. Proposal P1 (evidence-manifest gate) is the mechanical fix.

Also: my `9091 rows / 3` PROD statistic was arithmetically right and analytically meaningless — correct
scope was **17 applications, 9 broken**. And I reported agents "done" from completion notifications while
three were still live in miya's panel, burning tokens; a parent's notification says nothing about its
subtree.

**Fixed mechanically this session**: PROD SELECT no longer prompts (`prod-db-confirm` v1.1, write-gate
retained, 3/3 tests) · live postgres MCPs allowlisted in committed settings (the old entries named
decommissioned UAT/FAT) · `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` cleared — it had been silently overriding
every `model: opus` I passed.

**Slips**: `reask/rambling` · `reask/verbose` · `handed-miya-a-query-i-could-run`.

### Built AFTER the DE close — DE Step 7.5 IMPROVEMENT SWEEP (commit `087b009`)

miya, on having to ask for the improvement assessment two goals running: *"add this rule into our
domain expansion. So that I don't have to always tell you to SPECIFICALLY try to search for points to
improve our agentic system, our workflows, our debugging efficiency & accuracy, our etanah issues
solving, our sweep."*

| Piece | Where |
|---|---|
| **Step 7.5**, mandatory every DE, five fixed axes — A1 agentic system · A2 quest workflow · A3 debugging efficiency+accuracy · A4 etanah issue-solving · A5 sweep/file-sweep | `Feature/Domain-Expansion/expansion-protocol.md` §Step 7.5 |
| step wired into the orchestrator table **and** the step-line so it actually fires | `.claude/skills/domain-expansion/SKILL.md` |
| **`type=proposal`** lane — ideas get ruled on, not admired | `core/slips.js` → `slip-dashboard.md` § 💡 Open proposals (verified rendering at `:91`) |

Output contract: **(a)** a dated assessment under `system/` with a concrete instance per claim, and
**(b)** brainstormed proposals each naming its **eval case**. An axis with nothing to report is stated,
never silent. Weekly audit rules each proposal BUILD/DROP/DEFER; **unruled >14 days is itself a
finding** — the 2026-07-22 parked-enforcement-row failure.

Design note: proposals got their own type rather than reusing `upgrade`, because `upgrade` means
*shipped* — an idea filed there is invisible as an open decision, which is exactly how the No-Resit
row sat parked for two days.

**7 proposals filed** from this session. Highest-yield is A5 (evidence-manifest gate) — the mechanical
form of the multi-dimensional-evidence rule that has existed as prose since 2026-05-14 and was ignored
tonight on the one ticket where the image was decisive.

⚠️ **Sequencing note for the next audit**: this work landed *after* the DE close-out, so DE's own
Step 7.5 never ran on the session that created it. First real firing is next DE.

## 2026-08-04 22:33 → 2026-08-05 03:30 — QA-273300: THREE gates, two of them shipped wrong, third one verified

**I shipped a wrong fix to two env branches, then a second wrong fix, before adversarial familiars
and みや's own questions forced the third. The third is data-validated. The night cost him his sleep.**

### ▶▶ NEXT SESSION — START HERE

| # | Thing | State |
|---|---|---|
| 1 | `QA-273300` Phase 1 closed | commit `ea59cbecee` · `int-env dbbac70260` · `stag-env d9f03a22c8`, all remote-verified |
| 2 | **NOT COMPILED** | no JDK 8 on this machine (`E:\Java\java8` in the toolchain does not exist; only `C:\Program Files\Java\jdk-17`). The mlit build is the first compile |
| 3 | Deploy owed | `./deploy-awam.sh` on `172.16.100.162` → `deployment-scripts/mlit`, branch prompt `mlk/int-env` |
| 4 | Test fixtures | AWAM `samsiah.j85@gmail.com` · `/24` icon HIDE · `/25` icon SHOW |
| 5 | ⚠️ **Those two fixtures cannot distinguish v1 from v3** | neither sits in the leak window. A true differential fixture is stg1 ADK `8546214` or `8549168` |
| 6 | Phase 2 owed | archive hygiene + bounty for 273300 |

### The fix, and why the first two were wrong

BA's Expected: *"Ikon Surat Keputusan akan papar di AWAM selepas selesai tugasan Cetakan Dokumen …
dan … latest version with sign iaitu … yang telah user Peraku."*

| Gate | Predicate | Why it died |
|---|---|---|
| v1 `c7c19c538f` | hide while any ladder tugasan is **active** | leaks during `PTBUT2`, the hand-over step between peraku and cetakan — nothing of mine is active there |
| v2 (unshipped) | require **a** completed `CT_BSC_PLP` | `CT_BSC_PLP` is a SHARED multi-instance tugasan — mlit `PLPS/2026/2` printed 07-01 *and* 07-09, so an earlier print opened the gate weeks early |
| **v3 `ea59cbecee`** | latest completed peraku (`PSSK`/`PSTP`/`PSKN5A`) **AND** a completed `CT_BSC_PLP` whose `trkh_mula` is **after** it **AND** status ∈ {PERAKU, CETAK, SELESAI, null} | validated: stg1 25/25 rows incl. `8546214`/`8549168` (cetakan predates peraku → now hide); mlit `/24` HIDE, `/25` SHOW |

The three peraku kods came from `template.config.json` tugasanList, not from name resemblance —
they cover all 13 urusan that produce these letters.

### The adversarial round — his instruction, and it worked

3 opus familiars, ~440k tokens, one narrow question each. All three refuted the approach.
Two findings held under my re-verification (multi-instance cetakan; the status allow-list is inert —
`CETAK`/`SELESAI` have **zero** rows ever written in prod). **One over-claimed**: "rejection letters
hidden forever" — prod says the only modul-PLP urusan with these letters is PRBB, which *does* define
cetakan. Controller-verification caught the subagent, exactly as the 07-22 lesson says it must.

Three further defects I caught myself before writing code: the application-level fallback cannot tell
"flow has no cetakan" from "cetakan hasn't happened yet"; row-id is not a safe ordering proxy (3 stg1
apps run out of order); and `A_TGSN_ID` is **unmapped** in `etanah-domain 1.0.4-MLK`, which killed the
elegant per-document design outright.

### Behaviour — the expensive part

Slips logged this session: `reask/redundant` (asked him to choose a gate point BA had already stated
verbatim, and which my own doc had already marked answered) · `worktree-stranded-delivery` (wrote the
whole verification pass into the main-repo copy of the qa_doc while running in a worktree — caught by
`quest-deferrals-gate`, not by me) · `name-in-artifact` (`ruri/` prefix on a git tag) ·
`deploy-steps-missing-local-pull` (his local env branch was **55 commits behind**; my card would have
had him deploy a branch without the fix) · `predicate-weaker-than-requirement` ·
`correlation-read-as-mechanism` · `application-scoped-predicate-for-document-scoped-requirement`.

Also: I merged onto `mlk/master` because I ran `git merge` without checking that the preceding
`git checkout -B` had aborted. Undone, never pushed — but that is the second time this session that
not reading an exit code cost something.

Fixed at source, not just logged: `/deploy` skill (name prefix, one-command-per-block card, mandatory
local checkout+pull, and the env-catches-up-to-master delta is no longer treated as a blocker) ·
session-briefing + save-commands + `open-quest-surfacer` (the `Days` column is a bare number; `+3d`
and `Days left` are banned columns).
