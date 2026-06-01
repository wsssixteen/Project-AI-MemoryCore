---
name: redmine-phase1-prefill
description: Pre-fill the Redmine ticket Edit form at Phase 1 close after git commit + push — drives the page via Claude in Chrome MCP (Status=Resolved · Assignee=<chosen> · %Done=100% · Resolved By + Resolved By Text=Ahmad Ridhwan Anuar · Notes templated · Files uploaded from highest-numbered Task subfolder) THEN STOPS BEFORE SUBMIT so みや reviews + clicks Submit himself. MANUAL INVOKE ONLY — never auto-binds to quest workflow. Triggers — "redmine prefill", "prefill redmine for X", "/redmine-phase1-prefill", "fill the redmine form", "redmine close prefill", "phase 1 redmine", explicit manual invocation only.
---

# redmine-phase1-prefill — manual-invoke Phase 1 close form prefill

## What this does

After git commit + push has succeeded and みや invokes this skill, drive the Redmine ticket's Edit page via Claude-in-Chrome MCP and pre-fill 6 fields + upload files from the active cycle's Task subfolder. **STOPS before clicking Submit** — みや reviews and submits himself.

## CRITICAL — manual-invoke only

This skill does NOT auto-bind to the quest workflow. Quest Phase 1 close-out does not call it. Only fires when みや explicitly invokes via one of the trigger phrases above.

**Why manual**: browser automation is slower than API; not every quest close warrants the automation overhead. みや decides per-quest whether to invoke.

## Preconditions (verify before starting)

| Check | How |
|---|---|
| `git push` succeeded | `git log origin/<branch>..HEAD` returns empty (= local matches remote) |
| Chrome is already logged into Redmine | First navigate step succeeds without redirecting to login page |
| Quest's `task_folder=` is set in `quest/active.txt` | grep for `qa=QA-<num>` block + `task_folder=` field |
| Highest-numbered subfolder exists | `Get-ChildItem $taskFolder -Directory` with numeric prefix |
| Assignee is decided | みや mentions in invocation OR skill asks once (default: Aaron Loh Zhi Yong) |

If any precondition fails → STOP and surface to みや; never half-execute.

## Redmine fields scope (per みや 2026-06-01 S5)

| Field | In-scope? | Notes |
|---|---|---|
| Status | ✓ → Resolved | per photo |
| Assignee | ✓ → みや mentions, default Aaron Loh Zhi Yong | per photo |
| % Done | ✓ → 100% | per photo |
| Resolved By | ✓ → Ahmad Ridhwan Anuar | per photo |
| Resolved By Text | ✓ → Ahmad Ridhwan Anuar | per photo |
| Notes | ✓ → templated | per photo |
| Files (highest-numbered subfolder, immediate-only) | ✓ | per photo |
| **Resolution status + date** | ✓ NEW — populate via Redmine API/UI; critical for cycle tracking + audit trail | みや: *"resolution status+date... critical"* |
| Watchers | ✗ DROP | みや: *"I don't think I need it for now"* |
| Related issues | ✗ NOT in prefill (this skill is the form-prefill, not the discovery skill) — handled instead at Quest Phase 0 Scout step 0.5 (git history probe) alongside cross-ticket Redmine refs | みや: *"in-line when you are doing the git history search"* |
| Journal-level attachments | ✗ NOT in prefill (this skill is post-fix prefill, not pre-fix retrieval) — handled instead at Quest Phase 0 retrieval via redmine-sync.js extension (parked: cycle-boundary tagging) | みや: *"I don't know about journal-level attachment as well"* — explained: BA can attach to specific comments, not just original Description |

## Procedure

### Step 1 — Resolve invocation params

