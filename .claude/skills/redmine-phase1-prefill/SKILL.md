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

**🚨 STAGE-ONLY until 2026-10-30 (or until みや lifts it)** — every Redmine update goes through THIS form, never the API: fill, show him the staged values as a table, STOP. Submit only after "I approve" / "submit it" / "post it" in his latest message. Also a view-first ask ("let me see", "prepare first", "same page") = staging, after the date too. **Read the open page's DOM only** — never `fetch`/XHR a `/redmine/….json` URL from the browser: it pops a sign-in password box in his Chrome (#282555). Enforced by `domain/redmine-write-gate` v1.4.

### Step 2b — Read the ticket's live state, then decide the Status by his rule (2026-11-03)

```bash
node domain/redmine-write-gate/status-rule.js <qaNum> --assignee "<assignee>"
```

It prints the live status and assignee and whether Resolved is ALLOWED or BLOCKED, by the rule rows in `domain/redmine-write-gate/status-rule.json` (the one home of the rule and the BA list; `redmine-write-gate` v1.11 enforces the same function). Fill the **Assignee before the Status**: on a New ticket under someone else, the rule allows Resolved only once a BA is in the Assignee field.

### Step 3 — Fill the 6 fields (per みや's photo)

Use `mcp__Claude_in_Chrome__form_input` for each. **Assignee and Status: form_input with the visible name ("Nurul Amani", "Resolved"), Assignee first, never a page script** (2026-11-13 per みや, 289233/289306: a script fill hid the status from `redmine-write-gate`, his standing Resolved rule never ran, and I asked him).

