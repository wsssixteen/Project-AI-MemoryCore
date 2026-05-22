---
name: system-design
description: Apply System-Design Discipline when designing OR evaluating ANY system component — rule, skill, hook, memory entry, knowledge file, protocol, automation, format. Triggers on adding / refining / removing / auditing any such component, or any "should we build or change X" system-change request.
allowed-tools: Read, Grep, Glob, Edit, Write
---

# system-design — System-Design Discipline

> When designing OR evaluating ANY system component, do NOT design reactively from the latest slip. Architecture-first, evergreen-anchored.

## Step 0 — Refine before introducing (THE GATE)

When tempted to add a new workflow / file / skill / ritual, FIRST prove the existing mechanism cannot be extended. Document: *(a)* which existing thing is being refined, *(b)* what changes, *(c)* why refinement isn't sufficient. Only if no existing mechanism covers the work — and it's truly distinct in shape OR actor OR evidence-type — does a new mechanism land. Every proposed addition emits a "Refines-X / Net-new-because-Y" line in its Design Memo. If both can be argued, **refine wins by default**.

*Why: reactive per-slip additions cost weeks of bloat (quest-protocol → 595 lines; feedback files → 30+).*

## Step 1 — Identify decomposition seams (architecture first)

- **etanah work**: framework-layer matrix (Java validators/services, JSF/PrimeFaces, Java config/Template Method, .docx + Word CC, config.json, SQL/Hibernate, Spring DI, Flowable BPMN)
- **MemoryCore**: tier (Memory/Personality/Forge/Domain Expansion/Quest/Session) + file role (identity/boot/working/knowledge/feedback/protocol)
- **Skills**: trigger phrases + behavior + output format + lifecycle
- **Hooks**: event source + condition + action + side-effect scope
- **Memory entries**: type (user/feedback/project/reference) + canonical home + supersedes-what
- **Knowledge files**: SCOPE + NOT FOR + framework-skeleton-then-grow

## Step 2 — Apply relevant evergreen principles (pick subset; don't force)

SRP/SoC, OCP, ISP, DIP (OO/structured components) · DRY (esp. memory/rules) · YAGNI · KISS · Composability · Convention-over-Config · Postel's Law (lenient triggers, strict outputs).

## Step 3 — Validate (whichever applies)

- **Past-case pressure-test** (past cases exist) — ≥3 cases, diverse types. <50% benefit = layer-specific, not universal.
- **Failure-mode analysis** (net-new) — list 3+ ways it could fail / be misapplied.
- **Spike-on-one** (net-new) — apply to one real case end-to-end before generalizing.
- **Negative-test** — when should this NOT fire? Make explicit.

## Step 4 — Pick shape: universal-or-modular, no middle-ground bloat

- **Universal**: thin core + per-trigger entry points, broad applicability (e.g. Refine, Domain Expansion).
- **Small-scoped modular**: one clear job done well (e.g. env-check, familiar).
- **Banned — middle-ground bloat**: duplicate engines with scattered triggers + hidden overlap. If two candidates could share an engine, they should (universal). If genuinely different jobs, each stays modular.
- State which shape + why in the Design Memo.

## Step 5 — Type-specific sub-checks (only for types with documented past failures)

- **New skill**: name-conflict grep + trigger-overlap check + what it replaces + **naming-tier check**:
  - **Tier 1 — Signature skill** (identity-tier ritual, Japanese name): `<EnglishName>` + emoji + `<Japanese-name>` (e.g. Domain Expansion 💠 るり結界). Format locked / sacred.
  - **Tier 2 — Major skill / Feature / top-level framework**: `Capital-Hyphenated` (e.g. System-Design, Quest, Session-Briefing). `Feature/` folders follow this.
  - **Tier 3 — Sub-skill / small-scoped modular**: `lowercase-hyphenated` (e.g. env-check, familiar, verify). `.claude/skills/` folders follow this.
