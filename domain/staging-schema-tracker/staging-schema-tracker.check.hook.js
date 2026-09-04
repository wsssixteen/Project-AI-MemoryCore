#!/usr/bin/env node
// staging-schema-tracker.check.hook.js — born via core/forge.js (2026-08-10)
// TRIGGER: miya switch-phrase ('we switched to stgN' / 'use stg1 now') OR any env-prep / test-scenario prompt
// ACTION: on switch: rewrite system/melaka-env-state.json to the new schema + confirm; on env/test: inject the live staging target and auto-verify standalone.xml etanahDS matches it
// Lifecycle: created (narrow trigger — widen only with confirmed-fire evidence).
'use strict';
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const fs = require('fs');
const STATE = path.join(ROOT, 'system', 'melaka-env-state.json');

function safeRead(p) { try { return fs.readFileSync(p, 'utf-8'); } catch { return null; } }
function loadState() { const raw = safeRead(STATE); if (!raw) return null; try { return JSON.parse(raw); } catch { return null; } }
function schemaMeta(n) {
  return { melaka_staging_schema: 'stg' + n, schema_name: 'et_main_stg' + n,
           schema_user: 'et_main_stg' + n, mcp_server: n === '1' ? 'postgres-mlkstg1-pg' : 'postgres-mlkstg-pg' };
}
function standaloneSchema(state) {
  const p = state && state.standalone_path;
  if (!p) return { found: false };
  const xml = safeRead(p);
  if (xml === null) return { found: false };
  const ds = state.standalone_datasource || 'etanahDS';
  const idx = xml.indexOf('pool-name="' + ds + '"');
  if (idx === -1) return { found: true, schema: null };
  const m = xml.slice(idx, idx + 400).match(/currentSchema=(\w+)/);
  return { found: true, schema: m ? m[1] : null };
}

const SWITCH_INTENT = /(switch(?:ed|ing)?|we'?re on|now on|moved? to|chang(?:e|ed|ing) to|set (?:the )?env(?:ironment)?\s+to|staging (?:is|=|now)|use|using|amend.{0,40}stg|remember.{0,25}stg)/i;
const SCHEMA_TOKEN  = /\bstg\s*([12])\b/i;
const ENV_TRIGGER   = /(prepare|set ?up|setting up|\bprep\b)\s+(the\s+)?(env|environment)|env-?check|test scenario|prepare.*\btest\b|which\s+(schema|stg|staging)|standalone(?:\.xml)?|current schema|what schema/i;

runHook({ name: 'staging-schema-tracker', event: 'UserPromptSubmit' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) {}
  const prompt = data.prompt || '';
  const out = [];
  let state = loadState();

  // (A) SWITCH — miya sets the pointer. Skip if the stg token sits inside a question.
  const tok = prompt.match(SCHEMA_TOKEN);
  const tokSentence = prompt.split(/[.!\n]/).find(s => SCHEMA_TOKEN.test(s)) || '';
  if (tok && SWITCH_INTENT.test(prompt) && !/\?/.test(tokSentence)) {
    const n = tok[1];
    const prev = state ? state.melaka_staging_schema : 'unknown';
    const meta = schemaMeta(n);
    if (!state) state = { standalone_datasource: 'etanahDS', standalone_path: 'E:/Dev/jboss-7.4-plp-melaka/standalone/configuration/standalone.xml', history: [] };
    if (state.melaka_staging_schema !== meta.melaka_staging_schema) {
      Object.assign(state, meta);
      state.updated = new Date().toISOString().slice(0, 10);
      state.source = 'miya';
      state.history = (state.history || []).concat([{ schema: meta.melaka_staging_schema, from: state.updated }]);
      try {
        fs.writeFileSync(STATE, JSON.stringify(state, null, 2) + '\n');
        out.push('\u2705 Recorded: Melaka staging \u2192 ' + meta.melaka_staging_schema + ' (' + meta.schema_name + ', MCP ' + meta.mcp_server + '). Was ' + prev + '. Wrote system/melaka-env-state.json.');
        out.push('   \u2192 Also update standalone.xml etanahDS currentSchema+user to ' + meta.schema_name + ', and sync the prose pointer in feedback_staging_schema_stg2.md.');
      } catch (e) { out.push('\u26a0\ufe0f staging-schema-tracker: could not write state file: ' + e.message); }
    }
  }

  // (B) ENV / TEST-SCENARIO — surface the live target + verify standalone.
  if (ENV_TRIGGER.test(prompt)) {
    state = loadState() || state;
    if (state && state.melaka_staging_schema) {
      const t = state.schema_name, srv = state.mcp_server, sch = state.melaka_staging_schema;
      const sa = standaloneSchema(state);
      out.push('');
      out.push('\ud83c\udfaf Melaka staging target = ' + sch + ' (' + t + ') \u00b7 MCP ' + srv + ' \u00b7 per system/melaka-env-state.json (set ' + state.updated + ').');
      if (!sa.found) {
        out.push('   standalone.xml not readable here \u2014 verify ' + state.standalone_datasource + ' currentSchema=' + t + ' manually before declaring env ready.');
      } else if (sa.schema === t) {
        out.push('   \u2705 standalone.xml ' + state.standalone_datasource + ' = ' + sa.schema + ' \u2014 matches. Env correct for ' + sch + '.');
      } else {
        out.push('   \ud83d\udea8 MISMATCH: standalone.xml ' + state.standalone_datasource + ' = ' + sa.schema + ', target = ' + t + '. Change its connection-url currentSchema + <user-name> to ' + t + ' BEFORE declaring env ready or handing a test scenario.');
      }
      out.push('   SQL handed to miya stays UNQUALIFIED (he copy-pastes between schemas).');
    } else {
      out.push('\ud83c\udfaf Melaka staging target UNKNOWN \u2014 system/melaka-env-state.json missing/empty. Ask miya stg1 or stg2; do NOT default.');
    }
  }

  if (!out.length) return { fired: false };
  return { fired: true, blocked: false, contextOut: out.join('\n') + '\n' };
});