| Param | Source |
|---|---|
| `qaNum` | From invocation phrase OR active quest in `active.txt` |
| `taskFolder` | `quest/active.txt` → `qa=QA-<qaNum>` → `task_folder=` |
| `destSubfolder` | Highest-numbered subfolder of `taskFolder` (e.g. `2. Fix\`, `3. Rework\`, `4. xxx\`) |
| `assignee` | みや mentions OR ask once (default Aaron Loh Zhi Yong) |
| `extraNotes` | みや's additional discussion text (optional, appended after template) |

### Step 2 — Navigate to Edit page

```
mcp__Claude_in_Chrome__navigate
  url: https://<redmine-host>/issues/<qaNum>/edit
```

If page redirects to login → STOP, emit: `Redmine not logged in. Log in at <URL> then re-invoke.`

### Step 3 — Fill the 6 fields (per みや's photo)

Use `mcp__Claude_in_Chrome__form_input` for each:

| Field | Selector hint | Value |
|---|---|---|
| Status | `#issue_status_id` (select) | `Resolved` |
| Assignee | `#issue_assigned_to_id` (select) | `<assignee>` (default Aaron Loh Zhi Yong) |
| % Done | `#issue_done_ratio` (select) | `100` |
| Resolved By | `#issue_custom_field_values_<id>` (select) | `Ahmad Ridhwan Anuar` |
| Resolved By Text | `#issue_custom_field_values_<id>` (text) | `Ahmad Ridhwan Anuar` |
| Notes textarea | `#issue_notes` (textarea) | (see Step 4) |

Resolved By + Resolved By Text custom-field IDs need to be discovered on first run via `mcp__Claude_in_Chrome__find` against the form labels — cache the IDs in skill state after first successful discovery.

### Step 4 — Notes textarea template

```
Hi <Assignee firstname>, please find the fix at mlk/qa/<NNN>.

<extraNotes if provided>

Thanks
```

Default template per みや 2026-06-01 prior turn. `<NNN>` = numeric portion of QA-num. `<Assignee firstname>` = first word of assignee display name (e.g. "Aaron" from "Aaron Loh Zhi Yong").

### Step 5 — File uploads

```powershell
$files = Get-ChildItem -Path $destSubfolder -File  # immediate children only, no recurse
```

For each file:
```
mcp__Claude_in_Chrome__file_upload
  selector: input[name="attachments[1][file]"] (and [2], [3], ... per file index)
  filePath: <full path>
```

**Edge cases**:
- `$files` empty → fill non-file fields, emit warning `Files: 0 — confirm intentional or add to <destSubfolder>` (per みや 2026-06-01 prior turn answer 4c)
- `$destSubfolder` has subfolders (not just files) → surface for confirmation: `Found subfolders in <name>: <list>. Upload immediate files only? (per immediate-only rule)`
- File >97.7MB (Redmine limit per photo) → STOP that file, emit warning, continue with others

### Step 6 — Verify state + STOP

Verify all 6 fields are filled + N files attached via `mcp__Claude_in_Chrome__get_page_text` or `read_page`. Then emit confirmation:

```
═══ Redmine prefill complete — QA-<num> ═══

  URL: https://<host>/issues/<num>/edit
  Status: Resolved ✓
  Assignee: <name> ✓
  % Done: 100% ✓
  Resolved By: Ahmad Ridhwan Anuar ✓
  Resolved By Text: Ahmad Ridhwan Anuar ✓
  Notes: filled (<N> chars) ✓
  Files attached: <N> from <destSubfolder>

  🚨 NOT SUBMITTED — review the form and click Submit yourself.
```

**Hard rule**: DO NOT click Submit. みや reviews and submits manually.

## Banned actions

- Clicking the Submit button (the entire point — みや reviews first)
- Recursing into subfolders for file uploads (immediate children only, per みや answer 4b)
- Handling login flow (assume logged in, surface error if not, per みや answer 4a)
- Adding files outside the highest-numbered subfolder
- Defaulting assignee silently — even though Aaron is the common default, ALWAYS surface "Assignee: Aaron — confirm?" so みや knows who's being assigned

## Red flags — STOP if you catch yourself:

- About to click Submit → STOP, the hard rule
- Form structure differs from expected (Resolved By selector not found) → STOP, ask みや to inspect (Redmine may have UI changes)
- Browser session timed out mid-fill → preserve partial fill, surface for re-invocation
- File upload silently fails (size limit / network) → never claim success without verifying via subsequent get_page_text

## History

Created 2026-06-01 by みや design conversation (S4). Trigger photo: Redmine Edit form for QA-263344 showing the 6 fields to fill + Notes template + files area. Manual-invoke decision per みや: "the best/practical option is browser mcp which is slow"; ready for invoke but not auto-bound to quest closure.
