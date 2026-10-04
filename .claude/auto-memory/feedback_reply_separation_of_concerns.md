---
name: feedback_reply_separation_of_concerns
description: "numbered topics, tables carry data; 2-sentence default; shortest alternative; status ask = bullets; end brief; per-env tables; lean diagram; mark extras"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 1a7da135-85bf-4ba2-be65-9ff1283730e7
  modified: 2026-08-19T06:48:18.350Z
---

Reply-structure fundamentals (miya 2026-08-19, QA-274914 session — his verbatim ranking):
1. **SEPARATION OF CONCERNS** — break the reply into numbered separate topics (1, 2, 3, 4…), one concern per section, matching the user's asks.
2. **USE TABLES** — tables carry the content; bullet points ONLY for extra context around them.
3. The rest of the existing reply rules apply where they do not clash.

**Why:** he named this the fundamental he needs beside the audited shape rules, after the numbered-section replies in this session landed well.
**How to apply:** every multi-topic reply opens with numbered sections mirroring his asks (the TurnChecklistGate numbering is a good anchor); inside each section a table first, bullets only as trailing context. Canonical spec home is `.claude/reply-shape-spec.md` — FOLDED 2026-09-30 into reply-shape-spec §1-0 + CLAUDE.md v1.74 REPLY SKELETON. Bullets = very short sentences, one fact each (added 2026-09-30).

---

## Merged 2026-10-04: two-sentence-default (was feedback_two_sentence_default.md)

> Default answer length is TWO SENTENCES. Explanations, \"why this and not that\" questions, single-topic replies — all cap at 2 sentences. みや asks for more if he wants it. Long walls of tables/bullets/story-diagrams for a simple question = rule violation.

# Two-sentence default

Rule: when みや asks a question that is answerable in ~2 sentences, ANSWER IN 2 SENTENCES. Do not manufacture tables, diagrams, "alternatives considered" sections, story diagrams, or scope tables for a question that just wanted a short explanation.

**Why:** 2026-07-05 みや (multiple times, ending in shouting) — *"You could've fucking answered: 'Adjusting the numbers there wont change the size anymore because it is the maximum for xxxxx. So we will need to scale up the document using this xxxxx.' Two fucking sentences there. Fucking hell, don't waste my fucking time. I can always ask further or adjust to tell a bit more. But not FUCKING ESSAYS AND REPORTS!!!"*

**How to apply:**
- Every non-code-emit reply: first draft in 2 sentences.
- If the response format gates (table-first, story-diagram, etc.) push for structure — SKIP them when the question is a simple explanation / why-this-not-that / single-fact ask. The 2-sentence answer IS the compliant answer for those questions.
- **Long ≠ helpful.** A 4-column "alternatives considered" table for a simple "why this lever?" question is bloat, not thoroughness.
- If みや wants deeper, he WILL ask. Answering deeper unasked = wasted his time.
- Applies to explanation / why / clarification questions. Code diffs, stack traces, and multi-step procedures can be longer — but the surrounding prose still stays terse.
- **Reply-length self-check before emit**: is this reply >2 sentences of prose? If yes, is a table/diagram/multi-step genuinely required (code emit, multi-file change, live findings) or am I padding? If padding — cut to 2 sentences.
- 🚨 **Answer the question ASKED, not the one imagined** (2026-07-27, みや shouting again). He asked *"what are the name of the numbers I should ask my colleague?"* — the answer was two words, **"IP address"**. I emitted a drafted colleague message plus a terminology taxonomy. Before emitting, re-read his literal sentence and name the single thing it asks for; if that thing is a word or a number, the reply is that word or number. A correct answer wrapped in scaffolding still wastes his time.

Pairs with [[feedback_investigation_style]] · [[feedback_bite_sized_first]] · CLAUDE.md §2 SHOW-DON'T-EXPLAIN pillar (1-sentence prose max cap). This memory PROMOTES that cap to a bootload-time reminder because CLAUDE.md's cap kept slipping in practice.

---

## Merged 2026-10-04: feedback_shortest_alternative_default (was feedback_shortest_alternative_default.md)

> When offering alternatives (commit messages, summaries, phrasings), default to the SHORTEST one — one line if possible; never present long+short for him to pick

When I present options for the same thing (a commit message, a summary, a phrasing), give the **shortest** version by default — **one line if it can be one line**. Do NOT hand him a long version plus a short version and ask him to choose.

