---
name: project-local-deploy-hibernate-overlay
description: Local JBoss deploy fails with ClassNotFoundException org.hibernate.HibernateException (or Spring HttpRequestHandlerServlet) = jboss-deployment-structure.xml missing from the deployed war; it lives ONLY in the etanah-common overlay
metadata: 
  node_type: memory
  type: project
  originSessionId: 4844d191-43f5-4048-946c-69b6e4681de8
  modified: 2026-07-26T09:33:02.381Z
---

**Any local etanah server that won't start/deploy → read
`projects/coding-projects/active/etanah-knowledge/melaka/DEV-TESTING-HACKS.md`
§ "Local deploy fails: NoClassDefFoundError org/hibernate/HibernateException" FIRST.**
Occurred twice (2026-07-24 morning + night); the night cost ~2h because the already-written
entry was not consulted. `local-deploy-gate` (UserPromptSubmit, 10/10 eval) now injects this.

**Root cause**: `WEB-INF/jboss-deployment-structure.xml` is absent from the DEPLOYED war. It
declares `<module name="org.hibernate"/>` and does **not** exist in awam/pelupusan source — it
comes from the **etanah-common WAR overlay**, resolved through Eclipse's `M2_REPO` variable
(derived from the active `settings.xml` `<localRepository>`).
`E:\Dev\.m2_etanah` = real repo (8.47 GB) · `E:\Dev\.m2` = decoy (near-empty).

**Not a version clash**: pelupusan uses common `1.0.143-MLK`, awam `1.0.141-MLK`; both coexist
fine. One shared `M2_REPO` pointing at the wrong repo breaks whichever project publishes.

**Permanent fix**: copy `jboss-deployment-structure.xml` from the overlay into the project's own
`src/main/webapp/WEB-INF/`. Applied to etanah-awam 2026-07-24; **etanah-pelupusan still exposed**.

**Banned** — みや has always already tried them: Maven Update / Clean / republish ·
`dependency:tree` for hibernate (it is a JBoss module, never a Maven dep) · JSF-bug theory ·
proposing a new workflow instead of fixing the reported issue. See [[feedback-fix-dont-reroute]].
