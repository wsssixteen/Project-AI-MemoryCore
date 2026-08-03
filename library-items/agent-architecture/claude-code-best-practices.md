# Claude Code Best Practices — Anthropic-Recommended Patterns

> **Saved:** 2026-05-23 (Phase 1 of system-layer build)
> **Source:** Deep-research pass via general-purpose subagent. Sources: docs.claude.com, anthropic.com/engineering, github.com/anthropics/{claude-code, claude-agent-sdk-python, skills, anthropic-cookbook}, Claude Code CHANGELOG through May 2026
> **Last researched:** 2026-05-23 — re-verify freshness if >60 days old (per system-layer Stage 6 evolution-check)
> **Referenced by:** `system/INDEX.md` · `system/principles.md` · system-design-router skill (Step 3.5 best-practices check)

---

## Index (jump to section)

- [A) Skills](#a-skills) — frontmatter, lifecycle, when to split/combine
- [B) Hooks](#b-hooks) — events, payload shapes, deterministic semantics
- [C) CLAUDE.md memory architecture](#c-claudemd-memory-architecture)
- [D) MCP servers](#d-mcp-servers)
- [E) Subagents / Task tool](#e-subagents--task-tool)
- [F) Settings / permissions](#f-settings--permissions)
- [G) Last-60-days deltas (Mar–May 2026)](#g-last-60-days-deltas-marmay-2026)
- [H) Concrete recommendations](#h-concrete-recommendations)
- [Gaps / contradictions / not-found](#gaps--contradictions--not-found)
- [Sources](#sources)

---

## A) Skills

| Aspect | Anthropic guidance | Source |
|---|---|---|
| Frontmatter required fields | `name` (≤64 chars, lowercase/numbers/hyphens) · `description` (≤1024 chars, non-empty) | docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices |
| Optional fields | `allowed-tools` (grants permission while skill active — known not-enforced as access restriction, only as no-prompt allowlist) · `model` (only effective when `context: fork`) · `disable-model-invocation` · `user-invocable` | docs + GH issues #18837, #37683 |
| Loader trigger | Discovery: name+description preloaded at startup into system prompt. Activation: when user task matches description, Claude bash-reads SKILL.md into context. Execution: skill may reference further files loaded just-in-time. | anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills |
| Description style | Must include **what it does AND specific triggers/contexts for when to use it**. Description is "the primary signal Claude uses" to select among many skills. | best-practices doc |
| Size ceiling | "Keep SKILL.md body under 500 lines for optimal performance." Split into referenced sub-files when larger. | best-practices doc |
| Split vs combine | Split when mutually-exclusive paths exist (keeps token usage low). Combine when contexts always co-occur. | best-practices doc |
| Lifecycle (recommended) | Eval first → identify gap → build minimal skill → observe real usage → iterate. "Watch for unexpected trajectories or overreliance." | best-practices doc |
| Plugin-skill vs project-skill | Plugin skill = packaged + distributable across teams/users (`.claude-plugin/`). Project skill = `.claude/skills/` in repo. Personal/user skill = `~/.claude/skills/`. | docs.claude.com/en/docs/claude-code/plugins, /skills |

## B) Hooks

| Event | Can block? | Decision mechanism | Notes |
|---|---|---|---|
| `SessionStart` | No | env / context injection | Common for boot-load gates, env exports |
| `UserPromptSubmit` | Yes | exit 2 / JSON `decision:"block"` | Validate / rewrite user prompt |
| `PreToolUse` | Yes | `hookSpecificOutput.permissionDecision: "deny"\|"allow"\|"ask"` + `permissionDecisionReason` (NOT top-level `decision`) | Exit 2 also blocks; known bug #24327 where exit-2 can stop instead of feeding feedback — prefer JSON |
| `PostToolUse` | Yes (after-the-fact) | top-level `{"decision":"block","reason":"..."}` · also `hookSpecificOutput.updatedToolOutput` (rewrites tool result before Claude sees it) | Always fires, no matcher · `duration_ms` now in payload (May 2026) |
| `PostToolUseFailure` | — | feedback | Newer event; failure path of PostToolUse |
| `Notification` | No | — | Fires when Claude waiting for input |
| `Stop` | Yes (prevents stop) | top-level `{"decision":"block","reason":"..."}` | Reason instructs Claude what to do next · payload now includes `background_tasks`, `session_crons` (May 2026) |
| `SubagentStop` | Yes | same as Stop | Same recent additions |
| `PreCompact` | — | — | Runs before compaction |
| `SessionEnd` | — | — | Cleanup |
| `PermissionRequest` | Yes | `hookSpecificOutput.decision` | Different shape from PreToolUse |

**Determinism:** "Hooks are deterministic; CLAUDE.md is advisory." → If you need a behaviour to fire 100% of the time, it's a hook, not a CLAUDE.md instruction.

**Exit-code contract:** 0 = pass · 2 = block/feedback · other = error. For granular control prefer JSON over exit codes.

**May 2026 additions:** `terminalSequence` field on hook JSON output (desktop notifications/bells); PostToolUse `updatedToolOutput` extended to all tools (was MCP-only); duration_ms field.

## C) CLAUDE.md memory architecture

| Aspect | Anthropic guidance | Source |
|---|---|---|
| Size target | **"Target under 200 lines per CLAUDE.md file. Files over 200 lines consume more context and may reduce adherence."** | docs.claude.com/en/docs/claude-code/memory |
| Style | "Specific, concise, well-structured instructions work best." Prune ruthlessly; if Claude already does it right, delete it. | best-practices |
| `@path` imports | Supported for organization. **"Imported files still load and enter the context window at launch"** — splitting does NOT reduce context. | memory doc |
| Path-scoped rules | Preferred over @import when goal is context reduction — load only when Claude works with matching files. | memory doc |
| Two-system model | CLAUDE.md = you write (stable rules, judgment) · auto-memory MEMORY.md = Claude writes (corrections, picked-up preferences). | memory doc |
| Prose-pointer anti-pattern | **Not explicitly named in Anthropic-official material.** Best Practices doc says: "If Claude is already doing something correctly without instructions, delete it or convert to a hook." Implicit answer: behaviour that must fire → hook · domain knowledge that must trigger contextually → skill (description-triggered) · judgment guidance → CLAUDE.md. Pointers like "see X.md" are advisory and load X only if Claude chooses to follow the pointer — they are not a reliable activation mechanism. | best-practices; inferred from skills progressive-disclosure model |
| Context engineering principle | Claude Code's hybrid: CLAUDE.md = naive up-front load · glob/grep + skills + sub-files = just-in-time retrieval. Avoid stuffing CLAUDE.md to act as a knowledge base. | anthropic.com/engineering/effective-context-engineering-for-ai-agents |

## D) MCP servers

| Aspect | Guidance | Source |
|---|---|---|
| Scopes | Local (default, per-project, private) · Project (`.mcp.json` at repo root, team-shared, version-controlled) · User (~/.claude.json, all projects, private) | docs.claude.com/en/docs/claude-code/mcp |
| Precedence | Local > Project > User | mcp doc |
| When to build custom | Anthropic-official does not give a hard rule. Pattern from docs: build custom when no existing server covers it AND tool boundary is reusable across sessions. Otherwise prefer in-process custom tools via Agent SDK (no separate process). | mcp doc + claude-agent-sdk-python README |
| Tool description discipline | "The description field on each tool is not documentation for humans. It is the primary signal Claude uses to decide which tool to call." Generic descriptions lose to specific ones at selection time. | mcp doc |
| Permissions | Standard allow/deny/ask rules apply to MCP tools via `mcp__<server>__<tool>` pattern. | settings doc |

## E) Subagents / Task tool

| Aspect | Guidance | Source |
|---|---|---|
| Define when | "You keep spawning the same kind of worker with the same instructions." | docs.claude.com/en/docs/claude-code/sub-agents |
| Isolation | Each subagent = own context window, own system prompt, own tool access, independent permissions. Optional worktree isolation. | sub-agents doc |
| When to spawn | Side task would flood main context with logs/files/search results not needed downstream — subagent does work in its own window, returns summary. | sub-agents doc |
| Foreground vs background | Foreground = blocking. Background = concurrent. Multiple can run in parallel (e.g., style + security + tests). | sub-agents doc |
| Persistent memory | User-scope subagent → `~/.claude/agent-memory/` directory accumulates insights across sessions. | sub-agents doc |
| What NOT to delegate | "Only delegate when task clearly benefits from a separate agent with a new context window." Implied: small clarifying questions, tasks needing tight coupling with the main conversation, anything where you need to see the work-in-progress. | sub-agents doc |
| SDK (May 2026) | Subagents definable inline in code (no filesystem). `list_subagents()` / `get_subagent_messages()` helpers. Fixed: dynamic MCP server inheritance; isolated-worktree Read/Edit on own files. | claude-agent-sdk-python README + CHANGELOG |

## F) Settings / permissions

| Aspect | Guidance | Source |
|---|---|---|
| Hierarchy | Enterprise managed > CLI args > project local (`settings.local.json`, gitignored) > project shared (`settings.json`, committed) > user (`~/.claude/settings.json`) | docs.claude.com/en/docs/claude-code/settings |
| Permission shape | `permissions.{allow,deny,ask}` arrays of `"Tool"` or `"Tool(specifier)"`. Evaluation order: **deny → ask → allow**, first match wins. | settings doc |
| Convention | `Bash(npm run lint)`, `Bash(npm run test *)`, `Read(./.env)`, `mcp__server__tool` | settings doc |
| settings.json | Team-shared, committed | settings doc |
| settings.local.json | Personal overrides, gitignored | settings doc |
| Env vars | Set in settings via `env: {}`. New 2026: `CLAUDE_CODE_PLUGIN_PREFER_HTTPS`, `ANTHROPIC_WORKSPACE_ID`. | CHANGELOG |
| Hooks registration | Registered in settings.json under `hooks.<EventName>` with matcher + command. | hooks doc |

## G) Last-60-days deltas (Mar–May 2026)

| Change | Where | Source |
|---|---|---|
| Fast mode default → Opus 4.7 (was 4.6) | CLI | claude-code CHANGELOG May 2026 |
| `claude agents` new flags: `--add-dir`, `--settings`, `--mcp-config`, `--plugin-dir`, `--permission-mode`, `--model`, `--effort`, `--dangerously-skip-permissions`, `--cwd <path>` | CLI | CHANGELOG |
| Hook `terminalSequence` JSON field (desktop notifs, bells, window titles) | Hooks | CHANGELOG |
| PostToolUse `updatedToolOutput` extended from MCP-only → all tools | Hooks | CHANGELOG |
| `duration_ms` in PostToolUse/PostToolUseFailure payload | Hooks | CHANGELOG |
| Stop/SubagentStop payload adds `background_tasks`, `session_crons` | Hooks | CHANGELOG |
| `/plugin Discover/Browse` previews plugin's commands/agents/skills/hooks/MCP/LSP pre-install | Plugins | CHANGELOG |
| `CLAUDE_CODE_PLUGIN_PREFER_HTTPS` env (HTTPS clone for plugins, no SSH key needed) | Plugins | CHANGELOG |
| Subagent fixes: dynamic MCP server inheritance; isolated-worktree Read/Edit on own files | Subagents | CHANGELOG |
| `/feedback` can include last 24h or 7d of sessions | CLI | CHANGELOG |
| **Code with Claude 2026 keynote** (announced, not all GA): Multiagent Orchestration · Outcomes (success criteria, iterate) · Dreaming (recall prior sessions) | Roadmap | chrisebert.net notes (third-party report) |

## H) Concrete recommendations

Ordered by impact. Pattern → current anti-pattern → Anthropic-recommended → source.

| # | Pattern | Current anti-pattern | Anthropic-recommended | Source |
|---|---|---|---|---|
| 1 | **Behaviours that MUST fire belong in hooks, not CLAUDE.md prose** | "see X.md" pointers that fail to fire reliably | "Hooks are deterministic; CLAUDE.md is advisory. If Claude already does it correctly, delete or convert to a hook." | best-practices doc |
| 2 | **Domain knowledge with trigger conditions belongs in skills (description-triggered), not pointers** | Prose pointer assumes Claude will choose to follow it | Progressive disclosure: name+description preloaded · full SKILL.md loaded only when description matches task. Description must explicitly enumerate triggers. | equipping-agents blog + best-practices |
| 3 | **CLAUDE.md ≤200 lines, ruthlessly pruned, judgment-only** | Pushing CLAUDE.md past 200 lines; satellite-file pointers can bloat context | "Target under 200 lines… longer files consume more context and reduce adherence." Keep only stable rules + judgment guidance. | memory doc |
| 4 | **Stop using @import as a context-reduction tool** | Splitting into satellite .md files to "keep CLAUDE.md small" | "Imported files still load… at launch." Splitting helps organization, not context. For context reduction use path-scoped rules or skills. | memory doc |
| 5 | **Skill descriptions must enumerate triggers, not just describe the skill** | Description that says what the skill is, leaving Claude to guess when to fire | Description = what + specific triggers/contexts. "Primary signal Claude uses to choose the right Skill from potentially 100+." | best-practices |
| 6 | **Tool/MCP tool descriptions are model-facing, not human-facing** | Generic descriptions | Specific, disambiguating descriptions ("executes read-only SQL against analytics DB, returns rows as JSON" beats "runs a query") | mcp doc |
| 7 | **Use SessionStart hook for boot-load verification** | CLAUDE.md instruction "first line of briefing must show ✓ per file loaded" — relies on model compliance | A SessionStart hook can deterministically inject the verified-loaded marker and/or refuse to proceed | hooks doc |
| 8 | **Sub-files for skills: split when mutually exclusive, combine when co-occurring** | One-size-fits-all SKILL.md > 500 lines | "Keep SKILL.md body under 500 lines… split into separate files using progressive disclosure when content exceeds this. Mutually exclusive paths → separate files to reduce token usage." | best-practices |
| 9 | **Convert "always do X when Y" patterns into PreToolUse / PostToolUse hooks** | CLAUDE.md rule like "always update version stamp on protocol edits" | PreToolUse hook on Edit/Write inspecting target path; reject (exit 2 or JSON deny) if stamp not in diff | hooks doc + best-practices |
| 10 | **Package the system as a plugin once stable** | Loose `.claude/` files duplicated across worktrees, drift risk | Plugin bundles skills/hooks/commands/MCP. `/plugin` UI previews contents pre-install. Marketplace via `marketplace.json` even for internal-only use. | plugins doc |

## Gaps / contradictions / not-found

- **No Anthropic-official material explicitly names "prose pointer to satellite file" as an anti-pattern.** The closest official guidance is the "convert to hook if it must fire" line and the description-trigger model for skills. The label/diagnosis is third-party (HumanLayer blog, etc.) but consistent with the official progressive-disclosure architecture.
- **`allowed-tools` enforcement contradiction**: docs imply it grants permission while the skill is active; GitHub issues #18837 and #37683 (both open as of last 60 days) say it is not actually enforced as a restriction — only as a no-prompt allowlist. Treat as advisory.
- **PreToolUse exit-code 2 behaviour**: GH issue #24327 reports exit-2 causes Claude to stop instead of receiving feedback. Anthropic-recommended workaround = use JSON `hookSpecificOutput.permissionDecision` instead of exit codes for blocking.
- **Hook payload schema for PreToolUse vs PostToolUse is documented inconsistently** (anthropics/claude-code #19115). PostToolUse uses top-level `decision`; PreToolUse uses nested `hookSpecificOutput.permissionDecision`. Easy to get wrong.
- **"How Anthropic teams use Claude Code" PDF** (www-cdn.anthropic.com/58284b19...pdf) is the most authoritative internal-practice doc and was not fully fetched during the original research — worth reading directly for source-of-truth narrative on CLAUDE.md discipline and hook-vs-instruction triage.

## Sources

- [Skills (Claude Code)](https://docs.claude.com/en/docs/claude-code/skills)
- [Skill authoring best practices](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices)
- [Hooks reference](https://docs.claude.com/en/docs/claude-code/hooks) / [Hooks guide](https://docs.claude.com/en/docs/claude-code/hooks-guide)
- [Memory / CLAUDE.md](https://docs.claude.com/en/docs/claude-code/memory)
- [Sub-agents](https://docs.claude.com/en/docs/claude-code/sub-agents)
- [Settings](https://docs.claude.com/en/docs/claude-code/settings)
- [MCP](https://docs.claude.com/en/docs/claude-code/mcp)
- [Plugins](https://docs.claude.com/en/docs/claude-code/plugins)
- [Plugin marketplaces](https://docs.claude.com/en/docs/claude-code/plugin-marketplaces)
- [Slash commands](https://docs.claude.com/en/docs/claude-code/slash-commands)
- [Best practices for Claude Code](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Equipping agents with Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
- [How Anthropic teams use Claude Code (PDF)](https://www-cdn.anthropic.com/58284b19e702b49db9302d5b6f135ad8871e7658.pdf)
- [claude-code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- [claude-agent-sdk-python](https://github.com/anthropics/claude-agent-sdk-python)
- [anthropics/skills](https://github.com/anthropics/skills)
- [anthropic-cookbook agents](https://github.com/anthropics/anthropic-cookbook/tree/main/patterns/agents)
- [GH issue #18837 — allowed-tools not enforced](https://github.com/anthropics/claude-code/issues/18837)
- [GH issue #19115 — PreToolUse vs PostToolUse schema conflict](https://github.com/anthropics/claude-code/issues/19115)
- [GH issue #24327 — PreToolUse exit-2 stops instead of feedback](https://github.com/anthropics/claude-code/issues/24327)
