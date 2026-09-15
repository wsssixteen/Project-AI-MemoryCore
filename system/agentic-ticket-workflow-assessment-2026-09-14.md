# Agentic ticket-workflow assessment — 2026-09-14

Session: QA-278699 rework cycle 2 (brief → miya's Word edits → commit/int-env → Phase 1 close). One quest, no fan-out.

| Axis | Finding (with the instance) |
|---|---|
| A1 Agentic system | No fleet used; one session. The handover prompt from the WhatsApp watcher carried everything needed (files, state, rules) and the brief was delivered in one pass. Instance: manifest + analog read cost ~15 tool calls, no familiar needed. |
| A2 Quest workflow | `/quest resume` has no deterministic New/Rework/Addition emit; cycle knowledge came from the launching prompt. Instance: miya asked "you didn't realise this is the second time" — the doc's REWORK label was mine, not the tool's. Slip `quest-workflow/rework-cycle-not-detected`, side-build chip spawned. |
| A3 Debugging efficiency | Root cause found from BA's own attachment bytes (the `.main` files are DOCX) rather than a theory; zero build cycles for the diagnosis. Near-miss: PyMuPDF page render of a DOCX drops images — I sent one before noticing and had to replace it with a real screenshot. |
| A4 Etanah issue-solving | Working analog (Surat JT / YB) settled all three BA points at once; bold is template-owned, populators unchanged. Knowledge baked: WORD-TEMPLATE-RENDERING.md §6 (inline image inflates its line; JT signature-block shape). |
| A5 Sweep / file sweep | Ledger gate caught 3 cycle-1 files I had not re-opened this session; they changed nothing but the gate was right to ask. Two gates misfired on this session's shape: awam-no-resit (matched the word MCL in a template name) and show-gate (fired on a verbatim quote). |
