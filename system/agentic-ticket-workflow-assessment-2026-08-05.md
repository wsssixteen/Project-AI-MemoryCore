# Agentic Ticket-Solving — Assessment & System-Design Proposals

> Written 2026-08-05 at みや's instruction, from a single overnight run: 5 eSOKONGAN tickets
> (#273455 · #273460 · #273621 · #273919 · #273921) taken through four independent passes.
> Everything below is measured from that run. No projections.

---

## 1. What actually happened

| Pass | Shape | Agents |
|---|---|---|
| **Sweep** | one familiar per ticket, cold | 3 (the new tickets only) |
| **Blind quest** | one familiar per ticket, hard-banned from reading our own docs | 5 |
| **Adversarial audit** | one familiar per ticket, told to REFUTE, banned from the blind doc | 5 |
| **Fit-check** | one familiar per ticket, "does the conclusion answer what BA asked?" | 5 |

**Result: 5 of 5 tickets had something load-bearing overturned.** Not refined — overturned.

| Ticket | What the earlier pass concluded | What survived |
|---|---|---|
| 273919 | bind the panel to `#{mb.urusan.nama}` | REJECTED — renders the breadcrumb string; BA's *handwritten* expected text is a different form. Ternary instead. |
| 273621 | teach the report to accept `GP_L1E` | then "invert to data-side" (also wrong — `adalahMigrasi` means Daftar-Masuk urusan, not the migration batch); real candidate is a **format** problem, kod and format confounded |
| 273460 | disabled control at `:1350` | REFUTED — control is clickable, the persisted VALUE is wrong. Different bug, different fix. |
| 273455 | fix `PelupusanService:4992` | that is Defect 2; **BA's scenario is Defect 1** (`PelupusanSpocService:235`). Fixing `:4992` alone changes nothing she would see. |
| 273921 | template fix | correct, but the doc named the wrong screen, omitted the mandatory regenerate step, and the 18/18 experiment proves the *class*, not this document |

**Three of those overturns were of claims I had personally verified and reported as fact.**

---

## 2. Failure classes — named, with the instance that proves each

### F1 · Evidence-dimension blindness *(recurrence — first logged 2026-05-14, QA-260302)*
On #273919 I read BA's journal TEXT and never opened the PNG sitting in `0. Brief/`. The image
carried a red arrow and BA's handwriting: `Maklumat Pajakan Tanah Perizaban`. That single artifact
settled a wording question three passes had been arguing about. **The file was there the whole time.**

### F2 · Scope-unstated statistics
I ran a PROD query, got `officer 9091 rows / 3 with key` vs `SYSTEM 41 / 30`, and reported it as a
correction to a familiar. Correctly scoped — application-level, and only where the public actually
entered something — the real figure is **17 applications, 9 broken**. My number was *arithmetically
correct and analytically meaningless*: 9052 of those rows were counter-only applications with no
portal submission at all. A verified number with an unstated unit is not evidence.

### F3 · Citation-correct, mechanism-wrong
Every audit found this shape: a real `file:line` attached to a causal story that does not hold.
`:1350` exists and does disable the control — but disabling is by design. Checking that a citation
resolves is a *different act* from checking that it explains the symptom.

### F4 · Convention inferred from a same-named variable
`adalahMigrasi` reads like "is a migrated record". It is `urusanKod ∈ {DMPRBB, DMPRU, DMPRZ}`.
An audit built a whole fix-inversion on the name; I repeated it to みや before reading `:4891`.

### F5 · Sibling-doc contradiction with no authority marker
By 03:45 each ticket had 3-4 docs carrying opposite verdicts and no statement of which one wins.
A cold reader next week would have hit `-independent.md §10` bolding a recommendation the main doc
had already withdrawn.

### F6 · Orphaned child agents
Familiars spawned their own children. Parents returned and notified; children kept running and kept
spending. I reported "all five done" from notifications while みや's panel showed three still live.
**A completion notification describes one agent, not its subtree.**

---

## 3. Proposals — system-design lens

Ordered by (evidence strength × cheapness). Each names its eval case from tonight.

### P1 · Evidence-manifest gate — DETERMINISTIC, build first
**Trigger**: any Recon/root-cause emit on a ticket whose Task folder has a `0. Brief/`.
**Rule**: emit one line per file in that folder — *including every image and video* — stating what it
showed. A file that was listed but not opened must say `NOT OPENED`.
**Why a hook and not a rule**: `multi-dim-evidence-gate` already fires as an advisory reminder and
was ignored tonight on the one ticket where the image was decisive. A hook can count files on disk
against lines in the emit; that is mechanical, and mechanical is the only kind of rule that survives.
**Eval**: #273919 — the gate must block a Recon that never opened `- PPJK - Isu.png`.

### P2 · Scope declaration on every statistic
**Rule**: any count in a doc or chat carries its unit and filter inline — `17 applications (PT, PROD,
public-submitted, 2026-06-01+)`, never a bare `9091 rows`.
**Eval**: #273455 — 9091/3 vs 17/9 must be distinguishable at a glance.

### P3 · Doc-authority header — cheap, high leverage
**Rule**: when a qa_doc has siblings, the main doc opens with `THIS FILE IS AUTHORITATIVE`, lists the
inputs, and states that it wins on conflict. Siblings get a superseded banner.
**Deterministic check**: if `QA-*-independent.md` or `-audit.md` exists, the main doc must carry the
header. One `Test-Path` + one grep.
**Eval**: #273919 — `-independent.md` still bolds a withdrawn recommendation.

### P4 · Mechanism-vs-citation split in CODE-CHECK
**Rule**: a root-cause claim carries two separate ticks — `cited ✓ (file:line)` and
`mechanism ✓ (what I traced to prove this line produces THIS symptom)`. A bare glyph is a claim, not
evidence — the same rule みや set on 2026-07-27 for blast-radius, extended to causation.
**Eval**: #273460 — `:1350` would pass `cited` and fail `mechanism`.

### P5 · Name-vs-contract check on any inferred convention
**Rule**: before asserting "the codebase's convention is X" from an identifier, READ its definition.
**Eval**: #273621 — `adalahMigrasi` at `:4891`.

### P6 · Agent-subtree accounting
**Rule**: a parent's completion notification is not a subtree completion. Track spawned children;
report subtree state. Kill orphans whose parent has already reported.
**Cost tonight**: three agents ran 40+ minutes past the point anyone would read their output.

---

## 4. The bigger question — automating this more accurately

**What the run proves**: accuracy came from *independence*, not from more compute. Every material
catch came from a reader who could not see the previous reader's reasoning. Adding a fifth pass of
the same shape would have added cost, not accuracy.

**What it also proves**: the pipeline has no convergence test. Tonight ran four passes because four
were specified — not because a criterion said "still unstable". #273621's diagnosis flipped in all
four. #273919's flipped twice. Nothing in the system noticed that instability and asked for another
round, and nothing would have stopped at two if two had been enough.

**Design direction — a `/sweep` Power with a stability criterion** (todo Q1 already carries the
`/sweep` build; this is the missing spec):

```
  intake ──► blind quest ──► adversarial audit ──► fit-check ──► STABLE?
              (no shared context between any two)                 │
                                                          ┌───────┴────────┐
                                                    verdict unchanged   verdict moved
                                                    2 passes running    │
                                                          │             ▼
                                                          ▼        another blind pass
                                                     hand to みや    (different lens)
```

- **Stability, not pass-count, is the exit condition.** A ticket whose root cause moved in the last
  pass is not ready, however many passes it has had.
- **Controller verification between waves is non-negotiable** — tonight every wave produced at least
  one confidently-wrong claim that only a direct read or query caught. Cheap-model output is data.
- **The four lenses are not interchangeable.** Blind = independent derivation. Adversarial = refute.
  Fit-check = does it answer the ASK. Each caught a class the others missed; dropping any one loses
  its class.

**Honest limit**: none of this makes a ticket *solvable* without a runtime walk. Every conclusion
tonight is static — code, DB rows, and artifacts. #273921's last 10% needs a document regenerated on
stg1; #273621's needs one local render; #273460's needs BA's video re-walked. **The pipeline can
reach "Apply-ready with a stated test", never "verified fixed".** Designing as if it could is how
we would ship a confident wrong fix at scale.

---

## 5. File-sweep note

`0. Brief/` folders are read inconsistently — text first, images sometimes, video almost never. Of
the five tickets tonight, **the decisive artifact was a non-text file on two of them** (#273919's
annotated PNG, #273460's unopened `PLPS_Pembetulan_simulated.mp4`, still unwatched at time of
writing). P1 addresses this directly; it is the single highest-yield change on this list.

---

---

## 6. This is now a standing DE step — not a one-off

みや, 2026-08-05: *"add this rule into our domain expansion. So that I don't have to always tell you to
SPECIFICALLY try to search for points to improve our agentic system, our workflows, our debugging
efficiency & accuracy, our etanah issues solving, our sweep."*

Built the same session:

| Piece | Where |
|---|---|
| **DE Step 7.5 — Improvement Sweep**, five fixed axes, mandatory every DE | `Feature/Domain-Expansion/expansion-protocol.md` §Step 7.5 |
| step wired into the orchestrator + step-line | `.claude/skills/domain-expansion/SKILL.md` |
| **`type=proposal`** lane so ideas are *ruled on*, not admired | `core/slips.js` → `system/slip-dashboard.md` § 💡 Open proposals |

**The five axes** (sweep all, every time; an empty axis is stated, never silent):
**A1** agentic system · **A2** quest workflow · **A3** debugging efficiency + accuracy ·
**A4** etanah issue-solving · **A5** sweep / file sweep.

**Why a separate `proposal` type rather than reusing `upgrade`**: `upgrade` means *shipped*. An idea
filed as shipped is invisible as an open decision — which is exactly the failure that cost two days on
2026-07-22, when an enforcement row was written "parked" and nobody ruled on it. The dashboard now
states the escalation explicitly: **a proposal older than 14 days with no ruling is itself a finding.**

### Tonight's brainstorm — 7 rows filed for the weekly audit

| Axis | Proposal | Eval case |
|---|---|---|
| A5 | Evidence-manifest gate — block a Recon whose `0. Brief/` has unopened files | 273919's annotated PNG |
| A3 | Scope declaration on every statistic (unit + filter inline) | 9091 rows vs 17 applications |
| A2 | Doc-authority header when sibling docs exist | 273919's contradicting `-independent.md` |
| A3 | CODE-CHECK tick split: `cited` vs `mechanism` | `:1350` passes one, fails the other |
| A4 | Name-vs-contract check before asserting a convention from an identifier | `adalahMigrasi` |
| A1 | Agent-subtree accounting — notification ≠ subtree complete | 3 orphans, 40 min |
| A1 | `/sweep` exits on **verdict stability**, not pass-count | 273621 moved in all 4 passes |

**The quality bar that matters most**: prefer mechanical over prose. The multi-dimensional-evidence
rule has existed as prose since 2026-05-14 and was ignored tonight on the one ticket where the image
was decisive. A5 is the mechanical version of that same rule, and it is the highest-yield row here.

---

*Cross-refs: `system/slips.jsonl` (this session's rows) · `.claude/CLAUDE.md` §Delegation Economy ·
`main/todo.md` Q1 `/sweep` · `Feature/Domain-Expansion/expansion-protocol.md` §Step 7.5 ·
`Feature/Forge-Self-Improvement-System/improvement-audit-log.md` (detached 2026-05-31).*
