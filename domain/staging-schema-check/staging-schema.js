#!/usr/bin/env node
/**
 * staging-schema.js — resolve WHICH staging schema the local app is pointed at.
 *
 * Why this exists (2026-08-04, みや):
 *   Melaka STG carries two live schemas, et_main_stg1 and et_main_stg2, and みや
 *   switches between them. Nothing in the quest load path ever DETERMINED which one
 *   was active, so a fixture was picked from a qa_doc written against the other
 *   schema and handed to him as a test instruction. He could not find the
 *   permohonan. His words: "EVERY TIME WE LOAD QUEST MAKE SURE TO LOAD THE LATEST
 *   CORRECT DB SCHEMA WE'RE CURRENTLY USING FOR STAGING SINCE IT CAN BE CHANGED
 *   BETWEEN STG2 AND STG1".
 *
 * Source of truth:
 *   standalone.xml — the datasource whose pool-name is EXACTLY "etanahDS" (no
 *   numeric suffix) is the active one; etanahDS2 / etanahDS3 are the parked
 *   alternatives. Switching env is a jndi/pool rename, not a URL swap, so the
 *   suffix-less pool-name is the only reliable discriminator.
 *
 * Usage:  node domain/staging-schema-check/staging-schema.js [--path <standalone.xml>]
 * Exit:   0 resolved · 1 unresolved (file missing / no suffix-less etanahDS)
 */

const fs = require('fs');

const DEFAULT_XML =
  'E:\\Dev\\jboss-7.4-plp-melaka\\standalone\\configuration\\standalone.xml';

function parseArgs(argv) {
  const i = argv.indexOf('--path');
  return { xmlPath: i !== -1 && argv[i + 1] ? argv[i + 1] : DEFAULT_XML };
}

/**
 * Returns { schema, connectionUrl, poolName, line } for the ACTIVE etanahDS,
 * or null when no suffix-less etanahDS datasource is present.
 */
function resolveActive(xml) {
  const lines = xml.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    // pool-name="etanahDS" with nothing after it — the active one.
    if (!/pool-name="etanahDS"/.test(lines[i])) continue;

    // connection-url sits within the next few lines of the same <datasource>.
    for (let j = i; j < Math.min(i + 8, lines.length); j++) {
      const m = lines[j].match(/<connection-url>([^<]+)<\/connection-url>/);
      if (!m) continue;
      const url = m[1];
      const schema = (url.match(/currentSchema=([A-Za-z0-9_]+)/) || [])[1] || null;
      return { schema, connectionUrl: url, poolName: 'etanahDS', line: j + 1 };
    }
  }
  return null;
}

function main() {
  const { xmlPath } = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(xmlPath)) {
    console.log(`STAGING SCHEMA: ⚠️ UNRESOLVED — standalone.xml not found at ${xmlPath}`);
    console.log('   Do NOT quote a schema or a fixture until this resolves. Ask みや which schema he is on.');
    process.exit(1);
  }

  const active = resolveActive(fs.readFileSync(xmlPath, 'utf8'));

  if (!active || !active.schema) {
    console.log(`STAGING SCHEMA: ⚠️ UNRESOLVED — no suffix-less etanahDS datasource in ${xmlPath}`);
    console.log('   Do NOT quote a schema or a fixture until this resolves. Ask みや which schema he is on.');
    process.exit(1);
  }

  console.log(`STAGING SCHEMA: ${active.schema}  (etanahDS @ ${xmlPath}:${active.line})`);
  console.log(`   ${active.connectionUrl}`);
  console.log('   Every fixture, permohonan ID and SELECT this session must come from THIS schema.');
  console.log('   A qa_doc row labelled with a different schema is STALE — re-source it, do not relay it.');
  process.exit(0);
}

if (require.main === module) main();

module.exports = { resolveActive };
