# Handoff 2026-10-29: headless alter runner into the Quest Workflow (plan v1)

Asked by みや 2026-10-29 (/goal): integrate the alter knowledge (headless runner + alter.js) into the Quest Workflow so that
1. it is loaded at quest Phase 0 when the ticket turns out to be flowable-related;
2. it is loaded when the ticket's tracker is **Internal Issue (PROD)** and the ticket asks for an alter.

## What exists (inventory, system-rules Rule 1)

| Part | Kind | Home | What it does today | Gap |
|---|---|---|---|---|
| Headless runner | Tool | `E:\Dev\scripts\FlowableAlter\runner\` (outside git) | STG/MLIT Alter Flow with no login; `--target <KOD>`; `--run` verifies PASS/FAIL. Proven 2026-10-29: 10/10 urusan + different-step move. Refuses PROD. No Initiate & Alter. | not named anywhere in the quest system |
| alter.js | Tool | `E:\Dev\scripts\FlowableAlter\alter.js` | page driver for prod/stg/mlit; PROD needs dry-run approval code + `prod-alter-gate` | needs a live CAS session |
| `alter-ticket-gate` | Feature (hook, UserPromptSubmit) | `domain/alter-ticket-gate/` | injects playbook + A0-A6 rows when prompt/brief/prior turn has an alter word | (a) A5 Melaka row names alter.js only, no env routing to the runner; (b) never reads the tracker; (c) never scans the Task folder NAME (subject) |
| ALTER-TICKET-PLAYBOOK | Memory (knowledge, untracked) | `projects/coding-projects/active/etanah-knowledge/ALTER-TICKET-PLAYBOOK.md` | A0-A6 procedure + reply formats | A5 still says "miya clicks"; no tool-by-env table |
| FLOWABLE-KNOWLEDGE §6 | Memory (knowledge, untracked) | `etanah-knowledge/melaka/FLOWABLE-KNOWLEDGE.md` | the 5 page actions | no pointer to the runner |
| quest-phase0 Workflow | Workflow | `.claude/workflows/quest-phase0.js` | layerGuess `flowable` loads FLOWABLE-KNOWLEDGE only | playbook + tool not loaded; fix-shape never names the tool |
| ticket-gate Phase 0 checklist | Feature (hook) | `.claude/hooks/ticket-gate.js` | Phase 0 rows on every ticket mention | no alter/flowable row |
| quest SKILL step 6c | Workflow (skill) | `.claude/skills/quest/SKILL.md` | patch path: "alter → perak/melaka alter skill" | that skill does not exist |
| Tracker source | data | Task folder name `NNN. II #<num> - … (PROD)` (`quest/redmine-sync.js` TYPE_ABBR: INTERNAL ISSUE → II, bracket moved to the end) | — | only place the tracker is stored locally |

## Flow (one changed step marked)

```
ticket mention ─▶ ticket-gate (Phase 0 rows) ─▶ quest-phase0 Workflow (Discovery → KnowledgeLoad → Recon → Synth)
        │                                                           ▲
        └─▶ alter-ticket-gate (signal?) ─▶ playbook + A0-A6 ────────┘
                 ▲ CHANGED: + tracker II (PROD) signal, + folder-name signal, + A5 tool-by-env
```

## Plan (5 changes, all additive)

| # | Change | File | Detail |
|---|---|---|---|
| C1 | **Tracker signal** | `domain/alter-ticket-gate/alter-ticket-gate.check.hook.js` | read `task_folder` basename; `TRACKER_PROD_II = /^\d+\.\s*II\s*#\d+\b.*\(PROD\)\s*$/i`. If it matches AND the folder name / brief has an alter word → fire with `signal_src=tracker`. II (PROD) with no alter word → no fire (data patches, code bugs share the tracker). |
| C2 | **Folder name scanned** | same hook | add the Task folder basename (the Redmine subject) to the `ticket brief` text the signal scan reads. |
| C3 | **A5 tool-by-env (Melaka)** | same hook (full + reminder text) | A5 row becomes a table: PROD → `alter.js --dry-run` → approval code → `--approve` · STG/MLIT Alter Flow → runner `.\run.ps1 alter-flow --env <stg\|mlit> --id <ID> --target <KOD>` then `--run` (no login) · STG/MLIT Initiate & Alter → alter.js (or Edge mode when logged out). Never ask みや to log in for STG/MLIT. |
| C4 | **Phase 0 Workflow loads the alter layer** | `.claude/workflows/quest-phase0.js` | KnowledgeLoad: when `layerGuess === 'flowable'` OR the ask is an alter → also load `ALTER-TICKET-PLAYBOOK.md` + the state alter file + `E:\Dev\scripts\FlowableAlter\README.md` + `runner\README.md`; Synth: the fix-shape for an alter names the action (A4) and the exact tool command for the env. |
| C5 | **Knowledge + skill pointers** | playbook §0/A5 (untracked) · Melaka FLOWABLE-KNOWLEDGE §6 (untracked) · quest SKILL 6c | A5 text = the C3 table; §6 one pointer line to the runner; 6c "alter → perak/melaka alter skill" → "alter → ALTER-TICKET-PLAYBOOK + the alter-ticket-gate rows (tool by env)". |

