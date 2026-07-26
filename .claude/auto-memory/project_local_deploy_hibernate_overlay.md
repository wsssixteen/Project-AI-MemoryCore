---
name: project-local-deploy-hibernate-overlay
description: Local JBoss deploy fails with ClassNotFoundException org.hibernate.HibernateException (or Spring HttpRequestHandlerServlet) = jboss-deployment-structure.xml missing from the deployed war; it lives ONLY in the etanah-common overlay
metadata: 
  node_type: memory
  type: project
  originSessionId: 4844d191-43f5-4048-946c-69b6e4681de8
  modified: 2026-07-26T17:32:54.134Z
---

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
proposing a new workflow instead of fixing the reported issue. See [[feedback-fix-dont-reroute]].
