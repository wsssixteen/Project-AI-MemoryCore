---
name: Knowledgebase enrichment during debugging
description: "bank knowledge every debug; banked = trust, cheap change-check; check archives; video URL bar names the screen; ticket TYPE vocab"
type: feedback
originSessionId: b5e3014e-db08-4002-8c94-e8072c165ae9
---
Every debugging or first-time codebase scan session should produce knowledgebase entries as a side-effect — not just fix the bug.

**Why:** みや observed that tracing sessions produce valuable linkage knowledge (strategy patterns, tag mappings, table relationships) that would speed up future investigations. If we don't capture it, we re-derive the same chains next time.

**Canonical destination by entry shape** (2026-05-15 refinement, after QA-260302 NonUniqueResultException debug session):

| Entry shape | Destination file |
|---|---|
| Debug recipe (SYMPTOM → DIAGNOSTIC → ROOT-CAUSE) — e.g. exception classes, dirty data state, dispatch ambiguity | `projects/coding-projects/active/etanah-knowledge/melaka/BUG-BESTIARY.md` (canonical name; created 2026-04-14) |
| Deferred code issue (known bug, fix postponed) | `projects/coding-projects/active/etanah-knowledge/melaka/DEFERRED-CRITICAL-ISSUES.md` |
| Schema reference (table column, JPA mapping, prefix convention) | `projects/coding-projects/active/etanah-knowledge/melaka/DATABASE.md` |
| Package / Bean-type / Layer Map | `projects/coding-projects/active/etanah-knowledge/melaka/MODULE-ARCHITECTURE.md` |
| JSF composite wiring trap | `projects/coding-projects/active/etanah-knowledge/melaka/JSF-WIRING.md` |
| Domain vocabulary (urusan codes, tugasan kod patterns) | `projects/coding-projects/active/etanah-knowledge/melaka/DOMAIN-GLOSSARY.md` |

Note: the word "bestiary" appears as a generic concept in other memory entries — same idea (categorical pattern collection). DEBUGGING-PLAYBOOK is the implementation for the debug-recipe slice.

**How to apply:**
- After completing any code trace, add a FLOW-TRACES entry with the full chain
- Update MODULE-ARCHITECTURE and DATABASE.md with any new patterns/tables discovered
- Flag to みや: "I found [X] during this trace — should we add it to knowledgebase?" (per feedback_knowledgebase_tiers)
- Consider retrieval improvements: linkages between classes, naming convention patterns, grep shortcuts that would help future sessions find relevant code faster

---

## Merged 2026-10-04: feedback-banked-knowledge-change-check (was feedback_banked_knowledge_change_check.md)

> For mechanisms already banked in etanah-knowledge (FLOWABLE-KNOWLEDGE.md etc.), be 100% confident and re-read the source ONLY after a cheap change-check proves the code moved — never cold re-derive

