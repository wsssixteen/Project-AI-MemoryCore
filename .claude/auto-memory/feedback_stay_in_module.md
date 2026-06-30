---
name: stay-in-module
description: "Default scope = `etanah-pelupusan/src/` ONLY. Cross-module suggestions (patch etanah-common, override files at overlay-paths like /WEB-INF/layouts/, global CSS/JS injection that affects shared infra) are BANNED unless みや explicitly opens that scope. Also: a survey question is NOT a directive to enumerate every option including the out-of-scope ones."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c1704434-7e73-4ad1-a4b5-cc9739ef4037
---

When working on an etanah ticket (default = MPT / pelupusan work), the editable scope is **`E:\Projects\Melaka\etanah-pelupusan\src\`** ONLY. ANY suggestion that requires:

- Patching `etanah-common` (different repo, different release cycle)
- Creating override files in pelupusan src that mirror `etanah-common` overlay paths (e.g. `src/main/webapp/WEB-INF/layouts/bpmTemplate.xhtml` to shadow the overlay version)
- Global CSS/JS that affects shared infrastructure used by sibling modules
- Anything that ships only on みや's local laptop, not to other devs/users

...is **BANNED** unless みや explicitly says "patch etanah-common" / "override the overlay" / "open scope".

**Why** (みや 2026-06-30): *"You want the thousands of users to just use my laptop?"* — local-only forks are not a fix; they're a hack that diverges from etanah-common and breaks for every other developer or production user. The fix must ship through the supported channel: changes inside the module we own (etanah-pelupusan).

## A SURVEY ≠ a directive

When みや asks **"could we do X?"** / **"is there a centralized way?"** / **"what about Y?"** — that's a **survey**, not approval to enumerate every theoretical option including out-of-scope ones. **Answer surveys by listing ONLY in-scope options.** If a tempting solution requires going out of module, **MENTION it exists as a closed door** in one line, don't propose it as Option A.

**Banned**: presenting an option list where the recommended item requires cross-module work (e.g. "Recommended: bpmTemplate.xhtml override" when bpmTemplate lives in etanah-common).

## Self-rule — pre-answer scope check

Before proposing ANY fix in chat, grep my draft for these red flags:

| Red flag in my draft | Action |
|---|---|
| "patch etanah-common" / "edit the etanah-common version" | DELETE that proposal |
| "override file at /WEB-INF/layouts/" / "Maven WAR overlay override" | DELETE — only acceptable if みや explicitly opened the scope earlier in the thread |
| "global CSS sweep" / "body class on bpmTemplate" | DELETE — affects shared infra |
| "this requires opening the X repo" | DELETE — out of scope by definition |

Survivors of the scope check = the actual answer. If the scope check leaves nothing, say so honestly: *"All in-scope options have been tried; remaining leaks are out-of-module and need separate scope decision."*

## Today's failure (the trigger for this memory)

QA-239386 MPT centralized-disable discussion (2026-06-30):
- Proposed Option A1 = bpmTemplate.xhtml override (overlay-mirror in pelupusan)
- Proposed Option A2 = patch etanah-common
- Both out-of-module. みや rejected ALL.
- Earlier in same session: created `CommonSenaraiSemakanForm.xhtml` override at `src/main/webapp/protected/common/` — also a overlay-mirror; みや didn't reject at the time but the pattern is the same.

**Cross-ref**: [[feedback_simplify_and_reference]] (working-analog first within the system), [[feedback_no_extra_comments]] (in-scope discipline at code level).
