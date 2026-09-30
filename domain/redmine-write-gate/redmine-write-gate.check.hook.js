#!/usr/bin/env node
// redmine-write-gate.check.hook.js — born via core/forge.js (2026-09-04), implemented same day
// TRIGGER: a Bash/PowerShell command is about to WRITE to Redmine — a PUT/POST/DELETE/PATCH verb, a request body,
//          or a payload key (issue envelope · notes · status_id · assigned_to_id · done_ratio · journal · uploads)
//          against the Redmine API. A field READ (`i.done_ratio`) is not a write (v1.3).
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

// A Redmine WRITE = the redmine host/key is referenced AND a write verb or a request body is present.
// Field names alone (status_id, done_ratio, notes …) are NOT a write: a GET script reads them from the response
// (2026-09-28: `node audit.js` doing http.get + reading i.done_ratio was blocked). v1.3.
const REDMINE_REF = /172\.16\.90\.169\/redmine|REDMINE_BASE|REDMINE_KEY|X-Redmine-API-Key|redmine-sync\.js/i;
const WRITE_VERB = new RegExp([
  /\bmethod\s*[:=]\s*['"]?(?:PUT|POST|DELETE|PATCH)\b/.source,          // fetch / http.request / axios options
  /-X\s*['"]?(?:PUT|POST|DELETE|PATCH)\b|--request[\s=]+['"]?(?:PUT|POST|DELETE|PATCH)\b/.source, // curl
  /-Method\s+['"]?(?:PUT|POST|DELETE|PATCH)\b/.source,                  // Invoke-RestMethod / Invoke-WebRequest
  /\b(?:requests|axios|got|httpx|session)\.(?:put|post|patch|delete)\s*\(/.source, // client verb calls
  /--post-data|--body-data|--method[\s=]+['"]?(?:PUT|POST|DELETE|PATCH)\b/.source, // wget
].join('|'), 'i');
const QUOTED_VERB = /['"](?:PUT|POST|DELETE|PATCH)['"]/;               // req('PUT', …) — uppercase only, a "Post" label stays text
const REQUEST_BODY = new RegExp([
  /-Body\b/.source,                                                    // Invoke-RestMethod -Body
  /\bcurl\b[^\n|;&]*\s(?:-d|--data(?:-raw|-binary|-urlencode)?|-F|--form|-T|--upload-file)\b/.source,
].join('|'), 'i');
// Redmine payload keys, lowercase only so a printed label ('Journal:') stays text. A bare `body:` key is NOT one:
// fetch refuses a body on GET, so a real body always comes with a verb above, and local rows use `body: []`.
// A field written as a KEY (`{ status_id: 2 }`, `"notes":`) still counts — only a READ (`i.done_ratio`, `i['notes']`) is exempt.
const PAYLOAD_KEY = /(?<!\w)["']?issue["']?\s*:\s*\{|(?<![.\w])["']?(?:uploads?|journal|notes|status_id|assigned_to_id|done_ratio)["']?\s*:/;
const isMutation = t => WRITE_VERB.test(t) || QUOTED_VERB.test(t) || REQUEST_BODY.test(t) || PAYLOAD_KEY.test(t);
// Read-only helpers, matched on the basename. ticket-load-verify.js reads only local Task-folder files — its body names
// redmine-sync.js and a /notes:/ parser regex, which blocked every /quest resume (2026-09-25, #256334).
const READ_ONLY_SCRIPT = /(?:^|[\\/])(?:redmine-(?:sync|board|reconcile|status-check)(?:\.eval)?|ticket-load-verify)\.js$/i;
// Every script the command executes — quoted (spaces allowed) or bare path.
const NODE_SCRIPT = /node\s+(?:"([^"]+?\.js)"|'([^']+?\.js)'|([^"'\s]+\.js))/gi;
// What counts as miya's approval — the LAST user message only, never an older turn.
const APPROVAL = /(?<!\b(?:don'?t|do not|jangan|not|never)\s)(?<!\bI (?:will|'ll) )\b(post it|post now|go ahead and post|yes,? post|postkan|hantar (?:note|nota|komen)|\[redmine-post-ok\])\b/i;
const BYPASS = /\[skip-redmine-write-gate:\s*[^\]]+\]/i;
// A status-only write (no note, assignee, % done, journal or upload) may run on a plain "update the redmine" /
// "set status" / "update in progress" from miya — a status can be set back, a note cannot (2026-09-29, #282061).
const NON_STATUS_MUTATION = /assigned_to_id|done_ratio|["']notes["']|\bnotes\s*[:=]|\bjournal\s*:|\buploads?\s*:/i;
const STATUS_APPROVAL = /(?<!\b(?:don'?t|do not|jangan|not|never)\s)\b(?:update|set|change|tukar|kemaskini)\b[^.\n]{0,40}\b(?:redmine|status|in progress)\b/i;
// The AskUserQuestion answer arrives as a tool_result, not user text.
const POPUP_ANSWER = /^\s*Your questions have been answered:/;

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
      for (const x of c) {                                      // except a popup answer, which IS miya's reply
        if (!x || x.type !== 'tool_result') continue;
        const t = typeof x.content === 'string' ? x.content
          : Array.isArray(x.content) ? x.content.filter(y => y && y.type === 'text').map(y => y.text).join('\n') : '';
        if (POPUP_ANSWER.test(t)) return [...t.matchAll(/"="([^"]*)"/g)].map(m => m[1]).join('\n'); // answers only, never the question text
      }
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
  // Script files invoked by path — read each one so a write hidden inside a helper is still seen.
  // A read-only helper's body is skipped ONLY when it is invoked as an executed script AND the command itself carries
  // no mutation; every other script body (a chained writer included) and the command text are always scanned.
  // A writer that passes redmine-sync.js as an argument (to borrow the key) is still a writer.
  let body = cmd;
  const cmdClean = !isMutation(cmd);
  for (const x of cmd.matchAll(NODE_SCRIPT)) {
    const s = x[1] || x[2] || x[3];
    if (cmdClean && READ_ONLY_SCRIPT.test(s)) continue;
    try { body += '\n' + fs.readFileSync(s, 'utf8'); } catch (_) { /* absent */ }
  }
  if (!REDMINE_REF.test(body)) return { fired: false };
  if (!isMutation(body)) return { fired: false };

  const last = data.transcript_path ? lastUserText(String(data.transcript_path)) : '';
  if (BYPASS.test(last)) return { fired: true, blocked: false, contextOut: 'redmine-write-gate: bypassed by miya\n' };
  if (APPROVAL.test(last)) {
    try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), outcome: 'allowed', approval: (last.match(APPROVAL) || [''])[0] }) + '\n'); } catch (_) { /* never block */ }
    return { fired: true, blocked: false, contextOut: `redmine-write-gate: approved by miya ("${(last.match(APPROVAL) || [''])[0]}")\n` };
  }
  if (/status_id/i.test(body) && !NON_STATUS_MUTATION.test(body) && STATUS_APPROVAL.test(last)) {
    const said = (last.match(STATUS_APPROVAL) || [''])[0];
    try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), outcome: 'allowed', approval: 'status-only: ' + said }) + '\n'); } catch (_) { /* never block */ }
    return { fired: true, blocked: false, contextOut: `redmine-write-gate: status-only write approved by miya ("${said}")\n` };
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
