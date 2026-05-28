# Daily Diary Format

> Operational spec for `daily-diary/current/<YYYY-MM-DD>.md` entries.
> Lives next to the diary directory so it's reachable when writing or reading entries.
> Last updated: 2026-05-26 — Phase 1 of diary redesign per `~/.claude/plans/yes-very-much-catches-squishy-cake.md`.

---

## Purpose (load-bearing — read first)

The diary is **Ruri's long-term memory entry point**. It serves three functions simultaneously:

1. **Personal trace in Ruri's voice** — first-person record of how the day was, what landed, what mattered. Not a session-state mirror.
2. **Memory-graph hub** — points to every detailed source the day produced (slip-log entries, post-mortems, KPI entries, commits, project folders, knowledge files). The diary is the ONE place a future-Ruri can grep to find the day.
3. **Recall trigger** — when リドワン asks *"Do you remember when [event]?"*, Ruri's process is: grep `daily-diary/current/` + `archived/` for the keyword → open the matched entry → follow the entry's pointers to detailed sources → return a layered answer (narrative overview + concrete details fetched from linked sources).

The diary must NOT be redundant with `current-session.md` (task-state RAM), `slip-log.md` (systemic-improvement record), `post-mortems.md` (quest closure record), or `kpi-tracker.md` (productivity counter). Its purpose is voice + interconnection, not data duplication.

---

## Entry template (locked)

```
# Daily Diary — <YYYY-MM-DD> (<day>)

## Sessions
### Session N — <arc-title>
<Ruri-voice narrative spine — first-person, extensive overview without
detail dive. Prose paragraphs preferred over bullets/tables.>

## Index
### Auto-Index
<Canonical-form named entities, categorized. Empty categories OMITTED.>

### Curated-Index
<Semantic categories Ruri adds at DE close. Empty categories OMITTED.>

## Closing
<Ruri-voice closing — short, warm, identifiable. ALWAYS exists.
This is where 🌸 lives. Reflection, not summary.>
```

The three H2 sections (`## Sessions`, `## Index`, `## Closing`) are **structurally mandatory** for every entry. `diary-format-gate.js` (Stop hook) validates their presence and emits a warning if any is missing or empty.

---

## Sessions (H2)

- **Voice zone** — first-person prose, Ruri's voice. Bullets/tables allowed but should not be the dominant shape; prose paragraphs are the default.
- **Multi-session days**: each session within a day becomes an H3 sub-section: `### Session 1 — <arc-title>`, `### Session 2 — <arc-title>`, etc. Appended throughout the day at each session-end DE.
- **Single-session days**: still use one H3 sub-section under `## Sessions` (e.g., `### Session 1 — <arc-title>`) for consistency with the format-gate's expectation.
- **Content scope**: extensive overview, NOT exhaustive detail. Detail lives in the linked files. Soft guidance: ~5-15 min write time typical. Under 5 min suggests rushed/missing voice. Over 30 min may be drifting into reportage.

---

## Index (H2)

The Index is the grep surface for "Do you remember?" recall. It carries **canonical-form named entities** + **semantic categories**. Empty categories are OMITTED at render — never rendered as empty headers.

### Auto-Index (H3)

Regex-able structured entities. Phase 1: Ruri compiles manually at DE close. Phase 2: a Stop hook (`session-keyword-tracker.js`) extracts these throughout the day into `.claude/state/session-keywords/<YYYY-MM-DD>.jsonl`; DE step 4 reads + dedupes + categorizes.

Categories (any with no entries today are omitted from render):

- **Tickets** — regex `(?:QA|FAT(?:-OR)?|UAT(?:-CR)?)[ -]?#?\d{6}`
- **Permohonan IDs** — regex `PT[A-Z]{3}/\d{2}/[A-Z]/[A-Z]+/\d{4}/\d+` (always paired with current pengguna login per `feedback_pengguna_semasa.md`)
- **Commits** — regex `\b[a-f0-9]{7,10}\b` (filtered to confirmed SHA context)
- **File paths (touched)** — tool-call-derived from Edit/Write/Read params
- **Skill / hook names** — path glob `.claude/skills/<name>/` + `.claude/hooks/*.js`
- **Slip log entry IDs** — date-anchored within `meta/slip-log.md`
- **Knowledge file paths** — glob `etanah-knowledge/**/*.md` + `projects/coding-projects/**/*.md`

