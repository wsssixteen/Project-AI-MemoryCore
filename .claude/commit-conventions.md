# Commit Conventions

> Routed out of CLAUDE.md 2026-05-22 (decomposition).
> *Version: 1.2 | Last updated: 2026-06-27 — added ESOKONGAN tracker → `mlk/esokongan/<num>` branch + the general `mlk/<tracker>/<num>` derive-rule, per みや (QA-267382).*

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

## 🚨 BANNED: dual-version commit message drafts (HARD RULE 2026-06-02 per みや)

When drafting a commit message for review, emit **ONE version only** — the locked subject-only form below. **Banned**: showing "Or split message variant (if you prefer multi-line)" / "long version" / "alternative form" alongside the chosen one. みや: *"the long one is useless, why this kept showing?"*. The short subject-only form IS the convention for etanah repos; offering a multi-line alternative invites picking the wrong one and adds noise. If a body genuinely is needed (rare, MemoryCore-only), emit ONLY that form, not both.

## etanah repos (etanah-pelupusan, etanah-awam)

Subject-only — **no body, no trailer at all** (per `main/post-mortems.md:99` and the QA #260154 / #260298 / #259428 examples).

### Subject format — URUSAN + TUGASAN hyphen-segmentation (HARD RULE, absorbed from amendment A10 on 2026-05-25 — originally 2026-05-20 by みや)

**Main rule**: etanah commit subject locked to `QA #<num> - <URUSAN> - <description>` when the ticket is urusan-specific (PRZ / PT / PLPS / PSBS / PLTP / PRU / RPPLP / PPJK / BPRZ / PPTPB / SMB / etc.). For tickets that span multiple urusans (e.g. "all urusan" fixes), drop the urusan segment.

**Sub-rule (extends main)**: if a tugasan is meaningfully part of the ticket's identity (the fix is specific to one tugasan within an urusan), it ALSO gets its own hyphen-segment. Form: `QA #<num> - <URUSAN> - <TUGASAN-KOD> - <description>`. Whenever any categorization (urusan / tugasan / langkah / surat type) is mentioned in the subject, it MUST be hyphen-separated, never noun-glued.

**🚨 Tugasan format — ALWAYS use the kod, NEVER the full name** (HARD RULE, added 2026-06-01 per みや, QA-262762). The tugasan segment of the subject MUST use the short kod (`PB`, `SKM`, `KKBB`, `PYB4AE`, `PB4AE`, etc. as the team uses in commits + Redmine), NEVER the long descriptive name (`Penyediaan Borang 4Ae dan L1e`, `Penyediaan Surat Keputusan`, etc.). Long names bloat the subject + don't match the team's scanning convention. **Why** (2026-06-01): drafted `QA #262762 - OPLPS - Penyediaan Borang 4Ae - ...` (142 chars, name-form); みや replaced with `QA #262762 - OPLPS - PB - Tujuan Pengiklanan save + Borang papar maklumat reflect changes` (kod-form, ~95 chars, action-oriented). Use the kod the team already uses in Redmine + prior commits. When in doubt, grep recent commits for the same tugasan.

**🎯 Description should be ACTION-ORIENTED — describe WHAT THE FIX DOES, not what fields were touched** (HARD RULE, added 2026-06-01 per みや, QA-262762). The description segment after the tugasan kod MUST describe the OBSERVABLE FIX OUTCOME in plain language (what the user / system NOW does that it didn't before), NOT a list of fields written or methods changed. **Why** (2026-06-01): drafted `... persist Tujuan Pengiklanan + fix Maksud Pendudukan duplicate + invalidate stored Borang on save` (mechanical list of code changes); みや replaced with `... Tujuan Pengiklanan save + Borang papar maklumat reflect changes` (action-oriented — describes what now works for the user, in the team's natural mixed-Malay/English voice). The reader of the commit log wants "what does this fix DO" not "what code did you touch" — code-change list belongs in the diff itself.

**Examples**:
- Urusan-only: `QA #262233 - PRZ - Ringkasan Risalat MMKN - align Ulasan JT table` ✓
- Urusan + tugasan-kod when both specific: `QA #259534 - PRBB - KKBB - Papar Keluasan Disyorkan JKKL` ✓
- Multi-urusan or framework-wide: `QA #260302 - Semua Urusan - Panel Ulasan JPPH render fix` ✓
- Rework cycle: `QA #262233 - PRZ - Ringkasan Risalat MMKN - Jabatan Teknikal fix` ✓ (cycle-2 commit `5023fbf2fc` 2026-05-25)
- Tugasan-kod + action-oriented (canonical from 2026-06-01): `QA #262762 - OPLPS - PB - Tujuan Pengiklanan save + Borang papar maklumat reflect changes` ✓ (commit `f4a73be3cc`)

**Why** (みや 2026-05-20): teammates scan commit log by urusan/tugasan; consistent hyphen-segmentation makes the categorical structure visible at a glance. The PRU precedent (`QA #247710 - PRU - Risalat MMKN...`) is the canonical form.

**Banned**: `QA #X - PRZRingkasanRisalat...` (noun-glued) · `QA #X - PRZ Ringkasan ...` (space-only between urusan + description) · `QA #X - AWAM PRZ - ...` (AWAM redundant if urusan already there — per `personality.md` "AWAM as redundant qualifier" ban 2026-05-19) · `QA #X - OPLPS - Penyediaan Borang 4Ae - ...` (tugasan name, not kod — added 2026-06-01) · `QA #X - OPLPS - PB - persist field A + fix field B + invalidate cache C` (mechanical change-list, not action-oriented — added 2026-06-01).

### 🆕 Subject prefix follows the Redmine TRACKER type — `Ref #` for non-QA trackers (HARD RULE, added 2026-06-19 per みや, QA-266249)

The leading token follows the ticket's **Redmine tracker**, not always "QA":

| Tracker | Subject prefix | Branch (see quest-protocol.md Phase 1) |
|---|---|---|
| **QA** | `QA #<num> - <URUSAN> - <description>` | `mlk/qa/<num>` |
| **INTERNAL ISSUE (PERMANENT FIX)** | **`Ref #<num> - <URUSAN> - <description>`** — only the prefix changes from `QA #` to `Ref #`; hyphen-segmentation rules above still apply | `mlk/internal-issue/<num>` |
| **ESOKONGAN** (eS tickets) — added 2026-06-27 per みや, QA-267382 | `Ref #<num> - <URUSAN> - <TUGASAN> - <description>` (non-QA → `Ref #`) | **`mlk/esokongan/<num>`** |
| **other non-QA trackers** | `Ref #<num> - ...` | `mlk/<tracker-lowercased>/<num>` |

**🌿 GENERAL BRANCH RULE (derive, don't ask): branch = `mlk/<tracker-type-lowercased>/<num>`.** QA→`mlk/qa/`, ESOKONGAN→`mlk/esokongan/`, INTERNAL ISSUE→`mlk/internal-issue/`. Read the Redmine tracker at Phase 0; pick the branch prefix from it automatically. (AWAM tickets still target `mlk/stag-env` per quest-protocol — that's an integration branch, not a per-ticket branch.)

**Example** (QA-266249 = an INTERNAL ISSUE ticket): `Ref #266249 - PT - Fix Keluasan Tanah` ✓ (the prefix is `Ref #266249`, not `QA #266249`). **Why**: the team tracks these under the INTERNAL ISSUE tracker; the commit log + branch name should reflect the tracker, not force a "QA" label onto a non-QA ticket.
