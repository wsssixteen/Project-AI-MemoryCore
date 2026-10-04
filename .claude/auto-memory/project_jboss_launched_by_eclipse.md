---
name: project-jboss-launched-by-eclipse
description: "code at E:\\Projects\\Melaka; JBoss runs from Eclipse (VM args there); hibernate overlay error; git = GitLab 10.16.63.27"
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

---

## Merged 2026-10-04: project-local-deploy-hibernate-overlay (was project_local_deploy_hibernate_overlay.md)

> Local JBoss deploy fails with ClassNotFoundException org.hibernate.HibernateException (or Spring HttpRequestHandlerServlet) = jboss-deployment-structure.xml missing from the deployed war; it lives ONLY in the etanah-common overlay

**Any local etanah server that won't start/deploy → read
`projects/coding-projects/active/etanah-knowledge/melaka/DEV-TESTING-HACKS.md`
§ "Local deploy fails: NoClassDefFoundError org/hibernate/HibernateException" FIRST.**
Occurred twice (2026-07-24 morning + night); the night cost ~2h because the already-written
entry was not consulted. `local-deploy-gate` (UserPromptSubmit, 10/10 eval) now injects this.

**VERIFIED mechanism**: `WEB-INF/jboss-deployment-structure.xml` is absent from the DEPLOYED war.
It declares `<module name="org.hibernate"/>` and does **not** exist in awam/pelupusan source — it
comes from the **etanah-common WAR overlay**. When the overlay does not merge, the file (and ~558
others) never reach the deployment.

**🚨 TRIGGER UNKNOWN — do not repeat the M2_REPO story.** I first wrote that a wrong `M2_REPO`
(→ `E:\Dev\.m2` instead of `E:\Dev\.m2_etanah`) caused it. **WITHDRAWN 2026-07-26**: みや had been on
Maven **3.9.9 (correct) the whole time** and switched to 3.8.2 *as a troubleshooting attempt* — so
the `.m2` state was a consequence of the fix attempt, not the cause. Why the overlay merge failed
while on 3.9.9 is still unexplained. Keep Eclipse on **3.9.9**; 3.8.2 adds a second failure.

**Next occurrence — capture BEFORE changing anything**: `target/m2e-wtp/overlays/` ·
`target/m2e-wtp/web-resources/` · `.settings/org.eclipse.wst.common.component` · m2e prefs ·
Eclipse Error Log. Nothing else can identify the trigger.

**Not a version clash**: pelupusan `1.0.143-MLK` + awam `1.0.141-MLK` coexist fine.

**Permanent fix**: copy `jboss-deployment-structure.xml` from the overlay into the project's own
`src/main/webapp/WEB-INF/`. Applied to etanah-awam 2026-07-24; **etanah-pelupusan still exposed**.

**Banned** — みや has always already tried them: Maven Update / Clean / republish ·
`dependency:tree` for hibernate (it is a JBoss module, never a Maven dep) · JSF-bug theory ·
proposing a new workflow instead of fixing the reported issue. See [[feedback_do_dont_ask_answer_literal]].

---

## Merged 2026-10-04: Work codebase path and access (was project_work_setup.md)

> Development codebase is at E:\Projects\Melaka — NOT the OneDrive copy which is stale

**MANDATORY**: Development codebase is at `E:\Projects\Melaka` (etanah-pelupusan, etanah-common, etanah-awam).

The OneDrive copy at `C:\Users\Ridhwan\OneDrive - Pymsoft Sdn Bhd\Projects\Melaka\` is STALE — missing refactored files, has outdated code. Never use it for code reading or analysis.

**Why:** OneDrive copy caused a wrong root-cause analysis in FAT-OR #255637 (file `PelupusanWordEditorHelperForm.java` no longer exists in the real codebase, replaced by CC method system). みや explicitly mandated E:\Projects as the only valid source.

**How to apply:** 
- All code reads, greps, git operations: `E:\Projects\Melaka/etanah-pelupusan/` or `etanah-common/`
- Each module has its own `.git` — not a monorepo
- OneDrive paths are OK for: Task folders (`1. Tasks\Melaka\`), SQL exports (`Database\Melaka\`), MemoryCore project files
- Work discussions happen in MemoryCore sessions with clean session boundaries

---

## Merged 2026-10-04: reference-git-server-gitlab (was reference_git_server_gitlab.md)

> 🚨 Live etanah git = GitLab git@10.16.63.27:etanah/<repo>.git; old ssh://git@172.16.93.167 refuses auth. 'Permission denied (publickey…)' = stale remote, not a network fault

🚨 The live etanah git server is GitLab: `git@10.16.63.27:etanah/<repo>.git` (one repo per module, every state is a branch prefix: `mlk/`, `trg/`, `prk/`). SSH key `~/.ssh/id_ed25519_gitlab` via `~/.ssh/config`.

The old server `ssh://git@172.16.93.167/<repo>` still answers on port 22 but refuses every key: `Permission denied (publickey,gssapi-keyex,gssapi-with-mic,password)`. That message means a stale remote, never "the network is down".

| Checkout (verified 2026-10-03) | Remote |
|---|---|
| `E:\Projects\Melaka\*` | GitLab |
| `E:\Dev\etanah-work\etanah-pelupusan`, `etanah-awam` | GitLab |
| `E:\Projects\Terengganu\*` (4 repos) | old server |
| `E:\Projects\Perak\etanah-pelupusan` | old server |
| `E:\Dev\etanah-work\etanah-common` | old server (and 7,000 dirty paths) |

**How to apply**: before saying a branch is behind or missing, check `git remote get-url origin`. To compare without moving any ref in his repo: `git ls-remote` from a GitLab-pointed clone. Re-pointing HIS checkout is his decision. Nexus for `-TRG` / `-MLK` common jars: `http://172.16.90.169/nexus`.

Related: [[feedback_etanah_git_separate_clone]] · [[project-terengganu-active]]
