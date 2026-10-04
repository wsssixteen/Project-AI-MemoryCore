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
// v1.4 (2026-09-30, #282555): STAGE-ONLY for a month or until miya lifts it — every Redmine update is staged in the
// browser edit form and stops before Submit. A view-first ask forces staging even after the date.
const STAGE_ONLY_UNTIL = process.env.REDMINE_STAGE_ONLY_UNTIL || '2026-10-30';
const stageOnly = () => new Date().toISOString().slice(0, 10) < STAGE_ONLY_UNTIL;
const VIEW_FIRST = /\b(?:let me (?:see|check|view|review)|(?:view|see|check|review|prepare) (?:it |them |this )?first|show me (?:it )?first|in the same page|stage (?:it|first|only)|stop at staging)\b/i;
// Submit on the staged form needs miya's explicit send approval in his LAST message.
const SUBMIT_APPROVAL = /(?<!\b(?:don'?t|do not|jangan|not|never)\s)\b(?:post it|post now|yes,? post|\[redmine-post-ok\]|I approve|approved?\b[^.\n]{0,20}\b(?:send|post|submit|update)|submit it|go (?:ahead and )?submit)\b/i;
// Browser JS: any network call to Redmine (the .json API pops a basic-auth password box; a PUT/POST posts) is banned —
// read the open page's DOM instead. Form submit via JS needs SUBMIT_APPROVAL.
const BROWSER_NET = /\b(?:fetch|XMLHttpRequest|\$\.(?:ajax|get|post|getJSON)|axios)\b/;
const BROWSER_REDMINE_URL = /\/redmine\/|172\.16\.90\.169|\/issues\/[^'"`\s]*\.json|\.json\b[^\n]{0,40}issues/i;
const BROWSER_SUBMIT = /(?:issue-form|name=["']?commit|#issue_notes|issue_status_id)[\s\S]*(?:\.submit\s*\(|requestSubmit|\.click\s*\(\s*\))|(?:\.submit\s*\(|requestSubmit|\.click\s*\(\s*\))[\s\S]*(?:issue-form|name=["']?commit)/i;
const isBrowserTool = n => /(?:claude-in-chrome|Claude_Browser)__(?:javascript_tool|computer|browser_batch)$/.test(String(n || ''));

function transcriptTail(p) {
  try {
    const size = fs.statSync(p).size, want = 400000;
    const fd = fs.openSync(p, 'r'); const buf = Buffer.alloc(Math.min(size, want));
    fs.readSync(fd, buf, 0, buf.length, Math.max(0, size - buf.length)); fs.closeSync(fd);
    return buf.toString('utf8');
  } catch (_) { return ''; }
}

// One browser action → 'net' (Redmine API call) | 'submit' (sends the staged form) | '' (staging/reading, fine).
function browserVerdict(name, input, tail) {
  const n = String(name || ''); const ti = input || {};
  if (/browser_batch$/.test(n) || Array.isArray(ti.actions)) {
    for (const a of (ti.actions || [])) { const v = browserVerdict(a && a.name, a && a.input, tail); if (v) return v; }
    return '';
  }
  if (/javascript_tool$/.test(n) || typeof ti.text === 'string') {
    const t = String(ti.text || '');
    if (BROWSER_NET.test(t) && BROWSER_REDMINE_URL.test(t)) return 'net';
    if (BROWSER_SUBMIT.test(t)) return 'submit';
    return '';
  }
  if (/computer$/.test(n) && /click/.test(String(ti.action || '')) && ti.ref) {
    const ref = String(ti.ref).replace(/[^\w]/g, '');
    if (new RegExp(ref + '\\b[^\\n]{0,20}button\\s+\\\\?"(?:Submit|Hantar)\\\\?"', 'i').test(tail)) return 'submit';
  }
  return '';
}

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
  const logRow = o => { try { fs.appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...o }) + '\n'); } catch (_) { /* never block */ } };

  // v1.4 browser branch — staging (reading the page, setting field values) is always fine.
  if (isBrowserTool(data.tool_name)) {
    const tail = data.transcript_path ? transcriptTail(String(data.transcript_path)) : '';
    const verdict = browserVerdict(data.tool_name, ti, tail);
    if (!verdict) return { fired: false };
    const lastB = data.transcript_path ? lastUserText(String(data.transcript_path)) : '';
    if (verdict === 'net') {
      logRow({ outcome: 'blocked', surface: 'browser-net', last_user: lastB.slice(0, 120) });
      return { fired: true, blocked: true, blockReason: [
        '⛔ redmine-write-gate: browser JS is calling the Redmine API (fetch / XHR to /redmine/… .json).',
        '   That URL pops a sign-in password box in miya\'s Chrome, and a PUT/POST from here posts without review.',
        '   Read the OPEN page\'s DOM instead (form fields, .attributes, #history), or run node quest/redmine-sync.js <num>.',
      ].join('\n') };
    }
    if (SUBMIT_APPROVAL.test(lastB) || BYPASS.test(lastB)) {
      logRow({ outcome: 'allowed', surface: 'browser-submit', approval: (lastB.match(SUBMIT_APPROVAL) || ['bypass'])[0] });
      return { fired: true, blocked: false, contextOut: `redmine-write-gate: Submit approved by miya ("${(lastB.match(SUBMIT_APPROVAL) || ['bypass'])[0]}")\n` };
    }
    logRow({ outcome: 'blocked', surface: 'browser-submit', last_user: lastB.slice(0, 120) });
    return { fired: true, blocked: true, blockReason: [
      '⛔ redmine-write-gate: this clicks SUBMIT on a staged Redmine form and miya has not approved THIS send.',
      '',
      `   last user message: "${lastB.replace(/\s+/g, ' ').slice(0, 140) || '(none)'}"`,
      '',
      '   STOP AT STAGING: leave every field filled, show miya the staged values as a table, and wait for',
      '   "I approve" / "submit it" / "post it" in his latest message.',
    ].join('\n') };
  }

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
  // v1.4: stage-only window, or miya asked to view first → no API write at all, even with "post it".
  if (stageOnly() || VIEW_FIRST.test(last)) {
    const why = stageOnly() ? `STAGE-ONLY until ${STAGE_ONLY_UNTIL} (miya 2026-09-30)` : 'miya asked to view it first';
    logRow({ outcome: 'blocked', surface: 'api-stage-only', why, last_user: last.slice(0, 120) });
    return { fired: true, blocked: true, blockReason: [
      `⛔ redmine-write-gate: ${why} — no Redmine write through the API.`,
      '',
      '   Stage it instead: open the ticket in miya\'s Chrome, fill the EDIT form fields (skill redmine-phase1-prefill),',
      '   show him the staged values as a table, and STOP before Submit. He clicks Submit, or says "I approve" and you click it.',
      '   Never fetch /redmine/…json from the browser (it pops a password box).',
    ].join('\n') };
  }
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
