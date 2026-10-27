#!/usr/bin/env node
// redmine-upload-path.check.hook.js — born via core/forge.js (2026-10-27)
// TRIGGER: PreToolUse mcp__claude-in-chrome__file_upload (the browser upload used for Redmine attachments)
// ACTION: BLOCK when any uploaded path is not inside a Task folder's cycle folder (`2. Fix\` or an `N. Rework\` root).
//   Whatever goes to Redmine is saved in the Task folder first, so people can fact-check what was uploaded.
//   Bypass [skip-upload-path: <reason>].
// REPLAY (2026-10-27, 286462): BA screenshots were attached to the Redmine form straight from `1. Brief\`;
//   miya: "what ever you decided to upload to redmine you will ALWAYS NEED TO PUT INTO TASK FOLDER FIRST".
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const LOG = path.join(__dirname, 'log.jsonl');

function log(o) { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) {} }

// Allowed: the file sits directly in `2. Fix` or `<n>. Rework` inside `\1. Tasks\`.
function allowed(p) {
  const s = String(p || '').replace(/\//g, '\\');
  if (!/\\1\. Tasks\\/i.test(s)) return false;
  const parent = path.win32.basename(path.win32.dirname(s));
  return /^2\. Fix$/i.test(parent) || /^\d+\. Rework$/i.test(parent);
}

function decide(paths, turnText) {
  if (/\[skip-upload-path:/.test(String(turnText || ''))) return { block: false, bypass: true };
  const list = Array.isArray(paths) ? paths : [];
  const bad = list.filter(p => !allowed(p));
  return bad.length ? { block: true, bad } : { block: false };
}

function lastAssistantText(tp) {
  let raw; try { raw = fs.readFileSync(tp, 'utf8'); } catch (_) { return ''; }
  const L = raw.split(/\r?\n/).filter(Boolean);
  for (let i = L.length - 1; i >= 0; i--) {
    let o; try { o = JSON.parse(L[i]); } catch (_) { continue; }
    const m = o.message || o;
    if ((m.role || o.type) !== 'assistant') continue;
    const c = m.content;
    const t = typeof c === 'string' ? c : Array.isArray(c) ? c.filter(b => b && b.type === 'text').map(b => b.text).join('\n') : '';
    if (t.trim()) return t;
  }
  return '';
}

if (require.main === module) {
  let runHook;
  try { ({ runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'))); } catch (_) { process.exit(0); }
  runHook({ name: 'redmine-upload-path', event: 'PreToolUse' }, (input) => {
    let data = {}; try { data = JSON.parse(input || '{}'); } catch (_) { return { fired: false }; }
    const paths = (data.tool_input || {}).paths;
    if (!Array.isArray(paths) || !paths.length) return { fired: false };
    const d = decide(paths, lastAssistantText(data.transcript_path || ''));
    if (!d.block) { if (d.bypass) log({ action: 'bypass', n: paths.length }); return { fired: false }; }
    log({ action: 'blocked', bad: d.bad });
    return { fired: true, blocked: true, blockReason: [
      '⛔ redmine-upload-path: these files are not in the Task folder\'s fix folder:',
      ...d.bad.map(b => '   ' + b),
      '   Copy each one into the cycle folder first (`2. Fix\\` or the latest `N. Rework\\`), named `<n>. <what it shows>.<ext>`,',
      '   then upload from there, so what reaches Redmine can be fact-checked in the Task folder.',
      '   Bypass only with a reason: [skip-upload-path: <reason>].',
    ].join('\n') };
  });
}

module.exports = { allowed, decide };
