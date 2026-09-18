# Agentic / Ticket-Workflow Assessment — 2026-09-18 (ES #279615 rework)

## A1 — Agentic system
- **Gate friction on a trivial change**: a 4-line additive getter (mirror of an in-file sibling returning a constant) tripped ~10 sequential PreToolUse gates — branch-guard ×3, no-code-comments, logic-blast-radius, pre-code-check ×2, plus the deploy gates. Each is a round-trip. audit-briefing corroborates: this session's turns showed 122 s / 76 s of hook time, 438 fires on one turn. The gates are correct in intent but have no fast-path for a provably-inert additive member.

## A2 — Quest workflow
- **branch-at-Apply + branch-guard keyed to the WRONG quest**: the gates named `ADHOC-PT-2026-4` all session while I was working ES #279615, because active.txt's "active" detection is stale (279615 was tracked under a closed `ADHOC-UPP-2026-1` block). The one-shot approval flag had to be written under a wrong quest id. Detection should key to the ticket actually engaged this turn.
- **Deploy-merge divergence catch WORKED**: the deploy-merge-surface gate correctly forced the merge-vs-cherry-pick decision to みや, which surfaced a 116k-line delete + a binary `.docx` collision with #280029. This is the gate doing its job.

## A3 — Debugging efficiency + accuracy
- **Pre-diagnosed win**: latent-bug L8 (2026-09-17) predicted the `isTambahKuantiti` twin-getter crash; the MLIT video confirmed it verbatim → Recon collapsed to one grep. The register paid off.
- **Env-version skew is the real teacher**: cycle-1 verified on staging (no #263304) passed while MLIT (has #263304) still crashed. A fix "verified on staging" is not verified for an env on a different feature build.

## A4 — Etanah issue-solving
- **Sibling-getter pattern** (reusable): a shared JSF composite that reads N boolean flags (`mbb.isX or mbb.isY`) requires EVERY bean mounting it to expose all N getters; a bean missing one throws `PropertyNotFoundException` at render. Bank into JSF knowledge.
- **Env-branch base divergence**: `mlk/int-env` sits on an older release base than a ticket branch cut from release 1.6.1 — a full merge drags the whole release + hits binary conflicts. Cherry-pick is the deploy convention for such env branches (QA-276584 precedent).

## A5 — Sweep / file sweep
- N/A no multi-ticket sweep this session (single rework).