| Field | Selector hint | Value |
|---|---|---|
| Status | `#issue_status_id` (select) | `Resolved` when Step 2b says ALLOWED, with no question to him: under him and lower than Resolved (New · Open · In Progress · Rework · KIV · Reviewing), or New under someone else and sent back to a BA. BLOCKED = leave the select as it is and say in one line why: a status at or past Resolved (Resolved · **Verified** · Ready in PROD · Closed · Cancelled) is never set back, whoever holds it (2026-11-03 per みや; 2026-10-21 #282587: Verified was set back to Resolved), and someone else's In Progress / Rework is their work. His named order ("set status to X") always outranks the rule. Rule + BA list: `domain/redmine-write-gate/status-rule.json` |
| Assignee | `#issue_assigned_to_id` (select) | `<assignee>` (default Aaron Loh Zhi Yong) |
| % Done | `#issue_done_ratio` (select) | `100` |
| Resolved By | `#issue_custom_field_values_<id>` (select) | `Ahmad Ridhwan Anuar` |
| Resolved By Text | `#issue_custom_field_values_<id>` (text) | `Ahmad Ridhwan Anuar` |
| Notes textarea | `#issue_notes` (textarea) | (see Step 4) |

**Fill a field if it EXISTS on the form, skip it if it does not.** Read the form's field list first, never assume. Root Cause Issue (DEV) exists on eSOKONGAN MELAKA → fill it in the shape of `.claude/auto-memory/feedback_redmine_rootcause_format.md`. A Solution field exists on some trackers only → fill it only when present (みや 2026-09-30, #282555).

Resolved By + Resolved By Text custom-field IDs need to be discovered on first run via `mcp__Claude_in_Chrome__find` against the form labels — cache the IDs in skill state after first successful discovery.

### Step 4 — Notes textarea template

**READ FIRST, every time: `.claude/auto-memory/feedback_ticket_writing_style.md` → "miya's Redmine speech collection".** That memory decides his voice (English, "Salam <short name>", one fact per line, "Please help to verify.", "Thanks"). Pick the closest verbatim example there and match it. The block below is only the fallback when no example fits.

**Alter ticket (alter alone, or patch + alter) = GENERATE the note, never write it**: `node domain/ticket-close-block/ticket-close-block.js --alter --ticket <num> --ba "<BA name>" --id <ID> --tugasan "<tugasan>" --user <login from the AFTER check> [--resit "<no1>, <no2>"] [--patched] [--prod-script <num>.sql]`. It prints the note (its one home; `ALTER-TICKET-PLAYBOOK.md` §5.1 points to it); paste its output into Notes as is (2026-11-05 per みや, 288533: I wrote the ID, tugasan and login in one sentence, the shape §5.1 bans). **Banned**: an alter or patch+alter note typed by hand.

**Patch ticket (data, document or file) = GENERATE the note, never write it** (2026-11-11 per みや, 288974: a typed note said a linked permohonan was "tidak diubah" after the script had removed its link): `node domain/ticket-close-block/ticket-close-block.js --patch --ticket <num> --ba "<BA name>" --sql <num>.sql [--file "<Dokumen name>=<new file>"] [--was "<column>=<value in the BEFORE check>"] [--tugasan "<tugasan>"] [--user <login>]`. It lists every thing the script changed, per permohonan, in BA words; the wording lives only in the generator. Clear every `warn:` line (pass the value it asks for) before pasting. Patch + alter: the `--alter` line above with `--patched --sql <num>.sql`. The BA does not test a PROD patch; she passes it to the TSO, who asks the user. **Banned**: a patch note typed by hand · telling the BA how to route it.

```
Hi <Assignee firstname>, please find the fix at mlk/qa/<NNN>.

<extraNotes if provided>

Thanks
```

Default template per みや 2026-06-01 prior turn. `<NNN>` = numeric portion of QA-num. `<Assignee firstname>` = first word of assignee display name (e.g. "Aaron" from "Aaron Loh Zhi Yong").

### Step 5 — File uploads

**5a, always first (2026-11-13 per みや, 281324: "why did you not upload all the things needed"):** save every test photo of this ticket he sent this session, red-boxed, into `<destSubfolder>` (where his photos are: the deploy skill §5b "Finding his photos"), whether or not the folder already has files. **5b:** upload EVERY immediate file of `<destSubfolder>`; a file list in the invocation never narrows it. The note names them in one line (`Attached are the updated ... and the test evidence.`), never a table.

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
- `$files` empty → **do not submit yet** (2026-10-30 per みや, 287201: "no uploads? why do you always skip attachments?"). First find his test photo by the four places in the deploy skill §5b "Finding his photos" (images folder · Screenshots · clipboard · session transcript via `node lib/chat-images.js`), red-box it into `<destSubfolder>` and upload it. Submit with 0 files only when he says there is no file, or when all four places are empty: then name the missing photo in one line and write a `core/slips.js` blocker row. (Replaces the 2026-06-01 "warn and go on" rule 4c.)
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

### Step 7 — After he submits: check, then close the tabs (2026-10-27 per みや, #285768)

When みや says he submitted ("sent", "submitted", "done", "have sent"): read the ticket page once (`get_page_text`) to confirm the new journal, status and assignee, then close EVERY tab this skill opened (`tabs_close_mcp`, each tab id from `tabs_context_mcp`). Close only tabs I opened, never his own. **Banned**: leaving a Redmine tab open after his submit. **The same for a check (2026-11-06 per みや: "always close back tabs if you're simply checking something")**: a tab opened only to read a ticket or a journal closes in the same turn as the read; only a staged form waits open for his word.

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

<<<<<<< HEAD
Updated 2026-11-13 — Step 5 gains 5a (his test photos saved red-boxed into the folder first, always) and 5b (every file uploaded, an invocation list never narrows it; one-line attachment mention) per みや (281324: 1 of 8 files staged, an attachment table added). Additive; the empty-folder edge case stays.
=======
Updated 2026-11-13 — Step 3: Assignee and Status filled only by form_input, never a page script, per みや ("Yes, add it", 289233/289306). Additive; the form_input rule of Step 3 was already there.
>>>>>>> origin/main

Updated 2026-11-11 — Step 4 patch note is generated by `ticket-close-block --patch` per みや (288974). Kept (per miya 2026-11-11, "next time it will be can proceed to verify right?"): a PROD patch note ends "Can proceed to verify." (2026-11-04 rule); the generator prints "have patched as below. Can proceed to verify." Kept: the BA does not test a PROD patch · never tell the BA how to route it.

Updated 2026-11-05 — Step 4 alter note: the parenthetical restating the note's shape is dropped; the generator `ticket-close-block --alter` is its one home (per みや, Fable 5.1 audit: the shape sat in 8 places). Spec-preservation: the generate-never-type rule and its ban unchanged; only the restated shape removed.

Updated 2026-11-04 — Step 4 gains the PROD patch note shape per みや (#288169/#288261: he rewrote my "Please help to verify" to "Can proceed to verify"; the BA passes a PROD patch to the TSO, who asks the user). Spec-preservation: every step and ban unchanged; additive.

Created 2026-06-01 by みや design conversation (S4). Trigger photo: Redmine Edit form for QA-263344 showing the 6 fields to fill + Notes template + files area. Manual-invoke decision per みや: "the best/practical option is browser mcp which is slow"; ready for invoke but not auto-bound to quest closure.
