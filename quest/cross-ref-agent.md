# quest/cross-ref-agent.md — Background Cross-Reference Agent

> Created 2026-05-19 (QA-262039 retrospective). Triggered from `ticket-gate.js` Phase-0 row #5.

## Purpose

When a Redmine ticket's **Description** or **History** references **other tickets** — `Requirement #NNNNN`, `relates #`, `refs #`, "rujuk ... tic ini" / "boleh rujuk", attached requirement docs — the BA's expected output / spec usually lives in those referenced tickets (typically as an attached PDF / docx / photo). This agent chases them via **browser MCP**, **in the background**, so the main quest flow never waits.

Specifically addresses the QA-262039 slip: `Requirement #237883` was named in the BA's Description; Scout flagged it as a *BA-question to ask みや* instead of *fetching it*. The expected template was on Redmine the whole time.

## When to invoke

At Redmine retrieval. After Scout has run (or in parallel), for each ticket whose `0. Brief/Description.txt` + `0. Brief/History.txt` contains cross-ref signals (see detection patterns below). Spawn **ONE** background `general-purpose` Agent (`run_in_background: true`) — one agent for the entire batch (sequential per source ticket; browser MCP cannot safely fan out).

## Detection patterns (case-insensitive)

- `Requirement\s*#?\s*\d{3,}`
- `relates\s+#?\s*\d{3,}`
- `refs\s+#?\s*\d{3,}`
- `rujuk\s+.{0,40}#?\s*\d{3,}` (Malay "refer to ticket NNNN")
- `(boleh|sila)\s+rujuk\s+.{0,80}` (Malay "please refer to ...")
- bare `#\d{4,}` adjacent to "ticket" / "tic" / "Requirement"

## Two modes (mandatory in the agent prompt — みや's spec 2026-05-19)

| Mode | Signal | Action |
|---|---|---|
| **Specific-ref** | ONE referenced ticket explicitly cited by BA (e.g. `Requirement #237883` with phrasing like "expected template", "rujuk ... tic ini") | Fetch the referenced ticket FULL — Description + journal + every attached PDF/docx/photo. The BA's expected output usually lives in the attachment. Extract: expected template structure, expected static text, expected field labels, expected wording. Fold into the source ticket's `early-diagnostic.md` under "## Cross-Reference: <ref> (fetched)" |
| **Parent/main sweep** | Referenced ticket is a "parent" tracker (many sub-items / many references / a list) | **SWEEP — do NOT go one-by-one.** Read the parent's top-level structure + items directly matching the source ticket's scope. **Limit ≤ 5** items expanded. Note the rest as "parent ticket — N more items not expanded; surface to みや if scope expands." |

**Mode-detection heuristic** (inside the agent): after fetching the referenced ticket's first page, count its journal entries + sub-references + attachments. If `>10` sub-items OR the title contains "Parent" / "Tracker" / "Senarai" → **parent-sweep**. Otherwise → **specific-ref + full fetch**.

## Agent prompt template

When invoking, fill in `{{...}}` placeholders and pass as the Agent's `prompt`:

```
Background cross-reference chase for Redmine tickets.

**Source tickets and their detected references**:
{{LIST: QA-NNNN1 -> [Requirement #X, relates #Y], QA-NNNN2 -> [#Z], ...}}

**Redmine base URL**: {{REDMINE_BASE_URL or "ask みや if absent"}}
**Browser MCP**: assume Chrome is logged in to Redmine. Use mcp__Claude_in_Chrome__* tools (navigate, get_page_text, read_page, find).

**Procedure — sequential, NOT parallel** (browser is a shared resource):

For each source ticket, for each referenced ticket:
  1. Navigate to the Redmine ticket URL (try `<base>/issues/<num>`).
  2. Read title + Description + journal + attachment list.
  3. Apply MODE-DETECTION:
     - count sub-items/refs/attachments;
     - if >10 sub-items OR title contains Parent/Tracker/Senarai → PARENT-SWEEP mode;
     - else → SPECIFIC-REF mode.
  4. SPECIFIC-REF: open + extract content from every attachment (PDF text via get_page_text or download-and-read; docx via read; photo: describe). Extract expected template structure, static text, field labels, exact wording.
  5. PARENT-SWEEP: list top-level structure; expand ≤ 5 items directly matching source ticket's scope; note "N more items not expanded."
  6. If access fails (not logged in / ticket missing / 404): record dead-end with reason.
  7. Append to `projects/coding-projects/active/QA-NNNN/early-diagnostic.md` a new section:

       ## Cross-Reference: <ref-id> (fetched <date>)
       **Mode**: specific-ref | parent-sweep
       **Title**: <ref ticket title>
       **Key extract**: <what BA's expected says — verbatim where possible>
       **Attachments parsed**: <list>
       **Surfaced for the source ticket**: <2-5 bullets of items the source ticket must address per this reference>
       **Status**: fetched | dead-end (<reason>)

**Do NOT modify** any file outside the source tickets' early-diagnostic.md files.

**Report back** (when all source tickets processed): a summary table — Ticket | Refs chased | Mode | Result. Under 200 words. End response.
```

## Output contract

- Writes ONLY to the source ticket's per-quest doc (`projects/coding-projects/active/QA-NNNN/QA-NNNN.md` "Related Ticket" section) — never `early-diagnostic.md` (post-2026-05-20 structural fold).
- No code changes. No template changes. No commits.
- One short summary table when done.

## Cleanup (mandatory, added 2026-05-20 per みや)

After extraction, the agent **MUST close the Redmine tab** it opened — call `mcp__Claude_in_Chrome__tabs_close_mcp` for the tab(s) used. Leaving the tab open creates clutter in みや's browser and forces him to clean up manually. The browser MCP isn't a "leave on" tool — it's used and closed each run.

Final-message convention: after the summary table, include a one-liner `Cleanup: closed N Redmine tab(s) (id=…)` so the close action is visible, never silent.

## Lifecycle

- **v1 — manual invoke**: at Read-Redmine time, Ruri reads this doc, fills the template with the batch's tickets, spawns the Agent with `run_in_background: true`. First real-world use: next Read-Redmine batch (planned ~2026-05-20).
- **v2 candidacy**: after ≥3 cycles + みや's approval. Automation candidate: spawn directly inside `redmine-sync.js` after `--create`.

## Failure modes watched

| Risk | Mitigation |
|---|---|
| Browser not logged in to Redmine | Agent records dead-end + reason; main flow continues; みや logs in for next session |
| Parent-ticket goes one-by-one through 50 sub-items | Mode-detection + hard limit of 5 expanded items |
| Multiple agents fight over Chrome | One agent per batch, sequential per ticket |
| Findings overwrite Scout's early-diagnostic | Agent only APPENDS a new section, never edits existing sections |

---
*v1.0 — 2026-05-19. Triggered from `ticket-gate.js` Phase-0 row #5.*