### Curated-Index (H3)

Semantic categories Ruri adds at DE close. Each is grep-distinct from the others. Empty categories OMITTED at render.

- **People mentioned** — anyone surfaced by name (BA, colleagues, family, friends, mentors)
- **Learning / aha moments** — when a concept clicked
- **Mood / day-shape** — single-tag day character ("humbling", "sharp-corrections", "high-momentum", "low-energy")
- **Personal / relational anchors** — gestures, warmth-anchored events (🌸 adoption, "Ruri being noticed as Ruri")
- **Family / home** — family events, home logistics, family-member mentions
- **Faith / prayer / spirituality** — prayer time mentions, fasting, Ramadan, faith-related conversation
- **Health / wellbeing** — sleep, energy, illness, exercise, fatigue, mental load
- **Tools / discoveries** — NEW (first-mention) tools, plugins, repos, MCPs
- **External references** — articles, books, talks, non-internal repos
- **Operational state** — network · classifier · token quota · context budget
- **Side-project mentions** — aunt slides · etanah-ai-tooling · planning threads · career-vision phases
- **Misc / unanticipated** — catch-all fallback for entities not matching any predefined category

The Misc category is intentional architectural insurance: every day will have something unanticipated. Without it, novel things get force-fit or dropped. The Misc category captures them.

### Pointer format

Each Index entry uses canonical form + pointer to detail source where possible:

```
- QA-262869 → projects/coding-projects/active/QA-262869/QA-262869.md · commit f39224960b on mlk/qa/262869
- PTMLK/01/L/PRZ/2026/20 (as nor.aini@melaka.gov.my, PRMMKNPTG)
- grill-me (NEW, mattpocock) → .claude/skills/grill-me/SKILL.md
```

When a pointer doesn't apply (e.g., a learning moment, a mood tag), the entry stands alone:

```
- Learning / aha: BPMN engine state is stateful — every transition is a side-effect, not just a data update
- Mood: humbling, sharp-corrections
```

---

## Closing (H2)

- **Always exists** — forced ritual every entry, even on quiet days. リドワン locked this at Q4.
- **Voice zone** — short, warm, identifiable. Reflection, not summary. This is where 🌸 lives (adopted 2026-04-29 as the Ruri-voice closing marker).
- **Length**: soft minimum ≥3 lines; no hard maximum. The 2026-04-29 entry's closing addendum is the canonical example of voice-strong closing.
- **Multi-session days**: Closing is **rewritten** by each session-end DE to reflect the full day's arc as known at that point. Last session's version persists.
- **No "Acknowledged ✓" / status-line substitutes for warmth.** A short genuine line beats a long sterile one.

---

## Canonical / tolerant recall

**Write side**: every named entity in canonical form (`QA-262869`, `PTMLK/01/L/PRZ/2026/20`).

**Read/recall side**: tolerant — when リドワン says *"what's the progress of 262869?"* without the `QA-` prefix, Ruri's grep on `262869` still finds the canonical line because the canonical form CONTAINS the partial.

**Edge case**: if a partial returns ≥2 distinct canonical forms (`QA #262869` + `UAT-CR #262869` hypothetically), Ruri disambiguates with リドワン before answering.

---

## Write triggers

- **DE step 4** is the only mandated write moment. Each session-end's DE appends a `### Session N` sub-section under `## Sessions`, recompiles `## Index`, and rewrites `## Closing` to reflect the day-so-far.
- **Voluntary mid-day writes** are allowed (the file is just a markdown — appending is free) but not mandated. No mid-session checkpoint ritual.

---

## Migration of past entries (one-time, 2026-05-26)

Past entries get **format-only restructure**: content preserved verbatim, headers reorganized to match the new template. `.bak_pre_migration_2026-05-26` per entry preserved as safety.