When a mechanism is already banked in etanah-knowledge (e.g. `FLOWABLE-KNOWLEDGE.md` — the InitiateBPMFlowableForm / flowable-alter page mechanics, built during #274510), TRUST it at 100%. Do NOT cold re-read the source to re-derive what is already banked.

**Why:** cold re-reading banked mechanics wastes みや's time and reads as low confidence in my own knowledge base; the banked doc IS the answer. A fresh trace can also stop halfway and report a partial rule.

**How to apply:**
1. Answer from the banked knowledge directly, cited (`FLOWABLE-KNOWLEDGE.md §N`).
2. If freshness is in doubt, run a CHEAP change-check first — `git log -1 --format=%cd -- <file>` (or diff since the banking date/commit), not a full re-read.
3. Re-read the source ONLY if the change-check shows the file moved since banking; then update the banked doc.

Genuinely-new investigation (values/data not in the banked doc — e.g. a live engine query for this app's variables) is still legitimate; this rule is about not re-deriving the *already-banked mechanism*. Hook candidate (deferred): PreToolUse reminder when Reading an etanah source file covered by a knowledge doc. Related: (merged above) · [[feedback_simplify_and_reference]] · KNOWLEDGE-FIRST (CLAUDE.md §8).

---

## Merged 2026-10-04: Always check archive folders (was feedback_check_archives.md)

> When looking for past tickets, projects, or quests — check archive/archived subfolders, not just active ones

Always check archive folders when searching for past items (tickets, projects, quests). Don't assume things are only in active folders.

**Why:** Miya has reminded this multiple times. Completed quests, old projects, and past task data get archived — they don't disappear.

**How to apply:** When asked about a ticket/project/quest that isn't in the active folder, immediately check `quest/archive/`, `projects/*/archived/`, and any `archive/` subdirectories before asking Miya for a path.

---

## Merged 2026-10-04: feedback_watch_video_url_first (was feedback_watch_video_url_first.md)

> MANDATORY Phase 0 — extract frames from every video/screen-recording attachment and READ THE URL BAR; the URL's .xhtml path is the authoritative screen identity. A UI-render fix is BANNED until the exact form is confirmed from that URL, never guessed.

**At Phase 0, reading `0. Brief/` attachments: for EVERY video / screen-recording / browser-screenshot, extract frames (`video-frames` skill) and READ THE URL BAR + the visible screen. The URL path (`.../protected/<area>/<Form>.xhtml`) is the AUTHORITATIVE identity of the screen the BA is on — it outranks any code-grep guess.**

**Iron rule**: a diagnosis or fix for a UI-rendered symptom is BANNED until the exact form/xhtml is confirmed from the attachment's URL. Naming a form from grep/theory while an unwatched video holds the URL = the failure this kills. Watching the video is NOT optional "if the filename matches" — it is mandatory for every media file.

**Why** (2026-08-12, QA-274318 — みや furious, twice): the BA video's URL bar clearly read `etanah-pelupusan/protected/jpph/UtilitiKemaskiniUlasanJPPHForm`. I never watched it, guessed across THREE wrong pelupusan forms (`MlkUlasanJPPHForm`, `MlkJabatanTeknikalTerlibatForm`, `PelupusanSearchService`), **applied a fix + built a full test scenario on a form that never renders the BA's page**, and only found the truth when みや sent the URL screenshot himself. The real screen was etanah-common. One frame at Phase 0 would have named it in seconds.

**How to apply**:
1. Every media file in `0. Brief/` → `video-frames` extract → emit `<file> — URL: <full url> · screen: <what's visible>`.
2. Derive the exact `.xhtml` + owning module from the URL path (`/etanah-pelupusan/protected/jpph/...` = etanah-common overlay, not necessarily pelupusan src).
3. Only THEN name the form / trace bindings / propose a fix.

Pairs with [[feedback_reply_separation_of_concerns]] + the multi-dim-evidence rule + [[reference-jasper-field-sources]]. Over-confidence corollary: "strongest static candidate" ≠ "confirmed screen" — confirm from the render surface (URL) before applying or handing off.

---

## Merged 2026-10-04: feedback-ticket-type-vocab-tracking (was feedback_ticket_type_vocab_tracking.md)

> Tag each ticket with a TYPE (template / document-reset / etc.) and track how different individuals word the same style of ticket; hold provisional confidence until fluent

みや wants each ticket tagged with a "type" (e.g. template, document-reset-via-maintenance, ...) and wants me to collect the different WORDINGS that different BAs/individuals use for the same style of ticket, building fluency across tickets over time.

**Why:** I'm new to these ticket families; the same underlying issue is phrased differently per person, and premature confidence produces a wrong reset/fix model — e.g. QA-273621, where I over-asserted a `pembetulan` flow auto-delete when the real test-reset is deleting docs via `PelupusanMaintenanceForm.xhtml` ([[reference-jasper-field-sources]]).

**How to apply:** on each ticket record `ticket_type` + the reporter's exact phrasing; when a new ticket resembles a prior type, match on VERIFIED shape, not vocabulary alone; stay explicitly provisional ("still new to this family") until the pattern holds across several tickets. Related: [[over-generalization-check]] · [[feedback_verify_before_claim]].
