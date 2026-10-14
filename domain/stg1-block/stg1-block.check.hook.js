#!/usr/bin/env node
// stg1-block.check.hook.js — born via core/forge.js (2026-10-14); narrowed 2026-10-14 (miya ruling)
// TRIGGER: a tool call to the stg1 database (mcp__postgres-mlkstg1-pg__*)
// ACTION: ALLOW a read with a reminder (announce it; no root cause / test data work);
//         BLOCK write-like SQL unless miya's own latest message names stg1.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const NOT_A_TURN_START = /^\s*(<system-reminder>|<task-notification|Stop hook feedback)/i;
const STG1_TOOL = /^mcp__postgres-mlkstg1-pg__/;
const WRITE_SQL = /\b(insert|update|delete|alter|drop|truncate|create|grant|revoke|merge)\b/i;

function lastUserText(transcriptPath) {
  let raw; try { raw = fs.readFileSync(transcriptPath || '', 'utf8'); } catch (_) { return null; }
  let last = null;
  for (const line of raw.split('\n')) {
    let o; try { o = JSON.parse(line); } catch (_) { continue; }
    if (!o || typeof o !== 'object' || o.isMeta) continue;
    const m = o.message && typeof o.message === 'object' ? o.message : o;
    if ((m.role || o.type) !== 'user') continue;
    let c = m.content;
    if (typeof c === 'string') c = [{ type: 'text', text: c }];
    if (!Array.isArray(c)) continue;
    for (const b of c) if (b && b.type === 'text' && typeof b.text === 'string' && !NOT_A_TURN_START.test(b.text)) last = b.text;
  }
  return last;
}

function sqlOf(ti) {
  if (!ti || typeof ti !== 'object') return '';
  return [ti.query, ti.sql, ti.statement].filter(s => typeof s === 'string').join(' ');
}

const REMIND =
  'stg1-block: stg1 READ allowed only for data that already lives there (e.g. rows the BA created on staging).\n' +
  '   Announce it in your reply: "Read from stg1: <what and why>".\n' +
  '   Do NOT use stg1 to find a root cause or to prepare test data / a test scenario without asking miya first (use stg2).\n';

runHook({ name: 'stg1-block', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
  if (!STG1_TOOL.test(String(data.tool_name || ''))) return { fired: false };
  const said = lastUserText(data.transcript_path);
  if (said && /\bstg1\b/i.test(said)) return { fired: true, blocked: false, contextOut: 'stg1-block: allowed, miya named stg1 in his message. Still announce: "Read from stg1: <what and why>".\n' };
  if (WRITE_SQL.test(sqlOf(data.tool_input))) return { fired: true, blocked: true, blockReason:
    '⛔ stg1-block: write-like SQL on stg1 refused.\n' +
    '   stg1 is read-only for data lookups that already exist there; writes need miya to name stg1 in his message.\n' };
  return { fired: true, blocked: false, contextOut: REMIND };
});
