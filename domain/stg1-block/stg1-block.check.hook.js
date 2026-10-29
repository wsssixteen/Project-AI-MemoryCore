#!/usr/bin/env node
// stg1-block.check.hook.js — born via core/forge.js (2026-10-14); narrowed 2026-10-14 (miya ruling)
// v2 2026-10-15 (miya: "switched back to stg1 ... make it mechanical, like a turn on/off or switch"):
//   the guarded schema is no longer fixed to stg1. system/melaka-env-state.json `melaka_staging_schema`
//   (written only by miya's own switch phrase) names the schema that is ON; the hook guards the OTHER one.
// TRIGGER: a tool call to a staging database (mcp__postgres-mlkstg1-pg__* = stg1, mcp__postgres-mlkstg-pg__* = stg2)
// ACTION: schema ON -> silent. Schema OFF -> ALLOW a read with a reminder (announce it; no root cause / test data work);
//         BLOCK write-like SQL unless miya's own latest message names that schema.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const { lastHis } = require(path.join(ROOT, 'lib', 'his-words.js'));
const STG_TOOL = /^mcp__postgres-mlkstg(1?)-pg__/;
const WRITE_SQL = /\b(insert|update|delete|alter|drop|truncate|create|grant|revoke|merge)\b/i;
const STATE = process.env.STG_BLOCK_STATE || path.join(ROOT, 'system', 'melaka-env-state.json');

// The switch. Unreadable or unset = stg2 is ON (the rule before the switch existed: stg1 guarded).
function liveSchema() {
  try { const s = JSON.parse(fs.readFileSync(STATE, 'utf8')).melaka_staging_schema; return /^stg[12]$/.test(s) ? s : 'stg2'; } catch (_) { return 'stg2'; }
}

function sqlOf(ti) {
  if (!ti || typeof ti !== 'object') return '';
  return [ti.query, ti.sql, ti.statement].filter(s => typeof s === 'string').join(' ');
}

const remind = (off, on) =>
  'stg1-block: ' + off + ' is switched OFF (staging switch = ' + on + '). ' + off + ' READ allowed only for data that already lives there (e.g. rows the BA created on staging).\n' +
  '   Announce it in your reply: "Read from ' + off + ': <what and why>".\n' +
  '   Do NOT use ' + off + ' to find a root cause or to prepare test data / a test scenario without asking miya first (use ' + on + ').\n';

runHook({ name: 'stg1-block', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
  const m = String(data.tool_name || '').match(STG_TOOL);
  if (!m) return { fired: false };
  const schema = m[1] ? 'stg1' : 'stg2';
  const on = liveSchema();
  if (schema === on) return { fired: false };
  const said = lastHis(data.transcript_path);
  if (said && new RegExp('\\b' + schema + '\\b', 'i').test(said)) return { fired: true, blocked: false, contextOut: 'stg1-block: allowed, miya named ' + schema + ' in his message. Still announce: "Read from ' + schema + ': <what and why>".\n' };
  if (WRITE_SQL.test(sqlOf(data.tool_input))) return { fired: true, blocked: true, blockReason:
    '⛔ stg1-block: write-like SQL on ' + schema + ' refused (staging switch = ' + on + ').\n' +
    '   ' + schema + ' is read-only for data lookups that already exist there; writes need miya to name ' + schema + ' in his message.\n' };
  return { fired: true, blocked: false, contextOut: remind(schema, on) };
});
