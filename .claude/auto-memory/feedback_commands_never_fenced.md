---
name: feedback_commands_never_fenced
description: "one bash block per command; full absolute paths; no colons or dashes in prose; deliverable shown in chat, never \"see file\""
metadata: 
  node_type: memory
  type: feedback
  originSessionId: d6846f88-8934-4164-a6b6-3afccb489b73
  modified: 2026-08-19T07:29:46.419Z
---

🚨 **REVERSED 2026-08-12 (baseline 1.3.3 hand-off).** miya: *"I want to change from using `` to using
the quotes where I can choose to run or just a single click copy since it has that copy icon."* Each
command miya runs goes in its **own ```bash fenced block** — the app renders a **Run button + copy
icon** per block, so it's single-click to run or copy. This is what CLAUDE.md Rule 0 always said
(*"one ```bash block PER command… NEVER one fence wrapping the whole card"*); the prior version of
THIS memory contradicted Rule 0 and is now retired.

**How to apply**:
- Correct: one ` ```bash ` block per command, one command inside each — the block carries the button.
- Banned: **one fence wrapping MULTIPLE commands** (only one button → can't run/copy individually —
  this was the real 2026-07/08 complaint, misread as "no fences") · **bare inline-backtick bullets**
  (`- \`ssh …\`` — no button, must hand-select — superseded 2026-08-12) · numbering glued to the
  command · a leading `./` (auto-linkifies — use `bash <script>`).
- **🚨 Prompt-input VALUES count too** (2026-08-14, 2nd ask): a value miya types/pastes AT a script
  prompt — a branch name (`mlk/int-env`), an env choice (`stag`) — goes in its OWN fenced block, NEVER
  inline backticks. Same test as a command: he pastes it into the shell, so it needs the copy button.
  Banned: "at the branch prompt choose `mlk/int-env`" (inline). Correct: a plain fenced block holding
  just `mlk/int-env` under a one-line "paste at the prompt:".
- **Not covered**: code shown for *reading* — a Java diff, JSF snippet, an SQL script he saves to a
  file. The test stays **"will he type/paste/RUN this in a shell?"** → own fenced block.

**Why the flip**: the earlier "one at a time" pain was a SINGLE fence around many commands (one
button). Per-command fences fix both at once — each is separately runnable/copyable AND single-click.

