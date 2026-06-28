# Power: quest-doc-freshness

**Layer**: hook-only (Stop) · **REPORT-ONLY** (advisory, never blocks) · **Created** 2026-06-28 (みや)

## What it does
Keeps the active quest's `qa_doc` fresh **on the fly**. After each reply during an `active` quest, if the reply looks **state-changing** (a finding / decision / fix / verification / test-data / phase) but the `qa_doc` was **not written this turn**, it nudges: spawn a familiar to persist the change now — before context evaporates.

## The gap it closes
The QA-NNNN.md rule already says "save after every stop, spawn a familiar" — but it's a *discipline* (skippable). This is the **deterministic trigger** for it: detect the un-persisted state-change. (Same save-gap / curse-of-knowledge class as the `resume-readiness` gate, but caught *during* the work, not at hold/DE.)

## Honest limit
A hook **cannot author** the qa_doc content — only the model can. So this Power is *detect (hook) → write (familiar)*. It flags; I spawn the familiar to write properly.

## Contract
- **Fires**: Stop (after every reply).
- **Gates**: only when the single `status=active` quest has a `qa_doc`.
- **Flags** when: reply matches the state-change signal regex AND the `qa_doc` mtime is older than 120s (i.e. not written this turn). If no transcript is available, falls back to mtime-only.
- **Silent** otherwise (discussion turns + just-written docs = no churn).

## Files
- `quest-doc-freshness.discipline.hook.js` — the Stop hook
- `log.jsonl` — one line per fire (`flagged` true/false), system-rules Rule 5

## Trigger-timing (system-design Rule 8)
Stop, gated to active-quest + state-change + stale-doc — NOT "every reply" literally (that would churn the doc on discussion turns).
