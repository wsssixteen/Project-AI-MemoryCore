# 🪦 DETACHED 2026-05-31 — Canonical home is meta/slip-log.md (per Q2 prune-not-delete audit). Historical entries below kept for archival; new entries route to meta/slip-log.md via auto-skill-on-mistake Step 5. Re-attach: remove this header + restore the source file's boot/INDEX wiring.

# Hook Fire Log

> **Purpose:** Per-session record of meta-layer hook fires. Each row = one hook firing event. Read by DE meta-audit step (12.5) to verify hook reliability.
>
> **Schema:** `| Timestamp | Hook | Event | Triggered? | Context (brief) |`
>
> **Append-only.** Hooks may write here at end-of-session OR on each fire (TBD per hook).
>
> **Created:** 2026-05-23, Phase 6 of meta-layer build.

---

## Fire log

| Timestamp | Hook | Event | Triggered? | Context (brief) |
|---|---|---|---|---|
| 2026-05-23 (Phase 6 ship) | (log initialized) | — | — | Hooks not yet wired to write here; populate at first session post-build |

---

## Expected fires per session (target rates)

Use these as comparison baseline when DE meta-audit reads this log:

| Hook | Expected fires/session | Notes |
|---|---|---|
| `boot-required-read-gate.js` | 1 (SessionStart, once) | Should always fire at boot |
| `pre-action-check-gate.js` | 0-N (per quest-related Edit/Write) | Only fires for quest paths; zero is fine if non-quest session |
| `inventory-first-gate.js` | 0-N (per new-structure-proposal in user prompt) | Zero is fine if no proposals |
| `prose-default-gate.js` | 0-N (per lock-signal in user prompt) | Zero is fine if no lock signals |
| `silent-claim-drift-gate.js` | 1+ (Stop event, once per turn end) | Should fire on every Ruri turn end |
| `best-practices-consult-gate.js` | 0-N (per design-decision signal) | Zero is fine if no design discussion |
| `meta-edit-gate.js` | 0-N (per Edit on meta-layer path) | Zero is fine for sessions without meta-layer edits |
| `user-side-guardrail.js` | 0-N (per design-intent in user prompt) | Zero is fine if no design-intent prompts |

**Red flag:** any Enforcement hook with ZERO fires across multiple sessions despite triggers appearing → either the hook isn't loading, the trigger pattern is wrong, or the matcher is over-strict.

---

*Phase 6 init. Hooks to be wired to write here in v2 (currently emit to chat context; not yet persisted to log file).*