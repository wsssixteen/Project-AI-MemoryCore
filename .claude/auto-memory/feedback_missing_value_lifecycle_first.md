---
name: feedback_missing_value_lifecycle_first
description: "Missing/null-value bug → trace the field's LIFECYCLE before proposing ANY fix: writer file:line, which tugasan, mandatory-or-not (+blame date), why null for THIS row; blast-radius = count JOINED to flow-position, never a bare count; assume the mature system already has the prevention — find it and ask why it did not fire"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d6617a39-e51c-4896-939d-62e88a55fe11
  modified: 2026-08-27T04:11:19.910Z
---

🚨 **For any missing/null/kosong-value bug: the fix-shape question comes LAST, the lifecycle comes FIRST.** Emit this 4-row table before proposing anything:

| Lifecycle question | How |
|---|---|
| 1. WHO writes the field | grep the setter/JSON-key → the ONE writer file:line |
| 2. WHEN in the flow | which tugasan shows/saves it (view-flag + `TGS_*_LIST` gates) + BPMN order vs the crash step |
| 3. IS it enforced | xhtml `required=`/`isMandatory` + **git blame the enforcement — its DATE vs this row's tugasan dates** |
| 4. WHY null for THIS row | timeline (deploy window / legacy / alternate route), not "user forgot" |

**Blast-radius rule**: "N apps affected" MUST join current flow-position (`umm_a_tgsn` latest) — a bare null-count is BANNED. Standard proof = the cohort query: how many rows PASSED the crash step with vs without the field (the 12/12-vs-1 shape).

**Prevention-already-exists corollary** (Working-analog-first, data edition): in a mature system, assume the prevention already exists — find it (required attr / validator / recalc / mandatory step) and answer *why it didn't fire for this row* before designing a new one.

**Why (2026-08-27, ADHOC-PRBB-2026-3, みや caught every step)**: PROD PRBB Borang 4Ce NPE on null `kuantitiDisyor`. I proposed a null-guard code fix + claimed "52 apps crashable" from a bare null-count, then claimed "self-heal" without proof. The lifecycle pass (done only after みや pushed) showed: CR #263302 itself made the field MANDATORY at Minit Bebas (before Borang 4Ce), 12/12 apps that passed 4Ce had the value, and the 1 stuck app was a deploy-window straggler → correct fix = one data patch, NO code fix. Two `assume-not-verify` slips logged; category escalated (7d=5). Pairs with [[feedback_adhoc_note_env_first]] + [[feedback_simplify_and_reference]] + [[feedback_verify_before_claim]].

enforcement: hook-pending: null-bug lifecycle gate (P1)
