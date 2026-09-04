#!/usr/bin/env node
// redmine-write-gate.check.hook.js — born via core/forge.js (2026-09-04), implemented same day
// TRIGGER: a Bash/PowerShell command is about to WRITE to Redmine — PUT/POST to the redmine host, or a script
//          carrying notes / assigned_to_id / status_id / journal against the Redmine API.
// ACTION:  BLOCK unless the LAST USER MESSAGE in the transcript is an explicit post approval
//          (post it · post now · Yes, post · [redmine-post-ok]). The note text must have been SHOWN in chat first.
//
// REPLAY (#275847, 2026-09-04): I posted the alter note + reassigned to Ammar on the strength of "Start with the
//   standard Salam Amar" — a WORDING instruction, not a post approval. miya wanted to review first; the journal
//   cannot be edited through the API (PUT /journals/<id>.json → 404), so the wrong wording is permanent.
// NOD: miya 2026-09-04 — "Create a stophook now for me to review your comments first next time."
// Rule this hardens: memory feedback_redmine_write_needs_nod (prose — it did not fire).
//
// state-scoped: no — Redmine host is shared by every state.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, '..', '..');
const { runHook } = require(path.join(ROOT, 'lib', 'hook-runtime.js'));
const LOG = path.join(__dirname, 'log.jsonl');

// A Redmine WRITE = the redmine host/key is referenced AND a mutating verb or a mutating field is present.
const REDMINE_REF = /172\.16\.90\.169\/redmine|REDMINE_BASE|REDMINE_KEY|X-Redmine-API-Key|redmine-sync\.js/i;
const MUTATION = /\bmethod\s*[:=]\s*['"]?(PUT|POST|DELETE)\b|-X\s*(PUT|POST|DELETE)\b|assigned_to_id|status_id|done_ratio|["']notes["']|\bnotes\s*[:=]|\bjournal\s*:|\buploads?\s*:/i;
const READ_ONLY_SCRIPT = /redmine-(sync|board|reconcile|status-check)\.js/i;
// What counts as miya's approval — the LAST user message only, never an older turn.
const APPROVAL = /(?<!\b(?:don'?t|do not|jangan|not|never)\s)(?<!\bI (?:will|'ll) )\b(post it|post now|go ahead and post|yes,? post|postkan|hantar (?:note|nota|komen)|\[redmine-post-ok\])\b/i;
const BYPASS = /\[skip-redmine-write-gate:\s*[^\]]+\]/i;

function lastUserText(transcriptPath) {
  let tail = '';
  try {
    const size = fs.statSync(transcriptPath).size, want = 400000;
    const fd = fs.openSync(transcriptPath, 'r'); const buf = Buffer.alloc(Math.min(size, want));
    fs.readSync(fd, buf, 0, buf.length, Math.max(0, size - buf.length)); fs.closeSync(fd);
    tail = buf.toString('utf8');
  } catch (_) { return ''; }
  const lines = tail.split('\n').filter(l => /"type"\s*:\s*"user"/.test(l));
  for (let i = lines.length - 1; i >= 0; i--) {
    let obj; try { obj = JSON.parse(lines[i]); } catch (_) { continue; }
    const c = obj && obj.message && obj.message.content;
    if (typeof c === 'string') return c;                       // plain user text
    if (Array.isArray(c)) {
      const texts = c.filter(x => x && x.type === 'text').map(x => x.text);
      if (texts.length) return texts.join('\n');               // user text blocks (tool_result-only turns are skipped)
    }
  }
  return '';
}

runHook({ name: 'redmine-write-gate', event: 'PreToolUse', log: LOG }, (input) => {
  let data = {};
  try { data = typeof input === 'string' ? JSON.parse(input || '{}') : (input || {}); } catch (_) { return { fired: false }; }
  const ti = data.tool_input || {};
  const cmd = String(ti.command || '');
  if (!cmd) return { fired: false };
  // A script file invoked by path — read it so a write hidden inside a helper is still seen.
  let body = cmd;
  const m = cmd.match(/node\s+"?([^"\s]+\.js)"?/i);
  if (m) { try { body += '\n' + fs.readFileSync(m[1], 'utf8'); } catch (_) { /* absent */ } }
  if (!REDMINE_REF.test(body)) return { fired: false };
  // read-only helpers are exempt ONLY when they are the script being EXECUTED — a writer that merely
  // passes redmine-sync.js as an argument (to borrow the key) is still a writer.
  if (m && READ_ONLY_SCRIPT.test(m[1]) && !MUTATION.test(cmd)) return { fired: false };
  if (!MUTATION.test(body)) return { fired: false };

  const last = data.transcript_path ? lastUserText(String(data.transcript_path)) : '';
  if (BYPASS.test(last)) return { fired: true, blocked: false, contextOut: 'redmine-write-gate: bypassed by miya\n' };
  if (APPROVAL.test(last)) {
    try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), outcome: 'allowed', approval: (last.match(APPROVAL) || [''])[0] }) + '\n'); } catch (_) { /* never block */ }
    return { fired: true, blocked: false, contextOut: `redmine-write-gate: approved by miya ("${(last.match(APPROVAL) || [''])[0]}")\n` };
  }
  try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), outcome: 'blocked', last_user: last.slice(0, 120) }) + '\n'); } catch (_) { /* never block */ }
  return {
    fired: true, blocked: true,
    blockReason: [
      '⛔ redmine-write-gate: this command WRITES to Redmine (note / assignee / status) and miya has not approved THIS post.',
      '',
      `   last user message: "${last.replace(/\s+/g, ' ').slice(0, 140) || '(none)'}"`,
      '',
      '   Redmine journals cannot be edited through the API (PUT /journals/<id>.json → 404) — a wrong post is permanent.',
      '   Do this instead: SHOW the exact note text in chat (fenced), then wait for miya to reply "post it" / "post now" /',
      '   "Yes, post" / [redmine-post-ok]. A wording instruction ("start with Salam …") is NOT an approval.',
      '',
      '   Genuinely approved elsewhere? miya can write [skip-redmine-write-gate: <reason>] in his message.',
    ].join('\n'),
  };
});
