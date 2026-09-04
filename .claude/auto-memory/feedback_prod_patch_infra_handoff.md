---
name: feedback_prod_patch_infra_handoff
description: PROD data patches always go to infra via a fixed hand-off message format (greeting + one-line ticket explainer + script with expected-outcome comment)
metadata: 
  node_type: memory
  type: feedback
  originSessionId: a9fbf5d6-e99a-4b85-83d2-4336b3c13919
  modified: 2026-09-03T01:35:26.584Z
---

🚨 PROD patching ALWAYS goes through infra — never run it myself, never hand it to みや to run. Deliver it as an infra-addressed message in this EXACT format:

```
Hi infra, please assist. Thank you.

#<ticket number>: 1 very short, concise sentence explaining what/why.

<script>
-- x row <updated/inserted/deleted>
```

**Why**: infra is the only party that executes PROD writes; a fixed, minimal format lets them apply it without back-and-forth. The one-line explainer + the trailing `-- N row ...` expected-outcome comment are the whole context they need.

**How to apply**: at any PROD data-patch hand-back, emit this block verbatim (greeting line · blank · `#ticket: sentence` · blank · fenced script ending in the expected-outcome comment). Keep the sentence to one line.

**🚨 TWO ARTIFACTS, TWO SECTIONS, TWO FORMATS (2026-09-03, per みや, #277346 — "what you show as copyable is only used inside the SQL script file… What to handoff to infra is different section, different format")**:
1. **The `.sql` FILE** (`2. Fix\<ticket>.sql`, format per [[feedback_infra_script_schema_env]]: 4-line header + before-SELECT + DML) — share its contents in chat for review, in ITS OWN section ("<ticket>.sql for review").
2. **The HANDOFF MESSAGE** (the block above) — its fence carries the **DML statement(s) + `-- N rows …` ONLY**. 🚫 NO `-- Ticket/Env/Permohonan/Fix` header, NO before-SELECT, NO file path inside the fence. Pasting the file into the handoff = the #277346 slip. Enforced by `patch-script-gate` CHECK 7 (Stop, BLOCKS; bypass `[skip-handoff-shape: <reason>]`).

**🚨 One-liner content rule (2026-08-27, per みや)**: the sentence states urusan + OUTCOME only — NEVER the permohonan id, values/quantities, table names, or column names; all of that already lives in the script, and infra reads scripts. Example: `#276XXX: PRBB - data patch untuk buka tugasan Penyediaan Borang 4Ce`. Wrong: `#276XXX: PRBB PTMLK/.../12 - tambah kuantitiDisyor (500 Meter Padu) dalam mklmt_tmbhn umm_a_permit_lesen ...`. Schema-qualify (et_main) and still run the schema-verify + script-check gates first. Pairs with [[feedback_infra_script_schema_env]] and [[feedback_never_hand_miya_a_query]] (writes → infra, not みや).

enforcement: memory-only (message-format wording; the script half is already enforced by patch-script-gate + sql-schema-verify)
