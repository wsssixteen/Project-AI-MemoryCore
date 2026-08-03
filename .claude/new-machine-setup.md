# New Machine Setup

> Do this once whenever setting up Claude Code on a new machine.
> Everything in the project folder syncs automatically — only `~/.claude/settings.json` needs manual setup.

## Step 1 — Set auto-memory path

Add to `~/.claude/settings.json` (create if it doesn't exist):

```json
{
  "autoMemoryDirectory": "<local path to this project>/.claude/auto-memory"
}
```

**Example paths:**

- Windows OneDrive: `C:\Users\<username>\OneDrive - Pymsoft Sdn Bhd\0. AI\Project-AI-MemoryCore\.claude\auto-memory`
- If storage location changes (USB, different cloud, etc.): just update this path to wherever the project lives on that machine

## Step 2 — Install the ruri-skills plugin (machine-level, does NOT sync)

> Added 2026-07-12 (external-audit P0.3 parity check found this step missing — without it, the identity skills (`ruri`, `session-start`, `save-memory`, `auto-commit`, `work-plan`, `library`) silently don't exist on the new machine).

```
claude plugin add --local plugins/ruri-skills
```

- Source lives in the repo at `plugins/ruri-skills/` (syncs); the INSTALL is per-machine (`~/.claude/plugins/`)
- Skill format reference: `plugins/ruri-skills/skill-format.md`
- Verify: type `Ruri` in a fresh session — the `ruri-skills:ruri` skill should fire

## Step 3 — Done

Everything else (personality, memory, session, permissions, project rules) is in the project folder and already synced.

> If Claude Code adds new features that store data in `~/.claude/`, check if there's a corresponding `Directory` or `Path` setting to redirect it here. Pattern is always the same: local path → this project folder.

---

*Routed out of CLAUDE.md 2026-05-22 (decomposition) — one-time setup doesn't need to load every session.*
