#!/usr/bin/env node
// stg1-block.check.hook.js — born via core/forge.js (2026-10-14)
// TRIGGER: a tool call to the stg1 database (mcp__postgres-mlkstg1-pg__*)
// ACTION: BLOCK unless miya's own latest message names stg1
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));

const NOT_A_TURN_START = /^\s*(<system-reminder>|<task-notification|Stop hook feedback)/i;
const STG1_TOOL = /^mcp__postgres-mlkstg1-pg__/;

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

runHook({ name: 'stg1-block', event: 'PreToolUse' }, (input) => {
  let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
  if (!STG1_TOOL.test(String(data.tool_name || ''))) return { fired: false };
  const said = lastUserText(data.transcript_path);
  if (said && /\bstg1\b/i.test(said)) return { fired: true, blocked: false, contextOut: 'stg1-block: allowed, miya named stg1 in his message\n' };
  return { fired: true, blocked: true, blockReason:
    '⛔ stg1-block: stg1 is NOT used (miya 2026-10-12, repeated 2026-10-14).\n' +
    '   Use stg2 (postgres-mlkstg-pg, et_main_stg2). Do not query stg1, switch to it, or offer it as an option.\n' +
    '   Allowed only when miya\'s own latest message names stg1.\n' };
});
