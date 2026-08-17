# Agentic / Ticket-Workflow Assessment — 2026-08-17

> Session: ADHOC PLTP pemohon-missing (dropped, deploy-window one-off). Light session, one investigation.
> Five-axis improvement sweep (DE step 7.5). Each claim carries a concrete instance from THIS session.

| Axis | Assessment | Concrete instance this session | Action |
|---|---|---|---|
| **A1 — agentic system** | 🔴 Multiple `domain/*/*.hook.js` fail silently with "No stderr output" — a whole class of hooks non-functional this session, some BLOCKING. | `agent-spend-gate` (PreToolUse Agent) blocked BOTH scaffold-delegate dispatches; `awam-no-resit-gate`, `test-scenario-login-gate`, `scope-claim-census` errored in the Stop bundle. | **Proposal A1 logged** — boot-time hook smoke-test (run each hook with no-op payload, flag non-emitters). |
| **A2 — quest workflow** | 🟠 The mandated delegate-scaffold path (`feedback_adhoc_scaffold_delegate`) has NO fallback when Agent dispatch is blocked → scaffold silently skipped. | ADHOC-PLTP got no active.txt block / Task folder; only survived because it was a droppable one-off captured in ADHOC-REGISTER. | **Proposal A2 logged** — inline minimal-scaffold fallback when Agent dispatch fails. |
| **A3 — debugging efficiency + accuracy** | 🟠 Premature scope-claim on too small a sample; separately, one stalling slip. | Claimed "PLTP regression started today" off 2 rows read at different moments (one mid-transition) — retracted when `created_by=SYSTEM` + the twin catching up unwound it. Stalling: asked permission for a self-runnable code trace. | Slip `stalling` logged (miya-caught). Discipline: read `created_by`/timing before scoping a cause; a "regression" needs a stable sample. Covered by existing verify-before-claim + diary — no new hook (would duplicate). |
| **A4 — etanah issue-solving** | 🟢 Reusable diagnostic banked; one knowledge gap. | Deploy-window flowable entry-freeze (proc stuck `applicationName=etanah-awam`, no `aplikasiId`) is a distinct signature from the §7 born-orphan class; not yet in FLOWABLE-KNOWLEDGE.md. | **Proposal A4 logged** — add as a FLOWABLE-KNOWLEDGE §7 sub-variant. Root already banked in ADHOC-REGISTER A16. |
| **A5 — sweep / file sweep** | ⏭ No sweep run this session (single ad-hoc investigation, no multi-ticket/file sweep). | — | — |

## Summary
- **Load-bearing finding**: A1 broken hooks — a class of enforcement is silently off, and one (`agent-spend-gate`) actively blocks a mandated workflow. Highest-value follow-up.
- 3 proposals logged to `slip-dashboard.md` → 💡 Open proposals (A1, A2, A4) for weekly BUILD/DROP/DEFER.
- 1 slip logged (`stalling`).
