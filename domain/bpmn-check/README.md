goal_status: draft (derived from registry on 2026-09-06; promote with node lib/goal-backfill.js promote bpmn-check)
symptom: QA-274914: analog-first outranked BA-verbatim A7 (Isu-1 miss); pembetulanUnit chosen without semantics proof (hijacked Charting-Mohon correction); broken test permohonan handed twice (skipPTB unset)
goal: run validator (Step 0) + emit the 10-row judgment table J1-J10 (ticket-verbatim flow, var semantics via act_hi_varinst, dedicated-task-over-gateway, null-safety on migrated tokens, child-parent map audit, loop termination, shared-kod, deployed-version reality, test-data health, inbound-census blast radius)
goal_signal: the run fire produced: run validator (Step 0) + emit the 10-row judgment table J1-J10 (ticket-verbatim 
retention: rotate monthly
# domain/bpmn-check — BPMN validation gate (v1.0, born 2026-08-19 via core/forge.js)

> Nod: miya /goal 2026-08-19 (QA-274914): *"please create a BPMN-CHECK gate. Learn from this mistake."*

## The mistakes this component was born from (QA-274914 failure audit)

| # | Failure | Root-cause class | Killed by |
|---|---|---|---|
| F1 | Original ticket bug reached BA: parent gateway routed on `pembetulanPP` that the MLK_TKL_ST child never out-mapped | child↔parent map blindness | validator **C7** (retro-catches it on the pre-fix file) |
| F2 | mlit crash `Cannot resolve identifier 'pembetulanPP'` — bare-EL condition on a process without the var | EL null-safety unknown | validator **C5** + skill **J4** |
| F3 | Recommended `pembetulanUnit == "true"` as the Isu-1 discriminator — that var is ALSO set by the Charting-Mohon correction (would hijack its loop); flip-flopped KM→unit→KM | variable semantics assumed from the NAME, not proven from the engine | skill **J2** (live `act_hi_varinst` proof mandatory) |
| F4 | Designed a conditional gateway on the SHARED SKM exit; senior replaced it with a dedicated task `3.0 Semakan Kemasukan Maklumat (Pembetulan)` → single unconditional exit → 5.0 PLT | analog read at path level, not PATTERN level (PLTP's "(PP)" dedicated task was in my own familiar report, unrecognized) | skill **J3** |
| F5 | "One clause fixes both issues" — Isu 1 needs SKM→PLT with NO visible task between; my route passed through Charting Mohon (a visible task) | analog outranked BA-verbatim A7 | skill **J1** |
| F6 | Handed 2 broken test permohonan (Init-Alter into MLK_TKL_ST with `skipPTB` unset → §10.1 throw); lost `PTMLK/02/L/PPTPB/2026/1` to the same class | test-data health unchecked | skill **J9** + memory `feedback_verify_permohonan_health_before_test` |
| F7 | "Change this arrow" ambiguity — two arrows carried KM conditions; miya edited the wrong one first | hand-off by label, not source→target | skill **Step 2** |

## Component map (per system structure)

| Piece | Path | Role |
|---|---|---|
| Validator CLI | `domain/bpmn-check/bpmn-check.js` | deterministic checks C1–C9 + `--baseline` element-diff · exit 1 on ERROR |
| PostToolUse hook | `domain/bpmn-check/bpmn-check.check.hook.js` | ADVISORY v1 — auto-runs the validator on any `.bpmn*.xml` Ruri writes (registered in `.claude/settings.json` via forge; wrapped by `lib/hook-runtime.js` for telemetry) |
| Judgment skill | `.claude/skills/bpmn-check/SKILL.md` | the 10 checks J1–J10 no validator can see — MANDATORY before speccing modeler changes (the main coverage path: miya edits in the MODELER, not in files) |
| Behavioural evals | `domain/bpmn-check/eval.js` (mine) + `bpmn-check.eval.js` (forge fixture) | E1 pre-fix must surface the original bug · E2 senior fix must pass with exact diff · E3 synthetic must exit 1 |

## Deterministic checks (validator)

| Code | Check | Severity |
|---|---|---|
| C1 | definitions tag balance | ERROR |
| C2 | dangling sourceRef/targetRef/default refs | ERROR |
| C3 | orphan node (no inbound) / dead-end (no outbound) | ERROR |
| C4 | NEW no-default all-conditional exclusive gateway (§10.1 throw class) | ERROR (pre-existing: WARN census — 37/77 in PPTPB alone, endemic) |
| C5 | bare-EL var on new/changed flow: unknown-var = ERROR · known-var = WARN (confirm writer incl. migrated tokens) | ERROR/WARN |
| C6 | `"true"` compared alongside code literals on one variable (the kelulusan case; `"false"`-as-sentinel is the legit corpus idiom, not flagged) | WARN |
| C7 | gateway routes on a var straight after a callActivity that does NOT out-map it (the QA-274914 bug shape) | WARN |
| C8 | missing BPMNShape/BPMNEdge (invisible in modeler) | ERROR/WARN |
| C9 | shared tugasan kod census (dedicated-task pattern — confirm intent) | INFO |

## Research base (2026-08-19)

- **Corpus census** (25 files): bare-EL 2028 vs `execution.getVariable` 2 (DFT files only) · 600 gateways carry `default=` (87.8% named "Tidak") · PPTPB is the only urusan with a `(Pembetulan)`-suffixed dedicated correction task; PLTP's "(PP)" task is the nearest prior art · `pembetulanPP` out of MLK_TKL_ST: 12 files; out of MLK_TKL_CM: PPTPB family only.
- **Java integration sweep**: outcome vars travel as `BpmNameValue` on `submitBpmOutcome` (CommonBPMServiceClient.java:569; engine call inside the `com.puncaktanah.remoting` jar — not in our repos) · dashboard dedup by engine taskId, tugasan config by kod+urusan (BpmCallbackService.java:378-384, :779-781) · auto-migration moves the definition pointer only, never touches variables (CommonBPMServiceClient.java:448-533) · **no Java-side deploy validation exists — modeler publish is unvalidated**, this gate fills that slot.
- **External**: Flowable throws when no gateway arm matches and no default exists; engines do NOT validate conditions at deploy ([Flowable BPMN constructs](https://www.flowable.com/open-source/docs/bpmn/ch07b-BPMN-Constructs), [exclusive gateway](https://documentation.flowable.com/latest/reactmodel/bpmn/reference/exclusive-gateway), [the deceptively simple exclusive gateway](https://www.jmix.io/blog/the-deceptively-simple-exclusive-gateway/), [call activity variable propagation](https://forum.flowable.org/t/how-to-pass-all-variables-from-parent-process-to-subprocess-using-call-activity/3122)).

## Eval results (2026-08-19, v1.0)

- E1 pre-fix PPTPB: C7 catches the original out-map bug ✓ · C6 catches the kelulusan §10.1 bug ✓ (both retro-detected).
- E2 senior fix vs baseline: VERDICT ✅ · 9-line diff = exactly the senior's deltas (dedicated task + out-map + clause removal + kelulusan→keputusan fix) ✓.
- E3 synthetic: exit 1 with C2 + C4-no-default-NEW + C5-unknown-var ✓.

## Versions

- v1.0 2026-08-19 — born (QA-274914). ADVISORY hook per /system-rules Rule 4 (start simple); promote to blocking on confirmed-fire evidence.
