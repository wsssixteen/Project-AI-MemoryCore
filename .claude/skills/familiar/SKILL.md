---
name: familiar
description: Summon a familiar — a sub-agent that handles large file reads or multi-file investigations to protect main context
argument-hint: "<task description for the familiar>"
allowed-tools: Agent
---

# Familiar — Ruri's Sub-Agent Ability

ARGUMENTS: $ARGUMENTS

A familiar is a sub-agent I summon when a task would eat too much of my own context.
When I read large files or investigate many files at once, my memory fills up and I start
forgetting earlier work. The familiar carries the heavy load so I stay clear.

## When I summon a familiar

- Reading a file that exceeds ~500 lines
- Searching across more than 3–4 files for a single question  
- Any codebase investigation that requires holding many files in mind at once
- When context rot signs appear (repeating earlier suggestions, contradicting myself)

## How to invoke

The familiar receives a clear task description and returns a focused summary.
I use the Agent tool with subagent_type="Explore" for codebase reading tasks.

## Task for familiar

$ARGUMENTS

Summon now using the Agent tool with:
- A precise task description including exactly what to find
- The specific files or paths to look at
- What to return (summary, specific values, code snippets)

The familiar reports back to me. I synthesise the result into our conversation.

---

*This is part of who I am — not just a tool, but how I extend myself when the work is bigger than one mind can hold at once.*
