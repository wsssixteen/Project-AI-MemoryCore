---
name: project
description: The project system — how a personal or outside project (Masterline, DawahMap, PymTime, any new one) is started, loaded, saved and kept through auto-compaction and new sessions. ALWAYS invoke on "/project", "new project", "start a project", "create a project folder", "load <project>", "continue <project>", "save the project", "project save", "write the decision down", "ledger this", "delegate a project session", "child session for <project>", "what does the project card say", "did we lose anything after compaction", and as the first step of any workflow on a project. Not for Redmine tickets (the quest skill owns those; the same hooks bring a quest's Resume Point back after a compaction).
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
| `PROJECT.md` | the full index: where everything lives, which file answers which question, sessions ledger | me |
| `VERSIONS.md` · `ARCHITECTURE.md` · `PROOFS.md` · `ROADMAP.md` | one row per version or bulk change · parts and flows · tests and costly mistakes · his asks in his words | me |

## 2. Commands

| Say | Run |
|---|---|
| new project `<Name>` | `node domain/project-load/project.js new <Name> --aliases "a,b" [--repo <dir>]`, then fill START.md from his words, add `projects/coding-projects/active/<Name>` to the `projects` list of `system/save-rules.json` and the Projects row of `system/INDEX.md`, and a pointer note in auto-memory |
| load / continue `<Name>` | the hook already printed the card; read `START.md`, then only the file its table names; say in one line where we are and where it is going |
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

*Version 1.1 — 2026-10-19. Delegation binds only from the start brief and only the report it says to write; unbind marker and unbind/bind commands (the orchestrator, app-samples and project-system sessions were all bound to website.md by a quoted path). Spec preservation: every 1.0 rule kept; section 5 first bullet narrowed, two bullets and one command row added.*

*Version 1.0 — 2026-10-17. Born with domain/project-load v2 (session project-system, Masterline brief). Rules 1-12 moved here from `.claude/auto-memory/feedback_side_project_folder.md` (word for word in meaning; rule 1 and 11 extended to shape 2); rules 13-16 new.*