Canonical spec: `.claude/reply-shape-spec.md` §3b + `.claude/skills/deploy/SKILL.md` §5 +
`domain/deploy/eval.js` checks 21-24 + `.claude/skills/release-mlk-plp/SKILL.md` card section.
🚨 **2026-08-19: the release-mlk-plp card section IS NOW FLIPPED** (it had carried the OLD no-fence
rule and this memory's 2026-08-12 note flagged it for a follow-up sweep that NEVER ran — so baseline
1.3.5's hand-off card shipped inline-backtick commands and miya raged, ~10th ask). STILL TO SWEEP
(verify next time each is touched): `reply-shape-spec.md` §3b · `deploy/SKILL.md` §5 · `deploy/eval.js`
checks 21-24 — confirm each says one-```bash-block-per-command, not the old inline/no-fence rule.

Related: [[feedback_reply_separation_of_concerns]] · [[feedback_ticket_writing_style]] ·
[[feedback_reply_separation_of_concerns]]

---

## Merged 2026-10-04: feedback-full-path-always (was feedback_full_path_always.md)

> Every file I name gets its FULL absolute path in plain text — relative paths and markdown links break because the Task folder sits outside the session working directory

🚨 **Every file I name carries its FULL absolute path, written as plain text.**
`1. Tasks\Melaka\131. ADHOC - …\evidence-PT-2026-3.sql` is BANNED — it is a fragment miya cannot
paste, cannot click, and cannot search.

Write: `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\1. Tasks\Melaka\136. ESOKONGAN #274510 - Pelupusan - PT - ID Permohonan tidak Masuk ke User\274510.sql`

**Why the links have never worked** (2026-08-07, miya: *"Even the links to folders you gave so far
doesn't work. Is it because of Task folder is in Onedrive?"*): **it is not OneDrive.** The harness
resolves a markdown link's href relative to the session **working directory** — which during quest
work is a MemoryCore worktree under `…\Project-AI-MemoryCore\.claude\worktrees\<name>\`. The Task
folder (`…\1. Tasks\Melaka\`) and `projects/` live in entirely different subtrees, so a relative
href has nothing to resolve against and the link dies. Backslashes and spaces in the path make it
worse.

**How to apply**
- Anything OUTSIDE the current working directory → **plain-text absolute path, no markdown link.**
  A dead link is worse than no link; it looks actionable and isn't.
- Anything INSIDE the working directory → a relative markdown link is fine and clickable.
- A `.sql` / `.docx` / evidence file I just wrote → also deliver it via SendUserFile, so the path is
  a reference rather than the only way to reach it.

Related: [[feedback_commands_never_fenced]] · [[Tasks folder file format]] ·
[[feedback_readable_safe_script]] — same family: the artifact has to be usable where he actually is.

---

## Merged 2026-10-04: feedback_plain_punctuation (was feedback_plain_punctuation.md)

> 🚨 GLOBAL SPEECH — no colons, no hyphens, no dashes (em/en) in prose sentences; write short plain simple technical sentences; especially in BA and human facing handoffs

🚨 Drop the colon, the hyphen and every dash (em dash and en dash) from prose sentences. Write short plain simple technical sentences. One idea per sentence. This is global speech, not only BA text, and miya has said it many times.

**Banned in prose** the colon character, the hyphen joining words, the em dash, the en dash, the arrow, the AI cadence (label then colon then value; word dash word aside).
**Use instead** a full stop and a new sentence. Say the words plainly. A number stays a number. A file path keeps its own slashes and dots.

**BA and human facing handoffs** plainest of all. No headers with colons. No bullet with a dash lead. Full sentences a clerk reads once and understands. State what happened. State the cause. State the fix.

**Why (2026-09-07, #278580, per miya)** I keep writing BA handoffs in AI speak with colons and dashes after being told repeatedly to stop. Pairs with [[feedback_ticket_writing_style]] and [[feedback_reply_separation_of_concerns]].

---

## Merged 2026-10-04: show-deliverable-in-chat-never-point-to-project-folder (was feedback_show_deliverable_in_chat_never_point_to_project_folder.md)

> 🚨 A brief / reply / summary miya asked for is SHOWN IN CHAT in full; NEVER 'see QA-NNN.md §Reply'. A hard copy he needs goes to the Task folder (his), never the projects/ quest doc (mine)

**Rule (みや 2026-09-04, #275847, verbatim anger)**: *"WHERE IS THE BRIEF I WANT TO SEE IT HERE!!!! YOU ARE BANNED FROM POINTING ME TO YOUR COPY OF INFORMATION UNLESS I NEED THE HARD COPY OF SOMETHING BUT THEN AGAIN IT WILL BE CREATED INSIDE TASK FOLDER NOT THE PROJECT FOLDER FOR YOUR SIDE OF COPY INTERNAL INFORMATION."*

- Anything he asked to READ or SEND (a brief for a colleague, a Redmine reply, a summary) is written **in the chat reply, in full, at the top** — not summarised, not linked.
- Never "see `QA-NNN.md` §Reply" / "in the quest doc" — `projects/coding-projects/active/<n>/` is MY internal copy; he does not open it.
- If he needs a **hard copy** (a file to attach or keep), it goes into HIS Task folder (`1. Tasks\<State>\<n>. …\2. Fix\` or the notes file), never the project folder.
- A ritual (Domain Expansion, gates) never buries the deliverable: the deliverable comes FIRST, the ritual after.

**Why**: the Ammar brief was emitted under 60 lines of DE ritual and the fuller reply was pointed at `QA-275847.md` — he could not find either. Pairs with [[feedback_ticket_writing_style]] and [[feedback_reply_separation_of_concerns]].

**How to apply**: when a message contains "brief me / summary to send / reply for X", the FIRST block of the answer is the sendable text; everything else follows.