Not in scope: Initiate & Alter in the runner (needs an etanah repo change); PROD in the runner (stays alter.js + approval code).

## Evals

| # | Case | Expect |
|---|---|---|
| E1 | existing `alter-ticket-gate.eval.js` 20 fixtures | 20/20 still green |
| E2 | prompt "286988" only; active block task_folder `329. II #286988 - Pelupusan - PLPS - Request Untuk Alter Tugasan ke … (PROD)`; empty brief | fires, `signal_src=tracker` or `ticket brief`, A5 shows PROD → alter.js approval |
| E3 | II (PROD) folder, subject "Surat Jabatan Teknikal Tidak Papar 7 Bilangan (PROD)", no alter word | does NOT fire |
| E4 | ES ticket (`ES #286650`), prompt "alter PTMLK/02/L/PLTP/2026/9 on stg" | fires; A5 names the runner for STG Alter Flow + alter.js for Init&Alter |
| E5 | reminder mode (playbook already read) on a Melaka ticket | reminder names runner (STG/MLIT) and alter.js (PROD) |
| E6 | Perak alter ticket | A5 unchanged (runbook for みや), no runner/alter.js text |
| E7 | quest-phase0.js: `node --check` + a grep that the KnowledgeLoad prompt names the playbook + both READMEs under the flowable branch | pass |
| E8 | real replay: last 6 II (PROD) alter folders on disk (#280099 #281568 #282555 #282723 #284775 #286988) via the hook with a bare ticket-number prompt | 6/6 fire |
| E9 | real non-alter II (PROD) folders (#277147 + 2 others) | 0/3 fire |

## Record + land
README History rows (alter-ticket-gate), `node lib/watch.js add`, eval file updated, commit, land on main (INDEX change route step 7).

## Fable 5.1 plan audit 1 (2026-10-29): FAIL, 2 blockers + 5 majors, all applied (plan v2 = what was built)

| # | Finding | Applied as |
|---|---|---|
| 1 | blocker: bare ticket number only searched active.txt; archived / unsynced tickets silent | hook looks up active.txt → active-archive.txt → the Task folder on disk (open + Archive) · eval G1, G3, R1 |
| 2 | blocker: E4 used the deny-listed PLTP/2026/9 | fixtures use PLTP/2026/13; A5 names boot time, created_by=SYSTEM, deny-list |
| 3 | major: tracker added no trigger; its value is the env | env resolver (prompt → folder name), tracker logged; A5 prints that env's tool only · G1, G6-G8, G12 |
| 4 | major: goal 1 mid-Phase-0 (#277926) not covered | quest-phase0.js Synthesize reads the alter layer on any token-move fix; `alterLayerLoaded` + `alterCommand` in SYNTH_SCHEMA · phase0-alter.eval P3, P5 |
| 5 | major: five homes for one table | playbook A5 = the one table (main-checkout copy); hook A5 one env row + "Full table: playbook A5"; §4 heading + §6 bullet rewritten; FLOWABLE-KNOWLEDGE §6, quest SKILL 6c, memory = pointers |
| 6 | major: STG/MLIT order unstated; runner never with PROD | playbook A5: runner first for STG/MLIT Alter Flow, alter.js second; Init&Alter alter.js / Edge · G2, G9 assert no runner text when env=prod |
| 7 | minor: request/minta prefix, truncated subject, README history, NUKE-MARKER, goal_status, tools.json, E9 names | all done; plus `alter PT<STATE>/…` counted as an ask (found by G6); E9 = 277147, 277346, 281319 (R2 0/3) |

Not changed: ticket-gate.js (first-engagement only; alter-ticket-gate fires on the same prompt). Known overlap to judge later: `domain/alter-sim` also boots the real app (dry-run with rollback); the runner writes.

Evals at build: alter-ticket-gate 43/43 · phase0-alter 6/6 · subflow-trace 6/6 · agent-spend-gate 45/45 · diagram census OK · tool-registry: no new problems (7 pre-existing, eval F24 pre-existing on archive-hold).

## Fable 5.1 result audit 2: FAIL (1 major + 6 minor), all applied

| # | Finding | Applied as |
|---|---|---|
| 1 | major: "stg" in a prompt on a PROD ticket hid the approval-code row | env = every env the prompt names + prod whenever the folder says PROD (`env=prod+stg`, both rows) · G8 rewritten, G13, G14 |
| 2 | P6 vacuous | P6 scans each `agent()` options object (brace-matched) for a model |
| 3 | goal 1 proven at prompt level only | `alterCommand` required in SYNTH_SCHEMA ("n/a" allowed) · P7 |
| 4 | `alter <serahan>` silent | ALTER_ASK + `alter \d{2}[A-Z]{1,4}\d{1,6}/\d{4}` · G15 |
| 5 | three copies of the runner command | memory body = pointer to playbook A5; MEMORY.md index line updated |
| 6 | version stamps / picture | playbook v1.1 stamp (changed-and-named A5); map picture shows the Tools kind and its categories ("indexes · scripts"), not single tools, so two tool rows change no box: no redraw |
| 7 | header source + per-number disk scan | header names active-archive.txt / Task folder on disk (G16); folder list built once per run |

Evals: alter-ticket-gate 47/47 · phase0-alter 7/7 · agent-spend-gate 45/45.
