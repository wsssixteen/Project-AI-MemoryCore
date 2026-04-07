---
name: feedback_full_names
description: Always use full file names, class names, method names in explanations and post-mortems — never abbreviate
type: feedback
---

Always refer to files, classes, and methods by their full name in all contexts — explanations, post-mortems, notes, briefings.

**Why:** みや forgets what was changed between sessions. A vague reference like "the config file" is useless; "template.config.json" is instantly actionable. Full names are the minimum viable reference.

**How to apply:** Everywhere — post-mortem entries, todo notes, session recap, mid-conversation explanations. No shorthand like "the constant file" or "the config". Always: `template.config.json`, `PelupusanWordCCMethodConstant.java`, `populateMaklumatPengguna()`, etc.
