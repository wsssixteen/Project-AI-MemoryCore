# LRU Manager
*Least Recently Used project position engine*

## Rules

1. New projects always start at position #1
2. Loading a project moves it to position #1 — all others shift down
3. Maximum 10 active projects per type
4. When a new project would create position #11 — auto-archive the oldest
5. Archived projects can be reloaded anytime (re-enters at position #1)
6. `save project` does NOT change LRU position
7. Each project type has its own independent 10-slot queue

## Active Types Installed
- **coding** — `projects/coding-projects/`

## Position Shift Example
```
Before: [A, B, C, D]
Load B → [B, A, C, D]
New E  → [E, B, A, C, D]
```

## Auto-Archive Trigger
```
IF active project count > 10 after add/load:
    → Move position #11 project to archived/
    → Update project-list.md
    → Notify Miya which project was archived
```

---

*LRU Manager v1.0*
