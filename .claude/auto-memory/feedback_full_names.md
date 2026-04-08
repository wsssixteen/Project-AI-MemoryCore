---
name: feedback_full_names
description: Always use full file names, class names, method names in explanations and post-mortems — never abbreviate
type: feedback
---

Always refer to files, classes, and methods by their full name in all contexts — explanations, post-mortems, notes, briefings.

**Why:** みや forgets what was changed between sessions. A vague reference like "the config file" is useless; "template.config.json" is instantly actionable. Full names are the minimum viable reference. In a large system, みや may not know which class a method belongs to — dropping the class name makes the explanation useless.

**How to apply:** Everywhere — post-mortem entries, todo notes, session recap, mid-conversation explanations. No shorthand like "the constant file" or "the config". Always: `template.config.json`, `PelupusanWordCCMethodConstant.java`, `populateMaklumatPengguna()`, etc.

**Extra rule (large system investigations):** When explaining a method, ALWAYS lead with the full class name first — e.g. "In `MlkUlasanJPPHForm.java`, `saveUlasan()` does X" — never just "in `saveUlasan()`". みや may be looking at multiple classes and won't know which one without the class anchor.
