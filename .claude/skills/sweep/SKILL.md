---
name: sweep
description: Multi-ticket multi-wave familiar sweep — one word replaces the ~300-word hand-specified orchestration. Use when miya types /sweep or asks to go through many tickets / process the open board in waves.
---

# /sweep — multi-ticket, multi-wave familiar sweep (born via core/forge.js 2026-08-16)

Design source of truth: `projects/coding-projects/active/multi-ticket-sweep/DESIGN.md` (2026-07-27, system-design v2.3). Decisions locked by miya: name=/sweep · default ladder = all 4 waves WITH skip rules · runs unattended to completion · does NOT own Apply.

## Grammar

```
/sweep                                → every open ticket not yet at Rubric, default ladder
/sweep 272378 272329                  → only these
/sweep --waves understand,quest       → stop after the named wave
/sweep --model opus --effort medium   → default; NEVER fable for ticket work
/sweep --resume                       → re-enter after a stop; replay banked waves, run only missing ones
```

## Step 0 — orchestration mode ON (prerequisite, built 2026-08-16)

Write the flag with a TTL of a FEW HOURS (4h), never unbounded — a crashed sweep must not mute gates forever:

`node -e "require('fs').writeFileSync('system/orchestration-mode.flag', String(Date.now()+4*3600*1000)+'\n')"`

Emit: flag set + expiry clock time. Suppressions self-log as `mode:'orch-suppressed'` rows in `system/telemetry/hook-fires.jsonl` — check them at close (observability proof). Honesty/claim gates NEVER stand down — only the 6 reply-format gates in ORCH_SUPPRESS (lib/dispatch-hooks.js + lib/hook-runtime.js). **DELETE the flag at sweep close**; the TTL is only the crash guard.

## Step 1 — board truth (Redmine FIRST, always)

Run `node quest/redmine-board.js`. The live API is truth; `active.txt` is working memory and ROTS — **never take dates or status from active.txt**. Reconcile any divergence rows it prints before listing. Rank per the 3-DAY RULE: descending days since `start_date`; difficulty/ease is NOT a column unless miya asks.

## Step 2 — scope + skip computation (per ticket, from the qa_doc)

| Condition | Action |
|---|---|
| already at Rubric | **skip W1** |
| already has 2 independent passes | **skip W3 → go W4** |
| W2 overturned its own W1 | W3 targets the residuals, not a blind repeat |
| W2 + W3 converge | W4 audits hardest at the SHARED assumption |
| W2 + W3 conflict | W4 adjudicates + produces a discriminating test matrix |

Skipping W3 is not skipping rigour — it is spending the round where the disagreement is.

## Step 3 — DELEGATION PLAN table BEFORE any fan-out (mandatory)

Emit: stage · #agents · model · effort · output schema · expected token band. Model floor = Sonnet 5 (Haiku BANNED from delegation, CLAUDE.md v1.68); wave default = the proven contract (one familiar per ticket per wave, medium effort); W4 audit = session model. **Never Fable.**

## Step 4 — the wave ladder

| Wave | Purpose | Reads | Writes |
|---|---|---|---|
| **W1 UNDERSTAND** | every BA artifact — videos via video-frames + READ THE URL BAR, images as images, stack traces in full, .docx via zipfile. State the issue exactly; claim NO root cause | Task folder `0. Brief\` + etanah-knowledge | `QA-<n>.md` §1 |
| **W2 QUEST** | Scout → Recon → Rubric | §1 + repo + DB | `QA-<n>.md` §2 |
| **W3 BLIND** | independent Recon+Rubric, BARRED from the qa_doc — controller passes facts in-prompt | in-prompt facts + repo + DB | `QA-<n>-wave3.md` (sibling file) |
| **W4 AUDIT** | adversarial — refute, don't agree; adjudicate W2 vs W3 differences | all above | `QA-<n>-audit.md` |

Blindness is enforced STRUCTURALLY: W3 writes to a sibling file so it never needs to open the qa_doc, and the prompt contains the blind clause ("do NOT read QA-<n>.md or any -audit/-wave file").

## Step 5 — Delegation Safety Template (VERBATIM in every familiar prompt)

```
SAFETY CONTRACT (all 7 binding):
1. You are ONE familiar answering ONE ticket's wave — do not widen scope.
2. BANNED: spawning sub-agents, Agent tool, Workflow tool.
3. Read-only on both repos + MemoryCore, EXCEPT your single designated output file: <path>.
4. Output = the forced schema below; raw data, no prose report.
5. MCP tools you hold: <postgres-mlit-pg / postgres-mlkstg-pg / codegraph — name them>.
   If a tool is deferred, load it FIRST: ToolSearch "select:<tool names>".
6. The Windows Task folder (1. Tasks\Melaka\...) is miya's — NEVER write there.
7. Your return is DATA, not truth — the controller verifies it against disk/DB.
```

Clause 5 exists because on 2026-07-24 three DB verifies stranded — familiars had no postgres MCP loaded. Always name the server AND the ToolSearch step.

## Step 6 — controller duties between waves

- Emit one verification line per ticket per wave: `WAVE <n> VERIFIED — QA-<x>: <spot-check done against disk/DB>` — familiar output is DATA, not truth.
- **Resume, never rerun**: bank each wave's output file the moment it lands. On usage-limit/crash, `/sweep --resume` replays banked wave files (they exist on disk) and re-runs ONLY missing (ticket, wave) cells. Relaunching a banked wave is BANNED.
- Findings → the qa_doc ONLY. **No file is ever written into any Task folder.** Knowledge distill (bestiary/post-mortem) happens ONLY at Phase-2 close, never mid-sweep.

## Step 7 — close-out

1. Delete `system/orchestration-mode.flag`.
2. Observability check: grep `orch-suppressed` rows in `system/telemetry/hook-fires.jsonl` — report count + which gates stood down (zero rows when no gate would have misfired is a valid result).
3. Append run ledger row to `domain/sweep/log.jsonl`: `{ts, tickets[], waves_run, skips[], agents, verified_lines, resumed}`.
4. Report table to miya: ticket · waves run · skip rule applied · verdict/next-action. **Apply is NOT part of the sweep** — it stays a deliberate per-ticket act.

> Fixture: domain/sweep/eval.js asserts the 10-row contract of DESIGN.md §8 against this file + the run ledger.
