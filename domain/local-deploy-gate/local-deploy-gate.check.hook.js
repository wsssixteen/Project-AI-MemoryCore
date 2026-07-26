#!/usr/bin/env node
// local-deploy-gate.check.hook.js — born via core/forge.js (2026-07-26)
// TRIGGER: prompt signals a local server/deploy failure: ClassNotFoundException, NoClassDefFoundError, POST_MODULE, WFLYSRV0026, jboss-deployment-structure, HibernateException, HttpRequestHandlerServlet, or plain-language jboss/war/local-server + fail/stuck/same-issue
// ACTION: inject the KNOWN root cause (jboss-deployment-structure.xml missing from deployed war - lives ONLY in etanah-common overlay, resolved via M2_REPO), the 2-command diagnosis, the permanent fix (copy into src/main/webapp/WEB-INF), and the BANNED moves (Maven Update/Clean/republish, dependency:tree for hibernate, JSF theory, proposing new workflow)
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

runHook({ name: 'local-deploy-gate', event: 'UserPromptSubmit' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const p = String(data.prompt || data.user_message || '');

  // (a) the literal exception/log text, (b) plain-language "server won't run" — みや reported
  // it BOTH ways on 2026-07-24 ("cannot start my local server" / the raw stack trace).
  const hardSignal = /(ClassNotFoundException|NoClassDefFoundError|POST_MODULE|WFLYSRV0026|WFLYCTL0013|jboss-deployment-structure|HibernateException|HttpRequestHandlerServlet)/i.test(p);
  const softSignal = /\b(jboss|deploy(ment|ing|ed)?|\.war\b|local server)\b/i.test(p)
    && /(fail|error|broken|stuck|same (fucking )?issue|not deploying|won'?t|can'?t|cannot|not working|what'?s the problem)/i.test(p);
  if (!hardSignal && !softSignal) return { fired: false };

  return {
    fired: true,
    blocked: false,
    contextOut: [
      '🚨 local-deploy-gate: local deploy/start failure signal detected.',
      '',
      '   MANDATORY FIRST ACTION — read before ANY theory:',
      '     projects/coding-projects/active/etanah-knowledge/melaka/DEV-TESTING-HACKS.md',
      '     § "Local deploy fails: NoClassDefFoundError org/hibernate/HibernateException"',
      '       + § "SECOND OCCURRENCE — 2026-07-24" (carries the PERMANENT fix)',
      '',
      '   VERIFIED MECHANISM (2 occurrences): WEB-INF/jboss-deployment-structure.xml missing from',
      '   the DEPLOYED war. It declares <module name="org.hibernate"/> and lives ONLY in the',
      '   etanah-common WAR overlay. Overlay fails to merge -> file absent (+~558 others) ->',
      '   Hibernate/Spring ClassNotFoundException.',
      '',
      '   🚨 TRIGGER UNKNOWN — do NOT assert a cause. The M2_REPO/.m2 story was WITHDRAWN',
      '   2026-07-26 (miya was on Maven 3.9.9 all along; .m2 was a consequence of HIS 3.8.2',
      '   troubleshooting switch, not the cause). Keep Eclipse on 3.9.9.',
      '   CAPTURE BEFORE CHANGING ANYTHING: target/m2e-wtp/overlays/ · target/m2e-wtp/',
      '   web-resources/ · .settings/org.eclipse.wst.common.component · m2e prefs · Error Log.',
      '',
      '   DIAGNOSE FIRST (run it yourself, do not ask みや):',
      '     Test-Path "<jboss>\\standalone\\deployments\\<app>.war\\WEB-INF\\jboss-deployment-structure.xml"',
      '     then diff file lists: target\\<app>  vs  deployments\\<app>.war   (2026-07-24: 558 missing)',
      '',
      '   PERMANENT FIX: copy jboss-deployment-structure.xml from the overlay into the project\'s',
      '   OWN src/main/webapp/WEB-INF/ so a publish can never drop it.',
      '',
      '   BANNED (みや has ALWAYS already tried these; suggesting them wastes his time):',
      '     - Maven Update Project / Project Clean / JBoss clean+republish',
      '     - grepping POMs or mvn dependency:tree for hibernate-core (it is a JBoss MODULE)',
      '     - diagnosing it as a JSF / managed-bean bug',
      '     - proposing a NEW workflow instead of fixing the reported issue',
      '',
    ].join('\n'),
  };
});
