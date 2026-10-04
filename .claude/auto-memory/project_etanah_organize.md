---
name: etanah-organize-alpha — knowledge corpus organization project
description: "etanah-organize guidebook; aunt slides (Marp); held #255773 SPOC mirror-copy handoff"
type: project
originSessionId: 419ce805-48e9-40ef-9ac9-e406b3ef300d
---
Multi-session side project: turn the `etanah-knowledge/melaka/` corpus from a flat MD collection into a structured guidebook + visual artifact.

**Project folder**: `projects/coding-projects/active/etanah-organize-alpha/`
- `PROJECT.md` — vision, L2 + flag schema locks, iteration log
- `handoff-<date>-<phase>.md` — per-session pickup-and-resume artifacts

**Data ledger**: `projects/coding-projects/active/etanah-knowledge/melaka/organize-progress.json` (lives with the corpus it organizes)

**Activation skill**: **Bankai 蒼穹宝典** (Sōkyū Hōten / Azure Heaven Codex). Canonical format in `feedback_bankai_format.md`.

**Phases**:
- Phase 1 — Alpha — Loop-categorize all sections via 2 parallel familiars
- Phase 2 — Beta — Office-day verify flags (DB, codebase, flowable)
- Phase 3 — Design — Render as Claude Design artifact / website

**Current state** (2026-05-14): alpha-1 done. 115 items categorized. ~48 flags for Phase 2 office-day resolution.

**Resume**: read the most recent handoff file under the project folder.

---

## Merged 2026-10-04: Aunt's slides project (future) (was project_aunt_slides.md)

> Help Miya's aunt create better presentations using Claude + Marp. Low priority — after current codebase project.

Miya wants to help his aunt save time on presentations. Plan: use existing slides as input, Claude + Marp to create better ones. Export to HTML/PowerPoint.

Tool: Marp (Markdown-based presentation tool) + Claude Code. Reference: freecodecamp.org guide on Claude Code + Marp.

Future: Miya also plans to build an app for one of his aunt's projects. Requirements not yet gathered.

**Why:** Personal/family project. Miya offered to help.

**How to apply:** Low priority — don't surface unless Miya brings it up. When ready, create as a project in MemoryCore's projects/ system.

---

## Merged 2026-10-04: QA-255773 SPOC + Flowable knowledge (was project_qa_255773_spoc.md)

> Pointer to held #255773 investigation — triggers on "SPOC integration", "flowable silent-swallow", "PLTP mirror-copy", "pihak_bkptg not copying

QA-255773 is HELD and passed to colleague on 2026-04-16 afternoon. Knowledge is captured in `quest/handoff-255773.md` (comprehensive) + plan at `C:\Users\Ridhwan\.claude\plans\serialized-shimmying-valiant.md`. DATABASE.md §2b has the authoritative pemohon answer.

**Why:** The ticket surfaced a real SPOC mirror-copy bug: `SpocIntegrationServiceTask.java:120-124` silently swallows any exception from `PelupusanSpocService.populateAndCreateAppEntry` via `catch (Exception ex) { LOGGER.debug(ex); }`. Mirror pattern confirmed 2× on FAT: `hkmlk` row copies OK, `pihak_bkptg` + `permohonan_tnh` rows FAIL. H1 (@Transactional theory) was invalidated Thu 2026-04-16. H5 (repository queries silently return empty — `@Where`/`@Filter` annotations on domain entities) is current leading hypothesis. Wall: domain entity JAR source not accessible for static inspection.

**How to apply:** When みや mentions any of — "SPOC integration", "SpocIntegrationServiceTask", "flowable silent-swallow", "PLTP mirror-copy failure", "pihak_bkptg not copying", "QA-255773 resumed", or the colleague reports back on the ticket — immediately load `quest/handoff-255773.md` BEFORE proposing anything. Do NOT re-investigate from scratch. The "Ruled out / don't re-chase" section is load-bearing — H3 (flowable never started), `umm_a_pemohon` table (doesn't exist), AWAM-side helper class, and the 35s delay path are all dead ends that cost real time. H5 is the live thread; needs JAR source or live Eclipse remote-debug on FAT to advance.
