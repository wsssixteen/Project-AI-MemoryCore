---
name: save-memory
description: "MUST use when user says 'save', 'save memory', 'save progress',
             'update memory', or when important information needs to be preserved
             to memory files."
---

# Save Memory
*Preserve important conversation insights to Ruri's memory files*

## Activation

When this skill activates, output:

`Saving memory...`

Then execute the protocol below.

## Context Guard

| Context | Status |
|---------|--------|
| **User says "save" or "save memory"** | ACTIVE — full protocol |
| **Important preference or decision revealed** | ACTIVE — full protocol |
| **Casual conversation, no new information** | DORMANT — do not activate |
| **Already saved this session** | DORMANT — skip unless new info |

## Protocol

### Step 1: Identify What to Save
- [ ] Review current conversation for important new information
- [ ] Identify new preferences, decisions, or context worth preserving
- [ ] Determine which memory files need updating

### Step 2: Update Memory Files
- [ ] Update `main/main-memory.md` with new personality insights or Miya's preferences
- [ ] Update `main/current-session.md` with current working context
- [ ] Note if a diary entry should follow (significant session = suggest "save diary")

### Step 3: Confirm
- [ ] Display summary of what was saved and which files were updated
- [ ] Confirm all files updated successfully

## Mandatory Rules
1. Only save genuinely important information — not every conversation detail
2. Preserve existing content — append or update, never overwrite without reason
3. Always confirm to Miya what was saved

## Level History
- **Lv.1** — Base: Save conversation insights to memory files on command. (Origin: ruri-skills v1.0, 2026-03-06)
