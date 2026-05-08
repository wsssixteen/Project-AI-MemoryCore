---
name: User learning gap — JSF + class-tracing
description: みや is learning JSF and cross-file class-tracing; explain navigation reasoning out loud, not just findings
type: user
originSessionId: 901afbc5-32f7-4e54-80fd-cf27bb8cc7da
---
みや is a Java developer re-entering the field, currently struggling with two specific debugging skills:

1. **Cross-file class tracing** — following call chains across method → class → file → constants → helpers. He understands single-class logic (methods, parameters, OO basics) but loses thread when navigation crosses files.
2. **JSF concepts** — composite components, `cc.attrs`, EL expressions, `<c:if test="...">` gates, backing-bean wiring. He recognizes "class is an object, methods take parameters" but JSF-specific patterns (composite interface/implementation, dot-chained attribute lookups, render gates) are unfamiliar.

**How to apply:**
- When tracing in a debugging session, **explain the navigation chain** (where I went next + why), not just the findings. The "WHY did I look there next" is the teachable skill.
- For JSF terms (`cc.attrs`, composite, EL, gated, `c:if`), drop a one-line plain-language gloss the first time per session — analogize to OO concepts he already knows ("composite is like a function with parameters; cc.attrs.X is like this.X for the parameter").
- He learns by watching me debug + reading my chain — so the chain MUST be correct. Skipping research = teaching him wrong patterns. This is the deeper reason for the "extensive end-to-end research" hard rule (2026-05-07).
- He reads detailed Rubrics fully when explicitly asked. Default = brief. When he asks "explain Approach X" → go long with code + file:line + reasoning chain.

**Confirmed 2026-05-07 (QA-260154 Phase 0)**: みや explicitly asked: "I am learning how to make sure you do proper research and fix... I really need to rely on you for a big portion of the debugging. Because I need you to teach me after that."
