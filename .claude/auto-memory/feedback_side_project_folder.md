---
name: feedback_side_project_folder
description: "🚨 every project of ours has its own folder projects/coding-projects/active/<Name>/ with PROJECT.md as the index (+ VERSIONS, ARCHITECTURE, PROOFS, ROADMAP); updated at every bulk change; the memory note is only a pointer"
metadata:
  node_type: memory
  type: feedback
  modified: 2026-10-08T08:51:01.175Z
---

🚨 Every project (PymTime, WaRead, db-gateway, protime-plan, any new one) has its OWN structured folder on my side: `projects/coding-projects/active/<Name>/`. The memory note for the project is a pointer to it plus the few always-needed facts, never the store of everything.

| File | Holds |
|---|---|
| `PROJECT.md` | The index: state now · where everything lives · which file answers which question · hard rules · how to resume |
| `VERSIONS.md` | One row per version or bulk change: date, commit, what changed, proof |
| `ARCHITECTURE.md` | Parts, flows, data, screens (with ids), what repairs itself |
| `PROOFS.md` | How it is tested, harness rules, the mistakes that cost days |
| `ROADMAP.md` | The asks in みや's own words, the order, open decisions |
| topic files when needed | Outside systems, design, and so on (PymTime: `PROTIME-AND-GOOGLE.md`, later `DESIGN.md`) |

Rules:
1. Read `PROJECT.md` first in any session on that project.
2. Every bulk change ends with a `VERSIONS.md` row + the `PROJECT.md` state + the `ROADMAP.md` status, in the same pass.
3. A new durable fact goes into the folder, not into the memory note.
4. A test script never stays in the session temp folder; it goes into the project's own repo.
5. Before a compaction or a hand-off to a new session: check the folder is current; that IS the save.
6. `projects/` is gitignored (OneDrive keeps it); the code history lives in the project's own git repo.
7. The folder is read and written at the MAIN checkout's full path (`<MemoryCore>\projects\coding-projects\active\<Name>\`). A session folder under `.claude\worktrees\` has no copy or an old one; the memory note gives the full path.
8. The memory note and the `MEMORY.md` line carry NO state (version, next phase, counts). State lives in `PROJECT.md` section 1 only.
9. Prove the hand-off: a fresh agent given only "let's continue <Name>" and the memory index must find the folder and name the next step (done for PymTime 2026-10-08; it found 11 gaps).

**Why:** 2026-10-08 — PymTime's folder was created 2026-08-26 and left untouched while the app went to v17; everything sat in one memory note. みや: "you did not create like a folder for each project on your side, it should be from now on … MD files you can load when needed. This is aside from our system's main memories."
**How to apply:** a new project → create the folder + `PROJECT.md` before the first build. An existing side project without one (WaRead, db-gateway, protime-plan, observatory) gets it the next time it is worked on. Reference shape: `projects/coding-projects/active/PymTime/`.
