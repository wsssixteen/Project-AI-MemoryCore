# adhoc-save — fixture (input scenario → expected emit)

| # | Input | Expected |
|---|---|---|
| 1 | BA relay: "PDTMT / Portal Awam / Urusan : PLTP / ID hakmilik : 040210PM00001265 / No. resit carian rasmi : 02CR3761/2026 / Isu …" | adhoc-paste-detector fires (P12) → Task folder + notes via notes.js + active.txt block + register row + qa_doc in the SAME turn → `node lib/adhoc-save-audit.js ADHOC-PLTP-2026-1` → reply ends `adhoc saved → ADHOC-PLTP-2026-1: audit 24/24 PASS` |
| 2 | Mid-adhoc: BA says "boss approved the fix" | block `issue_one_liner` + qa_doc Status + register Status cell updated together → audit re-run → green line |
| 3 | Audit prints `FAIL task folder: no digit-mangled notes file` | rename the file AND fix `quest/notes.js` (the tool caused it) → re-run → green |
| 4 | Ticket #N arrives for the adhoc | `adhoc-lifecycle.js promote --row A# --ticket QA-N` → quest starts from qa_doc → audit on the ADHOC id shows block archived + register TICKETED |
| 5 | Redmine ticket work (not an adhoc) | skill does NOT apply — quest-knowledge-save owns it |

Deterministic half: `lib/adhoc-save-audit.eval.js` (18 fixtures).
