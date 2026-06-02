---
name: project-jboss-launched-by-eclipse
description: "みや's local JBoss EAP 7.4 is launched from Eclipse JBossTools, NOT from standalone.bat. standalone.conf.bat is IGNORED — JVM args set there never reach the JVM. Set JVM args in Eclipse Server Launch Config → Arguments → VM arguments instead."
metadata: 
  node_type: memory
  type: project
  originSessionId: e73b5096-df29-4914-a5a9-ee09f0151854
---

みや's JBoss EAP 7.4 at `E:/Dev/jboss-7.4-plp-melaka` is launched by Eclipse's **JBossTools** plugin, NOT from command-line `standalone.bat`. Evidence: in `server.log` boot system-properties dump, `program.name = JBossTools: Red Hat JBoss EAP 7.4`.

**Why this matters**: any JVM flag (`-D...`) written into `standalone.conf.bat` or `standalone.bat` is dead — JBossTools never sources those files. It uses its own Eclipse-managed launch configuration.

**Symptom of repeating this mistake**: after a JBoss restart, the expected `-D` system property is missing from the server.log boot properties section. Probe code that gates on `System.getProperty("...")` returns null → all probes silent → log shows zero of the expected tagged lines.

**How to apply**:
- **Setting a JVM flag for test/debug**: Eclipse → **Servers** view → double-click the JBoss server → **Overview** tab → **Open launch configuration** → **Arguments** tab → append to **VM arguments** box → Apply → restart server.
- **Faster alternative when probes are temporary**: skip the JVM flag entirely — make the probe helper return `true` unconditionally in the .java code. One source edit + one rebuild, no Eclipse fiddling. Reverted at Phase 1 close with the rest of the probes.
- **Verifying a JVM flag took effect after restart**: grep the boot system-properties section of `server.log` (the long block right after the "JBoss EAP ... starting" line) for the flag name. If missing → flag never reached JVM, do not waste a test cycle.

**First slip**: 2026-06-02 QA-262495. Edited `standalone.conf.bat` to add `-DqaProbe262495=true`, asked みや to restart, then the boot properties (lines 72200-72278 of server.log) showed zero `qaProbe262495`. One restart cycle + みや's testing time wasted. Cross-ref: `[[server-log-path]]` (`E:/Dev/jboss-7.4-plp-melaka/standalone/log/server.log`).
