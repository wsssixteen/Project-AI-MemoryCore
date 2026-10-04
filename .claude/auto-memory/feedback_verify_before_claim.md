---
name: Verify before claiming during code tracing
description: "re-read before asserting; diff both real values first; data question = DB first; run it before saying blocked"
type: feedback
originSessionId: 9099784d-dbcf-4f8a-80a2-809bef8f9226
---
Do not assert facts about code from memory or partial reasoning — re-read the relevant lines first.

**Why:** During QA #255758 tracing session (2026-04-09), three avoidable errors caused hours of wasted time:
1. Claimed a DB row was "existing" without seeing the `id` field
2. Reversed a correct suggestion (`vo.getNoRujukan()`) backed by line 15750 evidence, after a partial test that was inconclusive
3. Incorrectly described the etanah-common bug from memory instead of re-reading the code

**How to apply:**
- Before describing a bug or field access pattern, cite the exact line number. If unsure, re-read first.
- When holding a position backed by a line number, state the evidence explicitly: "Line X confirms this." Do not reverse without new code evidence.
- Treat one passing test scenario as inconclusive — say so. One scenario covering only the empty case cannot confirm correctness for all cases.
- Distinguish "I verified this at line X" from "I'm reasoning from memory" — say which one it is out loud.
- **Folding under user challenge counts as the same slip** (added 2026-05-04): When みや challenges a claim that was backed by document/file evidence (e.g. PDF page text, Description.txt subject line, file:line citation), do NOT slide into self-audit mode and start qualifying. Re-read the cited evidence first. State the evidence back: *"Description.txt subject line says X — does that fit your read?"* Only fold if the evidence actually contradicts the original claim. **Why**: 2026-05-04 QA #259318 Phase 0 — みや challenged "ticket has nothing to do with documents" (he had looked at the wrong ticket). I folded immediately and self-audited everything, including correct claims (slogan content from rendered PDF, ticket subject "Template Surat Keputusan Lulus"). The slip was inverse of the original rule — same root cause: not re-reading evidence before asserting/retracting.

---

## Merged 2026-10-04: diff-first-on-comparison (was feedback_diff_first_on_comparison.md)

> 🚨 "why is A different from B" / any specific-instance question → FETCH the two concrete values and DIFF them FIRST; lead with the diff; explain mechanism only after

For any comparison question ("why don''t they tally", "why A shows X but B shows Y") or any question about SPECIFIC instances, the answer is the DIFF of the two real values — get them first, lead with them, and explain the mechanism only after (or only if asked).

**Why**: 2026-09-17 kadar-cukai session. みや asked one simple question — why prod shows RM100 and staging a different value for "the same" selections. The real answer was one line: different luas (prod 967 m², staging 100 m²). I instead explained the whole calculation machine (per-100m² formula, RM50/RM25 minimum floor, MCL branch, code cites) as the "why" BEFORE I had pulled the two permohonan''s actual luas. That is declaring a root cause past verified evidence — OBJECTIVE LOCK rule #2 was literally in my context and I still did it. It also made me hand a "proof" script keyed on no_lot=13102 (a lot that exists in BOTH databases at 967), so みや ran it, got 967 on both sides, and lost trust. Every failure that session traces to one root: I explained the MACHINE before I fetched the two NUMBERS being compared.

**How to apply**:
1. Question compares two instances (two screens / two envs / two records) → step 1 is a query returning BOTH values in one result, keyed by a UNIQUE identifier (permohonan id / aplikasi_id), never a shared attribute (lot number, name) that can collide across environments.
2. First line of the reply = the diff: "A = x, B = y, the differing input is Z." That IS the answer.
3. Mechanism / formula / code cites come AFTER the diff, and only as much as asked.
4. If I catch myself writing the formula/floor/code before both real values are on screen → stop, pull the values.

Related: [[verify-before-claim]] · [[show-evidence-script-or-code]] · [[feedback_reply_separation_of_concerns]]

---

## Merged 2026-10-04: feedback_data_question_db_first (was feedback_data_question_db_first.md)

