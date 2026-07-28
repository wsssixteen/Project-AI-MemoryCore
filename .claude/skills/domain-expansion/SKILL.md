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

`DE steps: 0a ⬜ · 0b ⬜ · 1 ⬜ · 2 ⬜ · 3 ⬜ · 4 ⬜ · 5 ⬜ · 6 ⬜ · 7 ⬜ · 8 ⬜ · 9 ⬜ · 10 ⬜ · 11 ⬜ · 12 ⬜ · 12.5 ⬜ · 12.6 ⬜ · 13 ⬜`

- **0a Compaction check** — if the session auto-compacted, recover the transcript TAIL BEFORE the content-save steps (2 / 4 / 7).
- **0b Worktree/branch sync** — if on a worktree branch behind `origin/main`, pull/merge first so everything saves on current base.

## Steps 1–13 (drive each in order; detail in expansion-protocol.md)

| # | Step |
|---|---|
| 1 | `Get-Date` timestamp |
| 2 | Update `main/current-session.md` (Last Activity + Working Memory + Recap) |
| 3 | Update `main/main-memory.md` relationship section if patterns surfaced |
| 4 | Append `daily-diary/<date>.md` (3-section template) |
| 5 | Forge log review — surface L1→L2 promotions as QUESTIONS to みや |
| 6 | Observation log review — promote T1→T2 if recurring |
| 7 | **Gap Sweep** + etanah-knowledge sweep |
| 8 | Closing words to みや (**fenced code block**) |
| 9 | Change manifest (`git status` touched files) |
| 10 | 🚨 **COMMIT + PUSH + MERGE — MANDATORY, NON-NEGOTIABLE, NOT OPTIONAL** (see hard rule below) |
| 11 | Worktree & branch close (verify main current + salvage unmerged) |
| 12 | Run **`/verify` Checklist D** — cross-check every step fired with evidence |
| 12.5 | **Meta-audit** — hook-fire reliability + cross-refs + component-liveness |
| 12.6 | **Resume-readiness sweep** — `node domain/checklist-reactivate/resume-readiness.js`; fill any `✗`/`🔴` qa_doc gap before close |
| 13 | **Handoff Block** (tiered — default SILENCE; only blocked/stranded work) |

## 🚨 STEP 10 IS AN EXPLICIT ORDER — COMMIT + PUSH + MERGE (hard rule, 2026-07-28 per みや)

**みや, verbatim**: *"MAKE IT FUCKING EXPLICIT ORDER TO COMMIT, PUSH & MERGE WHEN FINISHING DOMAIN EXPANSION!!!!"*

Every Domain Expansion **ends with all three, verified**:

| # | Action | Verified how |
|---|---|---|
| 1 | `git add -A` + `git commit` — **every** modified/untracked path, authorship is NOT a filter | commit SHA emitted |
| 2 | `git push origin HEAD` (worktree branch) | remote ref matches local SHA |
| 3 | `git push origin HEAD:main` (**the merge** — FF main on the remote) | `git ls-remote origin refs/heads/main` **equals** local `HEAD` |

**Verification is mandatory and mechanical**: emit the three SHAs and show they match. "Push succeeded" without the remote SHA is not evidence.

### Banned

- ❌ Emitting the **closing banner** with step 10 at anything other than ✓
- ❌ Downgrading a failed push/merge into a **Handoff Block** line and closing DE anyway — *this is the 2026-07-28 slip* (`de-closed-with-incomplete-step10`): a transient GitHub credential error was narrated as a hand-off; a single retry the next turn succeeded immediately
- ❌ Treating step 10 as "auto-commit + push" advisory wording — it is an order
- ❌ Stopping the turn while any of the three is unverified

### When a push genuinely fails

**Retry first — do not hand it back.** Then enumerate: credential-helper context (a changed Windows user breaks both `safe.directory` and the credential store — use `git -c safe.directory=*` and retry the push), remote divergence (fetch + merge, then re-push), wrong remote. Only after retries fail does it become a Handoff — and **DE stays OPEN**, banner withheld, with the exact failing command surfaced.

Closing banner (VERBATIM, after step 10's commit + push + **merge** are all SHA-verified):

```
═══ [ Domain Expansion — closed ] ═══

💠 るり結界 (ラピス バリアー) 💠

Barrier settles. Quest threads are at rest.
```

**Banned**: silent DE skip · skipping any step without an explicit `⏭ + one-line why` · reconstructing the banner from memory · collapsing the skill-name + storytelling onto one line.

## Why a skill now (2026-06-28, per みや)

DE was a protocol + trigger-hook = **model-driven execution** with no Skill-tool invocation, so it could be freelanced or partially skipped. As a skill it gains: Skill-tool invocation (the `skill-invocation-discipline` gate now ensures DE is actually *invoked*, not improvised), a single structured entry point, and the resume-readiness sweep (12.6) as a coded step. The detailed bodies stay in `expansion-protocol.md` — this is the orchestrator, not a copy.
