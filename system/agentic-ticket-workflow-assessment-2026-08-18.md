# Agentic / Ticket-Workflow Assessment — 2026-08-18 (QA-275475)

Session: single-ticket, solo (no fan-out). Fix = 11-line deletion; StaleObjectStateException on a flowable serviceTask.

## A1 — Agentic system
- **No delegation this session** (single trivial fix). ⏭ no fleet to critique.
- **Instance — gate friction on a trivial deletion**: an 11-line pure deletion took **4 blocked gate round-trips** (predicate-box → logic-blast-radius → pre-code-check malformed → pre-code-check missing-6-checks) before the Edit landed. The full 22-row CODE-CHECK + logic-blast matrix + sibling-diff is calibrated for additive stateful-flow edits; a deletion of a dead write carries far less risk yet paid the full toll. Real cost: ~4 extra turns.

## A2 — Quest workflow
- **Resume on a "not drafted" ticket worked**: `/quest resume 275475` correctly fell through to a fresh `redmine-sync` + Phase 0 start (no local block existed). No gap.
- Scope discipline held: issue #1 (batal /17) correctly kept out of scope (Hasil team) — the ticket-load echo surfaced the routing.

## A3 — Debugging efficiency + accuracy
- **Instance — toolchain false-blocker**: first reported the build "blocked on missing JDK8" from the `mvn` error `Non-existing JDK home E:\Java\java8`. The pom actually requires a **JDK17** toolchain; the JDK8 line was a stale global ref. Cost: one wrong "blocked" report before reading the pom's real requirement. Lesson: read the pom's `<toolchains>` version requirement before naming the missing JDK.
- **Positive**: the data-loss verification used a live row-level before/after comparison (new fixed permohonan vs old siblings) — the right evidence class for a removal, settled it in one query.

## A4 — Etanah issue-solving
- **Instance — new bug pattern**: a flowable `<serviceTask>` (`mlkPelupusanPermohonanService`) persisted a derived cache key (`pjbtPermohonan`) into `umm_aplikasi.mklmt_tmbhn`; under concurrency the save lost the optimistic-lock race → `StaleObjectStateException` → submit rollback → stranded permohonan / no receipt. The persisted value has **0 readers** — a pure liability. Worth a BUG-BESTIARY entry + a check: "a flowable serviceTask that WRITES the aplikasi is a concurrency-clash candidate; confirm the write is needed and read somewhere."

## A5 — Sweep / file sweep
- ⏭ single ticket, no sweep.

## Gap-sweep knowledge candidates (defer-write to keep this session's commit clean)
1. BUG-BESTIARY: "flowable serviceTask unnecessary aplikasi-write → StaleObjectStateException during submit" (this ticket).
2. DEV-TESTING-HACKS: etanah-pelupusan CLI build needs a **JDK17** toolchain; `mvn --global-toolchains <file>` with a `<version>17</version>` → `C:\Program Files\Java\jdk-17` compiles offline.