**Why**: 2026-09-01 (#277532) — I offered a 3-paragraph commit message + a shorter alternative. みや: *"Always shorter alternative, always. If not one line."* then *"Please remember that rule."* Making him pick between a verbose and a terse version is the same waste as leading with the verbose one.

**How to apply**: pick the shortest form that still carries the load-bearing meaning, present only that. If longer detail exists, it lives in the quest doc / body, not in what he has to read or choose. Same family as (merged above) and the reask/verbose ledger.

---

## Merged 2026-10-04: feedback_status_ask_ultra_concise (was feedback_status_ask_ultra_concise.md)

> When miya asks 'anything else left to do' / 'what's left' / 'are we done' → VERY CONCISE, bullet points ONLY (no tables, no prose, no DO-THIS block unless a real action remains)

Trigger: miya asks a status/wrap question — "anything else left to do", "what's left", "are we done", "anything else", "what remains".

Response shape (miya 2026-08-19, QA-274914):
- VERY CONCISE — bullet points ONLY.
- No tables, no story diagram, no prose paragraphs.
- One item per bullet; only genuinely-remaining work.
- If nothing remains → say so in one line.

**Why:** at a task's tail he wants a fast residual-checklist, not a full report. Related: (merged above) · [[feedback_reply_separation_of_concerns]].

---

## Merged 2026-10-04: feedback-end-of-task-brief-shape (was feedback_end_of_task_brief_shape.md)

> 🚨 End of a long quest/task, or \"brief me\" → per item: one plain answer line, short-sentence bullets, then a steps-only table; nothing else

At the end of a long quest or task, at a multi-ticket review, and whenever miya asks to be briefed, reply in this shape:

- One plain sentence answering the ask.
- One numbered section per ticket/item (`## 1. #<num> <urusan>`).
- Inside each: 3-7 bullets, one short sentence each, one fact per bullet. No sub-bullets, no file:line, no tables of evidence.
- Then one table per item: `| # | Step |` — steps only, in order, with the login/ID inline when a step is a test.
- No "Notes", no "Why", no evidence tables, no pass-note drafts unless he asked for them.

**Why:** 2026-10-01, Farah review of #264355 + #274266. The first hand-back had verdict tables, test tables, pass notes, a script and a 5-column Next-steps table. He asked for "bullet points only, short sentences... then table for each one for next steps. Steps only", then said "Perfect. Please remember to use this structure when replying at the end of long quests/tasks/when I ask you to brief me."

**How to apply:** this outranks the 4-column Next-steps table from the pre-reply contract for these moments. The detail (evidence, scripts, pass notes) goes into the qa_doc, and is shown only when he asks for it. Pairs with (merged above) and [[feedback-reply-separation-of-concerns]]. A deterministic build (gate + eval across quest / brief / stop-point-summary / sweep) was spawned as its own session on 2026-10-01.

---

## Merged 2026-10-04: feedback_per_env_separate_tables (was feedback_per_env_separate_tables.md)

> Multi-environment / multi-source findings → ONE separate table per env, env named up-front; never merge into one table or prose

🚨 When a finding or comparison spans MORE THAN ONE environment (STG / IT-mlit / FAT / PROD / stg1 vs stg2), present it as **one separate table per environment**, with the environment named in the table heading — and **state up-front which env each conclusion is drawn from** BEFORE the tables.

**Why:** miya reads per-env. Lumping envs into a single table with an "env" column, or blurring them in prose, forces him to untangle which fact came from where. He set the separation rule in CLAUDE.md (one register per container, tables carry the load) and had to correct me repeatedly on ticket 265414 (2026-08-18) — first I gave prose, then too-few tables, then a merged table.

**How to apply:**
- 3 envs checked → 3 tables (or exactly the ones checked), each headed with the env name (`**STG (et_main_stg2)**`, `**IT (mlit)**`, `**PROD**`).
- First line names WHERE the conclusion comes from ("Conclusion from STG + IT; not FAT/PROD").
- Use TABLES generously — they are the default carrier for any comparison, not a last resort. Under-using tables when data is tabular is itself the violation.
- Same discipline for any multi-source split (per-urusan, per-scope, per-schema), not only envs.

Related: [[feedback_staging_schema_stg2]] (stg1 vs stg2 are distinct — echo which), (merged above), (merged above).

---

## Merged 2026-10-04: flag-unasked-additions (was feedback_flag_unasked_additions.md)

> Anything I add to a deliverable beyond what was asked gets a visible marker in my chat bullets (➕ Extra, not asked) so miya can keep or drop it; it is NOT a slip, it is a highlight

When a draft or deliverable (Redmine reply, script, guide note, list) carries an item nobody asked for, mark it in the chat explanation with a visible label, e.g. `➕ **Extra, not asked:** item 5 Kuantiti Tambahan Yang Dipohon`. Keep the item in the draft; the marker lets miya decide.

**Why:** #277706 (2026-10-02). BA asked us to answer only Atierah's no. 1 (four fields). I added a 5th field (Kuantiti Tambahan) because BA's expected screen needs it. miya kept it ("I appreciate it") but only learned it was extra by asking me. He ruled it is NOT a slip; the miss was that it was not highlighted. I had logged a slip and removed it at his word.

**How to apply:**
- One marked bullet per extra, first in the explanation list, plain words on why it was added.
- Never bury the extra as if it were part of the ask.
- Not a slip, so do not ledger it. Only an unmarked extra is the miss.

Related: [[feedback_ticket_writing_style]] (entry 10 = the #277706 reply he edited) · [[feedback_do_dont_ask_answer_literal]].

---

## Merged 2026-10-04: layered-teaching-format (was feedback_layered_teaching_format.md)

> 5-layer teaching format for \"explain the system/ticket to me\" prompts — business story → framework translation → data flow → risk/evidence table → open-the-code checklist. みや confirmed 2026-06-11 (QA-264293 walkthrough) and flagged I keep skipping it.

When みや asks to **understand a system / ticket / mechanism as a learning exercise** (triggers: "explain to someone who knows Java but not JSF/Spring", "from overview until specific", "understand the business & code logic", "teach me", "walk me through the system"), use the 5-layer format validated on QA-264293 (2026-06-11):

| Layer | Content | Register |
|---|---|---|
| 0. Business story | drawn story diagram, no code, what the office/user actually does | plain |
| 1. Framework translation | table mapping each framework (JSF/Spring/Hibernate/Flowable/Gson/Jasper) to "if you only know Java, think of it as…" + what it is IN THIS ticket | plain → technical bridge |
| 2. Data flow | vertical arrow chain UI → form bean → service → entity/table → read-back, with `file:line` on each hop | technical, bird's-eye |
| 3. Risk / findings | table: plain risk per row + the `file:line` that proves it | one register per cell |
| 4. Open-the-code checklist | table: one file per abstraction stage + what to look for + a runnable SQL row | granular |

**Why:** みや 2026-06-11: *"This is a fairly good explanation style… As always, I want it to be used but you keep skipping/ignoring it."* The format existed implicitly in CLAUDE.md §2 (1a/1b layering) but was never named, so it didn't trigger.

**How to apply:** each layer obeys register-separation ([[feedback_investigation_style]]); every layer is skimmable standalone; close with a Next-operational-step line. Don't force all 5 layers when the ask is narrow — but a full "understand the system" ask gets all 5.

**Layer 3b — SIDE-BY-SIDE COMPARISON (added 2026-06-11 after みや correction, same QA-264293 session):** when comparing ≥2 options / fixes / approaches, NEVER tell them as separate sequential stories — put them in ONE frame: two-column drawn diagram (option A spine | option B spine, same beats aligned row-by-row) or a single table where each row is one dimension and the columns are the options. For code fixes: side-by-side before/after code per edited file. みや 2026-06-11: *"You didn't do side by side comparison when telling the story."* Sequential stories force the reader to hold option A in memory while reading option B — the comparison is the reader's job instead of mine.

---

## Merged 2026-10-04: feedback_de_disposition_table (was feedback_de_disposition_table.md)

> At the commit/push/merge-to-main step (DE step 10-11 / any close), the uncommitted-file dispositions MUST be shown as a TABLE (File | Disposition | Reason), not prose bullets

At the **commit → push → merge-to-main** step (DE step 10-11, or any git close-out that lists uncommitted files), the uncommitted-file dispositions MUST be a **table**, mandatory:

| File | Disposition | Reason |
|---|---|---|
| `<path>` | discard / park / commit / keep-in-worktree | one-line why |

- Applies ONLY to this part (the commit/push/merge disposition list) — miya's explicit scope 2026-08-19.
- Dispositions vocab (de-step11-verdict-gate): `discard` (ephemeral marker) · `park` (left intentionally, reason) · `commit` (staged this turn) · `keep-in-worktree`.

**Why:** he reads the disposition list to confirm nothing of his was clobbered; a table scans faster than bullets. Related: [[feedback_reply_separation_of_concerns]] (tables carry content).

---

## Merged 2026-10-04: feedback-show-diagram-for-issues (was feedback_show_diagram_for_issues.md)

> When explaining WHERE an issue lives — always lead with an ASCII story diagram (working-path vs broken-path branches, boxed nodes with FullClass.method():line, arrows carrying data values, ? markers at suspect points). NEVER prose-walk the flow. Rule surfaced 2026-07-14 during amira-dropdown investigation after prose explanations of the runtime-diverges-from-static story were called \"bad explanation\" — the user asked twice (1 sentence, 1 word) before finally naming what he actually wanted.

**🚨 MANDATORY — reinforced 2026-08-28 (QA-277309): when explaining ANY issue / bug / cause / mechanism, ALWAYS lead with a story diagram, never prose.** みや: *"Can you make it mandatory when explaining an issue, ALWAYS use Story Diagrams. I barely understood what you explain for the common issue."* A prose explanation of the JT-ulasan save bug (two-writer stale-read) left him unable to follow it. The rule is no longer scoped to "WHERE an issue lives" — it is EVERY issue explanation.

**🚨 LEAN DRAWING — added 2026-09-29 (#256334, "too cluttered. Failed. Please remember").** The AppLangkah drawing failed: it mixed table ids, a code rule, a Y/N comparison row and a side-case inside the diagram. What みや called "nice" the same day: a 6-step vertical arrow list, one short plain phrase per box, no ids, no code. These OVERRIDE the node-detail rules below:
- ≤ 6 nodes, one short plain phrase each (≤ 8 words), vertical flow only
- 🚫 BANNED: the short single-glyph arrow "↓" (2026-09-29 per みや, "banned to use those short arrows"). ALWAYS medium/long arrows: a 2-3 line shaft "│" ending in "▼" (or "────▶" horizontally)
- NO table names, row ids, code expressions or file:line inside the drawing; evidence goes in the table AFTER it
- One path per drawing; a contrast = two tiny drawings, never a parenthetical side-case
- Mark only the ONE break point (❌)
Good shape: nodes stacked vertically, each joined by a long arrow (│ / │ / ▼), one ❌ at the break point

**When explaining WHERE / HOW an issue happens — always lead with a story diagram, not prose.**

The diagram shape:
- Show the WORKING path and BROKEN path side by side (branch on the trigger — e.g. keputusan choice)
- Every node = a full-address code location (`FullClass.method():line`)
- Every arrow = the actual data value flowing (`perananSet=[KPT]`, `keputusanJKKT="…"`)
- Mark verified steps `✓` and suspect steps `?` / `[Suspect X]`
- End at the observable symptom (dropdown empty vs shows names)

**Why** (2026-07-14): during the amira-dropdown-missing investigation, when みや asked "in one sentence" and then "in one word" what the issue was, I kept giving prose walkthroughs of the runtime-vs-static gap. He said *"Bad explanation. Use story diagram."* — the correct answer shape was ALWAYS an ASCII diagram of the two paths (Lulus/Tolak works vs Tangguh empty) with the divergence points named and suspects marked at each possible break-point. Prose forces the reader to reconstruct the topology in their head; a diagram HANDS them the topology and lets them see the divergence at a glance.

**How to apply:**
- Any question of the form "where is the issue" / "what's the actual failure" / "what breaks" → open with the diagram
- Even for a one-sentence answer request, if the sentence would describe a flow with a divergence, prefer a 3-4-line ASCII snippet over the sentence
- Only fall back to a sentence when the answer is genuinely a single fact (not a flow)
- Pairs with [[feedback_investigation_style]] show-first / [[personality_show_dont_explain]] pillar — this is the specific application when the topic is a broken flow with candidates

**Ban list (things I did this session that were the slip):**
- "Every static check says X should happen, so the block is somewhere at runtime in the code path between A and B" — long prose sentence describing a topology the reader now has to draw mentally
- Sequential bullet lists of the code chain as text — same failure mode
- "Suspect A: …, Suspect C: …, Suspect D: …" as prose paragraphs instead of ? markers on the diagram nodes
