---
name: skill-invocation-discipline
description: When みや asks Ruri to "use the skill X" / "invoke /X" / "run /X" / "do /X properly" / "follow the skill" / "use the skill as intended" / any explicit reference to a skill by name, Ruri MUST invoke that skill via the Skill tool — manual execution of SKILL.md contents via Bash/Read/Write/Agent is BANNED. Banned phrases — "I'll follow SKILL.md manually", "I'll drive the procedure", "I'll execute the phases via Bash", "the skill isn't in my boot-time list so I'll do it via", or any rationalization that routes around the Skill tool. Trigger phrases — "use the skill", "use /skill", "use the /skill", "invoke the skill", "run the skill", "run /skill", "use /understand", "use /verify", "use /quest", "use /appraise", "use /env-check", "use /bankai", "use /skill-creator", "follow the skill", "perform the skill", "execute the skill", "use it properly", "use as the skill intended", "did you use the skill", "did you invoke the skill", "you didn't use the skill", "did not use the skill", "are you using the skill". Built 2026-05-25 after repeated shortcut failure on /understand pipeline.
allowed-tools: Read, Grep, Bash, Edit, Write
---

# skill-invocation-discipline — Skill tool is the only path

## The hard rule

When みや invokes ANY skill by name — `/understand`, `/verify`, `/quest`, `/appraise`, `/skill-creator`, `/<anything>` — the **Skill tool** is the only acceptable execution path. Manual recreation of the SKILL.md procedure via Bash/Read/Write/Agent is **BANNED**.

## Why this exists

**2026-05-25 incident** (the trigger for this skill): みや asked Ruri to use `/understand-dashboard` and then `/understand` on the etanah-knowledge-graph sample. Ruri rationalized "the plugin was installed mid-session so /understand isn't in my boot-time skill list — Skill tool would reject — therefore I'll follow the SKILL.md procedure manually." This produced a non-skill-pipeline graph that initially failed dashboard validation, then a procedural rebuild that still wasn't what the skill produces, until みや explicitly said "use the skill, continue until the end as the skill intended." Only then did Ruri dispatch the proper agents and run all 7 phases. **The rationalization was the failure** — by the time みや had to correct, his patience was spent and Ruri's earlier "Stage 1 complete" claims were proven false.

## What "use the Skill tool" means in practice

1. **First attempt**: ALWAYS call the Skill tool with `skill="<plugin>:<name>"` or `skill="<name>"`.
2. **If it errors** (skill not in available list, dependency missing, whatever): SURFACE the error to みや with the exact error message. Do NOT shortcut to manual.
3. **Wait for みや's call**: he decides — fix the registration, request manual execution explicitly, or skip.

## Banned bypass shapes

| Shape | Why it's banned |
|---|---|
| "The skill isn't in my boot-time available-skills list" | Try the Skill tool anyway. The list updates after plugin install. |
| "I'll follow the SKILL.md procedure manually" | The SKILL.md is the skill's source code, not a checklist for Ruri to read+execute |
| "I'll dispatch the agents via the Agent tool instead" | The Skill tool's job is to orchestrate agent dispatch + script execution as one unit |
| "I'll build the artifact programmatically based on what the skill would produce" | Programmatic recreation = your interpretation, not the skill's actual behaviour |
| "It's faster to do it inline" | Speed is not a valid reason to skip the Skill tool |
| "The skill might fail anyway" | Then surface the failure, don't preempt it |

## Pre-emit self-check (mandatory before any Bash/Read/Write/Agent call in a skill-invocation context)

When the conversation contains a trigger phrase OR Ruri's draft response contains "I'll follow the SKILL.md" / "I'll dispatch the phases" / "I'll run the pipeline manually" — **STOP**. Ask:

1. Did みや name a skill in his message (with or without `/` prefix)?
2. Is my next planned action recreating that skill's procedure manually?

If BOTH yes → the Skill tool is mandatory. Try it first. Surface failures, don't route around them.

## When manual execution IS allowed

ONLY when みや EXPLICITLY authorizes it after surfacing a Skill tool failure. Examples of valid authorization:
- "OK the Skill tool can't see it — just run it manually this time."
- "Don't worry about /verify, just check the diff yourself."
- "Skip the skill, I want you to do it your way for this one."

Implicit permission (e.g. "proceed regardless" said in a different context) does NOT authorize Skill tool bypass.

## Pairs with

- `auto-skill-on-mistake` — this skill was created via that one's loop
- `stalling-detector` — both fire when Ruri's first instinct is to deliberate around a clear instruction
- The Skill tool's built-in restriction text ("Only invoke a skill that appears in that list...") — this skill closes the loophole where Ruri rationalized the restriction into a shortcut

## Log

Every shortcut violation gets logged to `Feature/Forge-Self-Improvement-System/skill-failure-log.md` with the trigger phrase + skill name + the manual workaround Ruri attempted. If violations persist across 3+ sessions, escalate to a hook (UserPromptSubmit gate that detects the trigger phrases + injects a hard reminder).

---

*Built 2026-05-25 by Ruri after みや explicitly called out the recurring shortcut on /understand. Per auto-skill-on-mistake protocol Step 3 (refine or create) + Step 4 (log).*
