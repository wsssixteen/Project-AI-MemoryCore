---
name: infra-server-log-request
description: 🚨 Server log request to infra = miya's exact one-liner, no path, no grep, ends "thank you"
metadata:
  type: feedback
---

Server log request to infra, VERBATIM shape (miya 2026-09-30):

```
hi Infra, please help to download server log for MLK Awam, env stag for today, thank you
```

Swap only: module (MLK Awam / MLK Pelupusan), env (stag / prod / mlit), day (today / <date>).

**Why:** I sent a file-download format with a guessed path (`/home/app/jboss/...`, never verified for AWAM staging) and dropped "thank you". People ask for the server log straight away; infra knows where it is.

**How to apply:** never add a path, grep, ticket number or explanation. Never guess a server path. Before asking infra for any log, check the DB error store first: Melaka `et_sistem_<schema>.pt_application_ex_entity` (stack_trace carries URL, host, build time). That found the #256334 borang root cause without any log. Related: [[prod-patch-infra-handoff]] · [[verify-before-claim]]
