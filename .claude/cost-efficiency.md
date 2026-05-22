# Cost Efficiency Rules

> Token-discipline rules. Learned 2026-04-03 — token spikes observed, documented to prevent repeat.
> Routed out of CLAUDE.md 2026-05-22 (decomposition) — evergreen discipline, needn't reload every session.

## Grep / Search

| Rule | Why |
|---|---|
| Always use `output_mode: files_with_matches` first | Content mode across large codebases = massive token dump |
| Then read only the matched file | One targeted Read is far cheaper than content-mode Grep |
| Use `path` to narrow scope — never grep entire repo for content | Unscoped content Grep is the #1 token spike |

## File Reads

| Rule | Why |
|---|---|
| Use `offset` + `limit` when you know the relevant area | Reading 400+ lines when you need 20 is wasteful |
| Don't re-read large files unless they've changed | `main-memory.md`, `ENVIRONMENT.md` etc. are stable — read once per session |
| Glob before Read — confirm file exists and path is right first | Avoids wasted reads on wrong paths |

## Agents / Familiars

| Rule | Why |
|---|---|
| Only spawn a familiar for files >500 lines or multi-file investigations | Spawning costs full context handoff |
| For targeted single-file reads, use Read directly | Familiar is overkill for one file |
| Pass exact file path to familiar — don't make it search | Familiar searching = double the token cost |

## General

| Rule | Why |
|---|---|
| Parallel tool calls where independent | Sequential when dependent only |
| Claude Desktop sessions add to daily token usage separately | Can't distinguish which session caused spike — be efficient in both |
| Large permission arrays in `settings.local.json` load every tool call (PreToolUse) | Keep it lean — remove stale entries periodically |
