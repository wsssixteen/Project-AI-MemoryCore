---
name: feedback-full-path-always
description: Every file I name gets its FULL absolute path in plain text — relative paths and markdown links break because the Task folder sits outside the session working directory
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 19b6d7cf-21f0-4bfe-88e6-7b43b29aa7f5
  modified: 2026-08-10T01:17:37.988Z
---

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

Related: [[feedback_commands_never_fenced]] · [[feedback_folder_vocabulary]] ·
[[feedback_never_hand_miya_a_query]] — same family: the artifact has to be usable where he actually is.
