#!/usr/bin/env node
// adhoc-brief-first.js — order check for an adhoc turn: the brief is shown BEFORE any save-set write.
// goal: miya reads the finding first; the save-set (Task folder, block, register row, quest doc, audit)
//       is written after the brief, by a background agent.
// symptom: 2026-10-13 ADHOC-MLPS-2026-4 — the whole save-set was written on the main thread before the
//          brief was shown. miya: "you must brief me first before saving or anything else that should be
//          done in the background".
//
// Usage:
//   node lib/adhoc-brief-first.js --transcript <session.jsonl> [--turn first|last|<n>]
//   node lib/adhoc-brief-first.js --latest            (newest transcript of this project folder)
// Exit 0 = PASS (brief first, or the turn wrote no save-set) · 1 = FAIL · 2 = cannot read.
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');

const BRIEF_MIN_CHARS = 400;
const WRITE_TOOLS = new Set(['Write', 'Edit', 'PowerShell', 'Bash', 'NotebookEdit']);
// A save-set write on the main thread. Reads (Read / Grep / Select-String) never match: only write tools count.
const SAVE_RE = [
  /active-cli\.js\\?["']?\s+start\s+ADHOC-/i,
  /adhoc-save-audit\.js/i,
  /quest[\\/]+notes\.js\\?["']?\s+--qa\s+ADHOC-/i,
  /Add-Content[^|]*ADHOC-REGISTER|ADHOC-REGISTER\.md[^|]*Add-Content/i,
  /New-Item[^|]*\d+\. AH - /i,
];
const QA_DOC_RE = /ADHOC-[A-Z0-9]+-\d{4}-\d+\.md/i;

function parse(file) {
  const out = [];
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    let o; try { o = JSON.parse(line); } catch (_) { continue; }
    if (!o || !o.message) continue;
    const c = o.message.content;
    if (o.type === 'user') {
      if (o.isMeta) continue;
      let text = null;
      if (typeof c === 'string') text = c;
      else if (Array.isArray(c) && !c.some(x => x.type === 'tool_result')) text = c.filter(x => x.type === 'text').map(x => x.text).join('\n');
      if (text === null) continue;
      // Hook feedback and command plumbing continue the same turn; they are not a new ask.
      if (/^\s*(Stop hook feedback|<local-command|A session-scoped Stop hook)/.test(text)) continue;
      out.push({ kind: 'prompt', text });
    } else if (o.type === 'assistant' && Array.isArray(c)) {
      for (const x of c) {
        if (x.type === 'text') out.push({ kind: 'text', text: x.text || '' });
        else if (x.type === 'tool_use') out.push({ kind: 'tool', name: x.name, input: JSON.stringify(x.input || {}) });
      }
    }
  }
  return out;
}

function turns(events) {
  const t = []; let cur = null;
  for (const e of events) {
    if (e.kind === 'prompt') { cur = { prompt: e.text, events: [] }; t.push(cur); }
    else if (cur) cur.events.push(e);
  }
  return t;
}

function isSave(e) {
  if (e.kind !== 'tool' || !WRITE_TOOLS.has(e.name)) return false;
  if ((e.name === 'Write' || e.name === 'Edit') && QA_DOC_RE.test(e.input)) return true;
  return SAVE_RE.some(r => r.test(e.input));
}
const isBrief = e => e.kind === 'text' && e.text.length >= BRIEF_MIN_CHARS;
const isBackgroundSave = e => e.kind === 'tool' && e.name === 'Agent' && /adhoc|save-set|ADHOC-/i.test(e.input) && !/"run_in_background":false/.test(e.input);

function check(turn) {
  const ev = turn.events;
  const firstSave = ev.findIndex(isSave);
  const firstBrief = ev.findIndex(isBrief);
  const bg = ev.some(isBackgroundSave);
  if (firstSave === -1) return { pass: true, reason: bg ? 'save-set handed to a background agent' : 'no save-set write on the main thread', background: bg };
  if (firstBrief !== -1 && firstBrief < firstSave) return { pass: true, reason: 'brief shown before the first save-set write', background: bg, mainThreadSave: true };
  const e = ev[firstSave];
  return { pass: false, reason: 'save-set write (' + e.name + ') ran before any brief of ' + BRIEF_MIN_CHARS + '+ characters was shown', background: bg, mainThreadSave: true };
}

function latestTranscript() {
  const slug = process.cwd().replace(/[^A-Za-z0-9]/g, '-');
  const dir = path.join(os.homedir(), '.claude', 'projects', slug);
  if (!fs.existsSync(dir)) return null;
  const f = fs.readdirSync(dir).filter(n => n.endsWith('.jsonl')).map(n => ({ n, m: fs.statSync(path.join(dir, n)).mtimeMs })).sort((a, b) => b.m - a.m)[0];
  return f ? path.join(dir, f.n) : null;
}

if (require.main === module) {
  const a = process.argv.slice(2);
  const arg = k => { const i = a.indexOf(k); return i === -1 ? null : a[i + 1]; };
  const file = a.includes('--latest') ? latestTranscript() : arg('--transcript');
  if (!file || !fs.existsSync(file)) { console.log('adhoc-brief-first: transcript not found' + (file ? ': ' + file : '')); process.exit(2); }
  const all = turns(parse(file));
  if (!all.length) { console.log('adhoc-brief-first: no turn found in the transcript'); process.exit(2); }
  const which = arg('--turn') || 'last';
  const idx = which === 'first' ? 0 : which === 'last' ? all.length - 1 : Math.max(0, Math.min(all.length - 1, parseInt(which, 10) - 1));
  const r = check(all[idx]);
  console.log('ADHOC-BRIEF-FIRST: ' + (r.pass ? 'PASS' : 'FAIL') + ' — turn ' + (idx + 1) + ' of ' + all.length + ' — ' + r.reason
    + (r.pass && r.mainThreadSave && !r.background ? ' (note: the save ran on the main thread, not in a background agent)' : ''));
  process.exit(r.pass ? 0 : 1);
}

module.exports = { parse, turns, check, isSave, isBrief, BRIEF_MIN_CHARS };
