---
name: QA-255773 SPOC + Flowable knowledge
description: Pointer to held #255773 investigation — triggers on "SPOC integration", "flowable silent-swallow", "PLTP mirror-copy", "pihak_bkptg not copying"
type: project
originSessionId: 03f24485-e93e-4213-9e14-ee5b7ac24326
---
QA-255773 is HELD and passed to colleague on 2026-04-16 afternoon. Knowledge is captured in `quest/handoff-255773.md` (comprehensive) + plan at `C:\Users\Ridhwan\.claude\plans\serialized-shimmying-valiant.md`. DATABASE.md §2b has the authoritative pemohon answer.

**Why:** The ticket surfaced a real SPOC mirror-copy bug: `SpocIntegrationServiceTask.java:120-124` silently swallows any exception from `PelupusanSpocService.populateAndCreateAppEntry` via `catch (Exception ex) { LOGGER.debug(ex); }`. Mirror pattern confirmed 2× on FAT: `hkmlk` row copies OK, `pihak_bkptg` + `permohonan_tnh` rows FAIL. H1 (@Transactional theory) was invalidated Thu 2026-04-16. H5 (repository queries silently return empty — `@Where`/`@Filter` annotations on domain entities) is current leading hypothesis. Wall: domain entity JAR source not accessible for static inspection.

**How to apply:** When みや mentions any of — "SPOC integration", "SpocIntegrationServiceTask", "flowable silent-swallow", "PLTP mirror-copy failure", "pihak_bkptg not copying", "QA-255773 resumed", or the colleague reports back on the ticket — immediately load `quest/handoff-255773.md` BEFORE proposing anything. Do NOT re-investigate from scratch. The "Ruled out / don't re-chase" section is load-bearing — H3 (flowable never started), `umm_a_pemohon` table (doesn't exist), AWAM-side helper class, and the 35s delay path are all dead ends that cost real time. H5 is the live thread; needs JAR source or live Eclipse remote-debug on FAT to advance.
