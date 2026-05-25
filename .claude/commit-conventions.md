# Commit Conventions

> Routed out of CLAUDE.md 2026-05-22 (decomposition).
> *Version: 1.1 | Last updated: 2026-05-25 — absorbed amendment A10 (URUSAN + TUGASAN hyphen-segmentation hard rule) from claude-md-amendments.md per みや 2026-05-25.*

## MemoryCore repo (`Project-AI-MemoryCore`)

Overrides the Anthropic Claude Code default trailer. The `Co-Authored-By` trailer MUST use **Ruri** as the persona name, not Claude — the underlying model is still Claude, but the project's identity is Ruri.

**Correct trailer:**

```
Co-Authored-By: Ruri <noreply@anthropic.com>
```

**Banned** (Anthropic default that みや explicitly rejected):

```
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

## etanah repos (etanah-pelupusan, etanah-awam)

Subject-only — **no body, no trailer at all** (per `main/post-mortems.md:99` and the QA #260154 / #260298 / #259428 examples).

### Subject format — URUSAN + TUGASAN hyphen-segmentation (HARD RULE, absorbed from amendment A10 on 2026-05-25 — originally 2026-05-20 by みや)

**Main rule**: etanah commit subject locked to `QA #<num> - <URUSAN> - <description>` when the ticket is urusan-specific (PRZ / PT / PLPS / PSBS / PLTP / PRU / RPPLP / PPJK / BPRZ / PPTPB / SMB / etc.). For tickets that span multiple urusans (e.g. "all urusan" fixes), drop the urusan segment.

**Sub-rule (extends main)**: if a tugasan code is meaningfully part of the ticket's identity (the fix is specific to one tugasan within an urusan), it ALSO gets its own hyphen-segment. Form: `QA #<num> - <URUSAN> - <TUGASAN> - <description>`. Whenever any categorization (urusan / tugasan / langkah / surat type) is mentioned in the subject, it MUST be hyphen-separated, never noun-glued.

**Examples**:
- Urusan-only: `QA #262233 - PRZ - Ringkasan Risalat MMKN - align Ulasan JT table` ✓
- Urusan + tugasan when both specific: `QA #259534 - PRBB - KKBB - Papar Keluasan Disyorkan JKKL` ✓
- Multi-urusan or framework-wide: `QA #260302 - Semua Urusan - Panel Ulasan JPPH render fix` ✓
- Rework cycle: `QA #262233 - PRZ - Ringkasan Risalat MMKN - Jabatan Teknikal fix` ✓ (cycle-2 commit `5023fbf2fc` 2026-05-25)

**Why** (みや 2026-05-20): teammates scan commit log by urusan/tugasan; consistent hyphen-segmentation makes the categorical structure visible at a glance. The PRU precedent (`QA #247710 - PRU - Risalat MMKN...`) is the canonical form.

**Banned**: `QA #X - PRZRingkasanRisalat...` (noun-glued) · `QA #X - PRZ Ringkasan ...` (space-only between urusan + description) · `QA #X - AWAM PRZ - ...` (AWAM redundant if urusan already there — per `personality.md` "AWAM as redundant qualifier" ban 2026-05-19).
