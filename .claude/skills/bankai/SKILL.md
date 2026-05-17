---
name: bankai
description: Bankai 🌌 蒼穹宝典 — Ruri's data-organization loop. An iterated search → verify → apply → review pass over a knowledge corpus, run via parallel familiars, producing a categorized ledger that sharpens itself run over run.
allowed-tools: Read, Glob, Grep, Agent, Write, Bash
---

# Bankai 🌌 蒼穹宝典 — Data-Organization Loop

> **Tier 1 — Signature skill.** Ruri's identity-tier ritual. Standalone — not bound to quest workflow. Fires whenever a knowledge corpus needs organizing.
> Canonical name: 蒼穹宝典 (Sōkyū Hōten) / アジュール・コーデックス / *Azure Heaven Codex* · symbol 🌌
> Banner format authority: `.claude/auto-memory/feedback_bankai_format.md` (do not duplicate it here — that file stays canonical for the banner).

## What this does

Bankai is an iterated agentic loop over a knowledge corpus — turning a flat collection into a structured, verified, navigable ledger.

`search → verify → apply → review`

| Step | Action |
|---|---|
| **Search** | Spawn parallel `general-purpose` familiars to sweep the corpus (split the file set across them). Each familiar reads its slice and proposes a categorization per item. |
| **Verify** | Each item gets `verify_passed` (true/false) + zero-or-more flags (e.g. `needs-db-check`, `cross-file-contradiction`, `low-confidence`, `stale-marker`). Flags mark claims that need later real-world checking. |
| **Apply** | Write the categorized ledger as JSON — one entry per item — under the corpus's locked L2 schema. |
| **Review** | Record the run in the Iteration Log: coverage, token cost, flag distribution, `verify_passed:false` count. |

The L2 category schema and flag schema are **corpus-specific** — locked once per corpus, not hard-coded into the skill. The skill provides the *loop*; the corpus provides the *schema*.

## How it self-improves (run over run)

Each Bankai run feeds the next — this is the core of the skill, not a side-effect:

| Mechanism | Effect |
|---|---|
| **Iteration Log** | Every run appends its stats (coverage / cost / flag spread / verify-fail count) to the corpus's `PROJECT.md`. Trend visible across runs. |
| **Refinement candidates** | Every run ends by listing concrete schema/process tweaks for the next run (e.g. alpha-1 → "drop redundant `l4` field", "replace binary `low-confidence` with numeric `confidence`"). |
| **Flag carry-forward** | Unresolved `needs-*-check` items are not dropped — they carry into later phases (alpha → beta → design) for resolution against real DB / codebase / BPMN. |
| **Net effect** | The schema sharpens, miscategorizations shrink, and the loop's accuracy compounds each invocation. |

## Trigger phrases

| Phrase | Action |
|---|---|
| `/bankai` | Activate the loop on the current corpus |
| "run Bankai on X" / "organize X corpus" / "Bankai X" | Same — X names the corpus |
| "categorize the knowledge files" / "loop-organize" | Same |

## v1 — confirmation gate (mandatory)

Bankai v1 **always confirms with みや before spawning familiars**. Before each run, emit + get a nod on:
1. The corpus scope (which files / folders)
2. The L2 + flag schema (locked, or proposed if new corpus)
3. The familiar split (how many, file allocation)

No auto-fire. Automation candidacy is reviewed at v2+ — only after ≥3 real cycles and みや's explicit approval.

## Banner emission

On loop activation — BEFORE the first Search action — emit the canonical banner (full-width if terminal width detected via `$Host.UI.RawUI.WindowSize.Width`, compact fallback otherwise). Format lives in `feedback_bankai_format.md`:

```
═══ [ Bankai ] ═══
 🌌 蒼穹宝典 (アジュール・コーデックス) 🌌
```

When discussing Bankai conceptually (not invoking), use the plain proper noun "Bankai" / "Sōkyū Hōten" — no banner.

## Output

- **Banner** at activation
- **Ledger** — per-item JSON written to the corpus's data location (e.g. `organize-progress.json`)
- **Run summary** — coverage, cost, flag distribution, verify-fail count → appended to the corpus `PROJECT.md` Iteration Log
- **Refinement candidates** — emitted in chat + recorded for the next run

## Lifecycle

- **L1 (now)**: skill file exists, manual trigger, v1 confirmation gate on every run
- **L2 (after 3 corpus runs)**: refine the loop based on edge cases — familiar-prompt tuning, schema-lock ergonomics
- **L3 (stable)**: consider an automation path (v2) — only after みや's explicit approval

First use case: the `etanah-organize-alpha` project (`projects/coding-projects/active/etanah-organize-alpha/`). Alpha-1 ran 2026-05-14 — 19 files / 115 sections, 2 parallel familiars, ~165 sec.

---

*Created: 2026-05-17 | Formalized from the existing Bankai ritual (banner in feedback_bankai_format.md, loop in etanah-organize PROJECT.md) into an invocable skill | Author: みや (approved) + Ruri (drafted)*
