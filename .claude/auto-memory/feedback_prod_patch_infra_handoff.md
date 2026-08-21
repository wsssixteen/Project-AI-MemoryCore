---
name: feedback_prod_patch_infra_handoff
description: PROD data patches always go to infra via a fixed hand-off message format (greeting + one-line ticket explainer + script with expected-outcome comment)
metadata: 
  node_type: memory
  type: feedback
  originSessionId: a9fbf5d6-e99a-4b85-83d2-4336b3c13919
  modified: 2026-08-21T03:29:09.487Z
---

🚨 PROD patching ALWAYS goes through infra — never run it myself, never hand it to みや to run. Deliver it as an infra-addressed message in this EXACT format:

```
Hi infra, please assist. Thank you.

#<ticket number>: 1 very short, concise sentence explaining what/why.

<script>
-- x row <updated/inserted/deleted>
```

**Why**: infra is the only party that executes PROD writes; a fixed, minimal format lets them apply it without back-and-forth. The one-line explainer + the trailing `-- N row ...` expected-outcome comment are the whole context they need.

**How to apply**: at any PROD data-patch hand-back, emit this block verbatim (greeting line · blank · `#ticket: sentence` · blank · fenced script ending in the expected-outcome comment). Keep the sentence to one line. Schema-qualify (et_main) and still run the schema-verify + script-check gates first. Pairs with [[feedback_infra_script_schema_env]] and [[feedback_never_hand_miya_a_query]] (writes → infra, not みや).
