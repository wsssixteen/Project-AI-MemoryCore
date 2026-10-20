# Agentic workflow assessment — 2026-10-17

## Session `website` (Masterline website samples, delegated by the orchestrator)

| Axis | Assessment | Instance |
|---|---|---|
| A1 agentic system | The delegated-session shape worked: a fixed brief, a fixed report schema, and a project folder outside git meant nothing was lost between turns. One gap: three sessions shared ONE worktree (orchestrator, `project-system`, `website`), so the Domain Expansion rule "commit every path, authorship is not a filter" collides with the spawned-session rule "commit only files you changed". I followed the spawned-session rule. | `git status` at DE: `domain/project-load/*` and `lib/save-rules.js` belong to `project-system`, `.claude/auto-memory/*` to the orchestrator |
| A1 agentic system | The 7-day audit briefing reports almost every hook as "never fired" when run from a worktree whose telemetry file is nearly empty. The same hooks fired visibly on this session's first prompt. A retire decision taken from that screen would remove live gates. | `audit-briefing.js --days 7`: "26 hook fires · 1 hooks seen", while TurnChecklistGate, multi-dim-evidence-gate and domain-expansion-trigger all injected text at turn 1 |
| A2 quest workflow | ⏭ no quest this session (project work) | — |
| A3 debugging efficiency + accuracy | A screenshot that "looked like a phone" was wrong: headless Edge ignores widths under 492 px and crops. Measuring the viewport with a one-line page caught it in one round; the DevTools-protocol script then gave phone emulation, console errors, failed loads and overflow in one run. | first phone shot showed text cut at the right edge; probe page printed `492 x 207 dpr 1` |
| A3 | A side-effect command ran unchecked: `msedge --version` on Windows does not print a version, it opens into the user's running browser. | output "Opening in existing browser session"; slip `side-effect/unchecked-command` |
| A4 etanah issue-solving | ⏭ no etanah work this session | — |
| A5 sweep / file sweep | Reading a contact sheet of all deck photos at once (one image, 19 tiles) chose photos in one look and caught a watermarked stock image and identifiable faces before any page used them. | `slide09-image-9-2` (watermark) and `slide14-image-14-2` (portrait) excluded |

Proposals logged (`core/slips.js --type proposal`, category A1): audit-briefing TELEMETRY-BLIND banner · scoped DE commit in a shared worktree.

## Session `project-system` (the project system, Masterline S7, delegated by the orchestrator)

| Axis | Assessment | Instance |
|---|---|---|
| A1 agentic system | Inventory found the design half-done by another of his sessions: DawahMap's foundation map had his ruling (index = START.md) and a checker's binding facts (hook output over 10,000 characters arrives as a 2,000-character preview). Building on it avoided a second design. | `DawahMap\wayfinder\foundation\issues\03` + `research_notes\Foundation\design-check.md` flaw 1 |
| A1 | His rulings often live only in popup answers, which the transcript stores as tool results. A words copier that reads only typed prompts misses them. | DawahMap transcript be5b16b4: 13 AskUserQuestion answers, one says "Please add into your project quest md that we need to produce this always" |
| A1 | The 7-day audit briefing runs out of memory against the main checkout's telemetry (13,279,702 hook fires in 7 days); it only finished with a 6 GB heap. The "rotate monthly" retention is not keeping the file small. | `node lib/audit-briefing.js --days 7` with CLAUDE_PROJECT_DIR = main: exit 134, last GCs |
| A1 | Hooks run from the main folder, so a session folder's own new hook is not live in that session; the design gate also looks for the eval in the main folder and refused the new hook files three times. | design-consult-gate "expected domain/project-load/eval.js" while it existed in the session folder |
| A2 quest workflow | After a compaction a quest now gets its Resume Point back (read only). An agreed fix stated mid-quest still has only the advisory quest-doc-freshness nudge, no block. | `domain/quest-doc-freshness` REPORT-ONLY vs the new project decision gate (blocks) |
| A3 debugging efficiency + accuracy | ⏭ no debugging this session | — |
| A4 etanah issue-solving | ⏭ no etanah work this session | — |
| A5 sweep / file sweep | ⏭ no sweep this session | — |

Proposals logged (`core/slips.js --type proposal`): A1 live-compaction proof watch · A1 telemetry rotation so the audit runs on a default heap · A2 quest decision gate (agreed fix with no qa_doc write).
