---
name: Untracked files in main repo are intentionally confidential
description: Files in main repo working tree that aren't committed (especially under projects/coding-projects/active/etanah-knowledge/ and similar) are intentionally untracked because they contain confidential project data. Don't push to commit them. Maintain on disk only.
type: feedback
originSessionId: 85d3b4f3-3ce6-4741-88b7-d0d05b78e0e7
---
**Rule**: Untracked files in the main MemoryCore repo working tree are intentionally untracked because they contain confidential project data (client codebase identifiers, test data, internal knowledge). **Do NOT** propose committing them, do NOT flag them as a tracking gap, do NOT auto-add them at session-end.

**Why**: みや 2026-05-11 — *"I believe the ones untracked are as per protocol to remember by CLAUDE.md those files are confidential."* The OneDrive sync handles cross-machine availability without git; git stays minimal-public.

**How to apply**:
- When `git status` in main repo shows `??` files under `projects/coding-projects/active/etanah-knowledge/`, `projects/coding-projects/active/QA-*/`, or similar paths — these are EXPECTED state. Don't flag as drift.
- When writing new knowledge entries (e.g. test data, urusan glossaries, ticket diagnostics), write to the main-repo absolute path. They live untracked, OneDrive-synced.
- Worktrees won't see these files (they only see tracked content). When operating inside a worktree, READ from the main-repo absolute path; WRITE to wherever みや designates per the specific ask.
- If みや explicitly says "commit X" for one of these files — honour the specific instruction, but don't generalize.

**Past slip (2026-05-11)**: flagged "untracked files in main repo" as a meta-issue during QA-260139 Cp A. みや corrected immediately. Save here so I don't re-flag.

**Pairs with**: feedback_uat_fat_environments.md (env state), CLAUDE.md (file structure conventions).
