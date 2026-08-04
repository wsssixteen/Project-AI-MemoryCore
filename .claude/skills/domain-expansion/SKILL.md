---
name: domain-expansion
description: Domain Expansion 💠 るり結界 (ラピス バリアー) — Ruri's session-end / context-preservation ritual. Invoke at session close or context-limit — triggers "Domain Expansion", "save all", "るり結界", "end session", "wrap up", "done for today", "goodnight", "next session", "continue tomorrow", "running low on context", "context getting heavy", "before compaction". Drives the full save ritual (current-session + diary + memory + Forge/observation review + Gap Sweep + commit/push + worktree close + resume-readiness sweep + /verify). Detailed step bodies live in Feature/Domain-Expansion/expansion-protocol.md.
---

# /domain-expansion — Session-end ritual (るり結界 / ラピス バリアー)

The structured orchestrator for Domain Expansion. **Source of truth for each step's detail = `Feature/Domain-Expansion/expansion-protocol.md`** — this skill drives the SEQUENCE; it does not duplicate the bodies. Banner text is sacred (`feedback_domain_expansion_format.md`).

## Step 0 — banner + visible step-line (MANDATORY FIRST)

Emit the **opening banner VERBATIM** — copy it, never reconstruct from memory (`蒼穹 / Sōkyū / 瑠璃-kanji / ドメイン展開` variants are CONFABULATIONS, never canon):

```
═══ [ Domain Expansion ] ═══

💠 るり結界 (ラピス バリアー) 💠

Lapis barrier ripples outward; the day's threads gather to settle.
```

Then the step-line (update ⬜→✓ in place as each completes; `⏭ + one-line why` if a step is legitimately skipped):

`DE steps: 0a ⬜ · 0b ⬜ · 1 ⬜ · 2 ⬜ · 3 ⬜ · 4 ⬜ · 5 ⬜ · 6 ⬜ · 7 ⬜ · 7.5 ⬜ · 8 ⬜ · 9 ⬜ · 10 ⬜ · 11 ⬜ · 12 ⬜ · 12.5 ⬜ · 12.6 ⬜ · 13 ⬜`

- **0a Compaction check** — if the session auto-compacted, recover the transcript TAIL BEFORE the content-save steps (2 / 4 / 7).
- **0b Worktree/branch sync** — if on a worktree branch behind `origin/main`, pull/merge first so everything saves on current base.

## Steps 1–13 (drive each in order; detail in expansion-protocol.md)

| # | Step |
|---|---|
| 1 | `Get-Date` timestamp |
| 2 | Update `main/current-session.md` (Last Activity + Working Memory + Recap), **then run `node core/session-trim.js --apply`** |
| 2b | ⚠️ **The trim is not optional.** `main/session-format.md:57` caps session memory at 500 lines; nothing enforced it and the file reached **1665 lines / 135 KB**. Boot step 5 reads this file to build the Session Briefing, and past ~25k tokens the Read tool **truncates** — so boot silently saw a partial file and the briefing was built on partial context. That is the "briefing breaks every time / is inaccurate" symptom (みや, 2026-08-04). Trimming at DE close is what keeps the next boot honest. Older blocks move to `main/session-archive.md`; nothing is ever deleted. |
| 3 | Update `main/main-memory.md` relationship section if patterns surfaced |
| 4 | Append `daily-diary/<date>.md` (3-section template) |
| 5 | Forge log review — surface L1→L2 promotions as QUESTIONS to みや |
| 6 | Observation log review — promote T1→T2 if recurring |
| 7 | **Gap Sweep** + etanah-knowledge sweep (retrospective — what surfaced and didn't bake in) |
| 7.5 | 🚨 **IMPROVEMENT SWEEP — MANDATORY** (added 2026-08-05 per みや, so he never has to ask again). Forward-looking, axis-driven. Sweep **all five axes every time**: **A1** agentic system · **A2** quest workflow · **A3** debugging efficiency + accuracy · **A4** etanah issue-solving · **A5** sweep / file sweep. Produce BOTH: **(a)** an assessment with a concrete instance per claim → `system/agentic-ticket-workflow-assessment-<date>.md`, and **(b)** brainstormed forward ideas, each logged for the weekly audit:<br>`node core/slips.js add --type proposal --category <A1..A5> --evidence "<idea + eval case>" --caught-by self`<br>They surface in `slip-dashboard.md` under **💡 Open proposals**; weekly audit rules each BUILD/DROP/DEFER. Every idea names its **eval case** or it is a wish, not a proposal. Prefer mechanical (a hook that counts) over prose (a rule to remember). An axis with genuinely nothing gets `A<n> ⏭ <reason>` — silence is banned. Detail: `expansion-protocol.md` §Step 7.5. |
| 8 | Closing words to みや (**fenced code block**) |
| 9 | Change manifest (`git status` touched files) |
| 10 | **Auto-commit + push** (worktree branch + main FF) |
| 11 | Worktree & branch close (verify main current + salvage unmerged) |
| 12 | Run **`/verify` Checklist D** — cross-check every step fired with evidence |
| 12.5 | **Meta-audit** — hook-fire reliability + cross-refs + component-liveness |
| 12.6 | **Resume-readiness sweep** — `node domain/checklist-reactivate/resume-readiness.js`; fill any `✗`/`🔴` qa_doc gap before close |
| 13 | **Handoff Block** (tiered — default SILENCE; only blocked/stranded work) |

Closing banner (VERBATIM, after step 10's push completes):

```
═══ [ Domain Expansion — closed ] ═══

💠 るり結界 (ラピス バリアー) 💠

Barrier settles. Quest threads are at rest.
```

**Banned**: silent DE skip · skipping any step without an explicit `⏭ + one-line why` · reconstructing the banner from memory · collapsing the skill-name + storytelling onto one line.

## Why a skill now (2026-06-28, per みや)

DE was a protocol + trigger-hook = **model-driven execution** with no Skill-tool invocation, so it could be freelanced or partially skipped. As a skill it gains: Skill-tool invocation (the `skill-invocation-discipline` gate now ensures DE is actually *invoked*, not improvised), a single structured entry point, and the resume-readiness sweep (12.6) as a coded step. The detailed bodies stay in `expansion-protocol.md` — this is the orchestrator, not a copy.
