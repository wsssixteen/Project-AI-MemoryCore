---
name: cross-module-check
description: Use when an etanah finding touches a module we do not own (etanah-common, GIS, SPOC etanah-spoc-hasil, Hasil, etanah-teknikal, reports, DMS, infra/DB), or BEFORE any "not our issue" / OWNED-ELSEWHERE / "common issue" / "GIS issue" / "pass to common" / "bukan isu kami" verdict or hand-off. Triggers - "cross-module", "is this common", "pass to common", "other team", "whose issue", "hand over to", a stack trace whose top frame is my.gov.etanah.common.* or GIS, the cross-module-intake scanner alert.
---

# cross-module-check — prove who owns it BEFORE handing it over

## The Iron Law

```
NO HAND-OFF, NO "NOT OURS", NO OWNED-ELSEWHERE UNTIL STEPS 1-6 ARE EMITTED
```

A failing frame in another module proves **where it broke**, never **who caused it**. Their code runs on what WE send it.
**Violating the letter of this check is violating the spirit of it.**

**Read FIRST**: the module's section in the boundary map
`projects/coding-projects/active/etanah-knowledge/<state>/OTHER-MODULES.md` (entry points · inputs we send · names built from our inputs · where to read the deployed version · known traps). State from `node lib/states.js resolve`.

## The 7 steps (each one a short emit)

| # | Step | Emit | Source of truth |
|---|---|---|---|
| 1 | **Boundary call-site** — where control leaves OUR module | `<our repo>\<path>\File.java:<line>` → `<their class>.<method>()` | OTHER-MODULES.md entry-point row · grep the locator call (`get<X>Service().`, `SpringUtil.lookupBean`) |
| 2 | **Input contract** — every value we hand over: method args, session state (pengguna, negeri, pejabat), DB rows WE wrote that they read | one line each: `Input check: <value> = <what we sent> from <where> → correct / wrong` | debugger photo · server.log · the test permohonan's DB rows |
| 3 | **Name walk-back** — every schema / table / kod / url / id in THEIR error | `<name in error> ← built at <their file:line> from input <n>` | read their code; OTHER-MODULES.md "names built from our input" rows |
| 4 | **Sibling-caller diff** — other callers of the same entry point in our modules | `<sibling file:line> derives <input> as <X>; ours as <Y>` | grep the entry method across etanah-pelupusan + etanah-awam |
| 5 | **Deployed version + lane** of their module on the failing env | `<module> <version> (from <ralat header / footer / pom pin>) · their commits on that method since <date>` | ralat page `common version:` line · `git log -- <their file>` · common: [[feedback_common_ticket_line_triage]] |
| 6 | **Env data/config they read** for our env | `<sistem parameter / ind_* row> = <value> on <env>` + the SELECT | live DB query |
| 7 | **Verdict** — exactly one of four | table below | steps 1-6 |

| Verdict | When | Our output |
|---|---|---|
| **OURS** | any step-2 row is `wrong`, or step 4 shows our derivation differs from a working sibling | fix in etanah-pelupusan / etanah-awam; no message to the other team |
| **THEIRS** | every step-2 row `correct`, every step-3 name traces to their own constants/config, step 5 shows it on their side | one message: not our issue + the error line ([[feedback_other_team_message_not_our_issue]]); artifact only when miya asks ([[feedback_cross_module_handoff_artifact]]) |
| **BOTH** | our input wrong AND their side has its own defect (e.g. an error mask) | fix ours; their defect → LATENT-BUGS row or a one-line note, never blocks our fix |
| **CATER** | theirs, but the module is never-edit (SPOC) and the bug bites our screen | work around from our tugasan/screen ([[feedback_module_edit_boundary]]) |

After the verdict: write any new boundary fact (entry point, derived name, trap) back into OTHER-MODULES.md in the same turn.

## Red Flags — STOP if you catch yourself thinking

- "The top frame is in etanah-common, so it is common's" — that is step 1's input, not step 7's answer
- "The error says their table is missing" — run step 3; the table/schema name may be built from our kod
- "The log line is enough evidence" — the log names the symptom; step 2 names the cause
- "It worked for other urusan" — then step 4: what does THIS urusan send differently?
- "I'll just send the error line and see what they say" — a bounce-back costs a day (#282442)

## Excuse | Reality

| Excuse | Reality |
|---|---|
| "It's obviously their bug" | ADHOC-PRBB-2026-6 was "obviously" GIS; `et_ptg` came from our empty kodPejabat |
| "Tracing their code is out of scope" | READING their code is in scope; only EDITING it is out of scope |
| "Steps 4-6 are overkill for a one-line handoff" | Steps 1-3 are the floor; 4-6 are one grep, one git log, one SELECT |
| "miya already said it's not ours" | Run the steps and show him the table; his call is made on evidence |

## Enforcement

- `domain/ownership-input-check` (Stop, `stop-claim-integrity` bundle) blocks any ownership verdict without an `Input check:` line.
- `domain/cross-module-intake/scan.js` flags cross-module wording at ticket intake and points here.
- Quest Recon ownership row (`.claude/skills/quest/SKILL.md`) · Debug Ritual 7 (`quest/quest-protocol.md`) · ADHOC-TRIAGE rule 6 route here.
- Eval: `node domain/cross-module-check/eval.js`.

symptom: 2026-10-01 #282442: miya - add a workflow before handover to other modules, more grounded than just asking you to confirm, always invoked when other modules are involved
goal: every cross-module verdict is decided from traced inputs and a boundary map, so our bugs are never handed to other teams and their bugs are handed over with proof
goal_signal: replies with an ownership verdict carry Input check rows and a verdict row from the skill
retention: rotate monthly
footprint: none: skill text only; the eval runs on demand

## History
- 2026-10-01 — created per miya after #282442: ADHOC-PRBB-2026-6 (2026-09-30) was closed OWNED-ELSEWHERE on `relation "et_ptg.log_service" does not exist`; the GIS team showed our `MlkUtilitiPembatalanPermohonanForm.initBPMFlow():346` sent an empty kodPejabat. Steps 2-4 would each have caught it.
