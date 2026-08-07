# Improvement Sweep — 2026-08-07 (DE Step 7.5)

Session: 2026-08-06 19:41 → 2026-08-07 09:0x. 273956 PROD patch shipped; 6 tickets taken to Rubric.
Every claim below carries the instance that proves it.

---

## A1 — Agentic system

**Failure class: `fan-out-scoped-to-artifact-not-to-outcome`.**

Instance: the first sweep spawned 8 familiars whose prompts each said *"READ pass only — do NOT
propose fixes, do NOT trace code."* They executed that faithfully (~690k tokens) and returned 8
correct summaries. Not one ticket could change phase, because the contract forbade the work that
changes phase. みや's question — *"why are all those tickets still phase 0?"* — was the first signal.
The second run, same tickets, same night, scoped to Scout→Recon→Rubric, produced 6 root causes and 6
fix addresses.

The cost is not the 690k. It is that **the delegation plan named the model tier and the output schema
but never the target STATE of the work**. Delegation Economy already forces "cheapest model that is
ENOUGH"; nothing forces "scope that is ENOUGH".

Second instance, same axis: parent agents notified complete while children still ran (observed
2026-08-05 and again tonight — 6 familiars, staggered completion over ~33 min). A parent's
notification says nothing about its subtree.

## A2 — Quest workflow

**Failure class: `qa-doc-written-to-a-path-that-does-not-survive`.**

Instance: all seven quest docs produced tonight were written to
`projects/coding-projects/active/QA-<n>/` inside a **worktree**. `.gitignore:9` ignores `projects/`.
`git add -A` exits **0** on an ignored path, so the commit succeeded, the push succeeded, and the
commit message asserted the docs were banked. `git ls-files --error-unmatch` at DE step 2c returned
**7 of 7 untracked**. `worktree-cleanup-boot.js` removes merged worktrees at the next boot — the
window between "reported saved" and "deleted" was one session.

This is a **repeat**. `main-memory.md` carries it dated 2026-07-28 ("a findings doc is only saved if
it is saved where it survives"), and `reference_multi_ticket_sweep.md` was written the same week. The
knowledge existed; nothing mechanical checked it.

## A3 — Debugging efficiency + accuracy

**What worked, and should be made standing: controller re-verification.**

Six familiar reports, six spot-checks by the main loop, **three corrections**, one of them fatal:

| Ticket | Familiar's claim | Controller check | Result |
|---|---|---|---|
| 273921 | "8 templates, 7 block-level, only PPTPB odd" | python census over all MLK `.docx` | **16 templates, 8 run-level** — argument dissolved |
| 273460 | fix `bd827a1bb6` on master + 1.3.1 only | `git branch -a --contains` | already on `mlk/int-env` |
| 273460 | test login sanarimah | `umm_a_tgsn` live read | nurul.izza@ — sanarimah's rows Selesai |
| 274182 | 5 containers, MAX picks wrong | direct PROD query | confirmed exactly |
| 274136 | duplicate EL at `:720`/`:782` | direct file read | confirmed exactly |
| 274318 | module = etanah-common | `find -not -path "*/target/*"` | confirmed exactly |

Cost per check: one command. Yield: 50% correction rate. The checks that confirmed are as valuable as
the ones that corrected — they are what makes the confirmations reportable as fact.

**Counter-instance (mine, not a familiar's)**: I seeded 274182's familiar with *"same shape as
#269169/#267382"* from memory. It was wrong — that is the Word chain, this is Jasper. A wrong hint in
a prompt costs more than no hint, because the agent spends tokens refuting it.

## A4 — Etanah issue-solving

Three reusable facts surfaced that are **not yet written back** (Phase-2 work per the
distil-at-close rule, listed here so they are not lost):

1. `DATABASE.md §17.3` overstates its scope. It says `STATUS_PENYEDIAAN_CETAK`/`_SELESAI` have "zero
   rows ever in Melaka PROD" — true for the Surat Keputusan family it names, but `PLP_SRT_YB` on
   aplikasi 3424732 carried **1979 = CETAK** tonight. Also `NULL` is not only "peraku completed"; it
   is the resting state of a rolled-back penyediaan document.
2. The document-regeneration contract, now verified in source: `JOIN adk.status s` is an INNER join
   (`AppDokumenKeluaranRepository.java:139-144`), so a NULL-status ADK row is invisible to **every**
   `findBaruOrSedia…` variant → the template survives → `processTemplateList()` regenerates.
   `appTugasan` is in the SELECT projection only, never the WHERE — a tugasan rollback alone does not
   free a stored document.
3. "Papar pelan lama" is **two** distinct mechanisms, not one family: the Word chain
   (`findByMedanAndMedanPk` unordered + `get(0)` — 267382/269169) and the Jasper chain
   (`AppDokumenKeluaranRepository.java:420` MAX(createdDate) container pick — 274182). BUG-BESTIARY
   currently implies one.

## A5 — Sweep / file-sweep

**Failure class: `decisive-video-left-unwatched`.**

Instance: three of tonight's six tickets had their answer inside an unopened `.mp4`. 273460's entire
defect set (which of 4 defects reproduce, and where) came off two videos nobody had played —
including a 93 MB PROD recording. 274136's strongest evidence was a frame showing the field already
blank after Seterusnya→Sebelum with **no save**, which is what pinned the defect to the view layer.
274318's click sequence was only visible on video.

The first sweep pass explicitly told familiars *"note any .mp4 by name + size but do NOT extract
frames."* Cheap in the moment, and it is precisely the evidence class that settles UI defects — the
same lesson already written on 2026-08-05 ("only a picture or a recording testifies about what the
officer could SEE or CLICK").

---

## Proposals logged for weekly audit

Each carries its eval case. Logged via `core/slips.js --type proposal`.

| Axis | Proposal | Eval case |
|---|---|---|
| A2 | **qa-doc durability gate at DE** — `git ls-files --error-unmatch` (or an existence check at the OneDrive main-repo path) for every `qa_doc=` named in `active.txt`; BLOCK the close on any that resolves only inside a worktree | tonight's 7 docs must FAIL pre-copy and PASS post-copy |
| A1 | **fan-out contract must declare the target STATE** — a delegation plan gets a `target phase` column, and a familiar prompt containing a work-forbidding clause ("do NOT trace code") while the ask was a sweep/quest raises a warning | tonight's first prompt set fails; the second passes |
| A3 | **controller-verification row is a required emit** at any fan-out synthesis — `verified N of M claims, C corrected`, each with the command run | tonight would show 6/6 checked, 3 corrected |
| A5 | **extend the brief-manifest gate to video** — any `.mp4` in `0. Brief/` with no content line blocks the Rubric emit, not just images/PDFs | 273460 first pass fails, second passes |
| A1 | **subtree-aware completion** — never report a fan-out complete on parent notifications alone; check for live descendants first | the 2026-08-05 instance where 3 agents were still spending |
