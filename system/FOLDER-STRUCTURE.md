# FOLDER-STRUCTURE.md — the root layout rule (v1.0, 2026-09-04)

> **The rule**: every entry at the MemoryCore root is in the allow-list below, with one owner and one purpose. A root entry that is not listed is an ORPHAN and `system-audit.js` flags it at every boot. Adding a root folder = add its row here first (the row is the nod). Nothing at the root is a scratchpad — scratch goes to the session scratchpad dir, deliverables go to the Task folder, per-state facts go to `projects/coding-projects/active/etanah-knowledge/<state>/`.
>
> Born per みや (#275847, 2026-09-04): *"organized properly for me to understand the folders & file structures … I see a lot of orphaned folders/files in your root folder."* Checked by `lib/folder-structure.js check` (the JSON fence below is the machine-read source — edit the table AND the fence together).

## Root layout — what each entry owns

| Entry | Kind | Owns | Owner (who writes it) |
|---|---|---|---|
| `.claude/` | canonical | session instructions · hooks · skills · settings · auto-memory · worktrees (ignored) | Ruri + Claude Code |
| `main/` | canonical | identity (`main-memory.md`) · session memory · todo · session formats | Ruri (DE step 2/3) |
| `system/` | canonical | constitution: INDEX · architecture · principles · ledgers (`slips.jsonl`, `registry.jsonl`) · **`states.json`** (the state registry) · this file | Ruri via `core/*.js` |
| `core/` | canonical | the kernel scripts: forge · registry · slips · boot · session-trim | Ruri |
| `lib/` | canonical | shared runtime libraries every hook imports: hook-runtime · **states** · folder-structure · feature-census · test-data-db | Ruri |
| `domain/` | canonical | Features (`domain/<feature>/` = hook + eval + README + NUKE-MARKER + log) | `core/forge.js` |
| `quest/` | canonical | quest engine scripts + protocol + `active.txt` (ignored working memory) + `active-archive.txt` | Ruri |
| `Feature/` | legacy-keep | pre-forge systems still boot-loaded: Domain-Expansion · Session-Briefing · Observation · Time-based · Forge (mostly tombstoned 2026-08-16) | Ruri (protocol edits only) |
| `daily-diary/` | canonical | day archive (`current/<date>.md` + format) | Ruri (DE step 4) |
| `projects/` | canonical (gitignored) | per-ticket quest docs (`coding-projects/active/QA-*/`) · **etanah-knowledge/<state>/** (untracked-confidential) · codemap · archive | Ruri |
| `etanah_atlas/` | canonical | the Atlas build (per-state HTML + config) — a project that ships from this repo; guarded by atlas-ship-gate / atlas-full-check | Ruri |
| `library-items/` | canonical | external reference material we re-read (claude-code-best-practices · security) — read by evolution-protocol + 4 hooks | Ruri |
| `README.md` | canonical | public repo description | Ruri |
| `RURI-NOTEBOOK.md` · `MIYA-NOTEBOOK.md` · `AGENT-ARCHITECTURE.md` | canonical (docs) | who Ruri is · how みや drives the system · operator's guide (AGENT-ARCHITECTURE supersedes MIYA-NOTEBOOK — tombstone pending) | Ruri |
| `REGISTRY.md` | generated | inventory rendered by `core/registry.js` — never hand-edited | `core/registry.js` |
| `.gitignore` · `.gitattributes` | canonical | repo hygiene | Ruri |

## Orphans found 2026-09-04 — pending みや's nod (nothing moved or deleted yet)

| Entry | Last real commit | Referenced by | Verdict proposed |
|---|---|---|---|
| `etanah-knowledge/` (root, 1 file `melaka/DEV-TESTING-HACKS.md`, 166 lines) | 2026-05-25 | nothing (canonical = `projects/…/etanah-knowledge/melaka/DEV-TESTING-HACKS.md`, 643 lines) | **port-then-delete** — NOT a pure subset: 29 of its headings (older section names, e.g. "Hack catalog" / "Apply procedure") are absent from the canonical; diff section-by-section, port anything unique into the canonical, then `git rm` |
| `growth/kpi-evidence-log.md` | 2026-04-15 | `Feature/Forge-Self-Improvement-System/forge-review-protocol.md` only | **move** → `Feature/Forge-Self-Improvement-System/` (or delete with Forge tombstones) |
| `library/formats/*` (8 template format files) | 2026-03-12 (origin template) | `plugins/ruri-skills/skills/library` + `library-items/README.md` | **delete** — Kiyoraka template leftovers, never used by a hook |
| `plugins/ruri-skills/` | 2026-03-12 (origin template) | `new-machine-setup.md` · `save-commands.md` (install notes) | **delete** — template plugin; our skills live in `.claude/skills/` · then trim the 2 setup notes |
| `Project Resources/plan-format.md` | 2026-03-12 (origin template) | `plugins/ruri-skills/.../work-plan` (itself an orphan) | **delete** |
| `tools/docx/*.ps1` (3 scripts) | 2026-04-24 | nothing live | **move** → `lib/docx/` if still used for .docx reads, else delete |
| `salvage/2026-05-31-worktree-reconciliation/` | 2026-05-31 | itself | **delete** — reconciliation done; git history keeps it |
| `outputs-temp/` (30 scratch .py/.ps1) | 2026-06-26 | 3 prose mentions as a scratch location | **delete** + add `outputs-temp/` to `.gitignore` — the session scratchpad replaced it |
| `RURI-GROWTH.md` | 2026-05-22 | itself | **move** → `system/RURI-GROWTH.md` (architecture-evolution log belongs with the constitution) |
| `MIYA-NOTEBOOK.md` | 2026-08-04 | CLAUDE.md · usage-guidance skill · user-side-guardrail hook | **keep for now** — AGENT-ARCHITECTURE.md declares it superseded; tombstone in a separate pass with the 3 readers re-pointed |

After the nod: run each move with `git mv`, each delete with `git rm -r`, then `node lib/folder-structure.js check` must print `0 orphan(s)`, then update the allow-list fence.

## Naming + retire rules

- Root folders are lowercase-dashed or a single capitalised legacy name; no spaces (the `Project Resources` shape is banned).
- A root entry retires by: (1) a row here flipped to `tombstoned <date>` for one cycle, (2) readers re-pointed (grep the name), (3) `git rm`. Never delete first.
- Per-operation folders are BANNED at the root and under `system/` (File Ownership row "Operation-run outputs", CLAUDE.md v1.70).
- State-specific material never gets a root folder — it goes under `projects/…/etanah-knowledge/<state>/` (layout: `KNOWLEDGE-SCHEMA.json`), Task folders under `1. Tasks/<State>/`, code under `E:/Projects/<State>/` — all three resolved by `lib/states.js`.

## Machine-read allow-list

```json
{
  "allow": [".claude", ".git", ".gitattributes", ".gitignore", "main", "system", "core", "lib", "domain", "quest", "Feature", "daily-diary", "projects", "etanah_atlas", "library-items", "README.md", "RURI-NOTEBOOK.md", "MIYA-NOTEBOOK.md", "AGENT-ARCHITECTURE.md", "REGISTRY.md", "node_modules", "backups", "meta", "outputs-temp.gitkeep"],
  "pending_nod": ["etanah-knowledge", "growth", "library", "plugins", "Project Resources", "tools", "salvage", "outputs-temp", "RURI-GROWTH.md"]
}
```

*`allow` = canonical/legacy/generated/ignored-runtime entries. `pending_nod` = orphans awaiting みや's verdict — they are reported as `pending` (not `orphan`) so the boot line stays honest until he rules. Anything in neither list is an ORPHAN.*