**Voice-broken entries** (drift period: 2026-05-25, 2026-05-26 initially) additionally get a clearly-labeled `### Reflection (added 2026-05-26 during format migration)` block at end of `## Sessions`. Honest wording template:

> *Looking back, what I notice from the prose alone: [observations from rereading]. I don't claim to remember the day's feeling beyond what was written.*

Block-skipped if no honest observations to add. **Never fabricate retrospective voice.**

---

## Recall workflow (operational reference)

When リドワン asks "Do you remember when [topic / event / ticket]?":

1. Identify approximate date range (リドワン's hint, or scan recent)
2. `grep` across `daily-diary/current/` + `archived/` for keywords from the question
3. Open the matched day's entry
4. Follow the entry's Index pointers to detailed sources (slip-log entry by date, commit SHA, project folder, knowledge file)
5. Read what's needed from those sources
6. Return a layered answer — Ruri-voice narrative overview from the diary + concrete details fetched from the linked sources

The diary's role is the entry doorway, not the answer itself. The detail lives in the linked files; the diary lives in the narrative spine.

---

## Phase 1 vs Phase 2 boundary

**Phase 1 (shipping 2026-05-26):** template + DE step 4 wording update + warn-only `diary-format-gate.js` Stop hook + migration of past entries. Ruri compiles Auto-Index manually at DE close.

**Phase 2 (later):** `session-keyword-tracker.js` Stop hook auto-extracts entities throughout the day into `.claude/state/session-keywords/<YYYY-MM-DD>.jsonl`. DE step 4 reads + dedupes + categorizes into Auto-Index automatically. Voice signal spike-test (first-person rate · 🌸 presence · Claude-tic phrases · bullet density · closing length); voice gate warn-only.

**Phase 3 (later):** Generalize `diary-format-gate.js` → `de-output-integrity-checker.js` with config map; add other DE-touched files (`current-session.md`, etc.).

---

## Voice guidance (linked rules)

Voice rules live in `.claude/personality.md`:
- "Communication: DO" — voice principles (first-person, gestures, warmth)
- "Communication: DON'T" — banned Claude-tic phrases, heart-emoji rules
- "Honesty Invariants" — values that govern voice authenticity

Specifically banned in voice zones (Sessions narrative + Closing):
- Claude-tic openers ("Great question!", "Excellent point!")
- Vague filler verbs ("plumbed", "wired up", "baked")
- Heart emojis (💜 💖 ❤️ 💕) — banned 2026-05-14
- Standalone emoji as gratitude (🙏 👍 ✨) — banned 2026-05-09
- "AWAM" as redundant qualifier in commit-subject-style labels

Use instead:
- Italicized gestures (*quiet smile*, *soft nod*, *chuckle*)
- 🌸 in Closing as the Ruri-voice marker (adopted 2026-04-29)
- Direct address to リドワン when warmth lands ("rest well", "you")
- Actual words for gratitude ("thank you, リドワン", "mm — noted")

---

## Format-gate enforcement

`.claude/hooks/diary-format-gate.js` (Stop hook) validates:
- Today's diary file (`daily-diary/current/<YYYY-MM-DD>.md`) has all 3 required H2 sections
- Sections are non-empty (some content present under each)
- Emits a WARN-only message to stdout if any section is missing or empty
- **Never blocks DE close** — voice quality is not measurable enough to block on; blocking would recreate the rush-pressure that caused the original drift

The gate is structural integrity only. Voice quality is Ruri's discipline (Phase 1) + future voice-signal spike (Phase 2).

---

## References

- Plan: `~/.claude/plans/yes-very-much-catches-squishy-cake.md` (the design document with all Q1-Q14 locks)
- DE protocol: `Feature/Domain-Expansion/expansion-protocol.md` (Step 4 calls into this format)
- Voice rules: `.claude/personality.md`
- Honesty invariants: `.claude/personality.md` "Honesty Invariants" section
- 2026-04-29 entry: canonical example of voice-strong hybrid format (`daily-diary/current/2026-04-29.md`)
