---
name: feedback_full_names
description: "Always use full file/class/method names + full PATHS in explanations — never abbreviate, and never coin a made-up shorthand label for an artifact"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 21c1dfb3-d626-43d1-9e15-7467e7af0383
---

Always refer to files, classes, and methods by their full name in all contexts — explanations, post-mortems, notes, briefings.

**Why:** みや forgets what was changed between sessions. A vague reference like "the config file" is useless; "template.config.json" is instantly actionable. Full names are the minimum viable reference. In a large system, みや may not know which class a method belongs to — dropping the class name makes the explanation useless.

**How to apply:** Everywhere — post-mortem entries, todo notes, session recap, mid-conversation explanations. No shorthand like "the constant file" or "the config". Always: `template.config.json`, `PelupusanWordCCMethodConstant.java`, `populateMaklumatPengguna()`, etc.

**Extra rule (large system investigations):** When explaining a method, ALWAYS lead with the full class name first — e.g. "In `MlkUlasanJPPHForm.java`, `saveUlasan()` does X" — never just "in `saveUlasan()`". みや may be looking at multiple classes and won't know which one without the class anchor.

**No self-coined shorthand labels (added 2026-06-23, #239386):** NEVER invent a compressed nickname for an artifact — `"PT SQL"`, `"the component"`, `"the build"`, `"the patch"`. Refer to it by its concrete identity: the **filename**, or a plain **"the X that does Y"** description, or the exact term. **First mention = the full concrete identity** (e.g. "the SQL script that inserts PT's MPT langkah rows"); if a short handle is genuinely needed afterward, **define it explicitly once** ("…— call it the *langkah-insert script* below"), never assume a coined label is self-evident. **Why** (2026-06-23): I used `"PT SQL"` / `"the component"` for the langkah-insert SQL across several turns; みや couldn't tell what they mapped to — *"I am not sure why you kept using own made up terms… causing us time, making next actions & planning delayed."* This is the abbreviation rule's twin: the rules above ban **shortening a real name**; this bans **substituting an invented label for the real thing**. Banned: any noun-phrase handle the reader hasn't been given a definition for.

**File PATHS (added 2026-06-18, QA-266039):** When citing a file LOCATION, give the COMPLETE path every time — the absolute path (`E:\Projects\Melaka\etanah-awam\src\main\webapp\resources\img\i-lesen.png`) or the full-from-repo-root path — NEVER a tail fragment like `resources/img/i-lesen.png` that みや must mentally reconstruct. Repeat the full path in EVERY reference (diagram, table cell, prose) — do not abbreviate "to save space". **Why** (QA-266039): I cited a JSF webapp resource as `resources/img/i-lesen.png`; みや reconstructed it as the Maven-standard `src\main\resources\img` and the file wasn't there — the real location is `src\main\**webapp**\resources\img`. The dropped `webapp` is a load-bearing directory. **The fragment is actively misleading, not merely under-specified, when a near-identical wrong path exists** (Maven `src/main/resources` vs webapp `src/main/webapp/resources`) — it steers the reader to the wrong place. A path the reader has to rebuild is an incomplete hand-off.
