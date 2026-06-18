---
name: feedback_full_names
description: "Always use full file names, class names, method names in explanations and post-mortems — never abbreviate"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 21c1dfb3-d626-43d1-9e15-7467e7af0383
---

Always refer to files, classes, and methods by their full name in all contexts — explanations, post-mortems, notes, briefings.

**Why:** みや forgets what was changed between sessions. A vague reference like "the config file" is useless; "template.config.json" is instantly actionable. Full names are the minimum viable reference. In a large system, みや may not know which class a method belongs to — dropping the class name makes the explanation useless.

**How to apply:** Everywhere — post-mortem entries, todo notes, session recap, mid-conversation explanations. No shorthand like "the constant file" or "the config". Always: `template.config.json`, `PelupusanWordCCMethodConstant.java`, `populateMaklumatPengguna()`, etc.

**Extra rule (large system investigations):** When explaining a method, ALWAYS lead with the full class name first — e.g. "In `MlkUlasanJPPHForm.java`, `saveUlasan()` does X" — never just "in `saveUlasan()`". みや may be looking at multiple classes and won't know which one without the class anchor.

**File PATHS (added 2026-06-18, QA-266039):** When citing a file LOCATION, give the COMPLETE path every time — the absolute path (`E:\Projects\Melaka\etanah-awam\src\main\webapp\resources\img\i-lesen.png`) or the full-from-repo-root path — NEVER a tail fragment like `resources/img/i-lesen.png` that みや must mentally reconstruct. Repeat the full path in EVERY reference (diagram, table cell, prose) — do not abbreviate "to save space". **Why** (QA-266039): I cited a JSF webapp resource as `resources/img/i-lesen.png`; みや reconstructed it as the Maven-standard `src\main\resources\img` and the file wasn't there — the real location is `src\main\**webapp**\resources\img`. The dropped `webapp` is a load-bearing directory. **The fragment is actively misleading, not merely under-specified, when a near-identical wrong path exists** (Maven `src/main/resources` vs webapp `src/main/webapp/resources`) — it steers the reader to the wrong place. A path the reader has to rebuild is an incomplete hand-off.