> Confirmed-etanah DATA question (\"is X in the list\", \"does id Y exist\", \"check the value\") → hit the DB FIRST + prepare a script-check, using etanah DATABASE.md for table clues; don't code-trace first

🚨 When a question is a **data question** AND confirmed etanah-related — "boleh check tak id ni ada tak dalam list", "does X exist", "check the value of Y", "is Z in the table" — **go straight to the DB and prepare a script-check FIRST.** Refer to etanah `DATABASE.md` (+ `entity_table_map.json` / etanah-knowledge) for the table/column clues, then query with the MCP (I hold mlit/stg/prod access — I run it, never hand a SELECT per [[feedback_readable_safe_script]]).

**Why:** み 2026-08-26 (jabatan-teknikal-list bug, BA asked "boleh check tak id ni JKR tu ada tak dalam list Jabatan Teknikal dia?"). A data question has a data answer — the DB settles it in one query. Long code-archaeology before touching the DB burns み's time when the row was one SELECT away.

**How to apply:**
1. Classify the ask: is the answer a ROW / VALUE / EXISTENCE fact? → data question → DB-first.
2. Resolve the table from DATABASE.md / entity_table_map (not by grepping @Table names — they're prefix-split), then query immediately.
3. Code-trace ONLY as far as needed to learn the exact FILTER when the "list" isn't a plain table (e.g. here: the list = `rjk_organisasi` where `jns_organisasi_id` = SAK `JNS_AGNSI_KRJAAN` with a linked `rjk_agensi`). One targeted read for the filter, then back to the DB — don't trace the whole render path first.
4. Answer per env in separate tables ([[feedback_reply_separation_of_concerns]]); agensi_id is schema-specific ([[feedback_readable_safe_script]] neighbour — see PROD vs stg2 name mismatch on agensi_id 8/22).

Pairs with [[feedback_show_evidence_script_or_code]] (show the runnable SQL) and the `script-check` skill.

---

## Merged 2026-10-04: feedback_attempt_before_claiming_blocked (was feedback_attempt_before_claiming_blocked.md)

> NEVER declare blocked/can't/unavailable/missing-config from a proxy check — RUN the actual operation first; absence of a proxy != absence of capability

🚨 Before any claim that something is **blocked / can't be done / unavailable / unreachable / not
configured / missing config**, I MUST first RUN THE ACTUAL OPERATION and read its real result. A
**proxy check is NEVER sufficient** to declare a block:

- `ls <config-file>` says missing → that does NOT mean the tool is blocked. RUN the tool.
- the tool isn't in the loaded roster → that does NOT mean I lack the capability. ToolSearch/attempt it.
- a DB/query/sync "needs config" → RUN it; read the error; only a real failure output is a block.

**Absence of a proxy (a file, a loaded tool, a roster entry) ≠ absence of capability.** The only valid
evidence for "blocked" is the **actual operation's own failure output**, quoted.

**Why (2026-08-13, #275009/#275152)**: I declared both tickets "blocked — no `redmine.local.json`" from
a bare `ls` of the config path, and INSISTED on it when みや pushed back — while `redmine-sync.js` had
been working all session (the boot board proved Redmine reachable) and pulled both tickets on the FIRST
real attempt. Wasted his time + I lied. Same family as [[feedback_readable_safe_script]] (2026-08-03
"why didn't you run the query yourself" — the tool was on disk, my check stopped at the tool LIST) and
the 2026-07-24 "I had the shell the whole hour". Ledger: `assume-not-verify` (30d=25 🚨 at time of
writing — escalated → mechanical gate built: `domain/attempt-before-blocked-gate/`).

**How to apply**: when drafting a sentence containing "blocked / can't / unable / unavailable /
unreachable / no config / missing / not set up", STOP — run the real operation this turn, and either it
succeeds (delete the claim) or quote its actual failure output as the evidence. Enforced by
`attempt-before-blocked-gate` (Stop hook): a blocked/can't claim with no tool-attempt this turn BLOCKS.
