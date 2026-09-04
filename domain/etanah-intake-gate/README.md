# etanah-intake-gate

**What fires when**: UserPromptSubmit — Free-text etanah work signal (hakmilik ID / etanah table / mutation-verb + env / error signal) with NO Redmine ticket number and NO labelled-field adhoc paste

**Contract**: Classify into lane DATA-PATCH | ADHOC-CANDIDATE | LOOKUP and inject the lane's compact pre-flight: routed etanah-knowledge file(s), key-path-evidence rule, input-IDs-verbatim rule, cross-verify rule

**Lanes (first-match)**:

| Lane | Predicate | Emit |
|---|---|---|
| *(silent)* | ticket number OR ≥3 labelled fields OR bypass `[skip-etanah-intake:]` OR no etanah signal | — (ticket-gate / adhoc-paste-detector own those) |
| DATA-PATCH | mutation verb + (hakmilik/permohonan ID \| etanah table \| env word) | knowledge routing + KEY-PATH EVIDENCE + IDs VERBATIM + CROSS-VERIFY + script-check + both-STG-schemas |
| ADHOC-CANDIDATE | error signal (NPE/error/gagal/tak boleh…) | scaffold-or-inline deterministic test + knowledge routing |
| LOOKUP | any other etanah signal | knowledge routing + write-back reminder |

**Layer choice (Rule 7)**: hook-only — detection is pure regex over the prompt; the procedure is compact enough to live in the emit. No state to hold, so no skill.

**Trigger moment (Rule 8)**: UserPromptSubmit behind a tight etanah-signal predicate — the disciplines (knowledge-first, key-path evidence, ID-verbatim) must land BEFORE the first query; any later event is too late. Silent on every non-etanah prompt (F7/A3 fixtures).

**Observability**: every fire appends to `domain/etanah-intake-gate/log.jsonl` (runHook telemetry: ts, fired, lane, dur_ms).

**state-scoped**: yes — `KNOWLEDGE_DIR` hardcodes `etanah-knowledge/melaka` and the hakmilik/urusan regexes encode Melaka shapes. A second state parameterizes `KNOWLEDGE_DIR` + extends the ID prefix list.

**Born from**: 2026-08-21 hakmilik-luas slip — free-text patch ask matched NO existing gate (ticket-gate needs a QA number, adhoc-paste-detector needs labelled fields, knowledge-first-gate needs a source-file Read); wrong banked 1:1 linkage trusted, wrong rows patched twice, one input ID silently substituted. Real path `ind_versi_dhd flag_aktif='Y' → mklmt_hkmlk_id` was one pg_constraint read away.
