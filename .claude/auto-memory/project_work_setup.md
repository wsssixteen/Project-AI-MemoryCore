---
name: Work codebase path and access
description: Development codebase is at E:\Projects\Melaka — NOT the OneDrive copy which is stale
type: project
originSessionId: b5e3014e-db08-4002-8c94-e8072c165ae9
---
**MANDATORY**: Development codebase is at `E:\Projects\Melaka` (etanah-pelupusan, etanah-common, etanah-awam).

The OneDrive copy at `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\Projects\Melaka\` is STALE — missing refactored files, has outdated code. Never use it for code reading or analysis.

**Why:** OneDrive copy caused a wrong root-cause analysis in FAT-OR #255637 (file `PelupusanWordEditorHelperForm.java` no longer exists in the real codebase, replaced by CC method system). みや explicitly mandated E:\Projects as the only valid source.

**How to apply:** 
- All code reads, greps, git operations: `E:\Projects\Melaka/etanah-pelupusan/` or `etanah-common/`
- Each module has its own `.git` — not a monorepo
- OneDrive paths are OK for: Task folders (`1. Tasks\Melaka\`), SQL exports (`Database\Melaka\`), MemoryCore project files
- Work discussions happen in MemoryCore sessions with clean session boundaries