- **New memory entry**: canonical home + supersedes-what (don't pile).
- **New rule**: which past slip(s) it would have caught + which past tickets it'd be dead weight on.
- **New MD file — versioning**: protocol/knowledge/skill files → frontmatter or footer `version: X.Y` + `last_updated`. Multi-phase docs → section-level timestamps. Transient state (`current-session.md` / `todo.md` / `active.txt`) → no file-level versioning.

Other addition types (hook, agent, knowledge, protocol, automation, format): apply Steps 0-4 + 6 only.

## Step 5b — v1 always confirms before acting

When creating any system (skill, tool, automation, hook, ritual), **v1 ALWAYS requires みや's explicit confirmation before acting** — no auto-fire / auto-apply / auto-trigger in v1. Automation candidacy starts v2+ only after v1 shipped + used ≥3 real cycles + みや explicitly approved automation. Every Design Memo's `Success measure` states "v1 has confirmation; automation candidacy at v2+ after ≥3 cycles."

## Step 5c — Output-Format Discipline (TABLE + SoC mandatory for new output formats)

New child rituals (Predicate Box / Refine Block / Design Memo / Recon / Rubric / new formats) inherit:

| Sub-rule | What it means |
|---|---|
| `table-default` | Emit as raw markdown table — NO triple-backtick wrap. Fence is for code / diff / shell output ONLY. The `═══ HEADER ═══ … ═══ END ═══` banners are plain-text delimiters; the table sits between them. |
| `soc-mandatory` | Don't jam multiple topics in one cell. A row covering ≥2 concerns gets extra COLUMNS or ROWS. Information density ≠ clarity. |

State a new skill/format's PURPOSE once at creation (in the Refine Block / Design Memo `Why` field) — not as a column in every emit.

## Step 6 — Evaluation lens for EXISTING designs (audit / retrospective)

- Is it firing when expected?
- Is it being followed (or silently dropped)?
- Is it producing measurable value (or ceremony)?
- Are there superseded-but-still-present rules to retire?

## Sub-rituals — Design Memo & Refine Block

Refine + Design Memo are not independent skills — they are the OUTPUT FORMATS of System-Design Discipline applied. Both inherit Steps 0-6. Both emitted INLINE in chat at the moment of change, as raw markdown (no code-block wrap), so みや can scan + course-correct in real time.

| Tier | Component | When fired |
|---|---|---|
| Tier 2 — Major skill | **System-Design Discipline** | Designing OR evaluating any system component |
| Tier 3 — Sub-ritual (net-new) | **Design Memo** | Net-new additions — output at point of creation |
| Tier 3 — Sub-ritual (update) | **Refine Block** | Updates to existing components — output at point of update |

### Design Memo — for net-NEW additions

═══ DESIGN MEMO — &lt;addition name&gt; ═══

| Field | Content |
|---|---|
| Type | rule / skill / hook / memory / knowledge / protocol / automation / format |
| Refines-X / Net-new-because-Y | which existing thing is refined OR justification for net-new |
| Decomposition seam | which axis it sits on |
| Evergreen principles applied | subset + why |
| Validation | past-case results / failure-mode list / spike result |
| Shape | universal / modular — reason |
| Naming | conflict-check result + tier (1 signature / 2 Capital-Hyphenated / 3 lowercase-hyphenated) |
| What it replaces / supersedes | list or "net-new" |
| Success measure | how we know it works in 30 days (incl. "v1 has confirmation; automation candidacy at v2+ after ≥3 cycles") |
| Time to implement | minutes / hours / multi-session |

═══ END ═══

### Refine Block — for protocol UPDATES

═══ REFINE — &lt;rule name&gt; ═══

| Field | Content |
|---|---|
| Slip | what went wrong — concrete observation, name the case/ticket |
| Diagnosis | root cause — why the slip happened, what gap allowed it |
| Before | CURRENT state of the rule/file being refined — verbatim quote or file:line snippet |
| Fix | the protocol change applied, with canonical home path |
| Pressure-test | past cases this would have caught + future failure-modes watched |

═══ END ═══

## Contract Verification Table — cross-cutting sub-ritual (Scout / Recon / Rubric)

**Purpose**: force explicit verification of CONTRACTS (method signatures, return types, EL bindings, field types, persistence write/read paths) per layer touched by a fix — catches name-vs-contract projection slips.

| Ritual | When it fires |
|---|---|
| Scout (Discovery) | early-diagnostic claims a method/binding/source-of-truth → emit with claims as HYPOTHESES |
| Recon (Phase 0 wrap-up) | verifying Scout's claims → each row independently source-traced; promote to verified-with-cite or downgrade to BA-Q |
| Rubric (Phase 1 start) | fix shape touches ≥2 layers OR adds new methods/fields → emit covering every layer touched |

═══ CONTRACT VERIFICATION — &lt;ticket / scope&gt; ═══

| Layer | Claim | Status | Evidence (file:line) |
|---|---|---|---|
| (per layer — VO / persistence-write / persistence-read / EL-binding / config / SAK-source / etc.) | the SPECIFIC contract assumption | HYPOTHESIS / VERIFIED / BA-Q | file:line or DB-query proving it, or "unverified — needs &lt;Action&gt;" |

═══ END ═══

Banned: collapsing the table to "plumbed" / "wired" / "matches pattern". Every layer gets its own row + evidence. Unverified → say "unverified".

## Queued refinements (post-decomposition)

Two approved refinements land here next: (1) **Step 0 extended to removals** — before cutting any component, separate INTENT from IMPLEMENTATION; real intent → default refine, not cut. (2) **A8 "Confirm understanding" pre-step** — when a system-change request leaves interpretation room, restate the interpretation + scope and get a one-word confirm BEFORE the Design Memo.

---

*Distilled from the CLAUDE.md "System-Design Discipline" section, routed out 2026-05-22 (decomposition). Justification-anecdotes pruned — full history in git + `RURI-GROWTH.md`.*
*Version: 1.0 | Last updated: 2026-05-22*
