---
name: feedback_redmine_deliverables_task_folder
description: 🚨 Anything miya opens/uploads to Redmine (report, script, doc, evidence) goes ONLY to the Task folder 2. Fix/ or 3. Rework/; BANNED from projects/.../QA-NNN/ (one file there: QA-NNN.md); familiars get the Task-folder path as write target
metadata:
  type: feedback
---

Redmine-bound deliverables live ONLY in the Task folder (`1. Tasks\Melaka\<n>. <ticket>\2. Fix\`, or `3. Rework\` on a rework cycle). Never in `projects/coding-projects/active/QA-<NNN>/` — that folder holds exactly one file, `QA-<NNN>.md`, which carries the pointer + findings only. A copy I want for myself also goes in the Task folder.

**Why:** 2026-09-02, QA-277697 — the DOCX audit report a familiar produced was written to the quest folder; みや had to hunt for the file he needed to attach to Redmine. みや: *"anything that needs to be uploaded into redmine, I need to open, from now on, please BAN YOURSELF from adding it to quest folders. Even if you need a copy, you need to make a copy inside Task folder (Fix or Rework)."*

**How to apply:** before writing any file that is not `QA-<NNN>.md` or the notes file, ask "will みや open or upload this?" — yes → Task folder `2. Fix\`. When delegating to a familiar, pass the Task-folder path as the output target. Enforced by `pre-action-check-gate.js` v1.3 deny. Related: [[feedback_task_folder_ownership]] · [[feedback_my_files_minimal]] · [[feedback_script_file_naming]].
