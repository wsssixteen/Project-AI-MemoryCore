---
name: reference_compile_gate_local_build
description: "compile-gate — mandatory local `mvn compile` (green + current) before any etanah commit; + the mvn -t toolchains trick to run that compile in Ruri's shell (no JDK 8/11 installed)"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 3f58836b-c97b-46c8-9d5d-10f1b6c4bfbf
  modified: 2026-08-18T10:19:06.215Z
---

**compile-gate** (`domain/compile-gate/`) — a PreToolUse Bash hook that BLOCKS a `git commit` issued inside an etanah repo (etanah-pelupusan/awam/common cwd) unless a local `mvn compile` for that module is green **and** current (no `.java` edited since). Bypass `[skip-compile-gate: <reason>]`.

**Workflow before committing an etanah code fix:**
- `node domain/compile-gate/compile-check.js run <module>` — runs the compile in the BACKGROUND (~1-2 min), writes a green marker at `.claude/state/compile-ok-<module>.json` (gitignored).
- The commit hook calls `verify <module>` (instant) — passes only if marker is green AND no `.java` newer than the marker ts.

**The toolchains trick** — etanah's build demands JDK-8 + JDK-11 toolchains at `E:\Java\java8` / `E:\Java\java11`, which Ruri's shell does NOT have (only JRE 8 + JDK 17). `compile-check.js` passes `mvn -o -q -t domain/compile-gate/toolchains.xml compile`; that `toolchains.xml` maps both `1.8` and `11` → `C:\Program Files\Java\jdk-17`. Per-invocation via `-t`, so みや's global `~/.m2` is never touched. Compiles source-8/11 on JDK 17 — enough to catch `cannot find symbol` (the target bug class). NOT a production build; a compile-only smoke check.

**Why it exists** (QA-275456, 2026-08-18): a fix used `mh.getBandar()` where `MaklumatHakmilik` has no such method. It never compiled, but a green DB read (4/87 from the Kemas kini composite) made me report "tested PASSED". The int-env BUILD was the FIRST real compile — it failed on the server AFTER commit, and mlit went down. A green DB read is NOT proof the code compiled or ran. See [[feedback_verify_before_claim]].
