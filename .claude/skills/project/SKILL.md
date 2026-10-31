---
name: project
description: The project system — how a personal or outside project (Masterline, DawahMap, PymTime, Trading, any new one) is started, loaded, saved and kept through auto-compaction and new sessions; the agent README (AGENTS.md), the hand-over (HANDOVER.md) and the voice intake (VOICE.md) every project starts with. ALWAYS invoke on "/project", "new project", "start a project", "create a project folder", "load <project>", "continue <project>", "save the project", "project save", "write the decision down", "ledger this", "handover", "hand-over", "voice intake", "intake <project>", "audit the projects", "delegate a project session", "child session for <project>", "what does the project card say", "did we lose anything after compaction", and as the first step of any workflow on a project. Not for Redmine tickets (the quest skill owns those; the same hooks bring a quest's Resume Point back after a compaction).
---

# /project — the project system

> Goal (his words, 2026-10-17): "it will only naturally survive compaction. Regardless hitting the limit or I choose to autocompact. I can confidently and without worry know you'll remember the critical & key details".
> One mechanism, two save targets: a **project** saves to `projects/coding-projects/active/<Name>/`; a **quest** (ticket) saves to `quest/active.txt` + Task folder + qa_doc, unchanged. The hooks re-inject both after a compaction.
> Code: `domain/project-load/` (README, `project.js`, four hooks, `templates/`, `eval.js`). Eval: `node domain/project-load/eval.js`.

## 1. The folder (shape 2)

| File | Holds | Written by |
|---|---|---|
| `project.json` | `name` · `aliases` (words that mean it in a prompt) · `repo` (its own code repo, if any) · `index: "START.md"` · `shape: 2` | `/project new` |
| `START.md` | THE spec anchor, under 20,000 characters, six sections: **Goal (his words) · Spec (S1, S2 … his words) · Hard rules · State now · Next step · Open decisions (his)**. The hooks cut the PROJECT CARD from it. | me, at every bulk change |
| `DECISIONS.md` | `| # | Date | Decision | Why | Who | Serves |` — one row per decision, the moment it is made | `project.js decide` only (append, never rewrite) |
| `history\words.md` | his prompts, word for word, copied out of the session transcripts | the PreCompact hook and `/project save` (by script, never by hand) |
| `history\compactions.md` | each compaction summary (lossy; kept to check nothing was lost) | the SessionStart compact hook |
| `reports\<session-name>.md` | a delegated session's report, six fixed headings | that session |
| `AGENTS.md` | the README for any agent (2026-10-31): read order, how to work here, the voice path. Standard name, so an agent that is not Ruri finds it. **No state, no spec, no map in it** (START.md, PROJECT.md own those); it only points | `/project new` (template; rarely edited) |
| `HANDOVER.md` | what the next worker needs to continue with no re-explaining: the six report headings, newest state only, rewritten at every stop. Current = not older than the newest change in the folder (`history\`, `reports\` excluded) | whoever stops work, before the stop |
| `VOICE.md` | the prompt he starts a voice chat with (section 8) and the two steps that bring its HANDOVER block here | `/project new` (template) |
| `history\voice-<date>.md` | the voice chat's HANDOVER block, word for word | `project.js intake` (by script, never by hand) |
| `PROJECT.md` | the full index: where everything lives, which file answers which question, sessions ledger | me |
| `VERSIONS.md` · `ARCHITECTURE.md` · `PROOFS.md` · `ROADMAP.md` | one row per version or bulk change · parts and flows · tests and costly mistakes · his asks in his words | me |

## 2. Commands

| Say | Run |
|---|---|
| new project `<Name>` | `node domain/project-load/project.js new <Name> --aliases "a,b" [--repo <dir>]` (scaffolds START, DECISIONS, AGENTS, HANDOVER, VOICE and the five documents), then fill START.md from his words (a voice block: `intake` first, section 8), one `decide` row per decision, **rewrite HANDOVER.md before the turn ends**, `node domain/project-load/project.js audit "<Name>"` exit 0; add `projects/coding-projects/active/<Name>` to the `projects` list of `system/save-rules.json` and the Projects row of `system/INDEX.md` (Domain Expansion finds the folder by its project.json even before that), and a pointer note in auto-memory; if the project has screens, run `/impeccable init` in the project folder before the first screen (section 7) |
| load / continue `<Name>` | the hook already printed the card; read `START.md`, then `HANDOVER.md`, then only the file PROJECT.md's table names; say in one line where we are and where it is going |
| a voice block arrives (he pastes the chat's HANDOVER block, or names a file) | `node domain/project-load/project.js intake "<Name>" --file <block>` → `history\voice-<date>.md` word for word; then fill START.md (goal, spec rows, hard rules, open decisions), `decide` per decision, rewrite HANDOVER.md, `audit` |
| before any stop on the project (end of turn with changes, hand-off, compaction coming) | rewrite `HANDOVER.md` (six headings, newest state), then `node domain/project-load/project.js audit "<Name>"` must exit 0 |
| is every project folder in shape | `node domain/project-load/project.js audit` (no name: every folder; shape 1 prints NA); Domain Expansion runs the same check on touched folders (`lib/save-rules.js` rule `project-handover`, `de-close-gate` C8) |
| an older shape-2 folder lacks AGENTS / HANDOVER / VOICE | `node domain/project-load/project.js upgrade "<Name>"` adds only the missing files; its hand-over is then written by the session that works on it |
| a decision is made | `node domain/project-load/project.js decide "<Name>" --decision "…" --why "…" --who "みや" --serves S#` in the SAME turn |
| save | (1) START.md state + next step · (2) VERSIONS.md row · (3) ROADMAP.md status · (4) `node domain/project-load/project.js words "<Name>" --transcript <this session's .jsonl>` · (5) the report if delegated · (6) commit what is in git |
| what would come back after a compaction | `node domain/project-load/project.js drill "<Name>"` |
| is the folder in shape | `node domain/project-load/project.js check "<Name>"` |
| a session wrongly marked delegated | `[project-unbind: <Name>]` in a prompt, or `node domain/project-load/project.js unbind "<Name>" --session <id>` |

## 3. Rules (canonical home; the auto-memory note only points here)

1. Read `START.md` first in any session on the project (shape 1 projects: `PROJECT.md`).
2. Every bulk change ends with the save of section 2, in the same pass.
3. A new durable fact goes into the folder, never into a memory note.
4. A test script never stays in the session temp folder; it goes into the project's own repo.
5. Before a compaction or a hand-off: the folder is current. That IS the save.
6. `projects/` is gitignored (OneDrive keeps it); code history lives in the project's own repo.
7. The folder is read and written at the MAIN checkout's full path. From a worktree session the Write tool is blocked there: write by script (Node or PowerShell with the absolute path).
8. The memory note and its `MEMORY.md` line carry no state; state lives in START.md section 4.
9. Prove the hand-off: a fresh agent given only "let's continue <Name>" and the memory index finds the folder and names the next step and the hard rules.
10. LOADED every time: `project-load` (UserPromptSubmit) prints the card when the prompt names an alias.
11. SAVED every time: at Domain Expansion `lib/save-rules.js` checks the five documents, the repo commit, the memory pointer, the shape-2 sections and the delegated reports.
12. A new project gets one entry in the `projects` list of `system/INDEX.md` and of `system/save-rules.json`.
13. **Spec anchor**: every deliverable names the spec row it serves (S1, S2 …). A request that fits no row is a new row, in his words, before it is built.
14. **Decisions**: written to DECISIONS.md the moment they are made, with why and who. Never re-decide a row; a change is a new row that names the old one. The Stop gate blocks a reply that states a decision with no ledger write this turn.
15. **His words are the record, not the summary.** After a compaction, `history\words.md` and DECISIONS.md win over anything the summary says.
16. **Every option he must pick from is SHOWN** as a table or a drawing before he is asked (CLAUDE.md 0a).
17. **A person does everything through the app's own page** (his rule 2026-10-23, every project). A file or an API is only for machines (another AI, a script). No design asks a person to edit a file; a person's choice is a control on the page. Printed in every project card by `project.js` (eval E4p, E1p). *Why*: PymTime Phase P, a colleague's Plan-or-Assist choice was first designed as a line in the adhoc inbox file; his words: "why are they changing it in that file but not through pymtime?"
18. **A hand-over before every stop, one file** (his ask 2026-10-31: "something like a handover always as part of starting a project"). `HANDOVER.md` is rewritten by whoever stops work; `project.js audit` fails when it is older than the folder's newest change, and Domain Expansion runs that check. Never a dated handover file in the project folder; `main/handoff-<date>-<topic>.md` is for MemoryCore system efforts only.
19. **AGENTS.md points, never stores** (2026-10-31): no state, spec or map in it. A fact that belongs to the project goes to START.md, DECISIONS.md or PROJECT.md; AGENTS.md says where. Banned: a second copy of the state in AGENTS.md.

## 4. After a compaction (this skill body comes back with it)

```
compaction starts ─► PreCompact hook copies his prompts → history\words.md
                 ─► the summary replaces the turns
                 ─► SessionStart(compact) hook prints the PROJECT CARD (and a QUEST CARD for a ticket)
                 ─► (if that card is missing) the next prompt prints it
me, first thing  ─► read START.md · read the newest entries of history\words.md
                 ─► every decision in them is in DECISIONS.md? if not, write it now
                 ─► then the next step from START.md section 5
```

## 5. Delegated sessions (his rule 2026-10-17)

- Only the session's START BRIEF (its first prompt) makes it delegated, and only for the report path the brief says to write ("write …\reports\<session-name>.md"). A report path quoted later (a child's note, a message from another session) never binds. Two paths in a brief with no write instruction bind none.
- Wrongly bound? In a prompt: `[project-unbind: <Name>]` (the report check goes off, the card stays). By command: `node domain/project-load/project.js unbind "<Name>" --session <session id> [--all]`; repair: `bind "<Name>" --session <id> --report <file>.md`.
- Report headings, exactly: **What changed** (file · change · serves) · **Decisions made** (each with its reason) · **Open questions for みや** (options SHOWN) · **Blockers** · **Unverified** · **Next step**.
- Written at every bulk change and before every end of turn; the same text is the final message.
- The Stop gate blocks when the report is missing, lacks a heading, or is older than the newest change in the project folder since the session began. Bypass only for a turn that changed nothing of mine: `[skip-project-report: <reason>]`.
- Opus 5.5 at effort high builds; the orchestrator plans and checks.

## 6. Shape 1 → shape 2 (migrating an existing project)

Keep every line. Move, never delete: hard rules → START section 3, decisions → DECISIONS.md rows, state → START section 4; leave a pointer where each stood and a word-for-word copy in `history\`. Then set `index: "START.md"` and `shape: 2` in project.json and run `/project check`.

## 7. Design and build tools (his rule 2026-10-19)

> His words: "Please make full good use of them where appropriate inside our system" · "It seems we need to install/setup things so that you do not forget … it will be useless if you simply installed and not take into account if I say it when starting a project". Installed 2026-10-19 and 2026-10-20 (user scope); install record and footprints: `.claude/auto-memory/project_installed_skills.md`.

| The job | Tool | How, every time |
|---|---|---|
| Any screen, page or app UI (web or native) | **impeccable** (plugin) | `/impeccable init` once per project; `/impeccable craft` or `shape` to design; `/impeccable critique` and `/impeccable audit` before anything is shown to him; its hook checks UI files on every edit and at Stop |
| Choosing a look | **impeccable** + the project's design research | directions drawn from named outside references, shown as screenshots; never the default Claude look (big rounded cards, soft shadows, pill chips, Inter, KPI tile row, greeting heading) |
| An art direction from real references, checked in a real browser at three widths | **taste-skill** (plugin) | `taste-skill:design-taste-frontend` once the direction is drawn; needs Node 22+ and Edge |
| Styles, colours and fonts to search; a design-system file; a pre-delivery checklist | **ui-ux-pro-max** (plugin) | `ui-ux-pro-max:design-system` for the project's file; its checklist before a delivery |
| A real brand's design system to start from | **awesome-design-md** (84 DESIGN.md files in `~/.claude/design-library/awesome-design-md/`) | copy the closest brand's DESIGN.md into the project and adapt it; refresh with `git -C ~/.claude/design-library/awesome-design-md pull` |
| Architecture, flow, system, sequence diagrams | **diagram-design** (plugin) | one HTML + SVG file in the project's brand; PNG export only if he asks |
| A product video, explainer or motion graphic | **hyperframes** (plugin) | HTML → MP4; read the sub-skill it routes to first |
| Understanding how an existing app or binary works | **REA** (skill `reverse-engineer-anything`; its server is on demand) | turn the server on for that session only: `claude mcp add rea --scope local -- cmd /d /c npx -y rea-agents@6.7.0 mcp`; only on apps we own or may inspect |
| Planning before building: interview, spec, tickets | **mattpocock-skills** (`grill-me`, `to-spec`, `to-tickets`, `wayfinder`, `tdd`, `code-review`) | grill-me before a new module; our own quest workflow still owns etanah tickets |

Mechanical, not remembered: hard rule 2 of the START.md template carries the design line into every new project's card; impeccable's own hook runs on UI edits.

## 8. Voice intake (his ask 2026-10-31: "I want to use voice chat and save a HUMONGOUS amount of time … Claude Code ends up like the worker")

| Step | Who | What |
|---|---|---|
| 1 | he | opens `VOICE.md` of the project (OneDrive: on the phone too), pastes section 1 into a claude.ai voice chat |
| 2 | the voice chat | one short question at a time, a recommended answer with each, never a list or a table aloud, never answers its own question; order: the destination first, then wide across the space, then grill each open decision (the wayfinder and grilling method, carried in the prompt because the chat has no skill); keeps decided / not yet specified / out of scope |
| 3 | the voice chat | at "wrap up": ONE plain-text block headed `HANDOVER <Name>`: his words · destination · decisions · spec rows · hard rules · open questions · not yet specified · out of scope · unverified · next step for Claude Code |
| 4 | he | pastes the block into Claude Code (or saves it as a file in the folder) |
| 5 | Claude Code | `intake` (the block word for word into `history\voice-<date>.md`), fills START.md, `decide` per decision, rewrites HANDOVER.md, `audit` exit 0 |

Not verified (2026-10-31): whether a claude.ai voice chat can read a file or export its own transcript; the design needs only copy and paste. A new project with no voice session yet still gets `VOICE.md`, ready for the first one.

*Version 1.4 — 2026-10-31. The project start, per みや ("a handover always as part of starting a project … a general README file but for agents … I want to use voice chat"): `AGENTS.md` (points, never stores), `HANDOVER.md` (one file, rewritten at every stop, current or the audit fails), `VOICE.md` (the voice prompt) in section 1 and the templates; commands `intake`, `audit`, `upgrade` in section 2; rules 18 and 19; section 8 voice intake; the audit runs at Domain Expansion through `lib/save-rules.js` rule `project-handover`. Picture: `.claude/skills/project/diagram.png`. Spec preservation: sections 1 to 7 and rules 1 to 17 unchanged; the `new` and `load` rows extended, five rows added. Eval: `domain/project-load/eval.js` 80/80.*

*Version 1.3 — 2026-10-23. Rule 17: a person does everything through the app's own page; files are for machines (his answer "Every project", after the PymTime Phase P inbox-file slip). The card prints it for shape 1 and shape 2 (`project.js` PEOPLE_RULE, eval E4p and E1p). Spec preservation: sections 1 to 7 and rules 1 to 16 unchanged; one rule added.*

*Version 1.2 — 2026-10-20. Section 7 Design and build tools (impeccable, diagram-design, hyperframes, REA, mattpocock-skills installed 2026-10-19 on his word; taste-skill, ui-ux-pro-max, awesome-design-md on 2026-10-20); "new project" runs `/impeccable init` for projects with screens; the START.md template carries hard rule 2 (the design line). Applied by the orchestrator from the app-samples session's hand-over patch. Spec preservation: sections 1 to 6 and rules 1 to 16 unchanged; one command cell extended, one section added.*

*Version 1.1 — 2026-10-19. Delegation binds only from the start brief and only the report it says to write; unbind marker and unbind/bind commands (the orchestrator, app-samples and project-system sessions were all bound to website.md by a quoted path). Spec preservation: every 1.0 rule kept; section 5 first bullet narrowed, two bullets and one command row added.*

*Version 1.0 — 2026-10-17. Born with domain/project-load v2 (session project-system, Masterline brief). Rules 1-12 moved here from `.claude/auto-memory/feedback_side_project_folder.md` (word for word in meaning; rule 1 and 11 extended to shape 2); rules 13-16 new.*
